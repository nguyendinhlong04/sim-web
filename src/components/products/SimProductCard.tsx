import Link from "next/link";

const PROVIDER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SOFTBANK: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  DOCOMO: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  RAKUTEN: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  AU: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  UQ: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
};

const GROUP_LABELS: Record<string, string> = {
  POCKET: "Pocket WiFi",
  DATA: "Data",
  DATA_VOICE: "Data + Voice",
};

type SimProductCardProps = {
  slug: string;
  locale: string;
  name: string;
  subtitle: string;
  imageUrl?: string;
  provider: string;
  group: string;
  dataCapacity: string;
  validityDays: number;
  price: number;
  promoPrice: number | null;
  promoEnd: string | null;
  daysLabel: string;
  promoLabel: string;
  ctaLabel: string;
};

export default function SimProductCard({
  slug,
  locale,
  name,
  subtitle,
  imageUrl,
  provider,
  group,
  dataCapacity,
  validityDays,
  price,
  promoPrice,
  promoEnd,
  daysLabel,
  promoLabel,
  ctaLabel,
}: SimProductCardProps) {
  const providerStyle = PROVIDER_COLORS[provider] ?? {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  };

  const isPromoActive =
    promoPrice != null && promoEnd && new Date(promoEnd) > new Date();

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);

  return (
    <Link
      href={`/${locale}/sim-the/${slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Promo Badge */}
      {isPromoActive && (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-3 py-1 text-xs font-bold text-white shadow-md">
          {promoLabel}
        </div>
      )}

      {/* Image Section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                📶
              </div>
              <span className="text-xs text-gray-400">SIM</span>
            </div>
          </div>
        )}
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-5">
        {/* Badges Row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${providerStyle.bg} ${providerStyle.text} ${providerStyle.border}`}
          >
            {provider}
          </span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
            {GROUP_LABELS[group] ?? group}
          </span>
        </div>

        {/* Name & Subtitle */}
        <h3 className="text-base font-bold text-gray-900 transition-colors group-hover:text-blue-600">
          {name}
        </h3>
        {subtitle && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">
            {subtitle}
          </p>
        )}

        {/* Specs */}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          {dataCapacity && (
            <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-700">
              {dataCapacity}
            </span>
          )}
          <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-700">
            {validityDays} {daysLabel}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            {isPromoActive ? (
              <>
                <span className="text-xl font-extrabold text-red-600">
                  {formatPrice(promoPrice!)}
                </span>
                <span className="ml-2 text-sm text-gray-400 line-through">
                  {formatPrice(price)}
                </span>
              </>
            ) : (
              <span className="text-xl font-extrabold text-gray-900">
                {formatPrice(price)}
              </span>
            )}
          </div>
          <span className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 group-hover:bg-blue-700 group-hover:shadow-md">
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
