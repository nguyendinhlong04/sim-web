"use client";

import { useState } from "react";
import type { RegionPricing } from "@/lib/electricity-pricing";
import { calcOldBill, calcNewBill, estimateKwhFromBill } from "@/lib/electricity-pricing";

type Props = {
  region: RegionPricing;
  t: (key: string) => string;
};

export default function SavingsCalculator({ region, t }: Props) {
  const [inputMode, setInputMode] = useState<"bill" | "kwh">("bill");
  const [ampere, setAmpere] = useState(30);
  const [monthlyBill, setMonthlyBill] = useState("");
  const [monthlyKwh, setMonthlyKwh] = useState("");
  const [result, setResult] = useState<{
    oldMonthly: number;
    newMonthly: number;
    yearlySaving: number;
  } | null>(null);

  const ampereOptions = region.isMinimumFee ? [] : region.basicFee.map((r) => r.ampere);

  const handleCalc = () => {
    let kwh = 0;

    if (inputMode === "bill") {
      const bill = parseFloat(monthlyBill);
      if (!bill || bill <= 0) return;
      kwh = estimateKwhFromBill(region, bill, ampere);
    } else {
      kwh = parseFloat(monthlyKwh);
      if (!kwh || kwh <= 0) return;
    }

    const oldMonthly = calcOldBill(region, kwh, ampere);
    const newMonthly = calcNewBill(region, kwh, ampere);
    const yearlySaving = (oldMonthly - newMonthly) * 12;

    setResult({ oldMonthly, newMonthly, yearlySaving });
  };

  const savingPct = result && result.oldMonthly > 0
    ? Math.round(((result.oldMonthly - result.newMonthly) / result.oldMonthly) * 100)
    : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
        <h3 className="text-lg font-bold text-white">{t("calculator")}</h3>
        <p className="mt-0.5 text-sm text-orange-100">{region.providerName} → トクスルでんき</p>
      </div>

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: Inputs */}
          <div className="space-y-4">
            {/* Ampere selector (only for non-minimum-fee regions) */}
            {!region.isMinimumFee && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("selectAmpere")}
                </label>
                <div className="flex gap-2">
                  {ampereOptions.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmpere(a)}
                      className={`flex-1 rounded-lg border-2 py-2 text-sm font-bold transition-colors ${
                        ampere === a
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {a}A
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input mode tabs */}
            <div>
              <div className="mb-2 flex rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => { setInputMode("bill"); setResult(null); }}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    inputMode === "bill"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  {t("inputByBill")}
                </button>
                <button
                  type="button"
                  onClick={() => { setInputMode("kwh"); setResult(null); }}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    inputMode === "kwh"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  {t("inputByKwh")}
                </button>
              </div>

              {inputMode === "bill" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t("monthlyBill")}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={monthlyBill}
                      onChange={(e) => { setMonthlyBill(e.target.value); setResult(null); }}
                      placeholder="8,000"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      {t("unit")}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t("monthlyKwh")}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={monthlyKwh}
                      onChange={(e) => { setMonthlyKwh(e.target.value); setResult(null); }}
                      placeholder="300"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      kWh
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Calculate button */}
            <button
              type="button"
              onClick={handleCalc}
              className="w-full rounded-xl bg-orange-500 py-3 text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-lg"
            >
              {t("calculate")}
            </button>
          </div>

          {/* Right: Results */}
          <div className="flex flex-col justify-center">
            {result ? (
              <div className="space-y-4">
                {/* Monthly comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-4 text-center">
                    <div className="mb-1 text-xs text-gray-500">{t("oldProvider")}</div>
                    <div className="text-sm font-medium text-gray-400">{t("monthly")}</div>
                    <div className="mt-1 text-xl font-bold text-gray-700">
                      {result.oldMonthly.toLocaleString()}<span className="text-sm">{t("unit")}</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-orange-50 p-4 text-center">
                    <div className="mb-1 text-xs text-orange-500">{t("newProvider")}</div>
                    <div className="text-sm font-medium text-orange-400">{t("monthly")}</div>
                    <div className="mt-1 text-xl font-bold text-orange-600">
                      {result.newMonthly.toLocaleString()}<span className="text-sm">{t("unit")}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="rounded-lg bg-gray-100 p-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-gray-500">{t("newProvider")}</span>
                    <span className="font-bold text-green-600">-{savingPct}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.max(0, 100 - savingPct)}%` }}
                    />
                  </div>
                </div>

                {/* Yearly savings (big highlight) */}
                <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-center text-white shadow-lg">
                  <div className="text-sm font-medium text-green-100">{t("yearlySavings")}</div>
                  <div className="mt-1 text-4xl font-extrabold">
                    {result.yearlySaving.toLocaleString()}
                    <span className="text-lg">{t("unit")}</span>
                  </div>
                  <div className="mt-1 text-sm text-green-200">
                    ({t("monthly")}: {(result.oldMonthly - result.newMonthly).toLocaleString()}{t("unit")} × 12)
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg className="h-16 w-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="mt-3 text-sm text-gray-400">{t("resultPlaceholder")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
