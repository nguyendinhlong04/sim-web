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
  status: z.string().optional(),
  publishedAt: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  translations: z
    .array(
      z.object({
        locale: z.string().min(1),
        title: z.string().min(1),
        metaTitle: z.string().nullable().optional(),
        metaDesc: z.string().nullable().optional(),
        content: z.string().default(""),
        excerpt: z.string().nullable().optional(),
        featuredImg: z.string().nullable().optional(),
      })
    )
    .optional(),
});

type RouteCtx = { params: { id: string } };

export async function GET(request: NextRequest, { params }: RouteCtx) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      translations: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
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

  const { translations, publishedAt, ...data } = parsed.data;

  // Build update payload
  const updateData: Record<string, unknown> = { ...data };
  if (publishedAt !== undefined) {
    updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
  }

  // Update post base fields
  await prisma.post.update({
    where: { id: params.id },
    data: updateData,
  });

  if (translations) {
    await prisma.postTranslation.deleteMany({
      where: { postId: params.id },
    });
    await prisma.postTranslation.createMany({
      data: translations.map((t) => ({ ...t, postId: params.id })),
    });
  }

  // Return updated post
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      translations: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(post);
}

export async function DELETE(request: NextRequest, { params }: RouteCtx) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.post.delete({ where: { id: params.id } });

  return NextResponse.json({ status: "deleted" });
}
