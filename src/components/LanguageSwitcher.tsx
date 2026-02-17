"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1">
      <Globe className="h-4 w-4 text-primary-100" />
      <div className="flex rounded-lg bg-white/20 p-0.5">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
              currentLocale === locale
                ? "bg-white text-primary-700 shadow-sm"
                : "text-white/80 hover:text-white"
            }`}
          >
            {localeNames[locale]}
          </button>
        ))}
      </div>
    </div>
  );
}
