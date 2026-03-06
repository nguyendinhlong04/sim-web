import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("Pages");

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold text-gray-900">{t("about")}</h1>
      <p className="text-base text-gray-600">{t("aboutDesc")}</p>
    </section>
  );
}
