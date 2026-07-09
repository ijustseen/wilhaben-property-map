export const LOCALE_COOKIE = "wh_lang";

export const SUPPORTED_LOCALES = [
  "en",
  "de",
  "ru",
  "uk",
  "pl",
  "cs",
  "sk",
  "hu",
  "ro",
  "tr",
  "fr",
  "es",
  "it",
] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_NAMES: Record<AppLocale, string> = {
  en: "English",
  de: "German",
  ru: "Russian",
  uk: "Ukrainian",
  pl: "Polish",
  cs: "Czech",
  sk: "Slovak",
  hu: "Hungarian",
  ro: "Romanian",
  tr: "Turkish",
  fr: "French",
  es: "Spanish",
  it: "Italian",
};

export function localeLabel(locale: AppLocale): string {
  return LOCALE_NAMES[locale] ?? locale;
}

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function detectLocale(acceptLanguage: string | null): AppLocale {
  if (!acceptLanguage) return "en";

  const parts = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: qPart ? Number(qPart) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    const primary = tag.split("-")[0];
    if (isAppLocale(primary)) return primary;
    if (isAppLocale(tag)) return tag;
  }

  return "en";
}

export function readLocaleCookie(cookieHeader: string | null): AppLocale | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  return isAppLocale(value) ? value : null;
}
