"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import LanguageTabs from "@/components/admin/LanguageTabs";
import { locales } from "@/i18n/routing";

// ── Types ─────────────────────────────────────────────────

type Translation = {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
};

type Section = {
  sectionType: string;
  sectionKey: string;
  sortOrder: number;
  imageUrl: string;
  extraData: string; // JSON string
  status: string;
  translations: Record<string, Translation>;
};

const emptyTranslation = (): Translation => ({
  title: "",
  subtitle: "",
  description: "",
  buttonText: "",
  buttonUrl: "",
});

const SECTION_TYPES = ["HERO", "FEATURE", "PLAN", "STEP", "FAQ"] as const;
type SectionType = (typeof SECTION_TYPES)[number];

const TAB_LABELS: Record<SectionType, string> = {
  HERO: "Hero",
  FEATURE: "Features",
  PLAN: "Plans",
  STEP: "Steps",
  FAQ: "FAQ",
};

// ── Helpers ───────────────────────────────────────────────

function buildDefaultSections(): Section[] {
  return [
    // Hero
    {
      sectionType: "HERO",
      sectionKey: "hero",
      sortOrder: 0,
      imageUrl: "",
      extraData: "",
      status: "PUBLISHED",
      translations: Object.fromEntries(locales.map((l) => [l, emptyTranslation()])),
    },
    // 4 Features
    ...Array.from({ length: 4 }, (_, i) => ({
      sectionType: "FEATURE" as const,
      sectionKey: `feature_${i + 1}`,
      sortOrder: i,
      imageUrl: "",
      extraData: JSON.stringify({ icon: "" }),
      status: "PUBLISHED" as const,
      translations: Object.fromEntries(locales.map((l) => [l, emptyTranslation()])),
    })),
    // 2 Plans
    ...Array.from({ length: 2 }, (_, i) => ({
      sectionType: "PLAN" as const,
      sectionKey: `plan_${i + 1}`,
      sortOrder: i,
      imageUrl: "",
      extraData: JSON.stringify({ price: "", discount: "" }),
      status: "PUBLISHED" as const,
      translations: Object.fromEntries(locales.map((l) => [l, emptyTranslation()])),
    })),
    // 3 Steps - New
    ...Array.from({ length: 3 }, (_, i) => ({
      sectionType: "STEP" as const,
      sectionKey: `step_new_${i + 1}`,
      sortOrder: i,
      imageUrl: "",
      extraData: "",
      status: "PUBLISHED" as const,
      translations: Object.fromEntries(locales.map((l) => [l, emptyTranslation()])),
    })),
    // 3 Steps - Switch
    ...Array.from({ length: 3 }, (_, i) => ({
      sectionType: "STEP" as const,
      sectionKey: `step_switch_${i + 1}`,
      sortOrder: i,
      imageUrl: "",
      extraData: "",
      status: "PUBLISHED" as const,
      translations: Object.fromEntries(locales.map((l) => [l, emptyTranslation()])),
    })),
    // 3 FAQs
    ...Array.from({ length: 3 }, (_, i) => ({
      sectionType: "FAQ" as const,
      sectionKey: `faq_${i + 1}`,
      sortOrder: i,
      imageUrl: "",
      extraData: "",
      status: "PUBLISHED" as const,
      translations: Object.fromEntries(locales.map((l) => [l, emptyTranslation()])),
    })),
  ];
}

/** Convert API response sections to our local state format */
function apiToState(
  apiSections: {
    sectionType: string;
    sectionKey: string;
    sortOrder: number;
    imageUrl: string | null;
    extraData: string | null;
    status: string;
    translations: {
      locale: string;
      title: string;
      subtitle: string | null;
      description: string | null;
      buttonText: string | null;
      buttonUrl: string | null;
    }[];
  }[]
): Section[] {
  if (!apiSections.length) return buildDefaultSections();

  return apiSections.map((s) => {
    const transMap: Record<string, Translation> = {};
    for (const loc of locales) {
      const found = s.translations.find((t) => t.locale === loc);
      transMap[loc] = found
        ? {
            title: found.title ?? "",
            subtitle: found.subtitle ?? "",
            description: found.description ?? "",
            buttonText: found.buttonText ?? "",
            buttonUrl: found.buttonUrl ?? "",
          }
        : emptyTranslation();
    }
    return {
      sectionType: s.sectionType,
      sectionKey: s.sectionKey,
      sortOrder: s.sortOrder,
      imageUrl: s.imageUrl ?? "",
      extraData: s.extraData ?? "",
      status: s.status,
      translations: transMap,
    };
  });
}

/** Convert local state to API format */
function stateToApi(sections: Section[]) {
  return sections.map((s) => ({
    sectionType: s.sectionType,
    sectionKey: s.sectionKey,
    sortOrder: s.sortOrder,
    imageUrl: s.imageUrl || undefined,
    extraData: s.extraData || undefined,
    status: s.status,
    translations: locales.map((locale) => ({
      locale,
      title: s.translations[locale]?.title ?? "",
      subtitle: s.translations[locale]?.subtitle || undefined,
      description: s.translations[locale]?.description || undefined,
      buttonText: s.translations[locale]?.buttonText || undefined,
      buttonUrl: s.translations[locale]?.buttonUrl || undefined,
    })),
  }));
}

