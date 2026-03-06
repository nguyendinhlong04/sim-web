import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// GET /api/chat/conversations/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: params.id },
    include: {
      agent: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
      _count: {
        select: {
          messages: {
            where: { isRead: false, senderType: "VISITOR" },
          },
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(conversation);
}

// PUT /api/chat/conversations/[id] - Update (admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status, assignedTo, tags, notes, rating } = body;

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (assignedTo !== undefined) data.assignedTo = assignedTo;
  if (tags !== undefined) data.tags = tags;
  if (notes !== undefined) data.notes = notes;
  if (rating !== undefined) data.rating = rating;
  if (status === "CLOSED") data.closedAt = new Date();

  const conversation = await prisma.chatConversation.update({
    where: { id: params.id },
    data,
    include: {
      agent: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(conversation);
}

// DELETE /api/chat/conversations/[id] - Delete (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete messages first
  await prisma.chatMessage.deleteMany({
    where: { conversationId: params.id },
  });

  await prisma.chatConversation.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ ok: true });
}
