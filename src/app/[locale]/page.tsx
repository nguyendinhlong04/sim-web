"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import SimProductCard from "@/components/products/SimProductCard";

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

type LandingHero = {
  translation: {
    title: string;
    subtitle: string | null;
    buttonText: string | null;
    buttonUrl: string | null;
  } | null;
};

type LandingData = {
  hero: LandingHero | null;
};

export default function HomePage() {
  const t = useTranslations("Home");
  const nav = useTranslations("Nav");
  const common = useTranslations("Common");
  const locale = useLocale();

  const [simProducts, setSimProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [landing, setLanding] = useState<LandingData | null>(null);

  useEffect(() => {
    // Fetch SIM products
    fetch(`/api/sim-products?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => setSimProducts((data.items ?? []).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch landing page data (only hero needed)
    fetch(`/api/landing?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setLanding(data);
      })
      .catch(() => {});
  }, [locale]);

  const getName = (p: Product) => p.translations[0]?.name ?? p.slug;
  const getSubtitle = (p: Product) => p.translations[0]?.subtitle ?? "";
  const getThumb = (p: Product) => p.media.find((m) => m.type === "IMAGE")?.url;

  // Landing data helpers with fallback
  const heroTitle = landing?.hero?.translation?.title || t("heroTitle");
  const heroSubtitle = landing?.hero?.translation?.subtitle || t("heroSubtitle");
  const heroCta = landing?.hero?.translation?.buttonText || t("cta");
  const heroUrl = landing?.hero?.translation?.buttonUrl || `/${locale}/lien-he`;

  return (
    <div className="flex flex-col gap-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-16 text-center text-white shadow-xl md:px-16 md:py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            {heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-blue-100 md:text-lg">
            {heroSubtitle}
          </p>
          <Link
            href={heroUrl}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            {heroCta}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Featured SIM Products Section */}
      <section>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {t("featuredSim")}
            </h2>
            <p className="mt-2 text-base text-gray-500">
              {t("featuredSimDesc")}
            </p>
          </div>
          <Link
            href={`/${locale}/sim-the`}
            className="hidden items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 md:inline-flex"
          >
            {t("viewAllSim")}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white">
                <div className="aspect-[16/10] rounded-t-2xl bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-gray-200" />
                    <div className="h-5 w-12 rounded-full bg-gray-200" />
                  </div>
                  <div className="h-5 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                  <div className="flex justify-between pt-2">
                    <div className="h-6 w-20 rounded bg-gray-200" />
                    <div className="h-8 w-24 rounded-full bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : simProducts.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {simProducts.map((p) => (
                <SimProductCard
                  key={p.id}
                  slug={p.slug}
                  locale={locale}
                  name={getName(p)}
                  subtitle={getSubtitle(p)}
                  imageUrl={getThumb(p)}
                  provider={p.provider}
                  group={p.group}
                  dataCapacity={p.dataCapacity}
                  validityDays={p.validityDays}
                  price={p.price}
                  promoPrice={p.promoPrice}
                  promoEnd={p.promoEnd}
                  daysLabel={t("days")}
                  promoLabel={t("promo")}
                  ctaLabel={common("learnMore")}
                />
              ))}
            </div>
            {/* Mobile "View All" button */}
            <div className="mt-8 text-center md:hidden">
              <Link
                href={`/${locale}/sim-the`}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-6 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                {t("viewAllSim")}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </>
        ) : (
          /* Fallback: static product cards when no SIM products in database */
          <div className="grid gap-6 md:grid-cols-3">
            <ProductCard
              ctaLabel={common("learnMore")}
              description={t("electricDesc")}
              href={`/${locale}/dien`}
              title={nav("electric")}
            />
            <ProductCard
              ctaLabel={common("learnMore")}
              description={t("wifiDesc")}
              href={`/${locale}/home-wifi`}
              title={nav("homeWifi")}
            />
            <ProductCard
              ctaLabel={common("learnMore")}
              description={t("simDesc")}
              href={`/${locale}/sim-the`}
              title={nav("sim")}
            />
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-sm md:p-12">
        <h2 className="text-2xl font-bold text-gray-900">
          {t("aboutTitle")}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600">
          {t("aboutDesc")}
        </p>
        <Link
          href={`/${locale}/gioi-thieu`}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
        >
          {common("learnMore")}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