// ── Component ─────────────────────────────────────────────

export default function AdminLandingPage() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>(buildDefaultSections());
  const [activeTab, setActiveTab] = useState<SectionType>("HERO");
  const [activeLocale, setActiveLocale] = useState("vi");
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "saved" | "error">("loading");

  // Load data on mount
  useEffect(() => {
    fetch("/api/admin/landing")
      .then((res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setSections(apiToState(data.sections ?? []));
        setStatus("idle");
      })
      .catch(() => {
        // No data yet - keep defaults
        setStatus("idle");
      });
  }, [router]);

  // Update a specific section field
  const updateSection = useCallback(
    (key: string, field: keyof Section, value: string | number) => {
      setSections((prev) =>
        prev.map((s) => (s.sectionKey === key ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  // Update translation field
  const updateTranslation = useCallback(
    (key: string, locale: string, field: keyof Translation, value: string) => {
      setSections((prev) =>
        prev.map((s) =>
          s.sectionKey === key
            ? {
                ...s,
                translations: {
                  ...s.translations,
                  [locale]: { ...s.translations[locale], [field]: value },
                },
              }
            : s
        )
      );
    },
    []
  );

  // Add a new section of type
  const addSection = useCallback(
    (type: SectionType) => {
      const existing = sections.filter((s) => s.sectionType === type);
      const prefix = type === "STEP" ? "step_new" : type.toLowerCase();
      const newKey = `${prefix}_${existing.length + 1}`;
      setSections((prev) => [
        ...prev,
        {
          sectionType: type,
          sectionKey: newKey,
          sortOrder: existing.length,
          imageUrl: "",
          extraData: type === "PLAN" ? JSON.stringify({ price: "", discount: "" }) : "",
          status: "PUBLISHED",
          translations: Object.fromEntries(locales.map((l) => [l, emptyTranslation()])),
        },
      ]);
    },
    [sections]
  );

  // Remove a section
  const removeSection = useCallback((key: string) => {
    setSections((prev) => prev.filter((s) => s.sectionKey !== key));
  }, []);

  // Save all
  const handleSave = async () => {
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/landing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: stateToApi(sections) }),
      });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setSections(apiToState(data.sections ?? []));
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  // Filtered sections for active tab
  const filtered = sections.filter((s) => s.sectionType === activeTab);

  if (status === "loading") {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Landing Page</h1>
        <p className="text-sm text-gray-500">Loading...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Landing Page</h1>
        <div className="flex items-center gap-3">
          {status === "saved" && (
            <span className="rounded-md bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              Saved successfully
            </span>
          )}
          {status === "error" && (
            <span className="rounded-md bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
              An error occurred
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {status === "saving" ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      {/* Section Type Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {SECTION_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === type
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {TAB_LABELS[type]}
            <span className="ml-1.5 text-xs opacity-70">
              ({sections.filter((s) => s.sectionType === type).length})
            </span>
          </button>
        ))}
      </div>

      {/* Language Tabs */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
          Language
        </label>
        <LanguageTabs activeLocale={activeLocale} onChange={setActiveLocale} />
      </div>

      {/* Section Editor */}
      <div className="space-y-4">
        {filtered.map((section) => (
          <SectionEditor
            key={section.sectionKey}
            section={section}
            locale={activeLocale}
            onUpdateSection={updateSection}
            onUpdateTranslation={updateTranslation}
            onRemove={removeSection}
          />
        ))}

        {/* Add button for repeatable sections */}
        {activeTab !== "HERO" && (
          <button
            onClick={() => addSection(activeTab)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add {TAB_LABELS[activeTab]}
          </button>
        )}
      </div>
    </section>
  );
}

// ── Section Editor Component ──────────────────────────────

function SectionEditor({
  section,
  locale,
  onUpdateSection,
  onUpdateTranslation,
  onRemove,
}: {
  section: Section;
  locale: string;
  onUpdateSection: (key: string, field: keyof Section, value: string | number) => void;
  onUpdateTranslation: (key: string, locale: string, field: keyof Translation, value: string) => void;
  onRemove: (key: string) => void;
}) {
  const t = section.translations[locale] ?? emptyTranslation();
  const isHero = section.sectionType === "HERO";
  const isFeature = section.sectionType === "FEATURE";
  const isPlan = section.sectionType === "PLAN";
  const isStep = section.sectionType === "STEP";
  const isFaq = section.sectionType === "FAQ";

  // Parse extraData for plan-specific fields
  let extraParsed: Record<string, string> = {};
  if (section.extraData) {
    try {
      extraParsed = JSON.parse(section.extraData);
    } catch {
      // ignore
    }
  }

  const updateExtra = (field: string, value: string) => {
    const updated = { ...extraParsed, [field]: value };
    onUpdateSection(section.sectionKey, "extraData", JSON.stringify(updated));
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-mono text-gray-600">
            {section.sectionKey}
          </span>
          {isStep && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                section.sectionKey.includes("new")
                  ? "bg-green-50 text-green-700"
                  : "bg-orange-50 text-orange-700"
              }`}
            >
              {section.sectionKey.includes("new") ? "New Registration" : "Switch Provider"}
            </span>
          )}
        </div>
        {!isHero && (
          <button
            onClick={() => onRemove(section.sectionKey)}
            className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Title <span className="text-xs text-gray-400">({locale.toUpperCase()})</span>
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={t.title}
            onChange={(e) => onUpdateTranslation(section.sectionKey, locale, "title", e.target.value)}
            placeholder={`Title in ${locale.toUpperCase()}`}
          />
        </div>

        {/* Subtitle - for Hero, Feature, Plan */}
        {(isHero || isFeature || isPlan) && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Subtitle <span className="text-xs text-gray-400">({locale.toUpperCase()})</span>
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={t.subtitle}
              onChange={(e) =>
                onUpdateTranslation(section.sectionKey, locale, "subtitle", e.target.value)
              }
              placeholder={`Subtitle in ${locale.toUpperCase()}`}
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {isFaq ? "Answer" : "Description"}{" "}
            <span className="text-xs text-gray-400">({locale.toUpperCase()})</span>
          </label>
          <textarea
            className="min-h-[100px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={t.description}
            onChange={(e) =>
              onUpdateTranslation(section.sectionKey, locale, "description", e.target.value)
            }
            placeholder={isFaq ? `Answer in ${locale.toUpperCase()}` : `Description in ${locale.toUpperCase()}`}
          />
        </div>

        {/* Button Text & URL - for Hero, Feature, Plan */}
        {(isHero || isFeature || isPlan) && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Button Text <span className="text-xs text-gray-400">({locale.toUpperCase()})</span>
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={t.buttonText}
                onChange={(e) =>
                  onUpdateTranslation(section.sectionKey, locale, "buttonText", e.target.value)
                }
                placeholder="Button label"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Button URL</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={t.buttonUrl}
                onChange={(e) =>
                  onUpdateTranslation(section.sectionKey, locale, "buttonUrl", e.target.value)
                }
                placeholder="/contact or https://..."
              />
            </div>
          </div>
        )}

        {/* Image - for Hero, Feature, Plan */}
        {(isHero || isFeature || isPlan) && (
          <ImageUploadField
            value={section.imageUrl}
            onChange={(url) => onUpdateSection(section.sectionKey, "imageUrl", url)}
          />
        )}

        {/* Plan-specific: price & discount */}
        {isPlan && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={extraParsed.price ?? ""}
                onChange={(e) => updateExtra("price", e.target.value)}
                placeholder="e.g. ¥2,980"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Discount</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={extraParsed.discount ?? ""}
                onChange={(e) => updateExtra("discount", e.target.value)}
                placeholder="e.g. 30% OFF"
              />
            </div>
          </div>
        )}

        {/* Feature-specific: icon */}
        {isFeature && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Icon (emoji or icon name)
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={extraParsed.icon ?? ""}
              onChange={(e) => updateExtra("icon", e.target.value)}
              placeholder="e.g. bolt, shield, star"
            />
          </div>
        )}

        {/* Sort Order */}
        {!isHero && (
          <div className="w-32">
            <label className="mb-1 block text-sm font-medium text-gray-700">Sort Order</label>
            <input
              type="number"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={section.sortOrder}
              onChange={(e) =>
                onUpdateSection(section.sectionKey, "sortOrder", parseInt(e.target.value) || 0)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Image Upload Field Component ──────────────────────────

function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadMsg("Only image files are allowed");
      setTimeout(() => setUploadMsg(""), 3000);
      return;
    }

    setUploading(true);
    setUploadMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setUploadMsg(err.error || "Upload failed");
        return;
      }

      const data = await res.json();
      if (data.url) {
        onChange(data.url);
        setUploadMsg("Uploaded successfully");
      } else {
        setUploadMsg("Upload failed — no URL returned");
      }
    } catch {
      setUploadMsg("Upload failed — network error");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(""), 3000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleUpload(file);
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Image</label>

      {/* Preview + Remove */}
      {value && (
        <div className="mb-3 flex items-start gap-3">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className="h-24 w-auto max-w-[200px] object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      )}

      {/* Drop zone + Upload button */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            {uploading ? (
              <span className="inline-flex items-center gap-2 text-blue-600">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </span>
            ) : (
              <>
                Drag & drop an image here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  browse
                </button>
              </>
            )}
          </p>
          <p className="text-xs text-gray-400">PNG, JPG, GIF, WebP</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Status message */}
      {uploadMsg && (
        <p
          className={`mt-1.5 text-xs font-medium ${
            uploadMsg.includes("success") ? "text-green-600" : "text-red-600"
          }`}
        >
          {uploadMsg}
        </p>
      )}

      {/* Manual URL input */}
      <div className="mt-3">
        <label className="mb-1 block text-xs text-gray-500">Or enter URL directly</label>
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://storage.googleapis.com/..."
        />
      </div>
    </div>
  );
}
