"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  RefreshCw,
  ArrowLeft,
  RotateCcw,
  Pencil,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  Tag,
} from "lucide-react";
import {
  parseReceiptText,
  type ParsedField,
  type ParsedReceipt,
} from "@/lib/receipt-parser";

interface DataPreviewProps {
  imageDataUrl: string;
  ocrText: string;
  onContinue: (editedFields: Record<string, string>) => void;
  onRetake: () => void;
}

const SUGGESTED_FIELDS = [
  "amount",
  "date",
  "receiptNumber",
  "phone",
  "businessName",
  "address",
  "taxId",
  "notes",
] as const;

const KNOWN_FIELD_KEYS = new Set<string>(SUGGESTED_FIELDS);

function ConfidenceBadge({
  confidence,
  t,
}: {
  confidence: "high" | "medium" | "low";
  t: (key: string) => string;
}) {
  const config = {
    high: {
      icon: CheckCircle,
      className: "bg-green-100 text-green-700 border-green-200",
    },
    medium: {
      icon: AlertCircle,
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    low: {
      icon: HelpCircle,
      className: "bg-gray-100 text-gray-600 border-gray-200",
    },
  };

  const { icon: Icon, className } = config[confidence];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${className}`}
    >
      <Icon className="h-3 w-3" />
      {t(`preview.confidence.${confidence}`)}
    </span>
  );
}

function getFieldDisplayName(
  key: string,
  t: (k: string) => string
): string {
  if (KNOWN_FIELD_KEYS.has(key)) {
    try {
      return t(`fields.${key}`);
    } catch {
      return key;
    }
  }
  return key;
}

function FieldAssignPopup({
  selectedText,
  existingKeys,
  onAssign,
  onClose,
  t,
}: {
  selectedText: string;
  existingKeys: string[];
  onAssign: (fieldKey: string, value: string) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [customName, setCustomName] = useState("");

  const availableFields = SUGGESTED_FIELDS.filter(
    (f) => !existingKeys.includes(f)
  );

  const handleCustomSubmit = () => {
    const name = customName.trim();
    if (!name) return;
    const key = name.replace(/\s+/g, "_").toLowerCase();
    if (existingKeys.includes(key)) return;
    onAssign(key, selectedText);
    onClose();
  };

  return (
    <div className="absolute inset-x-0 bottom-full z-20 mb-2 rounded-xl border-2 border-primary-300 bg-white p-3 shadow-xl">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500">
            {t("preview.assignField")}
          </p>
          <p
            className="mt-0.5 rounded bg-primary-50 px-2 py-1 text-xs text-primary-800 font-mono"
            dir="ltr"
          >
            &ldquo;
            {selectedText.length > 40
              ? selectedText.slice(0, 40) + "..."
              : selectedText}
            &rdquo;
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Suggested fields as quick-pick buttons */}
      {availableFields.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {availableFields.map((field) => (
            <button
              key={field}
              onClick={() => {
                onAssign(field, selectedText);
                onClose();
              }}
              className="rounded-lg bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-200"
            >
              {t(`fields.${field}`)}
            </button>
          ))}
        </div>
      )}

      {/* Custom field name input */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
        <Tag className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCustomSubmit();
          }}
          placeholder={t("preview.customFieldPlaceholder")}
          className="flex-1 rounded-lg border border-gray-200 bg-warm-50 px-2.5 py-1.5 text-xs outline-none focus:border-primary-400"
          autoFocus
        />
        <button
          onClick={handleCustomSubmit}
          disabled={!customName.trim()}
          className="rounded-lg bg-accent-400 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-500 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function DataPreview({
  imageDataUrl,
  ocrText,
  onContinue,
  onRetake,
}: DataPreviewProps) {
  const t = useTranslations();

  const parsed: ParsedReceipt = useMemo(
    () => parseReceiptText(ocrText),
    [ocrText]
  );

  const [editedValues, setEditedValues] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      parsed.fields.forEach((f) => {
        initial[f.key] = f.value;
      });
      return initial;
    }
  );

  const [customFields, setCustomFields] = useState<ParsedField[]>([]);
  const [showRawText, setShowRawText] = useState(true);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLDivElement>(null);

  const allFields = [...parsed.fields, ...customFields];

  const hasEdits = parsed.fields.some(
    (f) => editedValues[f.key] !== f.value
  );

  const handleRevert = () => {
    const reverted: Record<string, string> = {};
    parsed.fields.forEach((f) => {
      reverted[f.key] = f.value;
    });
    setEditedValues(reverted);
    setCustomFields([]);
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleRemoveCustomField = (key: string) => {
    setCustomFields((prev) => prev.filter((f) => f.key !== key));
    setEditedValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString().trim());
    }
  }, []);

  const handleAssignField = (fieldKey: string, value: string) => {
    const existingParsed = parsed.fields.find((f) => f.key === fieldKey);
    if (existingParsed) {
      setEditedValues((prev) => ({ ...prev, [fieldKey]: value }));
    } else {
      const existingCustom = customFields.find((f) => f.key === fieldKey);
      if (!existingCustom) {
        setCustomFields((prev) => [
          ...prev,
          {
            key: fieldKey,
            label: fieldKey,
            value,
            confidence: "medium" as const,
          },
        ]);
      }
      setEditedValues((prev) => ({ ...prev, [fieldKey]: value }));
    }
    setSelectedText(null);
  };

  const handleContinue = () => {
    onContinue(editedValues);
  };

  const hasFields = allFields.length > 0;
  const existingFieldKeys = allFields.map((f) => f.key);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-primary-900">
          {t("preview.title")}
        </h2>
        <p className="text-sm text-gray-500">{t("preview.subtitle")}</p>
      </div>

      {/* Image preview - expandable */}
      <div className="relative">
        <div
          className={`overflow-hidden rounded-xl border border-primary-200 transition-all ${
            imageExpanded ? "max-h-[70vh]" : "max-h-[25vh]"
          }`}
        >
          <img
            src={imageDataUrl}
            alt="Receipt"
            className="w-full object-contain bg-warm-50 cursor-pointer"
            onClick={() => setImageExpanded(!imageExpanded)}
          />
        </div>
        <button
          onClick={() => setImageExpanded(!imageExpanded)}
          className="absolute bottom-2 end-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80"
        >
          {imageExpanded ? (
            <>
              <ZoomOut className="h-3 w-3" />
              {t("preview.shrink")}
            </>
          ) : (
            <>
              <ZoomIn className="h-3 w-3" />
              {t("preview.expand")}
            </>
          )}
        </button>
      </div>

      {hasFields ? (
        <>
          {/* Identified fields header with revert button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-semibold text-gray-700">
                {t("preview.identifiedFields")}
              </span>
            </div>
            {(hasEdits || customFields.length > 0) && (
              <button
                onClick={handleRevert}
                className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                <RotateCcw className="h-3 w-3" />
                {t("preview.revertChanges")}
              </button>
            )}
          </div>

          {/* Editable fields */}
          <div className="space-y-3">
            {allFields.map((field) => {
              const isCustom = customFields.some((f) => f.key === field.key);
              const originalValue = parsed.fields.find(
                (f) => f.key === field.key
              )?.value;
              const isEdited =
                !isCustom && editedValues[field.key] !== originalValue;

              return (
                <div
                  key={field.key}
                  className={`rounded-xl border-2 bg-white p-3 transition-colors ${
                    isEdited || isCustom
                      ? "border-amber-300 shadow-sm"
                      : "border-primary-100"
                  }`}
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-primary-600">
                      {getFieldDisplayName(field.label, t)}
                    </label>
                    {!isCustom && (
                      <ConfidenceBadge confidence={field.confidence} t={t} />
                    )}
                    {isCustom && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-600">
                        <Tag className="h-2.5 w-2.5" />
                        {t("preview.custom")}
                      </span>
                    )}
                    {isEdited && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        <Pencil className="h-2.5 w-2.5" />
                        {t("preview.edited")}
                      </span>
                    )}
                    {isCustom && (
                      <button
                        onClick={() => handleRemoveCustomField(field.key)}
                        className="rounded-full bg-red-100 p-0.5 text-red-500 hover:bg-red-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editedValues[field.key] || ""}
                    onChange={(e) =>
                      handleFieldChange(field.key, e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-200 bg-warm-50 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-primary-400 focus:bg-white"
                  />
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {/* Additional / raw text - selectable for field assignment */}
      {(parsed.remainingText || !hasFields) && (
        <div>
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="flex w-full items-center justify-between rounded-lg bg-warm-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-warm-300"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              {hasFields
                ? t("preview.additionalText")
                : t("preview.extractedText")}
            </span>
            {showRawText ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {showRawText && (
            <div className="relative mt-2">
              {ocrText ? (
                <>
                  <div className="mb-1 flex items-center gap-1 text-[10px] text-primary-500">
                    <Plus className="h-3 w-3" />
                    {t("preview.selectToAssign")}
                  </div>
                  <div
                    ref={textAreaRef}
                    onMouseUp={handleTextSelection}
                    onTouchEnd={handleTextSelection}
                    className="max-h-[25vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-sm select-text cursor-text"
                  >
                    <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800 font-sans">
                      {hasFields ? parsed.remainingText : ocrText}
                    </pre>
                  </div>
                  {selectedText && (
                    <FieldAssignPopup
                      selectedText={selectedText}
                      existingKeys={existingFieldKeys}
                      onAssign={handleAssignField}
                      onClose={() => setSelectedText(null)}
                      t={t}
                    />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary-300 bg-warm-50 p-6">
                  <RefreshCw className="h-8 w-8 text-gray-400" />
                  <p className="text-center text-sm text-gray-500">
                    {t("preview.noText")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onRetake}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("preview.retake")}
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 rounded-xl bg-accent-400 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-accent-500 active:bg-accent-600"
        >
          {t("preview.continue")}
        </button>
      </div>
    </div>
  );
}
