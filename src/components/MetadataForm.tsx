"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Hash,
  FolderOpen,
  Tag,
  DollarSign,
  ArrowLeft,
  Send,
  Loader2,
} from "lucide-react";
import SearchableCombobox, {
  type ComboboxItem,
} from "@/components/SearchableCombobox";

interface MetadataFormProps {
  ocrText: string;
  parsedFields?: Record<string, string>;
  onSubmit: (data: {
    receiptNumber: string;
    projectName: string;
    subject: string;
    amount: string;
  }) => Promise<void>;
  onBack: () => void;
}

const SUBJECT_KEYS = [
  "food",
  "arts_and_craft",
  "snacks",
  "office_supplies",
  "transportation",
  "cleaning",
  "equipment",
  "other",
] as const;

export default function MetadataForm({
  ocrText,
  parsedFields,
  onSubmit,
  onBack,
}: MetadataFormProps) {
  const t = useTranslations();

  const [receiptNumber, setReceiptNumber] = useState(
    () => parsedFields?.receiptNumber || ""
  );
  const [projectName, setProjectName] = useState("");
  const [subject, setSubject] = useState("");
  const [amount, setAmount] = useState(() => {
    if (parsedFields?.amount) {
      return parsedFields.amount.replace(",", ".");
    }
    const match = ocrText.match(/(\d+[.,]\d{2})/);
    return match ? match[1].replace(",", ".") : "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [projectOptions, setProjectOptions] = useState<ComboboxItem[]>([]);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/options")
      .then((res) => res.json())
      .then((data: { projects: string[]; customSubjects: string[] }) => {
        setProjectOptions(
          data.projects.map((p) => ({ value: p, label: p }))
        );
        setCustomSubjects(data.customSubjects);
      })
      .catch(() => {});
  }, []);

  const subjectItems: ComboboxItem[] = useMemo(() => {
    const defaults: ComboboxItem[] = SUBJECT_KEYS.map((key) => ({
      value: key,
      label: t(`subjects.${key}`),
    }));
    const custom: ComboboxItem[] = customSubjects.map((s) => ({
      value: s,
      label: s,
    }));
    return [...defaults, ...custom];
  }, [customSubjects, t]);

  const newItemLabel = useCallback(
    (name: string) => t("form.newItem", { name }),
    [t]
  );

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isValid =
    receiptNumber.trim() &&
    projectName.trim() &&
    subject &&
    amount.trim() &&
    !isNaN(parseFloat(amount));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      receiptNumber: true,
      projectName: true,
      subject: true,
      amount: true,
    });

    if (!isValid) return;

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit({ receiptNumber, projectName, subject, amount });
    } catch {
      setError(t("errors.uploadFailed"));
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string, hasError: boolean) =>
    `w-full rounded-xl border-2 px-4 py-3 text-sm transition-colors outline-none ${
      touched[field] && hasError
        ? "border-red-300 bg-red-50 focus:border-red-500"
        : "border-primary-200 bg-white focus:border-primary-500 focus:bg-white"
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-primary-900">
          {t("form.title")}
        </h2>
        <p className="text-sm text-gray-500">{t("form.subtitle")}</p>
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Hash className="h-4 w-4 text-primary-500" />
          {t("form.receiptNumber")}
        </label>
        <input
          type="text"
          value={receiptNumber}
          onChange={(e) => setReceiptNumber(e.target.value)}
          onBlur={() => markTouched("receiptNumber")}
          placeholder={t("form.receiptNumberPlaceholder")}
          className={inputClass("receiptNumber", !receiptNumber.trim())}
          disabled={isSubmitting}
        />
        {touched.receiptNumber && !receiptNumber.trim() && (
          <p className="mt-1 text-xs text-red-500">{t("form.required")}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <FolderOpen className="h-4 w-4 text-primary-500" />
          {t("form.projectName")}
        </label>
        <SearchableCombobox
          items={projectOptions}
          value={projectName}
          onChange={setProjectName}
          onBlur={() => markTouched("projectName")}
          placeholder={t("form.searchProject")}
          allowNew
          newItemLabel={newItemLabel}
          disabled={isSubmitting}
          hasError={!!touched.projectName && !projectName.trim()}
        />
        {touched.projectName && !projectName.trim() && (
          <p className="mt-1 text-xs text-red-500">{t("form.required")}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Tag className="h-4 w-4 text-primary-500" />
          {t("form.subject")}
        </label>
        <SearchableCombobox
          items={subjectItems}
          value={subject}
          onChange={setSubject}
          onBlur={() => markTouched("subject")}
          placeholder={t("form.searchSubject")}
          allowNew
          newItemLabel={newItemLabel}
          disabled={isSubmitting}
          hasError={!!touched.subject && !subject}
        />
        {touched.subject && !subject && (
          <p className="mt-1 text-xs text-red-500">{t("form.required")}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <DollarSign className="h-4 w-4 text-primary-500" />
          {t("form.amount")} ({t("form.currency")})
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={() => markTouched("amount")}
          placeholder={t("form.amountPlaceholder")}
          className={inputClass(
            "amount",
            !amount.trim() || isNaN(parseFloat(amount))
          )}
          disabled={isSubmitting}
        />
        {touched.amount &&
          (!amount.trim() || isNaN(parseFloat(amount))) && (
            <p className="mt-1 text-xs text-red-500">{t("form.required")}</p>
          )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("form.back")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-400 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-accent-500 active:bg-accent-600 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("form.submitting")}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {t("form.submit")}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
