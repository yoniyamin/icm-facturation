"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import LanguageSwitcher from "./LanguageSwitcher";
import AllowedUsersModal from "./AllowedUsersModal";
import { Receipt, LogOut, List, Menu, X, Users } from "lucide-react";
import ConnectionStatus from "./ConnectionStatus";

interface AppHeaderProps {
  onShowReceipts?: () => void;
}

export default function AppHeader({ onShowReceipts }: AppHeaderProps) {
  const t = useTranslations();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userName =
    session?.user?.name?.split(" ")[0] ||
    session?.user?.email?.split("@")[0] ||
    "";

  const isAdmin =
    !!(session?.user as { isAdmin?: boolean } | undefined)?.isAdmin;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-primary-200 bg-primary-500/95 backdrop-blur-sm">
      <div className="mx-auto flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-400 shadow-sm sm:h-9 sm:w-9">
            <Receipt className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xs font-bold leading-tight text-white sm:text-sm">
              {t("app.title")}
            </h1>
            {userName && (
              <p className="truncate text-[10px] text-primary-200">
                {userName}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ConnectionStatus compact />
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center rounded-md bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30"
            >
              {menuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>

            {menuOpen && (
              <div className="absolute end-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                {session && onShowReceipts && (
                  <button
                    onClick={() => {
                      onShowReceipts();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-primary-50"
                  >
                    <List className="h-4 w-4 text-primary-500" />
                    {t("receipts.title")}
                  </button>
                )}
                {session && isAdmin && (
                  <button
                    onClick={() => {
                      setUsersOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 border-t border-gray-100 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-primary-50"
                  >
                    <Users className="h-4 w-4 text-primary-500" />
                    {t("users.title")}
                  </button>
                )}
                <div className="border-t border-gray-100 px-4 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    {t("language.select")}
                  </p>
                  <LanguageSwitcher />
                </div>
                {session && (
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-2.5 border-t border-gray-100 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("auth.signOut")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {usersOpen && <AllowedUsersModal onClose={() => setUsersOpen(false)} />}
    </header>
  );
}
