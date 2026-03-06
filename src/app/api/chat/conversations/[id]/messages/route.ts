import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/chat/conversations/[id]/messages
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

// POST /api/chat/conversations/[id]/messages
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { senderType, senderId, senderName, messageType, content, metadata } = body;

  if (!content || !senderType) {
    return NextResponse.json({ error: "content and senderType required" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId: params.id,
      senderType,
      senderId,
      senderName,
      messageType: messageType || "TEXT",
      content,
      metadata,
    },
  });

  // Update conversation timestamp
  await prisma.chatConversation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}
