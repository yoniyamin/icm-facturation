"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import { Receipt } from "lucide-react";
import ConnectionStatus from "./ConnectionStatus";

export default function AppHeader() {
  const t = useTranslations("app");

  return (
    <header className="sticky top-0 z-50 border-b border-primary-200 bg-primary-500/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400 shadow-sm">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-white">
              {t("title")}
            </h1>
            <p className="text-xs text-primary-100">{t("subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionStatus />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
