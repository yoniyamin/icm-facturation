"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Search,
} from "lucide-react";

interface Receipt {
  date: string;
  receiptNumber: string;
  projectName: string;
  subject: string;
  amount: string;
  imageLink: string;
  currency: string;
  businessName: string;
}

interface ReceiptsViewerProps {
  onBack: () => void;
}

const PAGE_SIZE = 10;

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  NIS: "₪",
};

export default function ReceiptsViewer({ onBack }: ReceiptsViewerProps) {
  const t = useTranslations();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const [projectFilter, setProjectFilter] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  useEffect(() => {
    fetch("/api/receipts")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setReceipts(data.receipts || []);
        setLoading(false);
      })
      .catch(() => {
        setError(t("receipts.error"));
        setLoading(false);
      });
  }, [t]);

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      if (
        projectFilter &&
        !r.projectName.toLowerCase().includes(projectFilter.toLowerCase())
      )
        return false;
      const amt = parseFloat(r.amount);
      if (amountMin && !isNaN(parseFloat(amountMin)) && amt < parseFloat(amountMin))
        return false;
      if (amountMax && !isNaN(parseFloat(amountMax)) && amt > parseFloat(amountMax))
        return false;
      return true;
    });
  }, [receipts, projectFilter, amountMin, amountMax]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeP = Math.min(page, totalPages);
  const paged = filtered.slice((safeP - 1) * PAGE_SIZE, safeP * PAGE_SIZE);

  const hasFilters = projectFilter || amountMin || amountMax;

  const clearFilters = () => {
    setProjectFilter("");
    setAmountMin("");
    setAmountMax("");
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [projectFilter, amountMin, amountMax]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        <p className="text-sm text-gray-500">{t("receipts.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("receipts.back")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-primary-900">
          {t("receipts.title")}
        </h2>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("receipts.back")}
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-primary-200 bg-white p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {t("receipts.project")}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                placeholder={t("receipts.projectFilter")}
                className="w-full rounded-lg border border-gray-200 bg-warm-50 py-1.5 pe-3 ps-8 text-xs outline-none transition-colors focus:border-primary-400 focus:bg-white"
              />
            </div>
          </div>
          <div className="w-20">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {t("receipts.amountMin")}
            </label>
            <input
              type="number"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-200 bg-warm-50 px-2.5 py-1.5 text-xs outline-none transition-colors focus:border-primary-400 focus:bg-white"
            />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {t("receipts.amountMax")}
            </label>
            <input
              type="number"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
              placeholder="999"
              className="w-full rounded-lg border border-gray-200 bg-warm-50 px-2.5 py-1.5 text-xs outline-none transition-colors focus:border-primary-400 focus:bg-white"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <X className="h-3 w-3" />
              {t("receipts.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {paged.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-primary-200 bg-warm-50 py-12">
          <p className="text-sm text-gray-500">{t("receipts.noResults")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-200">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-primary-200 bg-primary-50">
                <th className="px-3 py-2 text-start text-xs font-semibold text-primary-700">
                  {t("receipts.businessName")}
                </th>
                <th className="px-3 py-2 text-start text-xs font-semibold text-primary-700">
                  {t("receipts.project")}
                </th>
                <th className="px-3 py-2 text-start text-xs font-semibold text-primary-700">
                  {t("receipts.category")}
                </th>
                <th className="px-3 py-2 text-end text-xs font-semibold text-primary-700">
                  {t("receipts.amount")}
                </th>
                <th className="px-3 py-2 text-start text-xs font-semibold text-primary-700">
                  {t("receipts.date")}
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-primary-700">
                  {t("receipts.photo")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 bg-white transition-colors hover:bg-warm-50"
                >
                  <td className="max-w-[120px] truncate px-3 py-2 text-gray-800">
                    {r.businessName || "—"}
                  </td>
                  <td className="max-w-[120px] truncate px-3 py-2 text-gray-800">
                    {r.projectName}
                  </td>
                  <td className="max-w-[100px] truncate px-3 py-2 text-gray-600">
                    {r.subject}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-end font-medium text-gray-800">
                    {CURRENCY_SYMBOLS[r.currency] || r.currency}{" "}
                    {r.amount}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {r.date}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {r.imageLink ? (
                      <a
                        href={r.imageLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-200"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("receipts.viewPhoto")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safeP <= 1}
            className="rounded-lg border border-gray-300 bg-white p-1.5 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-gray-600">
            {t("receipts.page")} {safeP} {t("receipts.of")} {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeP >= totalPages}
            className="rounded-lg border border-gray-300 bg-white p-1.5 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
