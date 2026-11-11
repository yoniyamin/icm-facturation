import type { OcrResult, OcrWord, OcrLine } from "./ocr";

const OCR_SPACE_ENDPOINT = "https://api.ocr.space/parse/image";

const LOCALE_TO_OCR_SPACE_LANG: Record<string, string> = {
  es: "spa",
  en: "eng",
  he: "heb",
};

export function isOcrSpaceConfigured(): boolean {
  const key = process.env.OCR_SPACE_API_KEY;
  return !!key && key !== "your-api-key-here";
}

interface OcrSpaceWord {
  WordText: string;
  Left: number;
  Top: number;
  Height: number;
  Width: number;
}

interface OcrSpaceLine {
  Words: OcrSpaceWord[];
  MaxHeight: number;
  MinTop: number;
}

interface OcrSpaceResult {
  ParsedResults?: {
    TextOverlay?: {
      Lines?: OcrSpaceLine[];
      HasOverlay: boolean;
    };
    ParsedText?: string;
    ErrorMessage?: string;
    FileParseExitCode?: number;
  }[];
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string[] | string | null;
}

/**
 * Call OCR.space API and return an OcrResult compatible with the spatial parser.
 */
export async function recognizeWithOcrSpace(
  imageBase64: string,
  language?: string
): Promise<OcrResult> {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) throw new Error("OCR_SPACE_API_KEY not configured");

  const lang = language
    ? LOCALE_TO_OCR_SPACE_LANG[language] || "eng"
    : "eng";

  const formData = new URLSearchParams();
  formData.append("apikey", apiKey);
  formData.append("base64Image", `data:image/jpeg;base64,${imageBase64}`);
  formData.append("language", lang);
  formData.append("isOverlayRequired", "true");
  formData.append("OCREngine", "2");
  formData.append("scale", "true");
  formData.append("isTable", "true");

  const response = await fetch(OCR_SPACE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(`OCR.space error ${response.status}`);
  }

  const data: OcrSpaceResult = await response.json();

  if (data.IsErroredOnProcessing || data.OCRExitCode !== 1) {
    const msg = Array.isArray(data.ErrorMessage)
      ? data.ErrorMessage.join("; ")
      : data.ErrorMessage || "OCR processing failed";
    throw new Error(`OCR.space: ${msg}`);
  }

  const parsed = data.ParsedResults?.[0];
  if (!parsed || parsed.FileParseExitCode !== 1) {
    throw new Error(`OCR.space: ${parsed?.ErrorMessage || "No results"}`);
  }

  const fullText = parsed.ParsedText || "";
  const overlayLines = parsed.TextOverlay?.Lines ?? [];

  const allWords: OcrWord[] = [];
  const lines: OcrLine[] = [];

  let imageWidth = 0;
  let imageHeight = 0;

  for (const ocrLine of overlayLines) {
    const lineWords: OcrWord[] = [];

    for (const w of ocrLine.Words) {
      const bbox = {
        x0: w.Left,
        y0: w.Top,
        x1: w.Left + w.Width,
        y1: w.Top + w.Height,
      };

      if (bbox.x1 > imageWidth) imageWidth = bbox.x1;
      if (bbox.y1 > imageHeight) imageHeight = bbox.y1;

      const ocrWord: OcrWord = {
        text: w.WordText,
        confidence: 80,
        bbox,
        isNumeric: /^\d+([.,]\d+)?$/.test(w.WordText),
        isBold: false,
        fontSize: w.Height,
      };

      lineWords.push(ocrWord);
      allWords.push(ocrWord);
    }

    if (lineWords.length > 0) {
      lines.push({
        text: lineWords.map((w) => w.text).join(" "),
        confidence: 80,
        bbox: {
          x0: Math.min(...lineWords.map((w) => w.bbox.x0)),
          y0: ocrLine.MinTop,
          x1: Math.max(...lineWords.map((w) => w.bbox.x1)),
          y1: ocrLine.MinTop + ocrLine.MaxHeight,
        },
        words: lineWords,
      });
    }
  }

  return {
    text: fullText.trim(),
    lines,
    words: allWords,
    imageWidth,
    imageHeight,
    engine: "ocrspace" as const,
  };
}
