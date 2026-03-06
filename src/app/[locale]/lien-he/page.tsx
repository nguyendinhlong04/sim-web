import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("Pages");

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold text-gray-900">{t("contact")}</h1>
      <p className="text-base text-gray-600">{t("contactDesc")}</p>
      <form className="grid gap-4 rounded-xl border border-gray-200 bg-white p-6">
        <input
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder={t("contactName")}
          type="text"
        />
        <input
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder={t("contactEmail")}
          type="email"
        />
        <textarea
          className="min-h-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder={t("contactMessage")}
        />
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          type="submit"
        >
          {t("contactSubmit")}
        </button>
      </form>
    </section>
  );
}
