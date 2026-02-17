import { getDriveClient } from "./google-auth";
import { Readable } from "stream";

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
}

export async function uploadImageToDrive(
  imageDataUrl: string,
  fileName: string
): Promise<DriveUploadResult> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID in .env.local");
  }

  const drive = getDriveClient();

  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  const mimeMatch = imageDataUrl.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const stream = new Readable();
  stream.push(imageBuffer);
  stream.push(null);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id, webViewLink",
  });

  await drive.permissions.create({
    fileId: response.data.id!,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return {
    fileId: response.data.id!,
    webViewLink:
      response.data.webViewLink ||
      `https://drive.google.com/file/d/${response.data.id}/view`,
  };
}
