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
 * Group words into visual lines by Y-center position.
 *
 * Vision API structures output as pages → blocks → paragraphs, but
 * paragraphs reflect semantic grouping, not visual lines.  On receipts
 * with columnar layouts (e.g. "Total" on the left, "91.65" on the right),
 * these end up in separate paragraphs, breaking keyword + value matching.
 *
 * This function clusters words whose vertical centres are within a
 * threshold, then sorts each cluster left-to-right.
 */
function groupWordsIntoVisualLines(
  words: OcrWord[],
  imageHeight: number
): OcrLine[] {
  if (words.length === 0) return [];

  const threshold = Math.max(imageHeight * 0.012, 8);

  const sorted = [...words].sort((a, b) => {
    const ay = (a.bbox.y0 + a.bbox.y1) / 2;
    const by = (b.bbox.y0 + b.bbox.y1) / 2;
    return ay - by;
  });

  const lines: OcrLine[] = [];
  let currentGroup: OcrWord[] = [sorted[0]];
  let groupCenterY = (sorted[0].bbox.y0 + sorted[0].bbox.y1) / 2;

  for (let i = 1; i < sorted.length; i++) {
    const w = sorted[i];
    const cy = (w.bbox.y0 + w.bbox.y1) / 2;

    if (Math.abs(cy - groupCenterY) <= threshold) {
      currentGroup.push(w);
      groupCenterY =
        currentGroup.reduce((s, cw) => s + (cw.bbox.y0 + cw.bbox.y1) / 2, 0) /
        currentGroup.length;
    } else {
      lines.push(buildVisualLine(currentGroup));
      currentGroup = [w];
      groupCenterY = cy;
    }
  }
  lines.push(buildVisualLine(currentGroup));
  return lines;
}

function buildVisualLine(words: OcrWord[]): OcrLine {
  const ltr = [...words].sort((a, b) => a.bbox.x0 - b.bbox.x0);
  const avgConf =
    ltr.reduce((s, w) => s + w.confidence, 0) / ltr.length;
  return {
    text: ltr.map((w) => w.text).join(" "),
    confidence: avgConf,
    bbox: {
      x0: Math.min(...ltr.map((w) => w.bbox.x0)),
      y0: Math.min(...ltr.map((w) => w.bbox.y0)),
      x1: Math.max(...ltr.map((w) => w.bbox.x1)),
      y1: Math.max(...ltr.map((w) => w.bbox.y1)),
    },
    words: ltr,
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

  const allWords: OcrWord[] = [];
  let imageWidth = 0;
  let imageHeight = 0;

  for (const page of annotation.pages ?? []) {
    if (page.width && page.width > imageWidth) imageWidth = page.width;
    if (page.height && page.height > imageHeight) imageHeight = page.height;

    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const word of paragraph.words ?? []) {
          const wordText = (word.symbols ?? [])
            .map((s) => s.text)
            .join("");
          const confidence = (word.confidence ?? 0) * 100;
          const bbox = vertexToBbox(word.boundingBox?.vertices);

          allWords.push({
            text: wordText,
            confidence,
            bbox,
            isNumeric: /^\d+([.,]\d+)?$/.test(wordText),
            isBold: false,
            fontSize: bbox.y1 - bbox.y0,
          });
        }
      }
    }
  }

  const lines = groupWordsIntoVisualLines(allWords, imageHeight);

  return {
    text: annotation.text ?? "",
    lines,
    words: allWords,
    imageWidth,
    imageHeight,
  };
}
