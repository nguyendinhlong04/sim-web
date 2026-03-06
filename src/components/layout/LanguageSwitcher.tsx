"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { locales } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleChange = (nextLocale: string) => {
    if (!pathname) {
      router.push(`/${nextLocale}`);
      return;
    }

    const segments = pathname.split("/");
    if (segments.length > 1) {
      segments[1] = nextLocale;
      router.push(segments.join("/"));
      return;
    }

    router.push(`/${nextLocale}`);
  };

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-gray-500">Lang</span>
      <select
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
        onChange={(event) => handleChange(event.target.value)}
        value={locale}
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {item.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}
