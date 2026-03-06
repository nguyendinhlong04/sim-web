import { useTranslations } from "next-intl";
import StructuredData from "@/components/seo/StructuredData";

export default function HomeWifiPage() {
  const t = useTranslations("Pages");

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold text-gray-900">
        {t("homeWifi")}
      </h1>
      <p className="text-base text-gray-600">{t("homeWifiDesc")}</p>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: t("homeWifi"),
          description: t("homeWifiDesc"),
        }}
      />
    </section>
  );
}
