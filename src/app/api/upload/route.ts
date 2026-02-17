import { NextRequest, NextResponse } from "next/server";
import { uploadImageToDrive } from "@/lib/google-drive";
import { appendToSheet, ensureHeaders } from "@/lib/google-sheets";

export const maxDuration = 60;

interface UploadRequestBody {
  imageDataUrl: string;
  ocrText: string;
  receiptNumber: string;
  projectName: string;
  subject: string;
  amount: string;
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

    const timestamp = new Date();
    const dateStr = timestamp.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const fileName = `receipt_${body.receiptNumber}_${timestamp.getTime()}.jpg`;

    const driveResult = await uploadImageToDrive(body.imageDataUrl, fileName);

    await ensureHeaders();

    const sheetLink = await appendToSheet({
      date: dateStr,
      receiptNumber: body.receiptNumber,
      projectName: body.projectName,
      subject: body.subject,
      amount: body.amount,
      imageLink: driveResult.webViewLink,
      ocrText: body.ocrText || "",
    });

    return NextResponse.json({
      success: true,
      driveLink: driveResult.webViewLink,
      sheetLink,
      fileId: driveResult.fileId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
