"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const GROUPS = ["", "POCKET", "DATA", "DATA_VOICE"] as const;
const PROVIDERS = ["", "SOFTBANK", "DOCOMO", "RAKUTEN", "AU", "UQ"] as const;
const GROUP_LABELS: Record<string, string> = {
  "": "All Groups",
  POCKET: "Pocket WiFi",
  DATA: "Data Only",
  DATA_VOICE: "Data + Voice",
};
const PROVIDER_LABELS: Record<string, string> = {
  "": "All Providers",
  SOFTBANK: "Softbank",
  DOCOMO: "Docomo",
  RAKUTEN: "Rakuten",
  AU: "Au",
  UQ: "UQ",
};

type Product = {
  id: string;
  slug: string;
  group: string;
  provider: string;
  price: number;
  promoPrice: number | null;
  status: string;
  sortOrder: number;
  dataCapacity: string;
  validityDays: number;
  translations: { locale: string; name: string; subtitle: string }[];
  media: { url: string; type: string }[];
};

export default function AdminSimProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState("");
  const [filterProvider, setFilterProvider] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterGroup) params.set("group", filterGroup);
    if (filterProvider) params.set("provider", filterProvider);
    try {
      const res = await fetch(`/api/admin/sim-products?${params}`);
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setProducts(data.items ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [filterGroup, filterProvider]);

  const getName = (p: Product) => {
    const t = p.translations.find((t) => t.locale === "vi") ?? p.translations[0];
    return t?.name ?? p.slug;
  };

  const getThumb = (p: Product) => {
    const img = p.media.find((m) => m.type === "IMAGE");
    return img?.url;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/admin/sim-products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const toggleStatus = async (p: Product) => {
    const newStatus = p.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await fetch(`/api/admin/sim-products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchProducts();
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">SIM Products</h1>
        <Link
          href="/admin/sim-products/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
        >
          {GROUPS.map((g) => (
            <option key={g} value={g}>{GROUP_LABELS[g]}</option>
          ))}
        </select>
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={filterProvider}
          onChange={(e) => setFilterProvider(e.target.value)}
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : products.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No products found. Click &quot;Add Product&quot; to create one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {getThumb(p) ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={getThumb(p)} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                          IMG
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{getName(p)}</div>
                        <div className="text-xs text-gray-400">{p.dataCapacity} · {p.validityDays}d</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {GROUP_LABELS[p.group] ?? p.group}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                      {PROVIDER_LABELS[p.provider] ?? p.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{formatPrice(p.price)}</div>
                    {p.promoPrice != null && (
                      <div className="text-xs text-green-600">{formatPrice(p.promoPrice)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(p)}
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        p.status === "PUBLISHED"
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {p.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/sim-products/${p.id}`}
                        className="rounded border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
