"use client";

import type { RegionPricing } from "@/lib/electricity-pricing";

type Props = {
  region: RegionPricing;
  t: (key: string) => string;
};

function fmtYen(n: number): string {
  return n.toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "円";
}

function fmtSaving(diff: number): string {
  return diff.toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "円";
}

export default function PricingTable({ region, t }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">{t("priceUnit")}</h3>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
          {region.note}
        </span>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-5 py-3 text-left font-semibold text-gray-600">
                {t("category")}
              </th>
              <th className="px-5 py-3 text-right font-semibold text-gray-600">
                {region.providerName}
              </th>
              <th className="px-5 py-3 text-right font-semibold text-orange-600">
                トクスルでんき
              </th>
              <th className="px-5 py-3 text-right font-semibold text-green-600">
                {t("savings")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Basic fee or Minimum fee */}
            <tr className="bg-orange-50/40">
              <td colSpan={4} className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-orange-700">
                {region.isMinimumFee ? t("minimumFee") : t("basicFee")}
                <span className="ml-2 font-normal text-gray-400">
                  {t("perContract")}
                </span>
              </td>
            </tr>

            {region.isMinimumFee && region.minimumFee ? (
              <tr className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-700">
                  {t("minimumFee")} ({t("includedKwh").replace("{n}", String(region.minimumFee.includedKwh))})
                </td>
                <td className="px-5 py-3 text-right text-gray-700">
                  {fmtYen(region.minimumFee.oldPrice)}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-orange-600">
                  {fmtYen(region.minimumFee.newPrice)}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                    {fmtSaving(region.minimumFee.oldPrice - region.minimumFee.newPrice)}
                    <span className="text-[10px]">{t("savingsLabel")}</span>
                  </span>
                </td>
              </tr>
            ) : (
              region.basicFee.map((row) => (
                <tr key={row.ampere} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700">{row.ampere}A</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {fmtYen(row.oldPrice)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-orange-600">
                    {fmtYen(row.newPrice)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                      {fmtSaving(row.oldPrice - row.newPrice)}
                      <span className="text-[10px]">{t("savingsLabel")}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}

            {/* Volume rate header */}
            <tr className="bg-blue-50/40">
              <td colSpan={4} className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                {t("volumeRate")}
                <span className="ml-2 font-normal text-gray-400">{t("perKwh")}</span>
              </td>
            </tr>

            {/* Old volume rates */}
            {region.volumeRate.map((tier, idx) => (
              <tr key={`old-${idx}`} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-700">{tier.tier}</td>
                <td className="px-5 py-3 text-right text-gray-700">{fmtYen(tier.price)}</td>
                {idx === 0 ? (
                  <>
                    <td className="px-5 py-3 text-right font-semibold text-orange-600" rowSpan={region.volumeRate.length}>
                      <div className="space-y-1">
                        {region.newVolumeRate.map((nt) => (
                          <div key={nt.tier}>
                            <span className="text-xs text-gray-400">{nt.tier}:</span>{" "}
                            {fmtYen(nt.price)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3" rowSpan={region.volumeRate.length} />
                  </>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="space-y-4 md:hidden">
        {/* Basic / Minimum Fee */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-orange-700">
            {region.isMinimumFee ? t("minimumFee") : t("basicFee")}
          </h4>
          {region.isMinimumFee && region.minimumFee ? (
            <MobileRow
              label={`${t("minimumFee")} (${t("includedKwh").replace("{n}", String(region.minimumFee.includedKwh))})`}
              oldPrice={region.minimumFee.oldPrice}
              newPrice={region.minimumFee.newPrice}
              t={t}
            />
          ) : (
            <div className="space-y-3">
              {region.basicFee.map((row) => (
                <MobileRow
                  key={row.ampere}
                  label={`${row.ampere}A`}
                  oldPrice={row.oldPrice}
                  newPrice={row.newPrice}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* Volume Rate */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-700">
            {t("volumeRate")}
          </h4>
          <div className="mb-3 space-y-2">
            <p className="text-xs font-medium text-gray-500">{region.providerName}:</p>
            {region.volumeRate.map((tier) => (
              <div key={tier.tier} className="flex justify-between text-sm">
                <span className="text-gray-600">{tier.tier}</span>
                <span className="text-gray-700">{fmtYen(tier.price)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-orange-600">トクスルでんき:</p>
            {region.newVolumeRate.map((tier) => (
              <div key={tier.tier} className="flex justify-between text-sm">
                <span className="text-gray-600">{tier.tier}</span>
                <span className="font-semibold text-orange-600">{fmtYen(tier.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prefectures */}
      <div className="flex flex-wrap gap-1.5">
        {region.prefectures.map((p) => (
          <span key={p} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Mobile Row Helper ──

function MobileRow({
  label,
  oldPrice,
  newPrice,
  t,
}: {
  label: string;
  oldPrice: number;
  newPrice: number;
  t: (key: string) => string;
}) {
  const diff = oldPrice - newPrice;
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="mb-2 text-sm font-semibold text-gray-800">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs">
          <div className="text-gray-400">{t("oldProvider")}</div>
          <div className="text-gray-700">{fmtYen(oldPrice)}</div>
        </div>
        <svg className="h-4 w-4 flex-shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <div className="text-xs">
          <div className="text-orange-500">{t("newProvider")}</div>
          <div className="font-bold text-orange-600">{fmtYen(newPrice)}</div>
        </div>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
          -{fmtSaving(diff)} {t("savingsLabel")}
        </span>
      </div>
    </div>
  );
}
