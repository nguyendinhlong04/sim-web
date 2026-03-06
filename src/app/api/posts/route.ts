import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const locale = searchParams.get("locale") || "vi";
  const category = searchParams.get("category") || undefined;

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (category) where.category = category;

  const posts = await prisma.post.findMany({
    where,
    include: {
      translations: { where: { locale } },
      author: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({ items: posts });
}
