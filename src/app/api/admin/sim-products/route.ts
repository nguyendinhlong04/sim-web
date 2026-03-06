import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function isAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return !!token;
}

const createSchema = z.object({
  slug: z.string().min(1).max(200),
  group: z.string().min(1),
  provider: z.string().min(1),
  price: z.number().min(0).default(0),
  promoPrice: z.number().min(0).nullable().optional(),
  promoStart: z.string().nullable().optional(),
  promoEnd: z.string().nullable().optional(),
  dataCapacity: z.string().max(100).default(""),
  validityDays: z.number().int().min(1).default(30),
  status: z.string().default("DRAFT"),
  sortOrder: z.number().int().default(0),
  translations: z.array(
    z.object({
      locale: z.string().min(1),
      name: z.string().min(1),
      subtitle: z.string().default(""),
      description: z.string().default(""),
      metaTitle: z.string().nullable().optional(),
      metaDesc: z.string().nullable().optional(),
    })
  ).min(1),
  media: z.array(
    z.object({
      type: z.string(),
      url: z.string().min(1),
      sortOrder: z.number().int().default(0),
    })
  ).default([]),
  infoSections: z.array(
    z.object({
      sortOrder: z.number().int().default(0),
      translations: z.array(
        z.object({
          locale: z.string().min(1),
          title: z.string().min(1),
          description: z.string().default(""),
        })
      ),
    })
  ).default([]),
});

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const group = searchParams.get("group") || undefined;
  const provider = searchParams.get("provider") || undefined;
  const status = searchParams.get("status") || undefined;

  const where: Record<string, string> = {};
  if (group) where.group = group;
  if (provider) where.provider = provider;
  if (status) where.status = status;

  const products = await prisma.simProduct.findMany({
    where,
    include: {
      translations: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ items: products });
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { translations, media, infoSections, promoStart, promoEnd, ...data } = parsed.data;

  const product = await prisma.simProduct.create({
    data: {
      ...data,
      promoStart: promoStart ? new Date(promoStart) : null,
      promoEnd: promoEnd ? new Date(promoEnd) : null,
      translations: { create: translations },
      media: { create: media },
      infoSections: {
        create: infoSections.map((s) => ({
          sortOrder: s.sortOrder,
          translations: { create: s.translations },
        })),
      },
    },
    include: {
      translations: true,
      media: { orderBy: { sortOrder: "asc" } },
      infoSections: { include: { translations: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json(product, { status: 201 });
}
