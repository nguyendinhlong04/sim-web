"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";

// ── i18n for ElecPrice namespace ──
function useElecPriceT() {
  const t = useTranslations("ElecPrice");
  return t;
}

// ── Types ─────────────────────────────────────────────────

type LandingTranslation = {
  title: string;
  subtitle: string | null;
  description: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
};

type LandingSectionData = {
  sectionKey: string;
  sectionType: string;
  sortOrder: number;
  imageUrl: string | null;
  extraData: Record<string, string> | null;
  translation: LandingTranslation | null;
};

type LandingData = {
  hero: LandingSectionData | null;
  features: LandingSectionData[];
  plans: LandingSectionData[];
  stepsNew: LandingSectionData[];
  stepsSwitch: LandingSectionData[];
  faqs: LandingSectionData[];
};

// ── Page Component ────────────────────────────────────────

export default function DienPage() {
  const t = useTranslations("Pages");
  const tElec = useElecPriceT();
  const locale = useLocale();
  const [landing, setLanding] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/landing?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setLanding(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale]);

  const hasFeatures = landing?.features && landing.features.length > 0;
  const hasPlans = landing?.plans && landing.plans.length > 0;
  const hasSteps =
    (landing?.stepsNew && landing.stepsNew.length > 0) ||
    (landing?.stepsSwitch && landing.stepsSwitch.length > 0);
  const hasFaqs = landing?.faqs && landing.faqs.length > 0;
  const hasContent = hasFeatures || hasPlans || hasSteps || hasFaqs;

  const heroTitle = landing?.hero?.translation?.title || t("electric");
  const heroSubtitle = landing?.hero?.translation?.subtitle || t("electricDesc");

  return (
    <div className="flex flex-col">
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: t("electric"),
          description: t("electricDesc"),
        }}
      />

      {/* ════════════════════════════════════════════════════
          HERO
         ════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 px-6 py-16 text-center text-white md:py-24">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
          {heroTitle}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-orange-100">
          {heroSubtitle}
        </p>
      </section>

      {/* ════════════════════════════════════════════════════
          IN-PAGE NAVIGATION (anchor links like tokusurudenki)
         ════════════════════════════════════════════════════ */}
      {hasContent && (
        <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto w-full max-w-4xl px-4 py-3">
            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max min-w-full items-center gap-1 md:justify-center md:gap-2">
            {hasFeatures && (
              <a href="#features" className="shrink-0 whitespace-nowrap rounded-full border border-orange-200 bg-orange-50 px-5 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100">
                {landing!.features[0]?.translation?.buttonText || "Features"}
              </a>
            )}
            {hasSteps && (
              <a href="#steps" className="shrink-0 whitespace-nowrap rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100">
                {landing!.stepsNew[0]?.translation?.buttonText || "How to Apply"}
              </a>
            )}
            {hasPlans && (
              <a href="#plans" className="shrink-0 whitespace-nowrap rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100">
                {landing!.plans[0]?.translation?.buttonText || "Plans"}
              </a>
            )}
            {hasFaqs && (
              <a href="#faq" className="shrink-0 whitespace-nowrap rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100">
                FAQ
              </a>
            )}
            <Link
              href={`/${locale}/dien/details`}
              className="shrink-0 whitespace-nowrap rounded-full border border-orange-300 bg-orange-50 px-5 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100"
            >
              {tElec("detailsLink")}
            </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Loading */}
      {loading && (
        <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-16">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-4 rounded-2xl border border-gray-200 bg-white p-10">
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="h-8 w-2/3 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-48 w-full rounded-xl bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {/* No content */}
      {!loading && !hasContent && (
        <div className="py-24 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="mt-4 text-lg text-gray-500">{t("electricDesc")}</p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          FEATURES (full-width stacked cards, like tokusurudenki)
         ════════════════════════════════════════════════════ */}
      {hasFeatures && (
        <section id="features" className="scroll-mt-16 bg-gray-50 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 md:text-3xl">
              {landing!.features[0]?.translation?.buttonText || t("electric")}
            </h2>
            <p className="mb-12 text-center text-gray-500">
              {heroSubtitle}
            </p>

            <div className="space-y-10">
              {landing!.features.map((feature, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={feature.sectionKey}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image -- always on top on mobile, alternates on desktop */}
                      {feature.imageUrl && (
                        <div className={`flex items-center justify-center bg-gray-50 p-6 md:w-1/2 ${isEven ? "md:order-2" : "md:order-1"}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={feature.imageUrl}
                            alt={feature.translation?.title || ""}
                            className="max-h-64 w-full object-contain"
                          />
                        </div>
                      )}

                      {/* Text content */}
                      <div className={`flex-1 p-8 md:p-10 ${feature.imageUrl ? `md:w-1/2 ${isEven ? "md:order-1" : "md:order-2"}` : ""}`}>
                        {/* Number + FEATURE label */}
                        <div className="mb-4 flex items-center gap-3">
                          <span className="text-4xl font-black text-orange-500">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="rounded bg-orange-500 px-2.5 py-0.5 text-xs font-bold tracking-widest text-white">
                            FEATURE
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="mb-2 text-xl font-extrabold leading-tight text-gray-900 md:text-2xl">
                          {feature.translation?.title || ""}
                        </h3>

                        {/* Subtitle (highlight) */}
                        {feature.translation?.subtitle && (
                          <p className="mb-4 text-lg font-bold text-orange-600">
                            {feature.translation.subtitle}
                          </p>
                        )}

                        {/* Description */}
                        <p className="text-base leading-relaxed text-gray-600">
                          {feature.translation?.description || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════
          STEPS (horizontal flow with arrows, like tokusurudenki)
         ════════════════════════════════════════════════════ */}
      {hasSteps && (
        <section id="steps" className="scroll-mt-16 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
              {landing!.stepsNew[0]?.translation?.buttonText || "How to Apply"}
            </h2>

            {/* New Registration */}
            {landing!.stepsNew.length > 0 && (
              <div className="mb-12">
                <h3 className="mb-8 text-center text-lg font-bold text-gray-800">
                  {landing!.stepsNew[0]?.translation?.buttonText || "New Registration"}
                </h3>
                <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-start">
                  {landing!.stepsNew.map((step, idx) => (
                    <div key={step.sectionKey} className="flex flex-1 flex-col items-center md:flex-row">
                      {/* Step card */}
                      <div className="flex w-full flex-1 flex-col items-center rounded-2xl border-2 border-green-200 bg-green-50 px-6 py-8 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-lg font-bold text-white shadow-md">
                          {idx + 1}
                        </div>
                        <h4 className="mb-2 font-bold text-gray-900">
                          {step.translation?.title || ""}
                        </h4>
                        <p className="text-sm leading-relaxed text-gray-600">
                          {step.translation?.description || ""}
                        </p>
                      </div>
                      {/* Arrow */}
                      {idx < landing!.stepsNew.length - 1 && (
                        <div className="flex shrink-0 items-center justify-center py-2 md:px-2 md:py-0">
                          {/* Vertical arrow (mobile) */}
                          <svg className="h-6 w-6 text-green-400 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          {/* Horizontal arrow (desktop) */}
                          <svg className="hidden h-6 w-6 text-green-400 md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Switch Provider */}
            {landing!.stepsSwitch.length > 0 && (
              <div>
                <h3 className="mb-8 text-center text-lg font-bold text-gray-800">
                  {landing!.stepsSwitch[0]?.translation?.buttonText || "Switch Provider"}
                </h3>
                <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-start">
                  {landing!.stepsSwitch.map((step, idx) => (
                    <div key={step.sectionKey} className="flex flex-1 flex-col items-center md:flex-row">
                      {/* Step card */}
                      <div className="flex w-full flex-1 flex-col items-center rounded-2xl border-2 border-orange-200 bg-orange-50 px-6 py-8 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-lg font-bold text-white shadow-md">
                          {idx + 1}
                        </div>
                        <h4 className="mb-2 font-bold text-gray-900">
                          {step.translation?.title || ""}
                        </h4>
                        <p className="text-sm leading-relaxed text-gray-600">
                          {step.translation?.description || ""}
                        </p>
                      </div>
                      {/* Arrow */}
                      {idx < landing!.stepsSwitch.length - 1 && (
                        <div className="flex shrink-0 items-center justify-center py-2 md:px-2 md:py-0">
                          <svg className="h-6 w-6 text-orange-400 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <svg className="hidden h-6 w-6 text-orange-400 md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════
          PLANS (full-width, prominent discount, like tokusurudenki)
         ════════════════════════════════════════════════════ */}
      {hasPlans && (
        <section id="plans" className="scroll-mt-16 bg-gray-50 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 md:text-3xl">
              {landing!.plans[0]?.translation?.buttonText || t("electric")}
            </h2>

            {/* Discount highlight bar */}
            {landing!.plans.some((p) => p.extraData?.discount) && (
              <div className="mx-auto mb-10 flex max-w-xl flex-wrap items-center justify-center gap-3 text-center">
                {landing!.plans.map(
                  (plan) =>
                    plan.extraData?.discount && (
                      <span
                        key={plan.sectionKey}
                        className="rounded-full bg-red-500 px-5 py-2 text-sm font-bold text-white shadow"
                      >
                        {plan.translation?.title}: {plan.extraData.discount}
                      </span>
                    )
                )}
              </div>
            )}

            <div className="space-y-8">
              {landing!.plans.map((plan) => (
                <div
                  key={plan.sectionKey}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className={`flex flex-col ${plan.imageUrl ? "md:flex-row" : ""}`}>
                    {/* Text */}
                    <div className={`p-8 md:p-10 ${plan.imageUrl ? "md:w-1/2" : ""}`}>
                      <h3 className="text-2xl font-extrabold text-gray-900">
                        {plan.translation?.title || ""}
                      </h3>
                      {plan.translation?.subtitle && (
                        <p className="mt-2 text-lg font-bold text-orange-600">
                          {plan.translation.subtitle}
                        </p>
                      )}
                      {plan.extraData?.price && (
                        <div className="mt-4 inline-block rounded-lg bg-orange-50 px-4 py-2">
                          <span className="text-3xl font-extrabold text-orange-600">
                            {plan.extraData.price}
                          </span>
                        </div>
                      )}
                      {plan.extraData?.discount && (
                        <div className="mt-3">
                          <span className="rounded bg-red-100 px-3 py-1 text-sm font-bold text-red-600">
                            {plan.extraData.discount}
                          </span>
                        </div>
                      )}
                      <p className="mt-4 text-base leading-relaxed text-gray-600">
                        {plan.translation?.description || ""}
                      </p>
                    </div>
                    {/* Image */}
                    {plan.imageUrl && (
                      <div className="flex items-center justify-center bg-gray-50 p-6 md:w-1/2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={plan.imageUrl}
                          alt={plan.translation?.title || ""}
                          className="max-h-72 w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Link to pricing details */}
            <div className="mt-10 text-center">
              <Link
                href={`/${locale}/dien/details`}
                className="inline-flex items-center gap-2 rounded-full border-2 border-orange-500 px-8 py-3 text-base font-bold text-orange-600 transition-all hover:bg-orange-50"
              >
                {tElec("detailsLink")}
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════
          FAQ (accordion, like tokusurudenki)
         ════════════════════════════════════════════════════ */}
      {hasFaqs && (
        <section id="faq" className="scroll-mt-16 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 md:text-3xl">
              FAQ
            </h2>
            <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {landing!.faqs.map((faq) => (
                <FaqItem
                  key={faq.sectionKey}
                  question={faq.translation?.title || ""}
                  answer={faq.translation?.description || ""}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ── FAQ Accordion Item ────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  if (!question) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-gray-50"
      >
        <span className="pr-4 text-base font-semibold text-gray-900">{question}</span>
        <svg
          className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="bg-gray-50 px-6 py-5 text-base leading-relaxed text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
}
