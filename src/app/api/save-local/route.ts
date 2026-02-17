import { NextRequest, NextResponse } from "next/server";
import { saveReceiptToDisk } from "@/lib/disk-storage";

interface SaveLocalRequestBody {
  imageDataUrl: string;
  ocrText: string;
  receiptNumber: string;
  projectName: string;
  subject: string;
  amount: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveLocalRequestBody = await request.json();

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
      require("path").join(process.cwd(), "receipts");

    return NextResponse.json({
      success: true,
      entry,
      storagePath,
    });
  } catch (error) {
    console.error("Local save error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
