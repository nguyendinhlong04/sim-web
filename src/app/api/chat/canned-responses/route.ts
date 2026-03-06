import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// GET /api/chat/canned-responses
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (locale) where.locale = locale;
  if (search) {
    where.OR = [
      { shortcut: { contains: search } },
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }

  const responses = await prisma.chatCannedResponse.findMany({
    where,
    orderBy: { shortcut: "asc" },
  });

  return NextResponse.json(responses);
}

// POST /api/chat/canned-responses
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { shortcut, locale, title, content, category } = body;

  if (!shortcut || !locale || !title || !content) {
    return NextResponse.json(
      { error: "shortcut, locale, title, content required" },
      { status: 400 }
    );
  }

  const response = await prisma.chatCannedResponse.create({
    data: { shortcut, locale, title, content, category },
  });

  return NextResponse.json(response, { status: 201 });
}
