"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { locales } from "@/i18n/routing";
import LanguageTabs from "@/components/admin/LanguageTabs";
import RichTextEditor from "@/components/admin/RichTextEditor";

const GROUPS = [
  { value: "POCKET", label: "Pocket WiFi" },
  { value: "DATA", label: "Data Only" },
  { value: "DATA_VOICE", label: "Data + Voice" },
];
const PROVIDERS = [
  { value: "SOFTBANK", label: "Softbank" },
  { value: "DOCOMO", label: "Docomo" },
  { value: "RAKUTEN", label: "Rakuten" },
  { value: "AU", label: "Au" },
  { value: "UQ", label: "UQ" },
];

type Translation = {
  locale: string;
  name: string;
  subtitle: string;
  description: string;
  metaTitle: string;
  metaDesc: string;
};

type MediaItem = {
  id?: string;
  type: string;
  url: string;
  sortOrder: number;
};

type InfoSection = {
  id?: string;
  sortOrder: number;
  translations: { locale: string; title: string; description: string }[];
};

type FormData = {
  slug: string;
  group: string;
  provider: string;
  price: number;
  promoPrice: number | null;
  promoStart: string;
  promoEnd: string;
  dataCapacity: string;
  validityDays: number;
  status: string;
  sortOrder: number;
  translations: Translation[];
  media: MediaItem[];
  infoSections: InfoSection[];
};

const emptyTranslation = (locale: string): Translation => ({
  locale,
  name: "",
  subtitle: "",
  description: "",
  metaTitle: "",
  metaDesc: "",
});

