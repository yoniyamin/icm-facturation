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
