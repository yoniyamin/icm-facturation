"use client";

import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import LanguageSwitcher from "./LanguageSwitcher";
import { Receipt, LogOut } from "lucide-react";
import ConnectionStatus from "./ConnectionStatus";

export default function AppHeader() {
  const t = useTranslations();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-primary-200 bg-primary-500/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400 shadow-sm">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-white">
              {t("app.title")}
            </h1>
            <p className="text-xs text-primary-100">{t("app.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
