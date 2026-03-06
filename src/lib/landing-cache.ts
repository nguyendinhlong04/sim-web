import { prisma } from "@/lib/prisma";

type LandingTranslation = {
  title: string;
  subtitle: string | null;
  description: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
};

type LandingSectionData = {
  sectionKey: string;
  sectionType: string;
  sortOrder: number;
  imageUrl: string | null;
  extraData: Record<string, unknown> | null;
  translation: LandingTranslation | null;
};

export type LandingData = {
  hero: LandingSectionData | null;
  features: LandingSectionData[];
  plans: LandingSectionData[];
  stepsNew: LandingSectionData[];
  stepsSwitch: LandingSectionData[];
  faqs: LandingSectionData[];
  navItems: LandingSectionData[];
};

// In-memory cache per locale
const cache = new Map<string, { data: LandingData; time: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

function parseExtraData(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mapSection(
  section: {
    sectionKey: string;
    sectionType: string;
    sortOrder: number;
    imageUrl: string | null;
    extraData: string | null;
    translations: {
      locale: string;
      title: string;
      subtitle: string | null;
      description: string | null;
      buttonText: string | null;
      buttonUrl: string | null;
    }[];
  },
  locale: string
): LandingSectionData {
  const t = section.translations.find((tr) => tr.locale === locale) ?? null;
  return {
    sectionKey: section.sectionKey,
    sectionType: section.sectionType,
    sortOrder: section.sortOrder,
    imageUrl: section.imageUrl,
    extraData: parseExtraData(section.extraData),
    translation: t
      ? {
          title: t.title,
          subtitle: t.subtitle,
          description: t.description,
          buttonText: t.buttonText,
          buttonUrl: t.buttonUrl,
        }
      : null,
  };
}

export async function getLandingData(locale: string): Promise<LandingData> {
  const now = Date.now();
  const cached = cache.get(locale);
  if (cached && now - cached.time < CACHE_TTL_MS) {
    return cached.data;
  }

  const sections = await prisma.landingSection.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: {
        where: { locale },
      },
    },
  });

  const mapped = sections.map((s) => mapSection(s, locale));

  const data: LandingData = {
    hero: mapped.find((s) => s.sectionType === "HERO") ?? null,
    features: mapped.filter((s) => s.sectionType === "FEATURE"),
    plans: mapped.filter((s) => s.sectionType === "PLAN"),
    stepsNew: mapped
      .filter((s) => s.sectionType === "STEP" && s.sectionKey.startsWith("step_new"))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    stepsSwitch: mapped
      .filter((s) => s.sectionType === "STEP" && s.sectionKey.startsWith("step_switch"))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    faqs: mapped.filter((s) => s.sectionType === "FAQ"),
    navItems: mapped.filter((s) => s.sectionType === "NAV"),
  };

  cache.set(locale, { data, time: now });
  return data;
}

/** Invalidate cache for all locales (call after admin save) */
export function invalidateLandingCache() {
  cache.clear();
}
