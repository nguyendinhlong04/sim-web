import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileNav from "./MobileNav";

export type SiteConfigProps = {
  companyName: string;
  companyDesc: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoUrl: string;
};

type HeaderProps = {
  locale: string;
  siteConfig: SiteConfigProps;
};

export default function Header({ locale, siteConfig }: HeaderProps) {
  const t = useTranslations("Nav");
  const displayName = siteConfig.companyName || "Company";

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 text-lg font-semibold text-blue-600">
          {siteConfig.logoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={siteConfig.logoUrl}
              alt={displayName}
              className="h-8 w-auto object-contain"
            />
          )}
          {displayName}
        </Link>
        <nav className="hidden items-center gap-6 text-sm lg:flex">
          <Link href={`/${locale}`}>{t("home")}</Link>
          <Link href={`/${locale}/dien`} className="font-medium text-orange-600">{t("electric")}</Link>
          <Link href={`/${locale}/sim-the`} className="font-medium text-blue-600">{t("sim")}</Link>
          <Link href={`/${locale}/gioi-thieu`}>{t("about")}</Link>
          <Link href={`/${locale}/tin-tuc`}>{t("news")}</Link>
          <Link href={`/${locale}/lien-he`}>{t("contact")}</Link>
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitcher />
          <Link
            href="/admin"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            {t("admin")}
          </Link>
        </div>
        <MobileNav locale={locale} />
      </div>
    </header>
  );
}
