"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { REGIONS, REGION_NAMES } from "@/lib/electricity-pricing";
import JapanRegionMap from "@/components/electricity/JapanRegionMap";
import PricingTable from "@/components/electricity/PricingTable";
import SavingsCalculator from "@/components/electricity/SavingsCalculator";

export default function ElectricityDetailsPage() {
  const t = useTranslations("ElecPrice");
  const locale = useLocale();

  const [activeRegion, setActiveRegion] = useState("tokyo");
  const region = REGIONS.find((r) => r.regionKey === activeRegion) ?? REGIONS[2];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ── Hero Header ── */}
      <section className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 px-4 py-12 text-white md:py-16">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-orange-100 md:text-lg">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {/* ── Region Selector + Map ── */}
        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-gray-900 md:text-2xl">
            {t("selectRegion")}
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Tab buttons */}
            <div className="space-y-2">
              {REGIONS.map((r) => (
                <button
                  key={r.regionKey}
                  type="button"
                  onClick={() => setActiveRegion(r.regionKey)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-5 py-3.5 text-left transition-all ${
                    activeRegion === r.regionKey
                      ? "border-orange-500 bg-orange-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        activeRegion === r.regionKey
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {REGION_NAMES[r.regionKey]?.charAt(0)}
                    </span>
                    <div>
                      <div
                        className={`font-semibold ${
                          activeRegion === r.regionKey ? "text-orange-700" : "text-gray-800"
                        }`}
                      >
                        {REGION_NAMES[r.regionKey]}
                      </div>
                      <div className="text-xs text-gray-400">{r.providerName}</div>
                    </div>
                  </div>
                  {activeRegion === r.regionKey && (
                    <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Map */}
            <div className="flex flex-col items-center justify-center">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                {t("mapTitle")}
              </h3>
              <JapanRegionMap activeRegion={activeRegion} onSelect={setActiveRegion} />
              {/* Prefectures display */}
              <div className="mt-4 text-center">
                <p className="mb-2 text-xs font-medium text-gray-500">{t("prefectures")}</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {region.prefectures.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing Table ── */}
        <section className="mb-12">
          <PricingTable region={region} t={(key: string) => t(key)} />
        </section>

        {/* ── Savings Calculator ── */}
        <section className="mb-12">
          <SavingsCalculator region={region} t={(key: string) => t(key)} />
        </section>

        {/* ── CTA ── */}
        <section className="text-center">
          <Link
            href={`/${locale}/dien`}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            {t("ctaText")}
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </section>
      </div>
    </div>
  );
}
