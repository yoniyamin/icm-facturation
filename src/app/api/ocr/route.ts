import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recognizeWithVision, isVisionConfigured } from "@/lib/google-vision";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isVisionConfigured()) {
      return NextResponse.json(
        { error: "Vision API not configured", fallback: true },
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

    const languageHints = language ? [language] : undefined;
    const result = await recognizeWithVision(base64Match[1], languageHints);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Vision OCR error:", error);
    return NextResponse.json(
      { error: "OCR processing failed", fallback: true },
      { status: 500 }
    );
  }
}
