"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { recognizeText, localeToOcrLang, type OcrProgress } from "@/lib/ocr";
import { ScanLine, AlertCircle } from "lucide-react";

interface OcrProcessorProps {
  imageDataUrl: string;
  onComplete: (text: string) => void;
  onError: () => void;
}

export default function OcrProcessor({
  imageDataUrl,
  onComplete,
  onError,
}: OcrProcessorProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [progress, setProgress] = useState<OcrProgress>({
    status: "loading",
    progress: 0,
  });
  const [error, setError] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const lang = localeToOcrLang[locale] || "eng";

    recognizeText(imageDataUrl, lang, (p) => {
      setProgress(p);
    })
      .then((text) => {
        onComplete(text);
      })
      .catch(() => {
        setError(true);
      });
  }, [imageDataUrl, locale, onComplete]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <p className="text-center text-sm text-gray-600">{t("ocr.error")}</p>
        <button
          onClick={onError}
          className="rounded-xl bg-accent-400 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-accent-500"
        >
          {t("ocr.retry")}
        </button>
      </div>
    );
  }

  const getStatusText = () => {
    if (progress.status === "loading langdata" || progress.status === "loading tesseract core") {
      return t("ocr.loading");
    }
    if (progress.status === "recognizing text") {
      return t("ocr.recognizing");
    }
    return t("ocr.processing");
  };

  const percentage = Math.round(progress.progress * 100);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary-200 shadow-sm">
        <img
          src={imageDataUrl}
          alt="Processing"
          className="max-h-[30vh] w-full object-contain opacity-50"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/90 p-4 shadow-lg">
            <ScanLine className="h-8 w-8 animate-pulse text-primary-500" />
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {getStatusText()}
          </span>
          <span className="text-sm font-semibold text-primary-600">
            {percentage}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary-100">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-accent-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
