import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOcrSpaceConfigured, recognizeWithOcrSpace } from "@/lib/ocr-space";
import { isVisionConfigured, recognizeWithVision } from "@/lib/google-vision";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ocrSpaceReady = isOcrSpaceConfigured();
    const visionReady = isVisionConfigured();

    if (!ocrSpaceReady && !visionReady) {
      return NextResponse.json(
        { error: "No server-side OCR configured", fallback: true },
        { status: 501 }
      );
    }

    const { imageDataUrl, language } = await request.json();
    if (!imageDataUrl) {
      return NextResponse.json(
        { error: "Missing imageDataUrl" },
        { status: 400 }
      );
    }

    const base64Match = imageDataUrl.match(
      /^data:image\/\w+;base64,(.+)$/
    );
    if (!base64Match) {
      return NextResponse.json(
        { error: "Invalid image data URL" },
        { status: 400 }
      );
    }

    const base64 = base64Match[1];
    const languageHints = language ? [language] : undefined;

    // Priority: OCR.space → Google Vision
    if (ocrSpaceReady) {
      try {
        const result = await recognizeWithOcrSpace(base64, language);
        return NextResponse.json({ success: true, result });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("OCR.space error:", msg);
        // If Vision is also configured, try that before giving up
        if (!visionReady) {
          return NextResponse.json(
            { error: `OCR.space failed: ${msg}`, fallback: true },
            { status: 500 }
          );
        }
      }
    }

    if (visionReady) {
      const result = await recognizeWithVision(base64, languageHints);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json(
      { error: "All server-side OCR engines failed", fallback: true },
      { status: 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Vision OCR error:", message);
    return NextResponse.json(
      { error: `OCR processing failed: ${message}`, fallback: true },
      { status: 500 }
    );
  }
}
