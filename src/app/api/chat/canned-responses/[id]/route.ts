import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// PUT /api/chat/canned-responses/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { shortcut, locale, title, content, category } = body;

  const response = await prisma.chatCannedResponse.update({
    where: { id: params.id },
    data: {
      ...(shortcut && { shortcut }),
      ...(locale && { locale }),
      ...(title && { title }),
      ...(content && { content }),
      ...(category !== undefined && { category }),
    },
  });

  return NextResponse.json(response);
}

// DELETE /api/chat/canned-responses/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.chatCannedResponse.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}
