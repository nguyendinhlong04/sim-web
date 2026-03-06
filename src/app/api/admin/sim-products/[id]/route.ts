import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function isAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return !!token;
}

const updateSchema = z.object({
  slug: z.string().min(1).max(200).optional(),
  group: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  promoPrice: z.number().min(0).nullable().optional(),
  promoStart: z.string().nullable().optional(),
  promoEnd: z.string().nullable().optional(),
  dataCapacity: z.string().max(100).optional(),
  validityDays: z.number().int().min(1).optional(),
  status: z.string().optional(),
  sortOrder: z.number().int().optional(),
  translations: z.array(
    z.object({
      locale: z.string().min(1),
      name: z.string().min(1),
      subtitle: z.string().default(""),
      description: z.string().default(""),
      metaTitle: z.string().nullable().optional(),
      metaDesc: z.string().nullable().optional(),
    })
  ).optional(),
  media: z.array(
    z.object({
      id: z.string().optional(),
      type: z.string(),
      url: z.string().min(1),
      sortOrder: z.number().int().default(0),
    })
  ).optional(),
  infoSections: z.array(
    z.object({
      id: z.string().optional(),
      sortOrder: z.number().int().default(0),
      translations: z.array(
        z.object({
          locale: z.string().min(1),
          title: z.string().min(1),
          description: z.string().default(""),
        })
      ),
    })
  ).optional(),
});

type RouteCtx = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteCtx) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const product = await prisma.simProduct.findUnique({
    where: { id: params.id },
    include: {
      translations: true,
      media: { orderBy: { sortOrder: "asc" } },
      infoSections: {
        include: { translations: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(request: NextRequest, { params }: RouteCtx) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { translations, media, infoSections, promoStart, promoEnd, ...data } = parsed.data;

  // Build the main update payload
  const updateData: Record<string, unknown> = { ...data };
  if (promoStart !== undefined) updateData.promoStart = promoStart ? new Date(promoStart) : null;
  if (promoEnd !== undefined) updateData.promoEnd = promoEnd ? new Date(promoEnd) : null;

  // Update product base fields
  await prisma.simProduct.update({
    where: { id: params.id },
    data: updateData,
  });

  // Replace translations (delete + create)
  if (translations) {
    await prisma.simProductTranslation.deleteMany({ where: { productId: params.id } });
    await prisma.simProductTranslation.createMany({
      data: translations.map((t) => ({ ...t, productId: params.id })),
    });
  }

  // Replace media (delete + create)
  if (media) {
    await prisma.simProductMedia.deleteMany({ where: { productId: params.id } });
    await prisma.simProductMedia.createMany({
      data: media.map((m) => ({
        type: m.type,
        url: m.url,
        sortOrder: m.sortOrder,
        productId: params.id,
      })),
    });
  }

  if (infoSections) {
    await prisma.simProductInfo.deleteMany({ where: { productId: params.id } });
    for (const section of infoSections) {
      await prisma.simProductInfo.create({
        data: {
          productId: params.id,
          sortOrder: section.sortOrder,
          translations: { create: section.translations },
        },
      });
    }
  }

  // Return updated product
  const product = await prisma.simProduct.findUnique({
    where: { id: params.id },
    include: {
      translations: true,
      media: { orderBy: { sortOrder: "asc" } },
      infoSections: {
        include: { translations: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(request: NextRequest, { params }: RouteCtx) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.simProduct.delete({ where: { id: params.id } });

  return NextResponse.json({ status: "deleted" });
}
