"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { X, UserPlus, Trash2, Shield, Loader2 } from "lucide-react";

interface AllowedUser {
  email: string;
  isAdmin: boolean;
  addedBy: string;
  addedAt: string;
}

interface Props {
  onClose: () => void;
}

export default function AllowedUsersModal({ onClose }: Props) {
  const t = useTranslations();
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [seedAdmins, setSeedAdmins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAdmin, setNewAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/allowed-emails");
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setUsers(data.users || []);
      setSeedAdmins(data.seedAdmins || []);
    } catch {
      setError(t("users.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/allowed-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, isAdmin: newAdmin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("users.saveError"));
      setUsers(data.users || []);
      setNewEmail("");
      setNewAdmin(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("users.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(t("users.confirmRemove", { email }))) return;
    setError("");
    try {
      const res = await fetch("/api/admin/allowed-emails", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("users.saveError"));
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("users.saveError"));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-semibold text-primary-900">
            {t("users.title")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label={t("users.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleAdd}
            className="mb-4 flex flex-col gap-2 rounded-xl border border-gray-200 bg-warm-50 p-3"
          >
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={t("users.emailPlaceholder")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary-400"
              required
            />
            <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={newAdmin}
                onChange={(e) => setNewAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
              />
              {t("users.makeAdmin")}
            </label>
            <button
              type="submit"
              disabled={submitting || !newEmail.trim()}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {t("users.add")}
            </button>
          </form>

          <div className="space-y-2">
            {seedAdmins.map((email) => (
              <div
                key={`seed-${email}`}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-gray-800">
                      {email}
                    </p>
                    <p className="text-[10px] text-amber-700">
                      {t("users.seedAdmin")}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
              </div>
            ) : users.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-500">
                {t("users.empty")}
              </p>
            ) : (
              users.map((u) => (
                <div
                  key={u.email}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {u.isAdmin && (
                      <Shield className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-800">
                        {u.email}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {u.isAdmin ? t("users.admin") : t("users.user")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(u.email)}
                    className="shrink-0 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                    aria-label={t("users.remove")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
