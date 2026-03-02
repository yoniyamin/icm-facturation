import { sheets_v4, auth as gauth } from "@googleapis/sheets";

export function getGoogleAuth() {
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
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export function getSheetsClient() {
  return new sheets_v4.Sheets({ auth: getGoogleAuth() });
}
