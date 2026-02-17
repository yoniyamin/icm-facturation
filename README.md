# ICM Administration | אפליקציית ניהול ICM

A mobile-first web application for scanning receipts, extracting text via OCR, and logging them to Google Drive and Google Sheets.

## Features

- **Receipt Scanning**: Take a photo or upload an image of a receipt
- **OCR Processing**: In-browser text extraction using Tesseract.js (supports Hebrew, Spanish, English)
- **Data Preview**: Review and confirm extracted text before submission
- **Metadata Form**: Capture receipt number, project name, subject category, and amount
- **Google Drive Upload**: Automatically uploads receipt images to a dedicated Google Drive folder
- **Google Sheets Logging**: Appends receipt data as a new row in a Google Sheet
- **Multilingual**: Full support for Hebrew (RTL), Spanish, and English

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Tesseract.js v5** for in-browser OCR
- **next-intl** for internationalization
- **Google APIs** (Drive + Sheets) via service account

---

## Setup Instructions

### 1. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) (v18+) installed, then run:

```bash
npm install
```

### 2. Google Cloud Setup

Follow these steps to set up the Google API integration:

#### a) Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Note the project ID

#### b) Enable APIs

1. Go to **APIs & Services > Library**
2. Search for and enable:
   - **Google Drive API**
   - **Google Sheets API**

#### c) Create a Service Account

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > Service Account**
3. Give it a name (e.g., "icm-receipts")
4. Click **Done**
5. Click on the newly created service account
6. Go to the **Keys** tab
7. Click **Add Key > Create new key > JSON**
8. Download the JSON file (keep it safe, you'll need the `client_email` and `private_key` fields)

#### d) Create a Google Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder (e.g., "ICM Receipts")
3. Right-click the folder > **Share**
4. Add the service account email (from the JSON key file, the `client_email` field)
5. Give it **Editor** access
6. Copy the folder ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`

#### e) Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet (e.g., "ICM Receipts Log")
3. Click **Share**
4. Add the service account email with **Editor** access
5. Copy the sheet ID from the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

The app will automatically create headers on the first submission:

| Date | Receipt Number | Project Name | Subject | Amount | Image Link | OCR Text |
|------|----------------|--------------|---------|--------|------------|----------|

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.local.example .env.local
```

Or edit `.env.local` directly:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your-folder-id-here
GOOGLE_SHEET_ID=your-sheet-id-here
```

> **Important**: The `GOOGLE_PRIVATE_KEY` should be the entire private key from the JSON file, with `\n` replacing actual newlines. Wrap the whole value in double quotes.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop browser.

The app will redirect to the Hebrew locale by default: [http://localhost:3000/he](http://localhost:3000/he)

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/icm-facturation.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com/) and sign in
2. Click **New Project** and import your GitHub repository
3. In the **Environment Variables** section, add:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_DRIVE_FOLDER_ID`
   - `GOOGLE_SHEET_ID`
4. Click **Deploy**

### 3. Access the App

Once deployed, access the app at your Vercel URL (e.g., `https://icm-facturation.vercel.app`).

For mobile access, open the URL on your phone's browser. You can add it to your home screen for an app-like experience.

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx          # RTL/LTR layout wrapper
│   │   └── page.tsx            # Server component entry
│   └── api/
│       └── upload/
│           └── route.ts        # Google Drive + Sheets API
├── components/
│   ├── AppHeader.tsx           # App header with branding
│   ├── CameraCapture.tsx       # Camera/file input component
│   ├── DataPreview.tsx         # Extracted text preview
│   ├── HomeClient.tsx          # Main client-side app flow
│   ├── LanguageSwitcher.tsx    # HE/ES/EN switcher
│   ├── MetadataForm.tsx        # Receipt metadata form
│   ├── OcrProcessor.tsx        # Tesseract.js with progress
│   └── SuccessScreen.tsx       # Post-upload confirmation
├── i18n/
│   ├── config.ts               # Locale configuration
│   ├── request.ts              # next-intl server config
│   └── messages/
│       ├── he.json             # Hebrew translations
│       ├── es.json             # Spanish translations
│       └── en.json             # English translations
└── lib/
    ├── google-auth.ts          # Google service account auth
    ├── google-drive.ts         # Drive upload helper
    ├── google-sheets.ts        # Sheets append helper
    ├── ocr.ts                  # Tesseract.js wrapper
    └── utils.ts                # Utility functions
```

## Language Support

| Language | Code | Direction | Default |
|----------|------|-----------|---------|
| Hebrew   | he   | RTL       | Yes     |
| Spanish  | es   | LTR       | No      |
| English  | en   | LTR       | No      |

Switch languages using the language selector in the app header.

## Subject Categories

| Key              | Hebrew          | Spanish                | English          |
|------------------|-----------------|------------------------|------------------|
| food             | אוכל            | Comida                 | Food             |
| arts_and_craft   | אומנות ויצירה   | Arte y Manualidades    | Arts & Craft     |
| snacks           | חטיפים          | Bocadillos             | Snacks           |
| office_supplies  | ציוד משרדי      | Suministros de Oficina | Office Supplies  |
| transportation   | תחבורה          | Transporte             | Transportation   |
| cleaning         | ניקיון          | Limpieza               | Cleaning         |
| equipment        | ציוד            | Equipamiento           | Equipment        |
| other            | אחר             | Otro                   | Other            |
