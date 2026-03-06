import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/visitor-tracking";
import { lookupGeo } from "@/lib/ip-geo";

// GET /api/chat/conversations - List conversations (admin)
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const locale = searchParams.get("locale");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (locale) where.visitorLocale = locale;
  if (search) {
    where.OR = [
      { visitorName: { contains: search } },
      { visitorEmail: { contains: search } },
      { visitorId: { contains: search } },
    ];
  }

  const conversations = await prisma.chatConversation.findMany({
    where,
    include: {
      agent: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          messages: {
            where: { isRead: false, senderType: "VISITOR" },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}

// POST /api/chat/conversations - Create conversation (visitor)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { visitorId, visitorLocale, visitorName, visitorEmail, ...rest } = body;

  if (!visitorId) {
    return NextResponse.json({ error: "visitorId required" }, { status: 400 });
  }

  // Resolve visitor location from IP if not provided
  if (!rest.visitorCountry && !rest.visitorCity) {
    const ip = getClientIp(req.headers);
    const geo = await lookupGeo(ip);
    if (geo.country) rest.visitorCountry = geo.country;
    if (geo.city) rest.visitorCity = geo.city;
  }

  // Check for existing active conversation
  const existing = await prisma.chatConversation.findFirst({
    where: {
      visitorId,
      status: { not: "CLOSED" },
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const conversation = await prisma.chatConversation.create({
    data: {
      visitorId,
      visitorLocale: visitorLocale || "vi",
      visitorName,
      visitorEmail,
      ...rest,
    },
    include: {
      messages: true,
    },
  });

  // Send auto-greeting
  const greeting = await prisma.chatGreeting.findUnique({
    where: { locale: visitorLocale || "vi" },
  });

  if (greeting && greeting.isActive) {
    const greetingMsg = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: "SYSTEM",
        messageType: "SYSTEM",
        content: greeting.greeting,
      },
    });
    conversation.messages.push(greetingMsg);
  }

  // Notify agents via global Socket.io instance
  try {
    const io = (global as any).__socketio;
    if (io) {
      io.to("agents").emit("chat:newConversation", conversation);
    }
  } catch { /* ignore */ }

  return NextResponse.json(conversation, { status: 201 });
}
