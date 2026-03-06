"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { locales } from "@/i18n/routing";
import LanguageTabs from "@/components/admin/LanguageTabs";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/admin/RichTextEditor"),
  { ssr: false }
);

type Translation = {
  locale: string;
  title: string;
  metaTitle: string;
  metaDesc: string;
  content: string;
  excerpt: string;
  featuredImg: string;
};

type FormData = {
  slug: string;
  status: string;
  publishedAt: string;
  category: string;
  translations: Translation[];
};

const emptyTranslation = (locale: string): Translation => ({
  locale,
  title: "",
  metaTitle: "",
  metaDesc: "",
  content: "",
  excerpt: "",
  featuredImg: "",
});

const emptyForm: FormData = {
  slug: "",
  status: "DRAFT",
  publishedAt: "",
  category: "",
  translations: locales.map((l) => emptyTranslation(l)),
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

export default function AdminPostEditPage({ params }: PageProps) {
  const router = useRouter();
  const isNew = params.id === "new";
  const [form, setForm] = useState<FormData>(emptyForm);
  const [activeLocale, setActiveLocale] = useState("vi");
  const [status, setStatus] = useState<
    "idle" | "loading" | "saving" | "saved" | "error"
  >(isNew ? "idle" : "loading");
  const [uploadingImg, setUploadingImg] = useState(false);

  // Load existing post
  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/posts/${params.id}`)
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin/login");
          return null;
        }
        if (r.status === 404) {
          router.push("/admin/posts");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const loadedTranslations = locales.map((locale) => {
          const existing = data.translations?.find(
            (t: Translation) => t.locale === locale
          );
          return existing
            ? { ...emptyTranslation(locale), ...existing }
            : emptyTranslation(locale);
        });
        setForm({
          slug: data.slug ?? "",
          status: data.status ?? "DRAFT",
          publishedAt: data.publishedAt
            ? data.publishedAt.slice(0, 10)
            : "",
          category: data.category ?? "",
          translations: loadedTranslations,
        });
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [isNew, params.id, router]);

  const currentTranslation = form.translations.find(
    (t) => t.locale === activeLocale
  )!;

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

  // Auto-generate slug from Vietnamese title
  useEffect(() => {
    if (!isNew) return;
    const viTitle =
      form.translations.find((t) => t.locale === "vi")?.title ?? "";
    if (viTitle) {
      setForm((prev) => ({ ...prev, slug: slugify(viTitle) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.translations.find((t) => t.locale === "vi")?.title, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    // Filter out empty translations (require at least title)
    const filledTranslations = form.translations.filter(
      (t) => t.title.trim() !== ""
    );

    if (filledTranslations.length === 0) {
      alert("Please fill in at least one translation with a title.");
      setStatus("idle");
      return;
    }

    const payload = {
      slug: form.slug,
      status: form.status,
      publishedAt: form.publishedAt || null,
      category: form.category || null,
      translations: filledTranslations.map((t) => ({
        ...t,
        metaTitle: t.metaTitle || null,
        metaDesc: t.metaDesc || null,
        excerpt: t.excerpt || null,
        featuredImg: t.featuredImg || null,
      })),
    };

    try {
      const url = isNew
        ? "/api/admin/posts"
        : `/api/admin/posts/${params.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);

      if (isNew && data.id) {
        router.push(`/admin/posts/${data.id}`);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  // Featured image upload
  const handleFeaturedImgUpload = async (file: File) => {
    setUploadingImg(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        setUploadingImg(false);
        return;
      }
      const data = await res.json();
      if (data.url) {
        updateTranslation("featuredImg", data.url);
      }
    } catch {
      /* ignore */
    }
    setUploadingImg(false);
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
          {isNew ? "New Post" : "Edit Post"}
        </h1>
        <div className="flex items-center gap-2">
          {status === "saved" && (
            <span className="rounded bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              Saved
            </span>
          )}
          {status === "error" && (
            <span className="rounded bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
              Error saving
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Core Information */}
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Post Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Slug</label>
              <input
                type="text"
                className={inputCls}
                value={form.slug}
                onChange={(e) =>
                  setForm((p) => ({ ...p, slug: e.target.value }))
                }
                placeholder="auto-generated-from-title"
              />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <input
                type="text"
                className={inputCls}
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                placeholder="e.g. news, guides, tips..."
              />
            </div>
            <div>
              <label className={labelCls}>Publish Date</label>
              <input
                type="date"
                className={inputCls}
                value={form.publishedAt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, publishedAt: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Translations (Title, Excerpt, Content) */}
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Content
          </h2>
          <LanguageTabs activeLocale={activeLocale} onChange={setActiveLocale} />
          <div className="mt-4 grid gap-4">
            <div>
              <label className={labelCls}>
                Title ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                className={inputCls}
                value={currentTranslation.title}
                onChange={(e) => updateTranslation("title", e.target.value)}
                placeholder="Post title"
              />
            </div>
            <div>
              <label className={labelCls}>
                Excerpt ({activeLocale.toUpperCase()})
              </label>
              <textarea
                className={inputCls}
                rows={2}
                value={currentTranslation.excerpt}
                onChange={(e) => updateTranslation("excerpt", e.target.value)}
                placeholder="Short summary of the post"
              />
            </div>
            <div>
              <label className={labelCls}>
                Content ({activeLocale.toUpperCase()})
              </label>
              <RichTextEditor
                value={currentTranslation.content}
                onChange={(html) => updateTranslation("content", html)}
                placeholder="Write your post content here..."
                minHeight="250px"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Featured Image */}
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Featured Image ({activeLocale.toUpperCase()})
          </h2>
          <div className="space-y-3">
            {currentTranslation.featuredImg ? (
              <div className="group relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentTranslation.featuredImg}
                  alt="Featured"
                  className="h-40 rounded-md border object-cover"
                />
                <button
                  type="button"
                  onClick={() => updateTranslation("featuredImg", "")}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100"
                >
                  x
                </button>
              </div>
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-sm text-gray-400">
                No featured image
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                className="text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFeaturedImgUpload(file);
                  e.target.value = "";
                }}
              />
              {uploadingImg && (
                <span className="text-xs text-gray-500">Uploading...</span>
              )}
            </div>
            <div>
              <label className={labelCls}>Or paste image URL</label>
              <input
                type="text"
                className={inputCls}
                value={currentTranslation.featuredImg}
                onChange={(e) =>
                  updateTranslation("featuredImg", e.target.value)
                }
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Section 4: SEO */}
        <div className={cardCls}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            SEO ({activeLocale.toUpperCase()})
          </h2>
          <div className="grid gap-4">
            <div>
              <label className={labelCls}>Meta Title</label>
              <input
                type="text"
                className={inputCls}
                value={currentTranslation.metaTitle}
                onChange={(e) =>
                  updateTranslation("metaTitle", e.target.value)
                }
                placeholder="SEO title (defaults to post title)"
              />
            </div>
            <div>
              <label className={labelCls}>Meta Description</label>
              <textarea
                className={inputCls}
                rows={2}
                value={currentTranslation.metaDesc}
                onChange={(e) =>
                  updateTranslation("metaDesc", e.target.value)
                }
                placeholder="SEO description for search engines"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {status === "saving"
                ? "Saving..."
                : isNew
                  ? "Create Post"
                  : "Save Post"}
            </button>
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin/posts")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back to List
          </button>
        </div>
      </form>
    </section>
  );
}
