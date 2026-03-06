"use client";

import { useState, useEffect } from "react";
import { Search, X, Package } from "lucide-react";

interface SimProduct {
  id: string;
  slug: string;
  group: string;
  provider: string;
  price: number;
  promoPrice?: number | null;
  dataCapacity: string;
  validityDays: number;
  translations: { locale: string; name: string; subtitle: string }[];
  media: { url: string; type: string; sortOrder: number }[];
}

interface Props {
  locale: string;
  onSelect: (product: SimProduct) => void;
  onClose: () => void;
}

export default function ProductPicker({ locale, onSelect, onClose }: Props) {
  const [products, setProducts] = useState<SimProduct[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/sim-products?locale=all");
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : data.items || []);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const translation = p.translations.find((t) => t.locale === locale) || p.translations[0];
    return (
      translation?.name.toLowerCase().includes(s) ||
      p.slug.toLowerCase().includes(s) ||
      p.provider.toLowerCase().includes(s) ||
      p.group.toLowerCase().includes(s)
    );
  });

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="text-xs font-semibold text-gray-700">Send Product</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      </div>
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded border border-gray-200 py-1.5 pl-7 pr-2 text-xs outline-none focus:border-blue-400"
          />
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="py-4 text-center text-xs text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-4 text-center text-xs text-gray-400">No products found</div>
        ) : (
          filtered.map((product) => {
            const translation =
              product.translations.find((t) => t.locale === locale) ||
              product.translations[0];
            const image = product.media
              .filter((m) => m.type === "IMAGE")
              .sort((a, b) => a.sortOrder - b.sortOrder)[0];

            return (
              <button
                key={product.id}
                onClick={() => onSelect(product)}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-gray-50"
              >
                {image ? (
                  <img
                    src={image.url}
                    alt={translation?.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                    <Package size={16} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-medium text-gray-900">
                    {translation?.name || product.slug}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">
                      {product.provider} • {product.dataCapacity} • {product.validityDays}d
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {product.promoPrice ? (
                    <>
                      <p className="text-xs font-bold text-red-600">
                        ¥{product.promoPrice.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 line-through">
                        ¥{product.price.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs font-bold text-blue-600">
                      ¥{product.price.toLocaleString()}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
