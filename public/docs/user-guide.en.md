# ICM Administration — User Guide

A short walkthrough of the receipt-scanning app: signing in, scanning, editing data, browsing your history, switching languages, and (for admins) managing who can use the app.

---

## 1. Signing in

1. Open the app URL in your browser (mobile or desktop).
2. Tap **Sign in with Google**.
3. Choose the Google account whose email an admin has added to the allowed list.

If you see *"Your email is not authorized to use this app"*, ask an administrator to add your Google email (see [§6 — For administrators](#6-for-administrators)).

> **Tip:** On mobile, after signing in once you can add the page to your home screen ("Add to Home Screen") for an app-like experience.

---

## 2. Scanning a receipt

The flow has four steps: **Capture → Review OCR → Fill details → Submit**.

### Step 1 — Capture an image

From the home screen, choose either:

- **Take Photo** — opens your device camera. Hold the receipt flat, fill the frame, avoid shadows.
- **Upload Image** — pick an existing JPG, PNG, or HEIC file from your device.

### Step 2 — Review the extracted data

The app runs OCR (text recognition) directly in your browser. When it finishes:

- The detected fields (receipt number, business name, date, amount, etc.) appear at the top with confidence indicators (green = high, yellow = medium, red = low).
- The full extracted text is shown below — you can scroll through it.

You can:

- **Edit a field** — tap the pencil icon next to a field and type the corrected value.
- **Re-assign text** — select any text in the extracted block and a small popup will let you assign it to a specific field (useful when OCR put the receipt number into the wrong field, for example).
- **Pick from multiple amounts** — when several amounts are detected, an "amount picker" lets you choose the correct total.
- **Revert changes** to go back to the original OCR.
- **Retake** to throw the scan away and start over.

When the data looks right, tap **Continue**.

### Step 3 — Fill the metadata form

- **Receipt Number** — pre-filled from OCR if found; edit if needed.
- **Project Name** — search existing projects or type a new name (a "+ Add" option appears when no match exists).
- **Subject** — choose a category (Food, Office Supplies, Transportation, etc.) or add a custom one.
- **Amount + Currency** — pre-filled from OCR; default currency is EUR. Switch to USD or NIS if needed.

Tap **Submit** to upload.

### Step 4 — Confirmation

You'll see a success screen with:

- A link to the uploaded receipt image.
- A link to the Google Sheet (only useful if the sheet has been shared with your Google account).
- A **Scan Another Receipt** button.

---

## 3. Browsing saved receipts

Open the menu (☰ icon, top-right) → **Receipts**.

You can:

- **Filter by project** — type in the search box to narrow down.
- **Sort** — tap any column header (Business, Project, Category, Amount, Date) to sort ascending/descending.
- **Change page size** — pick 5/10/20/50 per page or *All*.
- **View the photo** — tap **View** in the Photo column to open the original image.

Tap **Back to scanner** to return to the scan flow.

---

## 4. Switching language

Open the menu (☰) → under **Language** pick one of:

- עברית (Hebrew) — right-to-left
- Español (Spanish)
- English

Your choice is saved per device.

---

## 5. Signing out

Menu (☰) → **Sign out**.

---

## 6. For administrators

Admins see an extra menu item: **Manage Users**.

### Adding a user

1. Open **Manage Users**.
2. Type the user's Google email address.
3. (Optional) Tick **Grant admin access** to make them an admin too.
4. Tap **Add user**.

The new user can sign in immediately on their next visit — no redeploy needed.

### Removing a user

In the **Manage Users** list, tap the trash icon next to a user → confirm. They lose access on their next sign-in attempt.

### Built-in admins

Admins listed under **Built-in admin (env)** were defined at deploy time via the `ADMIN_EMAILS` environment variable. They cannot be removed from the UI — they're the safety net that prevents lock-out. To change them, edit the environment variable in Vercel.

### Important notes

- The email must match the Google account the user signs in with. Adding `someone@outlook.com` won't work unless they sign into Google with that exact address.
- **Promoting/demoting an admin** takes effect on that user's *next sign-in*. If they're currently logged in, they need to sign out and back in to see the change.
- Adding a user only grants access to **the app**, not to the Google Sheet or the Cloudinary image library directly. To share the spreadsheet, do it from Google Sheets in the usual way.

---

## 7. Troubleshooting

| Problem | What to try |
|---|---|
| "Your email is not authorized" | Ask an admin to add your Google email. |
| Camera button does nothing | Allow camera access in your browser settings; on iOS use Safari (PWA cameras work best there). |
| OCR results are poor | Retake in better light; flatten the receipt; fill more of the frame; avoid glare. |
| Wrong amount picked | Use the *amount picker* in step 2, or edit the amount manually before submitting. |
| Can't open Google Sheet | The sheet is owned by the project; ask the owner to share it with your Google account. |
| Submit fails repeatedly | Check your internet connection; if persistent, contact the admin. |

---

## 8. Privacy

- The OCR runs entirely in your browser — receipt images are not sent to any third-party text-recognition service.
- Receipt images and metadata are uploaded to the project's Cloudinary account and Google Sheet.
- Sign-in is handled by Google OAuth; the app stores only your name, email, and admin status in a session cookie.
