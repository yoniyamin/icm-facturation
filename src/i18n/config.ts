export const locales = ["he", "es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "he";

export const localeNames: Record<Locale, string> = {
  he: "עברית",
  es: "Español",
  en: "English",
};

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
  es: "ltr",
  en: "ltr",
};
