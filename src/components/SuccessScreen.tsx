"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  ScanLine,
  FolderOpen,
} from "lucide-react";
import { isLocalMode } from "@/lib/local-storage";

interface SuccessScreenProps {
  driveLink?: string;
  sheetLink?: string;
  storagePath?: string;
  onScanAnother: () => void;
}

export default function SuccessScreen({
  driveLink,
  sheetLink,
  storagePath,
  onScanAnother,
}: SuccessScreenProps) {
  const t = useTranslations("success");
  const localMode = isLocalMode();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
        </div>
        <div className="absolute -inset-2 animate-ping rounded-full bg-green-200 opacity-20" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-primary-900">{t("title")}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {localMode ? t("subtitleLocal") : t("subtitle")}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        {localMode && storagePath && (
          <div className="rounded-xl border-2 border-accent-200 bg-accent-50 p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-accent-700">
              <FolderOpen className="h-4 w-4" />
              {t("savedTo")}
            </div>
            <p
              className="break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-gray-600"
              dir="ltr"
            >
              {storagePath}
            </p>
          </div>
        )}
        {driveLink && (
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary-200 bg-white px-4 py-3 text-sm font-semibold text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-50"
          >
            <ExternalLink className="h-4 w-4" />
            {t("driveLink")}
          </a>
        )}
        {sheetLink && (
          <a
            href={sheetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary-200 bg-white px-4 py-3 text-sm font-semibold text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {t("sheetLink")}
          </a>
        )}
      </div>

      <button
        onClick={onScanAnother}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-400 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-accent-500 active:scale-[0.98] active:bg-accent-600"
      >
        <ScanLine className="h-5 w-5" />
        {t("scanAnother")}
      </button>
    </div>
  );
}
