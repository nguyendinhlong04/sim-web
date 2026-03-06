"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";

const GROUPS = [
  { value: "", label: "all" },
  { value: "POCKET", label: "pocket" },
  { value: "DATA", label: "data" },
  { value: "DATA_VOICE", label: "dataVoice" },
];
const PROVIDERS = [
  { value: "", label: "all" },
  { value: "SOFTBANK", label: "Softbank" },
  { value: "DOCOMO", label: "Docomo" },
  { value: "RAKUTEN", label: "Rakuten" },
  { value: "AU", label: "Au" },
  { value: "UQ", label: "UQ" },
];

type Product = {
  id: string;
  slug: string;
  group: string;
  provider: string;
  price: number;
  promoPrice: number | null;
  promoEnd: string | null;
  dataCapacity: string;
  validityDays: number;
  translations: { name: string; subtitle: string }[];
  media: { url: string; type: string }[];
};

export default function SimThePage() {
  const t = useTranslations("Pages");
  const locale = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState("");
  const [filterProvider, setFilterProvider] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ locale });
    if (filterGroup) params.set("group", filterGroup);
    if (filterProvider) params.set("provider", filterProvider);

    setLoading(true);
    fetch(`/api/sim-products?${params}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale, filterGroup, filterProvider]);

  const getName = (p: Product) => p.translations[0]?.name ?? p.slug;
  const getSubtitle = (p: Product) => p.translations[0]?.subtitle ?? "";
  const getThumb = (p: Product) => p.media.find((m) => m.type === "IMAGE")?.url;
  const isPromoActive = (p: Product) =>
    p.promoPrice != null && p.promoEnd && new Date(p.promoEnd) > new Date();

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">{t("sim")}</h1>
        <p className="mt-2 text-base text-gray-600">{t("simDesc")}</p>
      </div>

      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t("sim"),
          description: t("simDesc"),
          numberOfItems: products.length,
        }}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {GROUPS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setFilterGroup(g.value)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                filterGroup === g.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {g.label === "all"
                ? "All"
                : g.label === "pocket"
                  ? "Pocket"
                  : g.label === "data"
                    ? "Data"
                    : "Data + Voice"}
            </button>
          ))}
        </div>
        <select
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
          value={filterProvider}
          onChange={(e) => setFilterProvider(e.target.value)}
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.value === "" ? "All Providers" : p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500">
          No products available at the moment.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/${locale}/sim-the/${p.slug}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                {getThumb(p) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getThumb(p)}
                    alt={getName(p)}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                    {p.provider}
                  </span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {p.dataCapacity || p.group}
                  </span>
                  <span className="text-xs text-gray-400">{p.validityDays}d</span>
                </div>
                <h3 className="font-semibold text-gray-900">{getName(p)}</h3>
                {getSubtitle(p) && (
                  <p className="mt-1 text-sm text-gray-500">{getSubtitle(p)}</p>
                )}
                <div className="mt-3 flex items-baseline gap-2">
                  {isPromoActive(p) ? (
                    <>
                      <span className="text-lg font-bold text-red-600">
                        {formatPrice(p.promoPrice!)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(p.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(p.price)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