const emptyForm: FormData = {
  slug: "",
  group: "DATA",
  provider: "SOFTBANK",
  price: 0,
  promoPrice: null,
  promoStart: "",
  promoEnd: "",
  dataCapacity: "",
  validityDays: 30,
  status: "DRAFT",
  sortOrder: 0,
  translations: locales.map((l) => emptyTranslation(l)),
  media: [],
  infoSections: [],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type PageProps = { params: { id: string } };

export default function AdminSimProductEditPage({ params }: PageProps) {
  const router = useRouter();
  const isNew = params.id === "new";
  const [form, setForm] = useState<FormData>(emptyForm);
  const [activeLocale, setActiveLocale] = useState("vi");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">(
    isNew ? "idle" : "loading"
  );
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Load existing product
  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/sim-products/${params.id}`)
      .then((r) => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        if (r.status === 404) { router.push("/admin/sim-products"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        // Merge loaded translations with all locales
        const loadedTranslations = locales.map((locale) => {
          const existing = data.translations?.find((t: Translation) => t.locale === locale);
          return existing
            ? { ...emptyTranslation(locale), ...existing }
            : emptyTranslation(locale);
        });
        setForm({
          slug: data.slug ?? "",
          group: data.group ?? "DATA",
          provider: data.provider ?? "SOFTBANK",
          price: data.price ?? 0,
          promoPrice: data.promoPrice ?? null,
          promoStart: data.promoStart ? data.promoStart.slice(0, 10) : "",
          promoEnd: data.promoEnd ? data.promoEnd.slice(0, 10) : "",
          dataCapacity: data.dataCapacity ?? "",
          validityDays: data.validityDays ?? 30,
          status: data.status ?? "DRAFT",
          sortOrder: data.sortOrder ?? 0,
          translations: loadedTranslations,
          media: data.media ?? [],
          infoSections: (data.infoSections ?? []).map((s: InfoSection & { id: string }) => ({
            id: s.id,
            sortOrder: s.sortOrder,
            translations: locales.map((locale) => {
              const existing = s.translations.find((t) => t.locale === locale);
              return existing ?? { locale, title: "", description: "" };
            }),
          })),
        });
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [isNew, params.id, router]);

  const currentTranslation = form.translations.find((t) => t.locale === activeLocale)!;

  const updateTranslation = useCallback(
    (field: keyof Translation, value: string) => {
      setForm((prev) => ({
        ...prev,
        translations: prev.translations.map((t) =>
          t.locale === activeLocale ? { ...t, [field]: value } : t
        ),
      }));
    },
    [activeLocale]
  );

  // Auto-generate slug from Vietnamese name
  useEffect(() => {
    if (!isNew) return;
    const viName = form.translations.find((t) => t.locale === "vi")?.name ?? "";
    if (viName) {
      setForm((prev) => ({ ...prev, slug: slugify(viName) }));
    }
  }, [form.translations.find((t) => t.locale === "vi")?.name, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    // Filter out empty translations (only send locales where user filled in a name)
    const filledTranslations = form.translations.filter((t) => t.name.trim() !== "");
    const filledInfoSections = form.infoSections.map((s) => ({
      ...s,
      translations: s.translations.filter((t) => t.title.trim() !== ""),
    })).filter((s) => s.translations.length > 0);
    const filledMedia = form.media.filter((m) => m.url.trim() !== "");

    const payload = {
      ...form,
      translations: filledTranslations,
      infoSections: filledInfoSections,
      media: filledMedia,
      promoStart: form.promoStart || null,
      promoEnd: form.promoEnd || null,
    };

    try {
      const url = isNew ? "/api/admin/sim-products" : `/api/admin/sim-products/${params.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) { router.push("/admin/login"); return; }
      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);

      if (isNew && data.id) {
        router.push(`/admin/sim-products/${data.id}`);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  // Media upload
  const handleMediaUpload = async (file: File) => {
    setUploadingMedia(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) { setUploadingMedia(false); return; }
      const data = await res.json();
      if (data.url) {
        const isVideo = file.type.startsWith("video/");
        setForm((prev) => ({
          ...prev,
          media: [
            ...prev.media,
            { type: isVideo ? "VIDEO" : "IMAGE", url: data.url, sortOrder: prev.media.length },
          ],
        }));
      }
    } catch { /* ignore */ }
    setUploadingMedia(false);
  };

  const removeMedia = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== idx),
    }));
  };

  // Info sections
  const addInfoSection = () => {
    setForm((prev) => ({
      ...prev,
      infoSections: [
        ...prev.infoSections,
        {
          sortOrder: prev.infoSections.length,
          translations: locales.map((l) => ({ locale: l, title: "", description: "" })),
        },
      ],
    }));
  };

  const removeInfoSection = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      infoSections: prev.infoSections.filter((_, i) => i !== idx),
    }));
  };

  const updateInfoTranslation = (
    sectionIdx: number,
    locale: string,
    field: "title" | "description",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      infoSections: prev.infoSections.map((s, i) =>
        i === sectionIdx
          ? {
              ...s,
              translations: s.translations.map((t) =>
                t.locale === locale ? { ...t, [field]: value } : t
              ),
            }
          : s
      ),
    }));
  };

  const inputCls =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelCls = "mb-1 block text-sm font-medium text-gray-700";
  const cardCls = "rounded-lg border border-gray-200 bg-white p-6";

  if (status === "loading") {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Loading...</h1>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isNew ? "New SIM Product" : "Edit SIM Product"}
        </h1>
        <div className="flex items-center gap-2">
          {status === "saved" && (
            <span className="rounded bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              Saved
            </span>
          )}
          {status === "error" && (
            <span className="rounded bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
              Error
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Media */}
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Images & Videos</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {form.media.map((m, idx) => (
                <div key={idx} className="group relative">
                  {m.type === "IMAGE" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.url} alt="" className="h-24 w-24 rounded-md border object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-md border bg-gray-100 text-xs text-gray-500">
                      VIDEO
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 text-xs text-white opacity-0 group-hover:opacity-100"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*,video/*"
                className="text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleMediaUpload(file);
                  e.target.value = "";
                }}
              />
              {uploadingMedia && <span className="text-xs text-gray-500">Uploading...</span>}
            </div>
            <div>
              <label className={labelCls}>Or add video URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="https://youtube.com/watch?v=..."
                  id="video-url-input"
                />
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => {
                    const input = document.getElementById("video-url-input") as HTMLInputElement;
                    const videoUrl = input?.value?.trim() ?? "";
                    if (videoUrl) {
                      input.value = "";
                      setForm((prev) => ({
                        ...prev,
                        media: [
                          ...prev.media,
                          { type: "VIDEO", url: videoUrl, sortOrder: prev.media.length },
                        ],
                      }));
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Product Information */}
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Product Information</h2>
          <div className="grid gap-4">
            {/* Common fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Slug</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="auto-generated-from-name"
                />
              </div>
              <div>
                <label className={labelCls}>Data Capacity</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.dataCapacity}
                  onChange={(e) => setForm((p) => ({ ...p, dataCapacity: e.target.value }))}
                  placeholder="3GB, 50GB, Unlimited..."
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Group</label>
                <select
                  className={inputCls}
                  value={form.group}
                  onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))}
                >
                  {GROUPS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Provider</label>
                <select
                  className={inputCls}
                  value={form.provider}
                  onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Validity (days)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.validityDays}
                  onChange={(e) => setForm((p) => ({ ...p, validityDays: parseInt(e.target.value) || 30 }))}
                  min={1}
                />
              </div>
            </div>

            {/* Language tabs for translations */}
            <div className="border-t border-gray-100 pt-4">
              <LanguageTabs activeLocale={activeLocale} onChange={setActiveLocale} />
              <div className="mt-4 grid gap-4">
                <div>
                  <label className={labelCls}>Name ({activeLocale.toUpperCase()})</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={currentTranslation.name}
                    onChange={(e) => updateTranslation("name", e.target.value)}
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <label className={labelCls}>Subtitle ({activeLocale.toUpperCase()})</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={currentTranslation.subtitle}
                    onChange={(e) => updateTranslation("subtitle", e.target.value)}
                    placeholder="Short tagline"
                  />
                </div>
                <div>
                  <label className={labelCls}>Description ({activeLocale.toUpperCase()})</label>
                  <RichTextEditor
                    value={currentTranslation.description}
                    onChange={(html) => updateTranslation("description", html)}
                    placeholder="Full product description"
                    minHeight="120px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Additional Info Sections */}
        <div className={cardCls}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Additional Info</h2>
            <button
              type="button"
              onClick={addInfoSection}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            >
              + Add Section
            </button>
          </div>
          {form.infoSections.length === 0 ? (
            <p className="text-sm text-gray-400">
              No info sections yet. Add sections for return policy, usage guide, etc.
            </p>
          ) : (
            <div className="space-y-4">
              {form.infoSections.map((section, sIdx) => {
                const sectionTrans = section.translations.find((t) => t.locale === activeLocale) ?? {
                  locale: activeLocale,
                  title: "",
                  description: "",
                };
                return (
                  <div key={sIdx} className="rounded-md border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Section {sIdx + 1} ({activeLocale.toUpperCase()})
                      </span>
                      <button
                        type="button"
                        onClick={() => removeInfoSection(sIdx)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-3">
                      <div>
                        <label className={labelCls}>Title</label>
                        <input
                          type="text"
                          className={inputCls}
                          value={sectionTrans.title}
                          onChange={(e) =>
                            updateInfoTranslation(sIdx, activeLocale, "title", e.target.value)
                          }
                          placeholder="Section title"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <RichTextEditor
                          value={sectionTrans.description}
                          onChange={(html) =>
                            updateInfoTranslation(sIdx, activeLocale, "description", html)
                          }
                          placeholder="Section content"
                          minHeight="80px"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 4: Pricing */}
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Price (JPY)</label>
              <input
                type="number"
                className={inputCls}
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                min={0}
              />
            </div>
            <div>
              <label className={labelCls}>Promo Price (JPY)</label>
              <input
                type="number"
                className={inputCls}
                value={form.promoPrice ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    promoPrice: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                min={0}
                placeholder="Leave empty if no promo"
              />
            </div>
            <div>
              <label className={labelCls}>Promo Start</label>
              <input
                type="date"
                className={inputCls}
                value={form.promoStart}
                onChange={(e) => setForm((p) => ({ ...p, promoStart: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Promo End</label>
              <input
                type="date"
                className={inputCls}
                value={form.promoEnd}
                onChange={(e) => setForm((p) => ({ ...p, promoEnd: e.target.value }))}
              />
            </div>
          </div>
          {form.promoPrice != null && form.promoEnd && new Date(form.promoEnd) > new Date() && (
            <div className="mt-3 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
              Promotion is currently active
            </div>
          )}
        </div>

        {/* Section 5: Status & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {status === "saving" ? "Saving..." : "Save Product"}
            </button>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin/sim-products")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back to List
          </button>
        </div>
      </form>
    </section>
  );
}
