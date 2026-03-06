import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";

const langAliases: Record<string, Locale> = { tl: "fil" };

function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.trim().toLowerCase(), quality: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { lang } of preferred) {
    const prefix = lang.split("-")[0];
    const resolved = langAliases[prefix] ?? prefix;
    if (locales.includes(resolved as Locale)) return resolved as Locale;
  }

  return defaultLocale;
}

export default function RootPage() {
  const locale = detectLocale(headers().get("accept-language"));
  redirect(`/${locale}`);
}
