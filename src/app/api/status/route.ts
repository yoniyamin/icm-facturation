import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/google-auth";
import { isCloudinaryConfigured, pingCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

interface StatusResult {
  mode: "cloud" | "local";
  services: {
    configured: boolean;
    cloudinaryConnected: boolean;
    sheetsConnected: boolean;
    error?: string;
  };
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

export async function GET() {
  const cloudinaryOk = isCloudinaryConfigured();
  const sheetsOk = isSheetsConfigured();
  const configured = cloudinaryOk && sheetsOk;

  if (!configured) {
    const missing: string[] = [];
    if (!cloudinaryOk) missing.push("Cloudinary");
    if (!sheetsOk) missing.push("Google Sheets");

    return NextResponse.json({
      mode: "local",
      services: {
        configured: false,
        cloudinaryConnected: false,
        sheetsConnected: false,
        error: `Not configured: ${missing.join(", ")}`,
      },
    } satisfies StatusResult);
  }

  let cloudinaryConnected = false;
  let sheetsConnected = false;
  let error: string | undefined;

  try {
    cloudinaryConnected = await pingCloudinary();
    if (!cloudinaryConnected) {
      error = "Cloudinary: authentication failed";
    }
  } catch (e) {
    error = `Cloudinary: ${e instanceof Error ? e.message : "Connection failed"}`;
  }

  try {
    const sheets = getSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID!;
    await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "properties.title",
    });
    sheetsConnected = true;
  } catch (e) {
    const sheetsError = `Sheets: ${e instanceof Error ? e.message : "Connection failed"}`;
    error = error ? `${error}; ${sheetsError}` : sheetsError;
  }

  const mode =
    process.env.NEXT_PUBLIC_STORAGE_MODE === "local"
      ? "local"
      : cloudinaryConnected && sheetsConnected
        ? "cloud"
        : "local";

  return NextResponse.json({
    mode,
    services: {
      configured,
      cloudinaryConnected,
      sheetsConnected,
      error,
    },
  } satisfies StatusResult);
}
