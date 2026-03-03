"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";
import { useLocale } from "next-intl";

const localeLabels: Record<string, string> = {
  he: "עברית",
  es: "Español",
  en: "English",
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex gap-1">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
            currentLocale === locale
              ? "bg-primary-100 text-primary-700 shadow-sm"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          }`}
        >
          {localeLabels[locale] || locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
