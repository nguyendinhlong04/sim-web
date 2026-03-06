import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function getUser(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token;
}

const createSchema = z.object({
  slug: z.string().min(1).max(200),
  status: z.string().default("DRAFT"),
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
    .min(1),
});

export async function GET(request: NextRequest) {
  const token = await getUser(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;

  const where: Record<string, string> = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const posts = await prisma.post.findMany({
    where,
    include: {
      translations: true,
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items: posts });
}

export async function POST(request: NextRequest) {
  const token = await getUser(request);
  if (!token) {
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

  const { translations, publishedAt, ...data } = parsed.data;

  const post = await prisma.post.create({
    data: {
      ...data,
      authorId: token.sub as string,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      translations: { create: translations },
    },
    include: {
      translations: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}
