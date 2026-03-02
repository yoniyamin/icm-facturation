export interface ParsedField {
  key: string;
  label: string;
  value: string;
  confidence: "high" | "medium" | "low";
}

export interface ParsedReceipt {
  fields: ParsedField[];
  rawText: string;
  remainingText: string;
}

const AMOUNT_PATTERNS = [
  /(?:total|סה"כ|סהכ|סה״כ|סכום|total|importe|monto)\s*:?\s*[₪$€]?\s*(\d+[.,]\d{2})/i,
  /[₪$€]\s*(\d+[.,]\d{2})/,
  /(\d+[.,]\d{2})\s*[₪$€]/,
  /(?:total|סה"כ|סהכ)\s*(\d+[.,]\d{2})/i,
];

const DATE_PATTERNS = [
  /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
  /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
];

const RECEIPT_NUMBER_PATTERNS = [
  /(?:receipt|קבלה|מס[פ']?\s*:?|recibo|factura|invoice|#)\s*:?\s*#?\s*(\w[\w\-\/]*\d+)/i,
  /(?:אסמכתא|מספר)\s*:?\s*(\w[\w\-\/]*\d+)/i,
];

const PHONE_PATTERNS = [
  /(?:טל|tel|phone|טלפון)\s*:?\s*([\d\-\+\(\)\s]{7,})/i,
  /(0\d[\-\s]?\d{3,4}[\-\s]?\d{3,4})/,
  /(\+?\d{1,3}[\-\s]?\d{2,4}[\-\s]?\d{3,4}[\-\s]?\d{3,4})/,
];

const BUSINESS_NAME_PATTERNS = [
  /^([^\n]{3,50})$/m,
];

function extractField(
  text: string,
  patterns: RegExp[],
  fieldKey: string,
  fieldLabel: string
): ParsedField | null {
  for (let i = 0; i < patterns.length; i++) {
    const match = text.match(patterns[i]);
    if (match && match[1]) {
      return {
        key: fieldKey,
        label: fieldLabel,
        value: match[1].trim(),
        confidence: i === 0 ? "high" : "medium",
      };
    }
  }
  return null;
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const fields: ParsedField[] = [];
  let remainingText = rawText;

  const amount = extractField(rawText, AMOUNT_PATTERNS, "amount", "amount");
  if (amount) {
    fields.push(amount);
    remainingText = remainingText.replace(amount.value, "").trim();
  }

  const date = extractField(rawText, DATE_PATTERNS, "date", "date");
  if (date) {
    fields.push(date);
    remainingText = remainingText.replace(date.value, "").trim();
  }

  const receiptNum = extractField(
    rawText,
    RECEIPT_NUMBER_PATTERNS,
    "receiptNumber",
    "receiptNumber"
  );
  if (receiptNum) {
    fields.push(receiptNum);
    remainingText = remainingText.replace(receiptNum.value, "").trim();
  }

  const phone = extractField(rawText, PHONE_PATTERNS, "phone", "phone");
  if (phone) {
    fields.push(phone);
    remainingText = remainingText.replace(phone.value, "").trim();
  }

  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const firstMeaningfulLine = lines.find(
      (line) =>
        line.length >= 3 &&
        line.length <= 60 &&
        !/^\d+[\/\-\.]/.test(line) &&
        !/^[₪$€\d]/.test(line)
    );
    if (firstMeaningfulLine) {
      fields.push({
        key: "businessName",
        label: "businessName",
        value: firstMeaningfulLine,
        confidence: "low",
      });
    }
  }

  return {
    fields,
    rawText,
    remainingText: remainingText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n"),
  };
}
