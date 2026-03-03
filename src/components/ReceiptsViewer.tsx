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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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

const PAGE_OPTIONS = [5, 10, 20, 50, 0] as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  NIS: "₪",
};

type SortKey = "businessName" | "projectName" | "subject" | "amount" | "date";
type SortDir = "asc" | "desc";

function parseDate(d: string): number {
  const parts = d.split("/");
  if (parts.length === 3) {
    return new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
  }
  return new Date(d).getTime() || 0;
}

export default function ReceiptsViewer({ onBack }: ReceiptsViewerProps) {
  const t = useTranslations();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [projectFilter, setProjectFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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
    let result = receipts;
    if (projectFilter) {
      result = result.filter((r) =>
        r.projectName.toLowerCase().includes(projectFilter.toLowerCase())
      );
    }
    return result;
  }, [receipts, projectFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "amount") {
        cmp = parseFloat(a.amount || "0") - parseFloat(b.amount || "0");
      } else if (sortKey === "date") {
        cmp = parseDate(a.date) - parseDate(b.date);
      } else {
        cmp = (a[sortKey] || "").localeCompare(b[sortKey] || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages =
    pageSize === 0 ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize));
  const safeP = Math.min(page, totalPages);
  const paged =
    pageSize === 0
      ? sorted
      : sorted.slice((safeP - 1) * pageSize, safeP * pageSize);

  const hasFilters = !!projectFilter;

  const clearFilters = () => {
    setProjectFilter("");
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [projectFilter, pageSize]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

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
    <div className="flex flex-1 flex-col gap-3">
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

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              placeholder={t("receipts.projectFilter")}
              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pe-3 ps-8 text-xs outline-none transition-colors focus:border-primary-400"
            />
          </div>
        </div>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-primary-400"
        >
          {PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n === 0 ? t("receipts.all") || "All" : `${n} / ${t("receipts.page").toLowerCase()}`}
            </option>
          ))}
        </select>
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

      {/* Table */}
      {paged.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-primary-200 bg-warm-50 py-12">
          <p className="text-sm text-gray-500">{t("receipts.noResults")}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-xl border border-primary-200">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary-200 bg-primary-50">
                <th
                  onClick={() => handleSort("businessName")}
                  className="cursor-pointer px-3 py-2 text-start text-xs font-semibold text-primary-700 select-none hover:bg-primary-100"
                >
                  <span className="inline-flex items-center gap-1">
                    {t("receipts.businessName")}
                    <SortIcon col="businessName" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("projectName")}
                  className="cursor-pointer px-3 py-2 text-start text-xs font-semibold text-primary-700 select-none hover:bg-primary-100"
                >
                  <span className="inline-flex items-center gap-1">
                    {t("receipts.project")}
                    <SortIcon col="projectName" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("subject")}
                  className="cursor-pointer px-3 py-2 text-start text-xs font-semibold text-primary-700 select-none hover:bg-primary-100"
                >
                  <span className="inline-flex items-center gap-1">
                    {t("receipts.category")}
                    <SortIcon col="subject" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="cursor-pointer px-3 py-2 text-end text-xs font-semibold text-primary-700 select-none hover:bg-primary-100"
                >
                  <span className="inline-flex items-center justify-end gap-1">
                    {t("receipts.amount")}
                    <SortIcon col="amount" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("date")}
                  className="cursor-pointer px-3 py-2 text-start text-xs font-semibold text-primary-700 select-none hover:bg-primary-100"
                >
                  <span className="inline-flex items-center gap-1">
                    {t("receipts.date")}
                    <SortIcon col="date" />
                  </span>
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
                  <td className="max-w-[140px] truncate px-3 py-2 text-gray-800">
                    {r.businessName || "—"}
                  </td>
                  <td className="max-w-[140px] truncate px-3 py-2 text-gray-800">
                    {r.projectName}
                  </td>
                  <td className="max-w-[120px] truncate px-3 py-2 text-gray-600">
                    {r.subject}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-end font-medium text-gray-800">
                    {CURRENCY_SYMBOLS[r.currency] || r.currency} {r.amount}
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
      {pageSize > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-1">
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
