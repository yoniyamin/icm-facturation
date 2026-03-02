import { getSheetsClient } from "./google-auth";

export interface SheetEntry {
  date: string;
  receiptNumber: string;
  projectName: string;
  subject: string;
  amount: string;
  imageLink: string;
  ocrText: string;
  scannedBy: string;
  currency?: string;
  businessName?: string;
}

export interface ReceiptRow {
  date: string;
  receiptNumber: string;
  projectName: string;
  subject: string;
  amount: string;
  imageLink: string;
  scannedBy: string;
  currency: string;
  businessName: string;
}

export async function appendToSheet(entry: SheetEntry): Promise<string> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("Missing GOOGLE_SHEET_ID in .env.local");
  }

  const sheets = getSheetsClient();

  const truncatedOcrText =
    entry.ocrText.length > 500
      ? entry.ocrText.substring(0, 500) + "..."
      : entry.ocrText;

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Sheet1!A:J",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          entry.date,
          entry.receiptNumber,
          entry.projectName,
          entry.subject,
          entry.amount,
          entry.imageLink,
          truncatedOcrText,
          entry.scannedBy,
          entry.currency || "NIS",
          entry.businessName || "",
        ],
      ],
    },
  });

  return `https://docs.google.com/spreadsheets/d/${sheetId}`;
}

export async function getReceipts(): Promise<ReceiptRow[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return [];

  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Sheet1!A2:J",
  });

  const rows = response.data.values ?? [];
  return rows
    .map((row) => ({
      date: row[0] || "",
      receiptNumber: row[1] || "",
      projectName: row[2] || "",
      subject: row[3] || "",
      amount: row[4] || "",
      imageLink: row[5] || "",
      scannedBy: row[7] || "",
      currency: row[8] || "NIS",
      businessName: row[9] || "",
    }))
    .reverse();
}

export async function getUniqueOptions(): Promise<{
  projects: string[];
  subjects: string[];
}> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return { projects: [], subjects: [] };

  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Sheet1!C2:D",
  });

  const rows = response.data.values ?? [];
  const projects = new Set<string>();
  const subjects = new Set<string>();

  for (const row of rows) {
    const project = row[0]?.trim();
    const subject = row[1]?.trim();
    if (project) projects.add(project);
    if (subject) subjects.add(subject);
  }

  return {
    projects: Array.from(projects).sort((a, b) => a.localeCompare(b)),
    subjects: Array.from(subjects).sort((a, b) => a.localeCompare(b)),
  };
}

export async function ensureHeaders(): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return;

  const sheets = getSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!A1:J1",
    });

    const firstRow = response.data.values?.[0];
    if (!firstRow || firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Sheet1!A1:J1",
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              "Date",
              "Receipt Number",
              "Project Name",
              "Subject",
              "Amount",
              "Image Link",
              "OCR Text",
              "Scanned By",
              "Currency",
              "Business Name",
            ],
          ],
        },
      });
    } else if (firstRow.length < 10) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Sheet1!I1:J1",
        valueInputOption: "RAW",
        requestBody: {
          values: [["Currency", "Business Name"]],
        },
      });
    }
  } catch {
    // Sheet might not exist yet, headers will be added on first append
  }
}
