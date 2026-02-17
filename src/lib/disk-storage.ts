import fs from "fs";
import path from "path";

const DEFAULT_STORAGE_PATH = path.join(process.cwd(), "receipts");

function getStoragePath(): string {
  return process.env.LOCAL_STORAGE_PATH || DEFAULT_STORAGE_PATH;
}

export interface DiskReceiptEntry {
  id: string;
  date: string;
  receiptNumber: string;
  projectName: string;
  subject: string;
  amount: string;
  ocrText: string;
  imageFileName: string;
  imagePath: string;
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sanitizeDirName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "_").trim() || "unknown";
}

/**
 * Folder structure mirrors Google Drive:
 *   receipts/
 *     {projectName}/
 *       receipt_123_456.jpg
 *       receipt_123_456.json
 *     receipts.json              (master index across all projects)
 */
export function saveReceiptToDisk(data: {
  receiptNumber: string;
  projectName: string;
  subject: string;
  amount: string;
  ocrText: string;
  imageDataUrl: string;
}): DiskReceiptEntry {
  const storagePath = getStoragePath();
  ensureDir(storagePath);

  const projectDir = path.join(storagePath, sanitizeDirName(data.projectName));
  ensureDir(projectDir);

  const id = `receipt_${Date.now()}`;
  const date = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const base64Data = data.imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");
  const mimeMatch = data.imageDataUrl.match(/^data:(image\/(\w+));base64,/);
  const ext = mimeMatch ? mimeMatch[2] : "jpg";
  const safeReceiptNum = data.receiptNumber.replace(/[^a-zA-Z0-9]/g, "_");
  const imageFileName = `${safeReceiptNum}_${id}.${ext}`;

  const imagePath = path.join(projectDir, imageFileName);
  fs.writeFileSync(imagePath, imageBuffer);

  const entry: DiskReceiptEntry = {
    id,
    date,
    receiptNumber: data.receiptNumber,
    projectName: data.projectName,
    subject: data.subject,
    amount: data.amount,
    ocrText: data.ocrText,
    imageFileName,
    imagePath: path.join(sanitizeDirName(data.projectName), imageFileName),
  };

  const metadataPath = path.join(projectDir, `${safeReceiptNum}_${id}.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(entry, null, 2), "utf-8");

  const indexPath = path.join(storagePath, "receipts.json");
  let entries: DiskReceiptEntry[] = [];
  if (fs.existsSync(indexPath)) {
    try {
      entries = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    } catch {
      entries = [];
    }
  }
  entries.push(entry);
  fs.writeFileSync(indexPath, JSON.stringify(entries, null, 2), "utf-8");

  return entry;
}
