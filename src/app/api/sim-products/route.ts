import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const group = searchParams.get("group") || undefined;
  const provider = searchParams.get("provider") || undefined;
  const locale = searchParams.get("locale") || "vi";

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (group) where.group = group;
  if (provider) where.provider = provider;

  const translationFilter = locale === "all" ? {} : { where: { locale } };

  const products = await prisma.simProduct.findMany({
    where,
    include: {
      translations: translationFilter,
      media: { orderBy: { sortOrder: "asc" } },
      infoSections: {
        include: { translations: locale === "all" ? {} : { where: { locale } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ items: products });
}
