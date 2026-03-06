import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// GET /api/chat/greetings
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale");

  if (locale) {
    const greeting = await prisma.chatGreeting.findUnique({
      where: { locale },
    });
    return NextResponse.json(greeting);
  }

  const greetings = await prisma.chatGreeting.findMany({
    orderBy: { locale: "asc" },
  });
  return NextResponse.json(greetings);
}

// PUT /api/chat/greetings - Upsert greetings (admin)
export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { greetings } = body as {
    greetings: { locale: string; greeting: string; isActive: boolean }[];
  };

  if (!greetings || !Array.isArray(greetings)) {
    return NextResponse.json({ error: "greetings array required" }, { status: 400 });
  }

  const results = await Promise.all(
    greetings.map((g) =>
      prisma.chatGreeting.upsert({
        where: { locale: g.locale },
        create: {
          locale: g.locale,
          greeting: g.greeting,
          isActive: g.isActive ?? true,
        },
        update: {
          greeting: g.greeting,
          isActive: g.isActive ?? true,
        },
      })
    )
  );

  return NextResponse.json(results);
}
