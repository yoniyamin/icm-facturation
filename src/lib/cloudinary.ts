import crypto from "crypto";

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

function getConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  return { cloudName, apiKey, apiSecret };
}

function generateSignature(
  params: Record<string, string>,
  apiSecret: string
): string {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto
    .createHash("sha1")
    .update(signatureString + apiSecret)
    .digest("hex");
}

export interface UploadMetadata {
  receiptNumber: string;
  projectName: string;
  subject: string;
  amount: string;
  date: string;
}

export async function uploadToCloudinary(
  imageDataUrl: string,
  projectName: string,
  metadata: UploadMetadata
): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret } = getConfig();

  const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, "_") || "general";
  const folder = `receipts/${safeName}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const context = [
    `receipt_number=${metadata.receiptNumber}`,
    `project=${metadata.projectName}`,
    `subject=${metadata.subject}`,
    `amount=${metadata.amount}`,
    `date=${metadata.date}`,
  ].join("|");
  const displayName = `receipt-${metadata.receiptNumber}`;

  const paramsToSign: Record<string, string> = {
    context,
    display_name: displayName,
    folder,
    timestamp,
  };
  const signature = generateSignature(paramsToSign, apiSecret);

  const formData = new FormData();
  formData.append("file", imageDataUrl);
  formData.append("folder", folder);
  formData.append("context", context);
  formData.append("display_name", displayName);
  formData.append("timestamp", timestamp);
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Cloudinary upload failed: ${err.error?.message || response.statusText}`
    );
  }

  const data = await response.json();

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
  };
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export async function pingCloudinary(): Promise<boolean> {
  const { cloudName, apiKey, apiSecret } = getConfig();
  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/usage`,
    {
      headers: { Authorization: `Basic ${credentials}` },
    }
  );

  return response.ok;
}
