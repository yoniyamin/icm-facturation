import type { OcrResult, OcrLine } from "./ocr";
import type { ParsedField, ParsedReceipt } from "./receipt-parser";
import { parseReceiptText } from "./receipt-parser";

const AMOUNT_RE = /\d+[.,]\d{2}/;
const CURRENCY_RE = /[₪$€]/;
const DATE_RE =
  /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/;
const TOTAL_KEYWORDS =
  /total|סה"כ|סהכ|סה״כ|סכום|לתשלום|importe|monto/i;
const RECEIPT_NUM_KEYWORDS =
  /receipt|קבלה|מס[פ']?\s*:?|אסמכתא|מספר|recibo|factura|invoice|#/i;
const PHONE_RE =
  /0\d[\-\s]?\d{3,4}[\-\s]?\d{3,4}|\+?\d{1,3}[\-\s]?\d{2,4}[\-\s]?\d{3,4}[\-\s]?\d{3,4}/;

function extractAmountFromLine(line: OcrLine): string | null {
  const match = line.text.match(AMOUNT_RE);
  return match ? match[0] : null;
}

/**
 * Parse receipt fields using spatial (bounding-box) data from Tesseract.
 * Falls back to the regex-only parser when spatial data is insufficient.
 */
export function parseReceiptSpatial(ocrResult: OcrResult): ParsedReceipt {
  const { lines, imageHeight, text } = ocrResult;

  if (!lines.length || imageHeight === 0) {
    return parseReceiptText(text);
  }

  const confidentLines = lines.filter((l) => l.confidence > 40);
  if (confidentLines.length < 2) {
    return parseReceiptText(text);
  }

  const fields: ParsedField[] = [];

  // ── TOTAL AMOUNT ──────────────────────────────────────────────
  // 1. Lines with a total keyword + an amount → highest confidence
  // 2. Among those prefer the bottommost (totals sit at the end)
  // 3. Fallback: bottommost amount-bearing line on the receipt
  const amountCandidates: {
    value: string;
    confidence: ParsedField["confidence"];
    y: number;
    hasKeyword: boolean;
  }[] = [];

  for (let idx = 0; idx < confidentLines.length; idx++) {
    const line = confidentLines[idx];
    const amount = extractAmountFromLine(line);
    if (!amount) continue;

    const hasKeyword = TOTAL_KEYWORDS.test(line.text);
    const hasCurrency = CURRENCY_RE.test(line.text);

    const prevLine = idx > 0 ? confidentLines[idx - 1] : null;
    const nextLine =
      idx < confidentLines.length - 1 ? confidentLines[idx + 1] : null;
    const adjacentKeyword =
      (prevLine && TOTAL_KEYWORDS.test(prevLine.text)) ||
      (nextLine && TOTAL_KEYWORDS.test(nextLine.text));

    let confidence: ParsedField["confidence"] = "low";
    if (hasKeyword && hasCurrency) confidence = "high";
    else if (hasKeyword || (adjacentKeyword && hasCurrency)) confidence = "high";
    else if (hasKeyword || adjacentKeyword || hasCurrency) confidence = "medium";

    amountCandidates.push({
      value: amount,
      confidence,
      y: line.bbox.y0,
      hasKeyword: hasKeyword || !!adjacentKeyword,
    });
  }

  if (amountCandidates.length > 0) {
    const withKeyword = amountCandidates.filter((c) => c.hasKeyword);
    const best =
      withKeyword.length > 0
        ? withKeyword.reduce((a, b) => (a.y > b.y ? a : b))
        : amountCandidates.reduce((a, b) => (a.y > b.y ? a : b));

    const amountField: ParsedField = {
      key: "amount",
      label: "amount",
      value: best.value,
      confidence: best.confidence,
    };

    const uniqueValues = Array.from(new Set(amountCandidates.map((c) => c.value)));
    if (uniqueValues.length > 1) {
      amountField.candidates = uniqueValues;
    }

    fields.push(amountField);
  }

  // ── DATE ──────────────────────────────────────────────────────
  // Prefer the topmost date (usually in the header).
  let bestDate: { value: string; y: number } | null = null;
  for (const line of confidentLines) {
    const dateMatch = line.text.match(DATE_RE);
    if (dateMatch) {
      if (!bestDate || line.bbox.y0 < bestDate.y) {
        bestDate = { value: dateMatch[0], y: line.bbox.y0 };
      }
    }
  }
  if (bestDate) {
    const inTopRegion = bestDate.y < imageHeight * 0.4;
    fields.push({
      key: "date",
      label: "date",
      value: bestDate.value,
      confidence: inTopRegion ? "high" : "medium",
    });
  }

  // ── RECEIPT NUMBER ────────────────────────────────────────────
  // Find a keyword, then extract the number on the same or next line.
  let foundReceiptNum = false;
  for (let i = 0; i < confidentLines.length && !foundReceiptNum; i++) {
    const line = confidentLines[i];
    if (!RECEIPT_NUM_KEYWORDS.test(line.text)) continue;

    const numMatch = line.text.match(
      /(?:receipt|קבלה|מס[פ']?\s*:?|אסמכתא|מספר|recibo|factura|invoice|#)\s*:?\s*#?\s*(\w[\w\-\/]*\d+)/i
    );
    if (numMatch?.[1]) {
      fields.push({
        key: "receiptNumber",
        label: "receiptNumber",
        value: numMatch[1].trim(),
        confidence: "high",
      });
      foundReceiptNum = true;
      break;
    }

    if (i + 1 < confidentLines.length) {
      const nextLine = confidentLines[i + 1];
      const standalone = nextLine.text.trim().match(/^(\w[\w\-\/]*\d+)$/);
      if (standalone) {
        fields.push({
          key: "receiptNumber",
          label: "receiptNumber",
          value: standalone[1].trim(),
          confidence: "medium",
        });
        foundReceiptNum = true;
      }
    }
  }

  // ── BUSINESS NAME ─────────────────────────────────────────────
  // Top 20% of the receipt, highest-confidence non-numeric line.
  const topRegion = imageHeight * 0.2;
  const topLines = confidentLines
    .filter((l) => l.bbox.y0 < topRegion && l.confidence > 50)
    .filter((l) => {
      const t = l.text.trim();
      return (
        t.length >= 3 &&
        t.length <= 60 &&
        !/^\d+[\/\-\.]/.test(t) &&
        !/^[₪$€\d]/.test(t) &&
        !DATE_RE.test(t) &&
        !PHONE_RE.test(t)
      );
    });

  if (topLines.length > 0) {
    const sorted = [...topLines].sort((a, b) => {
      const aFontSize = a.words.length
        ? Math.max(...a.words.map((w) => w.fontSize))
        : 0;
      const bFontSize = b.words.length
        ? Math.max(...b.words.map((w) => w.fontSize))
        : 0;
      if (Math.abs(bFontSize - aFontSize) > 5) return bFontSize - aFontSize;
      const confDiff = b.confidence - a.confidence;
      if (Math.abs(confDiff) > 10) return confDiff;
      return b.text.trim().length - a.text.trim().length;
    });
    const best = sorted[0];

    const hasBoldWords = best.words.some((w) => w.isBold);
    const hasLargeFont =
      best.words.length > 0 &&
      Math.max(...best.words.map((w) => w.fontSize)) > imageHeight * 0.025;

    fields.push({
      key: "businessName",
      label: "businessName",
      value: best.text.trim(),
      confidence:
        hasBoldWords || hasLargeFont || best.confidence > 80 ? "medium" : "low",
    });
  }

  // ── PHONE ─────────────────────────────────────────────────────
  for (const line of confidentLines) {
    const phoneMatch = line.text.match(PHONE_RE);
    if (phoneMatch) {
      fields.push({
        key: "phone",
        label: "phone",
        value: phoneMatch[0].trim(),
        confidence: "medium",
      });
      break;
    }
  }

  // ── MERGE with regex fallback for any fields we missed ────────
  if (fields.length < 2) {
    const regexResult = parseReceiptText(text);
    const spatialKeys = new Set(fields.map((f) => f.key));
    for (const field of regexResult.fields) {
      if (!spatialKeys.has(field.key)) {
        fields.push(field);
      }
    }
    return { fields, rawText: text, remainingText: regexResult.remainingText };
  }

  const fieldValues = new Set(fields.map((f) => f.value));
  const remainingText = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !fieldValues.has(l))
    .join("\n");

  return { fields, rawText: text, remainingText };
}
