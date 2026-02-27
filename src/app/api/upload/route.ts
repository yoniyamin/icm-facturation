import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { appendToSheet, ensureHeaders } from "@/lib/google-sheets";
import { saveReceiptToDisk } from "@/lib/disk-storage";

export const maxDuration = 60;

interface UploadRequestBody {
  imageDataUrl: string;
  ocrText: string;
  receiptNumber: string;
  projectName: string;
  subject: string;
  amount: string;
}

function isSheetsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_PRIVATE_KEY !==
      '-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\\n' &&
    process.env.GOOGLE_SHEET_ID &&
    process.env.GOOGLE_SHEET_ID !== "your-sheet-id-here"
  );
}

function isCloudConfigured(): boolean {
  return isCloudinaryConfigured() && isSheetsConfigured();
}

function getEffectiveMode(): "cloud" | "local" {
  if (process.env.NEXT_PUBLIC_STORAGE_MODE === "local") return "local";
  if (isCloudConfigured()) return "cloud";
  return "local";
}

export async function POST(request: NextRequest) {
  try {
    const body: UploadRequestBody = await request.json();

    if (
      !body.imageDataUrl ||
      !body.receiptNumber ||
      !body.projectName ||
      !body.subject ||
      !body.amount
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const mode = getEffectiveMode();

    if (mode === "cloud") {
      const timestamp = new Date();
      const dateStr = timestamp.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const cloudinaryResult = await uploadToCloudinary(
        body.imageDataUrl,
        body.projectName,
        {
          receiptNumber: body.receiptNumber,
          projectName: body.projectName,
          subject: body.subject,
          amount: body.amount,
          date: dateStr,
        }
      );

      await ensureHeaders();

      const sheetLink = await appendToSheet({
        date: dateStr,
        receiptNumber: body.receiptNumber,
        projectName: body.projectName,
        subject: body.subject,
        amount: body.amount,
        imageLink: cloudinaryResult.secureUrl,
        ocrText: body.ocrText || "",
      });

      return NextResponse.json({
        success: true,
        mode: "cloud",
        imageLink: cloudinaryResult.secureUrl,
        sheetLink,
      });
    }

    // Local disk mode
    const entry = saveReceiptToDisk({
      receiptNumber: body.receiptNumber,
      projectName: body.projectName,
      subject: body.subject,
      amount: body.amount,
      ocrText: body.ocrText || "",
      imageDataUrl: body.imageDataUrl,
    });

    const storagePath =
      process.env.LOCAL_STORAGE_PATH ||
      path.join(process.cwd(), "receipts");

    return NextResponse.json({
      success: true,
      mode: "local",
      entry,
      storagePath,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
