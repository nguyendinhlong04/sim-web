"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

type MobileNavProps = {
  locale: string;
};

export default function MobileNav({ locale }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Nav");

  return (
    <div className="lg:hidden">
      <button
        className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        Menu
      </button>
      {open ? (
        <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <nav className="flex flex-col gap-3 text-sm">
            <Link href={`/${locale}`}>{t("home")}</Link>
            <Link href={`/${locale}/dien`} className="font-medium text-orange-600">{t("electric")}</Link>
            <Link href={`/${locale}/sim-the`} className="font-medium text-blue-600">{t("sim")}</Link>
            <Link href={`/${locale}/gioi-thieu`}>{t("about")}</Link>
            <Link href={`/${locale}/tin-tuc`}>{t("news")}</Link>
            <Link href={`/${locale}/lien-he`}>{t("contact")}</Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
