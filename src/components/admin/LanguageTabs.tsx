"use client";

import { locales } from "@/i18n/routing";

type LanguageTabsProps = {
  activeLocale: string;
  onChange: (locale: string) => void;
};

export default function LanguageTabs({
  activeLocale,
  onChange,
}: LanguageTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {locales.map((locale) => (
        <button
          className={`rounded-md px-3 py-1 text-sm ${
            activeLocale === locale
              ? "bg-blue-600 text-white"
              : "border border-gray-200 text-gray-700"
          }`}
          key={locale}
          onClick={() => onChange(locale)}
          type="button"
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
