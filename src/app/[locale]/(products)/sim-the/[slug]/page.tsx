"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StructuredData from "@/components/seo/StructuredData";

type Translation = { name: string; subtitle: string; description: string };
type MediaItem = { url: string; type: string; sortOrder: number };
type InfoSection = {
  sortOrder: number;
  translations: { title: string; description: string }[];
};

type Product = {
  id: string;
  slug: string;
  group: string;
  provider: string;
  price: number;
  promoPrice: number | null;
  promoEnd: string | null;
  promoStart: string | null;
  dataCapacity: string;
  validityDays: number;
  translations: Translation[];
  media: MediaItem[];
  infoSections: InfoSection[];
};

const GROUP_LABELS: Record<string, string> = {
  POCKET: "Pocket WiFi",
  DATA: "Data Only",
  DATA_VOICE: "Data + Voice",
};

function getYouTubeEmbedUrl(url: string): string | null {
  // Handle: youtube.com/watch?v=ID, youtube.com/embed/ID, youtu.be/ID, youtube.com/shorts/ID
  let videoId: string | null = null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) {
        return url; // already embed format
      }
      if (u.pathname.startsWith("/shorts/")) {
        videoId = u.pathname.split("/shorts/")[1]?.split("/")[0] ?? null;
      } else {
        videoId = u.searchParams.get("v");
      }
    } else if (u.hostname === "youtu.be") {
      videoId = u.pathname.slice(1).split("/")[0];
    }
  } catch {
    return null;
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

export default function SimProductDetailPage({ params }: { params: { slug: string } }) {
  const locale = useLocale();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [openInfo, setOpenInfo] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/sim-products?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        const items: Product[] = data.items ?? [];
        setAllProducts(items);
        const found = items.find((p) => p.slug === params.slug);
        if (found) setProduct(found);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locale, params.slug]);

  // --- Related Products: score by matching group, provider, dataCapacity ---
  // Must be called before early returns to satisfy Rules of Hooks
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p.id !== product.id)
      .map((p) => {
        let score = 0;
        if (p.group === product.group) score += 3;
        if (p.provider === product.provider) score += 2;
        if (p.dataCapacity === product.dataCapacity) score += 1;
        return { product: p, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((r) => r.product);
  }, [product, allProducts]);

  if (loading) {
    return <p className="py-12 text-center text-sm text-gray-500">Loading...</p>;
  }

  if (!product) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Product not found.</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const t = product.translations[0] ?? { name: product.slug, subtitle: "", description: "" };
  // Combine images and videos into a single gallery, sorted by sortOrder
  const galleryItems = [...product.media].sort((a, b) => a.sortOrder - b.sortOrder);
  const isPromoActive =
    product.promoPrice != null && product.promoEnd && new Date(product.promoEnd) > new Date();

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);

  const getThumb = (p: Product) => p.media.find((m) => m.type === "IMAGE")?.url;
  const isItemPromoActive = (p: Product) =>
    p.promoPrice != null && p.promoEnd && new Date(p.promoEnd) > new Date();

  return (
    <section className="space-y-8">
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: t.name,
          description: t.subtitle || t.description?.slice(0, 200),
          brand: { "@type": "Brand", name: product.provider },
          offers: {
            "@type": "Offer",
            price: isPromoActive ? product.promoPrice : product.price,
            priceCurrency: "JPY",
            availability: "https://schema.org/InStock",
          },
        }}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          {galleryItems.length > 0 ? (
            <>
              {/* Main display area */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {galleryItems[activeImage]?.type === "VIDEO" ? (
                  (() => {
                    const v = galleryItems[activeImage];
                    const embedUrl = isYouTubeUrl(v.url) ? getYouTubeEmbedUrl(v.url) : null;
                    return embedUrl ? (
                      <iframe
                        src={embedUrl}
                        className="aspect-[4/3] w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        title={`Video`}
                      />
                    ) : (
                      <video
                        key={activeImage}
                        src={v.url}
                        controls
                        autoPlay
                        className="aspect-[4/3] w-full object-cover"
                      />
                    );
                  })()
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={galleryItems[activeImage]?.url ?? galleryItems[0]?.url}
                    alt={t.name}
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
              </div>

              {/* Thumbnails */}
              {galleryItems.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {galleryItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(idx)}
                      className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                        activeImage === idx ? "border-blue-500" : "border-transparent"
                      }`}
                    >
                      {item.type === "VIDEO" ? (
                        <>
                          {/* Video thumbnail: show play icon overlay */}
                          {isYouTubeUrl(item.url) ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={`https://img.youtube.com/vi/${(() => {
                                try {
                                  const u = new URL(item.url);
                                  if (u.hostname.includes("youtube.com")) {
                                    if (u.pathname.startsWith("/shorts/"))
                                      return u.pathname.split("/shorts/")[1]?.split("/")[0] ?? "";
                                    return u.searchParams.get("v") ?? "";
                                  }
                                  if (u.hostname === "youtu.be")
                                    return u.pathname.slice(1).split("/")[0];
                                  return "";
                                } catch { return ""; }
                              })()}/mqdefault.jpg`}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200">
                              <svg className="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          )}
                          {/* Play icon overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.url} alt="" className="h-full w-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
              No images
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
              {product.provider}
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {GROUP_LABELS[product.group] ?? product.group}
            </span>
            {product.dataCapacity && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                {product.dataCapacity}
              </span>
            )}
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {product.validityDays} days
            </span>
          </div>

          {/* Name & subtitle */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.name}</h1>
            {t.subtitle && (
              <p className="mt-2 text-lg text-gray-600">{t.subtitle}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            {isPromoActive ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-red-600">
                    {formatPrice(product.promoPrice!)}
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  Promo ends {new Date(product.promoEnd!).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Description */}
          {t.description && (
            <div
              className="prose prose-sm max-w-none text-gray-700 prose-a:text-blue-600 prose-a:underline"
              dangerouslySetInnerHTML={{ __html: t.description }}
            />
          )}
        </div>
      </div>

      {/* Additional Info Sections (Accordion) */}
      {product.infoSections.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Additional Information</h2>
          <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
            {product.infoSections.map((section, idx) => {
              const st = section.translations[0] ?? { title: `Section ${idx + 1}`, description: "" };
              const isOpen = openInfo === idx;
              return (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setOpenInfo(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-medium text-gray-900">{st.title}</span>
                    <span className="ml-2 text-gray-400">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div
                      className="prose prose-sm max-w-none px-5 pb-4 text-gray-600 prose-a:text-blue-600 prose-a:underline"
                      dangerouslySetInnerHTML={{ __html: st.description }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Related Products</h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => {
              const pt = p.translations[0] ?? { name: p.slug, subtitle: "" };
              const thumb = getThumb(p);
              const promo = isItemPromoActive(p);
              return (
                <Link
                  key={p.id}
                  href={`/${locale}/sim-the/${p.slug}`}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Promo badge */}
                  {promo && (
                    <div className="absolute left-2 top-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      SALE
                    </div>
                  )}

                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {thumb ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={thumb}
                        alt={pt.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    {/* Tags */}
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                        {p.provider}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        {GROUP_LABELS[p.group] ?? p.group}
                      </span>
                      {p.dataCapacity && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          {p.dataCapacity}
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                      {pt.name}
                    </h3>

                    {/* Specs */}
                    <p className="mt-1 text-xs text-gray-400">
                      {p.validityDays} days
                    </p>

                    {/* Price */}
                    <div className="mt-2 flex items-baseline gap-1.5">
                      {promo ? (
                        <>
                          <span className="text-base font-bold text-red-600">
                            {formatPrice(p.promoPrice!)}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(p.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-base font-bold text-gray-900">
                          {formatPrice(p.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
