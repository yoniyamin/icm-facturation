"use client";

import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import LanguageSwitcher from "./LanguageSwitcher";
import { Receipt, LogOut, List } from "lucide-react";
import ConnectionStatus from "./ConnectionStatus";

interface AppHeaderProps {
  onShowReceipts?: () => void;
}

export default function AppHeader({ onShowReceipts }: AppHeaderProps) {
  const t = useTranslations();
  const { data: session } = useSession();

  const userName =
    session?.user?.name?.split(" ")[0] ||
    session?.user?.email?.split("@")[0] ||
    "";

  return (
    <header className="sticky top-0 z-50 border-b border-primary-200 bg-primary-500/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
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
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {session && onShowReceipts && (
            <button
              onClick={onShowReceipts}
              title={t("receipts.title")}
              className="flex items-center gap-1 rounded-md bg-white/20 px-2 py-1 text-[10px] font-bold text-white transition-colors hover:bg-white/30"
            >
              <List className="h-3 w-3" />
              <span className="hidden sm:inline">{t("receipts.title")}</span>
            </button>
          )}
          <ConnectionStatus />
          <LanguageSwitcher />
          {session && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title={t("auth.signOut")}
              className="flex items-center gap-1 rounded-md bg-white/20 px-2 py-1 text-[10px] font-bold text-white transition-colors hover:bg-white/30"
            >
              <LogOut className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
