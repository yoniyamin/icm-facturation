import { NextResponse } from "next/server";
import { getDriveClient, getSheetsClient } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

interface StatusResult {
  mode: "google" | "local";
  google: {
    configured: boolean;
    driveConnected: boolean;
    sheetsConnected: boolean;
    error?: string;
  };
}

function isGoogleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_PRIVATE_KEY !== "-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\\n" &&
    process.env.GOOGLE_DRIVE_FOLDER_ID &&
    process.env.GOOGLE_DRIVE_FOLDER_ID !== "your-folder-id-here" &&
    process.env.GOOGLE_SHEET_ID &&
    process.env.GOOGLE_SHEET_ID !== "your-sheet-id-here"
  );
}

export async function GET() {
  const configured = isGoogleConfigured();

  if (!configured) {
    return NextResponse.json({
      mode: "local",
      google: {
        configured: false,
        driveConnected: false,
        sheetsConnected: false,
        error: "Google credentials not configured",
      },
    } satisfies StatusResult);
  }

  let driveConnected = false;
  let sheetsConnected = false;
  let error: string | undefined;

  try {
    const drive = getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
    await drive.files.list({
      q: `'${folderId}' in parents`,
      pageSize: 1,
      fields: "files(id)",
    });
    driveConnected = true;
  } catch (e) {
    error = `Drive: ${e instanceof Error ? e.message : "Connection failed"}`;
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
      : driveConnected && sheetsConnected
        ? "google"
        : "local";

  return NextResponse.json({
    mode,
    google: {
      configured,
      driveConnected,
      sheetsConnected,
      error,
    },
  } satisfies StatusResult);
}
