"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { X, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "@/lib/markdown";

interface Props {
  onClose: () => void;
}

export default function UserGuideModal({ onClose }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/docs/user-guide.${locale}.md`)
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setError(t("guide.loadError"));
        setLoading(false);
      });
  }, [locale, t]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-semibold text-primary-900">
            {t("guide.title")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label={t("guide.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <p className="py-4 text-center text-sm text-red-600">{error}</p>
          ) : (
            <MarkdownRenderer content={content} />
          )}
        </div>
      </div>
    </div>
  );
}
