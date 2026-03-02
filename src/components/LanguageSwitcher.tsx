"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";
import { useLocale } from "next-intl";

const localeLabels: Record<string, string> = {
  he: "HE",
  es: "ES",
  en: "EN",
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex rounded-lg bg-white/20 p-0.5">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`rounded-md px-1.5 py-1 text-[10px] font-bold transition-all ${
            currentLocale === locale
              ? "bg-white text-primary-700 shadow-sm"
              : "text-white/80 hover:text-white"
          }`}
        >
          {localeLabels[locale] || locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
