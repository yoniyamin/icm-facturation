import { getSheetsClient } from "./google-auth";

export interface SheetEntry {
  date: string;
  receiptNumber: string;
  projectName: string;
  subject: string;
  amount: string;
  imageLink: string;
  ocrText: string;
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
    range: "Sheet1!A:G",
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
        ],
      ],
    },
  });

  return `https://docs.google.com/spreadsheets/d/${sheetId}`;
}

export async function ensureHeaders(): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return;

  const sheets = getSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!A1:G1",
    });

    const firstRow = response.data.values?.[0];
    if (!firstRow || firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Sheet1!A1:G1",
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
            ],
          ],
        },
      });
    }
  } catch {
    // Sheet might not exist yet, headers will be added on first append
  }
}
