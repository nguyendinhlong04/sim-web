import { useTranslations } from "next-intl";
import type { SiteConfigProps } from "./Header";

type FooterProps = {
  siteConfig: SiteConfigProps;
};

export default function Footer({ siteConfig }: FooterProps) {
  const t = useTranslations("Footer");

  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 text-sm text-gray-600 md:grid-cols-3">
        <div>
          <div className="text-base font-semibold text-gray-900">
            {siteConfig.companyName || t("company")}
          </div>
          <p className="mt-2">{siteConfig.companyAddress || t("address")}</p>
        </div>
        <div>
          <div className="text-base font-semibold text-gray-900">
            {t("contact")}
          </div>
          <p className="mt-2">{siteConfig.companyPhone || t("phone")}</p>
          <p>{siteConfig.companyEmail || t("email")}</p>
        </div>
        <div>
          <div className="text-base font-semibold text-gray-900">
            {t("follow")}
          </div>
          <p className="mt-2">Facebook · Zalo · LinkedIn</p>
        </div>
      </div>
    </footer>
  );
}
