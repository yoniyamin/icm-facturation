import { auth as gauth } from "@googleapis/sheets";
import type { OcrResult, OcrWord, OcrLine } from "./ocr";

function getVisionAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !privateKey) {
    throw new Error(
      "Missing Google service account credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local"
    );
  }

  return new gauth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/cloud-vision"],
  });
}

export function isVisionConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_PRIVATE_KEY !==
      '-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\\n' &&
    process.env.ENABLE_GOOGLE_VISION === "true"
  );
}

/**
 * Verify the service account can obtain a Vision-scoped access token.
 * Does NOT call the Vision API itself — costs zero quota.
 */
export async function pingVisionAuth(): Promise<boolean> {
  const auth = getVisionAuth();
  const credentials = await auth.authorize();
  return !!credentials.access_token;
}

interface VisionVertex {
  x?: number;
  y?: number;
}

interface VisionBoundingBox {
  vertices?: VisionVertex[];
}

interface VisionSymbol {
  text: string;
  confidence?: number;
  boundingBox?: VisionBoundingBox;
}

interface VisionWord {
  symbols?: VisionSymbol[];
  confidence?: number;
  boundingBox?: VisionBoundingBox;
}

interface VisionParagraph {
  words?: VisionWord[];
  confidence?: number;
  boundingBox?: VisionBoundingBox;
}

interface VisionBlock {
  paragraphs?: VisionParagraph[];
  boundingBox?: VisionBoundingBox;
}

interface VisionPage {
  width?: number;
  height?: number;
  blocks?: VisionBlock[];
}

interface VisionAnnotation {
  text?: string;
  pages?: VisionPage[];
}

function vertexToBbox(vertices: VisionVertex[] | undefined) {
  if (!vertices || vertices.length === 0) {
    return { x0: 0, y0: 0, x1: 0, y1: 0 };
  }
  const xs = vertices.map((v) => v.x ?? 0);
  const ys = vertices.map((v) => v.y ?? 0);
  return {
    x0: Math.min(...xs),
    y0: Math.min(...ys),
    x1: Math.max(...xs),
    y1: Math.max(...ys),
  };
}

/**
 * Call Google Cloud Vision DOCUMENT_TEXT_DETECTION and return an OcrResult
 * compatible with the spatial parser.
 */
export async function recognizeWithVision(
  imageBase64: string,
  languageHints?: string[]
): Promise<OcrResult> {
  const auth = getVisionAuth();
  const credentials = await auth.authorize();

  const body = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        ...(languageHints?.length
          ? { imageContext: { languageHints } }
          : {}),
      },
    ],
  };

  const response = await fetch(
    "https://vision.googleapis.com/v1/images:annotate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.access_token}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Vision API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const annotation: VisionAnnotation | undefined =
    data.responses?.[0]?.fullTextAnnotation;

  if (!annotation) {
    return { text: "", lines: [], words: [], imageWidth: 0, imageHeight: 0 };
  }

  const words: OcrWord[] = [];
  const lines: OcrLine[] = [];
  let imageWidth = 0;
  let imageHeight = 0;

  for (const page of annotation.pages ?? []) {
    if (page.width && page.width > imageWidth) imageWidth = page.width;
    if (page.height && page.height > imageHeight) imageHeight = page.height;

    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        const lineWords: OcrWord[] = [];

        for (const word of paragraph.words ?? []) {
          const wordText = (word.symbols ?? [])
            .map((s) => s.text)
            .join("");
          const confidence = (word.confidence ?? 0) * 100;
          const bbox = vertexToBbox(word.boundingBox?.vertices);

          const ocrWord: OcrWord = {
            text: wordText,
            confidence,
            bbox,
            isNumeric: /^\d+([.,]\d+)?$/.test(wordText),
            isBold: false,
            fontSize: bbox.y1 - bbox.y0,
          };

          lineWords.push(ocrWord);
          words.push(ocrWord);
        }

        if (lineWords.length > 0) {
          const paraBbox = vertexToBbox(paragraph.boundingBox?.vertices);
          lines.push({
            text: lineWords.map((w) => w.text).join(" "),
            confidence: (paragraph.confidence ?? 0) * 100,
            bbox: paraBbox,
            words: lineWords,
          });
        }
      }
    }
  }

  return {
    text: annotation.text ?? "",
    lines,
    words,
    imageWidth,
    imageHeight,
  };
}
