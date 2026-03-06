import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { invalidateLandingCache } from "@/lib/landing-cache";

async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  return !!token;
}

/**
 * GET /api/admin/landing
 * Returns all landing sections with ALL translations (for admin editing).
 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sections = await prisma.landingSection.findMany({
      orderBy: [{ sectionType: "asc" }, { sortOrder: "asc" }],
      include: { translations: true },
    });

    return NextResponse.json({ sections });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

type TranslationInput = {
  locale: string;
  title: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
};

type SectionInput = {
  id?: string;
  sectionType: string;
  sectionKey: string;
  sortOrder?: number;
  imageUrl?: string;
  extraData?: string;
  status?: string;
  translations: TranslationInput[];
};

/**
 * PUT /api/admin/landing
 * Upserts all landing sections and their translations.
 * Body: { sections: SectionInput[] }
 */
export async function PUT(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { sections } = body as { sections?: SectionInput[] };

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: "Invalid body: sections array required" },
        { status: 400 }
      );
    }

    // Get existing section keys to detect deletions
    const existingKeys = await prisma.landingSection.findMany({
      select: { id: true, sectionKey: true },
    });
    const incomingKeys = new Set(sections.map((s) => s.sectionKey));
    const toDelete = existingKeys.filter((e) => !incomingKeys.has(e.sectionKey));

    // Use a transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete removed sections
      for (const del of toDelete) {
        await tx.landingSectionTranslation.deleteMany({
          where: { sectionId: del.id },
        });
        await tx.landingSection.delete({ where: { id: del.id } });
      }

      // Upsert each section + translations
      for (const section of sections) {
        const upserted = await tx.landingSection.upsert({
          where: { sectionKey: section.sectionKey },
          update: {
            sectionType: section.sectionType,
            sortOrder: section.sortOrder ?? 0,
            imageUrl: section.imageUrl ?? null,
            extraData: section.extraData ?? null,
            status: section.status ?? "PUBLISHED",
          },
          create: {
            sectionType: section.sectionType,
            sectionKey: section.sectionKey,
            sortOrder: section.sortOrder ?? 0,
            imageUrl: section.imageUrl ?? null,
            extraData: section.extraData ?? null,
            status: section.status ?? "PUBLISHED",
          },
        });

        // Upsert translations
        for (const t of section.translations) {
          await tx.landingSectionTranslation.upsert({
            where: {
              sectionId_locale: {
                sectionId: upserted.id,
                locale: t.locale,
              },
            },
            update: {
              title: t.title ?? "",
              subtitle: t.subtitle ?? null,
              description: t.description ?? null,
              buttonText: t.buttonText ?? null,
              buttonUrl: t.buttonUrl ?? null,
            },
            create: {
              sectionId: upserted.id,
              locale: t.locale,
              title: t.title ?? "",
              subtitle: t.subtitle ?? null,
              description: t.description ?? null,
              buttonText: t.buttonText ?? null,
              buttonUrl: t.buttonUrl ?? null,
            },
          });
        }
      }
    });

    // Invalidate cache so frontend picks up changes immediately
    invalidateLandingCache();

    // Return fresh data
    const updated = await prisma.landingSection.findMany({
      orderBy: [{ sectionType: "asc" }, { sortOrder: "asc" }],
      include: { translations: true },
    });

    return NextResponse.json({ sections: updated });
  } catch (err) {
    console.error("Landing save error:", err);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
