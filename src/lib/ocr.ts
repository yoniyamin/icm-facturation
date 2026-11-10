import Tesseract from "tesseract.js";

export type OcrLanguage = "heb" | "spa" | "eng";

export const localeToOcrLang: Record<string, OcrLanguage> = {
  he: "heb",
  es: "spa",
  en: "eng",
};

export interface OcrProgress {
  status: string;
  progress: number;
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  isNumeric: boolean;
  isBold: boolean;
  fontSize: number;
}

export interface OcrLine {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  words: OcrWord[];
}

export interface OcrResult {
  text: string;
  lines: OcrLine[];
  words: OcrWord[];
  imageWidth: number;
  imageHeight: number;
}

export async function recognizeText(
  imageDataUrl: string,
  language: OcrLanguage = "heb",
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  const langs = `${language}+eng`;

  const result = await Tesseract.recognize(imageDataUrl, langs, {
    logger: (info: Tesseract.LoggerMessage) => {
      if (onProgress && info.status) {
        onProgress({
          status: info.status,
          progress:
            typeof info.progress === "number" ? info.progress : 0,
        });
      }
    },
  });

  return result.data.text.trim();
}

export async function recognizeStructured(
  imageDataUrl: string,
  language: OcrLanguage = "heb",
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  const langs = `${language}+eng`;

  const result = await Tesseract.recognize(imageDataUrl, langs, {
    logger: (info: Tesseract.LoggerMessage) => {
      if (onProgress && info.status) {
        onProgress({
          status: info.status,
          progress: typeof info.progress === "number" ? info.progress : 0,
        });
      }
    },
  });

  const page = result.data;

  const mapWord = (w: Tesseract.Word): OcrWord => ({
    text: w.text,
    confidence: w.confidence,
    bbox: { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 },
    isNumeric: w.is_numeric,
    isBold: w.is_bold,
    fontSize: w.font_size,
  });

  const lines: OcrLine[] = (page.lines || []).map((l) => ({
    text: l.text,
    confidence: l.confidence,
    bbox: { x0: l.bbox.x0, y0: l.bbox.y0, x1: l.bbox.x1, y1: l.bbox.y1 },
    words: (l.words || []).map(mapWord),
  }));

  const words: OcrWord[] = (page.words || []).map(mapWord);

  let imageWidth = 0;
  let imageHeight = 0;
  for (const w of words) {
    if (w.bbox.x1 > imageWidth) imageWidth = w.bbox.x1;
    if (w.bbox.y1 > imageHeight) imageHeight = w.bbox.y1;
  }

  return {
    text: page.text.trim(),
    lines,
    words,
    imageWidth,
    imageHeight,
  };
}
