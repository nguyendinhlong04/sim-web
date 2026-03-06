import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { PrismaClient } from "@prisma/client";
import {
  CHAT_EVENTS,
  ChatMessagePayload,
  ConversationPayload,
  TypingPayload,
  ProductSharePayload,
} from "./chat-events";
import { lookupGeo, getSocketIp } from "./ip-geo";

const prisma = new PrismaClient();

// Track online agents (userId -> Set<socketId>)
const onlineAgents = new Map<string, Set<string>>();

// Track online visitors (visitorId -> Set<socketId>)
const onlineVisitors = new Map<string, Set<string>>();

export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── Agent comes online ──────────────────────────────
    socket.on(CHAT_EVENTS.AGENT_ONLINE, (data: { agentId: string; agentName: string }) => {
      if (!onlineAgents.has(data.agentId)) {
        onlineAgents.set(data.agentId, new Set());
      }
      onlineAgents.get(data.agentId)!.add(socket.id);
      socket.join("agents");
      socket.data.agentId = data.agentId;
      socket.data.agentName = data.agentName;
      socket.data.isAgent = true;

      // Broadcast agent count to all visitors
      io.emit(CHAT_EVENTS.AGENTS_STATUS, { online: onlineAgents.size > 0 });
    });

    // ── Join a conversation room ────────────────────────
    socket.on(CHAT_EVENTS.JOIN_ROOM, (data: { conversationId: string }) => {
      socket.join(`conversation:${data.conversationId}`);
    });

    // ── Leave a conversation room ───────────────────────
    socket.on(CHAT_EVENTS.LEAVE_ROOM, (data: { conversationId: string }) => {
      socket.leave(`conversation:${data.conversationId}`);
    });

    // ── New conversation from visitor ───────────────────
    socket.on(CHAT_EVENTS.NEW_CONVERSATION, async (data: ConversationPayload, callback?: (res: { id: string }) => void) => {
      try {
        // Resolve visitor location from IP if not already provided
        let visitorCountry = data.visitorCountry;
        let visitorCity = data.visitorCity;
        if (!visitorCountry && !visitorCity) {
          const ip = getSocketIp(socket);
          const geo = await lookupGeo(ip);
          visitorCountry = geo.country;
          visitorCity = geo.city;
        }

        // Check for existing active conversation
        const existing = await prisma.chatConversation.findFirst({
          where: {
            visitorId: data.visitorId,
            status: { not: "CLOSED" },
          },
          orderBy: { createdAt: "desc" },
        });

        if (existing) {
          // Update conversation with visitor info from pre-chat form
          const updateData: Record<string, string> = {};
          if (data.visitorName) updateData.visitorName = data.visitorName;
          if (data.visitorEmail) updateData.visitorEmail = data.visitorEmail;
          if (data.visitorDevice) updateData.visitorDevice = data.visitorDevice;
          if (data.visitorBrowser) updateData.visitorBrowser = data.visitorBrowser;
          if (data.visitorOs) updateData.visitorOs = data.visitorOs;
          if (data.pageUrl) updateData.pageUrl = data.pageUrl;
          // Fill in location if previously empty
          if (!existing.visitorCountry && visitorCountry) updateData.visitorCountry = visitorCountry;
          if (!existing.visitorCity && visitorCity) updateData.visitorCity = visitorCity;

          if (Object.keys(updateData).length > 0) {
            const updated = await prisma.chatConversation.update({
              where: { id: existing.id },
              data: updateData,
            });
            // Notify agents of the update
            io.to("agents").emit(CHAT_EVENTS.CONVERSATION_UPDATED, updated);
          }

          socket.join(`conversation:${existing.id}`);
          if (callback) callback({ id: existing.id });
          return;
        }

        const conversation = await prisma.chatConversation.create({
          data: {
            visitorId: data.visitorId,
            visitorName: data.visitorName,
            visitorEmail: data.visitorEmail,
            visitorLocale: data.visitorLocale,
            visitorCountry,
            visitorCity,
            visitorDevice: data.visitorDevice,
            visitorBrowser: data.visitorBrowser,
            visitorOs: data.visitorOs,
            pageUrl: data.pageUrl,
          },
        });

        socket.join(`conversation:${conversation.id}`);

        // Send auto-greeting
        const greeting = await prisma.chatGreeting.findUnique({
          where: { locale: data.visitorLocale, isActive: true },
        });

        if (greeting) {
          const greetingMsg = await prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              senderType: "SYSTEM",
              messageType: "SYSTEM",
              content: greeting.greeting,
            },
          });
          io.to(`conversation:${conversation.id}`).emit(CHAT_EVENTS.NEW_MESSAGE, greetingMsg);
        }

        // Notify all agents
        io.to("agents").emit(CHAT_EVENTS.NEW_CONVERSATION, conversation);

        if (callback) callback({ id: conversation.id });
      } catch (error) {
        console.error("[Socket] Error creating conversation:", error);
      }
    });

    // ── Send message ────────────────────────────────────
    socket.on(CHAT_EVENTS.SEND_MESSAGE, async (data: ChatMessagePayload) => {
      try {
        const message = await prisma.chatMessage.create({
          data: {
            conversationId: data.conversationId,
            senderType: data.senderType,
            senderId: data.senderId,
            senderName: data.senderName,
            messageType: data.messageType,
            content: data.content,
            metadata: data.metadata,
          },
        });

        // Update conversation timestamp
        await prisma.chatConversation.update({
          where: { id: data.conversationId },
          data: { updatedAt: new Date() },
        });

        // Broadcast to everyone in the conversation room
        io.to(`conversation:${data.conversationId}`).emit(CHAT_EVENTS.NEW_MESSAGE, message);

        // If visitor message, also notify agents room
        if (data.senderType === "VISITOR") {
          io.to("agents").emit(CHAT_EVENTS.NEW_MESSAGE, message);
        }
      } catch (error) {
        console.error("[Socket] Error sending message:", error);
      }
    });

    // ── Mark messages as read ───────────────────────────
    socket.on(CHAT_EVENTS.MESSAGES_READ, async (data: { conversationId: string; readerType: string }) => {
      try {
        const oppositeType = data.readerType === "AGENT" ? "VISITOR" : "AGENT";
        await prisma.chatMessage.updateMany({
          where: {
            conversationId: data.conversationId,
            senderType: oppositeType,
            isRead: false,
          },
          data: { isRead: true },
        });

        io.to(`conversation:${data.conversationId}`).emit(CHAT_EVENTS.MESSAGES_READ, {
          conversationId: data.conversationId,
          readerType: data.readerType,
        });
      } catch (error) {
        console.error("[Socket] Error marking read:", error);
      }
    });

    // ── Assign agent ────────────────────────────────────
    socket.on(CHAT_EVENTS.ASSIGN_AGENT, async (data: { conversationId: string; agentId: string; agentName: string }) => {
      try {
        const conversation = await prisma.chatConversation.update({
          where: { id: data.conversationId },
          data: { assignedTo: data.agentId, status: "ACTIVE" },
        });

        // System message
        const sysMsg = await prisma.chatMessage.create({
          data: {
            conversationId: data.conversationId,
            senderType: "SYSTEM",
            messageType: "SYSTEM",
            content: `${data.agentName} joined the conversation`,
          },
        });

        io.to(`conversation:${data.conversationId}`).emit(CHAT_EVENTS.NEW_MESSAGE, sysMsg);
        io.to("agents").emit(CHAT_EVENTS.CONVERSATION_UPDATED, conversation);
      } catch (error) {
        console.error("[Socket] Error assigning agent:", error);
      }
    });

    // ── Close conversation ──────────────────────────────
    socket.on(CHAT_EVENTS.CLOSE_CONVERSATION, async (data: { conversationId: string; agentName?: string }) => {
      try {
        const conversation = await prisma.chatConversation.update({
          where: { id: data.conversationId },
          data: { status: "CLOSED", closedAt: new Date() },
        });

        const sysMsg = await prisma.chatMessage.create({
          data: {
            conversationId: data.conversationId,
            senderType: "SYSTEM",
            messageType: "SYSTEM",
            content: data.agentName
              ? `${data.agentName} closed the conversation`
              : "Conversation closed",
          },
        });

        io.to(`conversation:${data.conversationId}`).emit(CHAT_EVENTS.NEW_MESSAGE, sysMsg);
        io.to(`conversation:${data.conversationId}`).emit(CHAT_EVENTS.CLOSE_CONVERSATION, { conversationId: data.conversationId });
        io.to("agents").emit(CHAT_EVENTS.CONVERSATION_UPDATED, conversation);
      } catch (error) {
        console.error("[Socket] Error closing conversation:", error);
      }
    });

    // ── Visitor comes online ────────────────────────────
    socket.on(CHAT_EVENTS.VISITOR_ONLINE, (data: { visitorId: string }) => {
      if (!onlineVisitors.has(data.visitorId)) {
        onlineVisitors.set(data.visitorId, new Set());
      }
      onlineVisitors.get(data.visitorId)!.add(socket.id);
      socket.data.visitorId = data.visitorId;
      socket.data.isVisitor = true;

      // Notify agents about this visitor's status
      io.to("agents").emit(CHAT_EVENTS.VISITOR_STATUS, {
        visitorId: data.visitorId,
        online: true,
      });
    });

    // ── Check visitor status (agent queries) ─────────
    socket.on(CHAT_EVENTS.VISITOR_STATUS, (data: { visitorId: string }, callback?: (res: { online: boolean }) => void) => {
      const online = onlineVisitors.has(data.visitorId) && (onlineVisitors.get(data.visitorId)!.size > 0);
      if (callback) callback({ online });
    });

    // ── Typing indicators ───────────────────────────────
    socket.on(CHAT_EVENTS.TYPING_START, (data: TypingPayload) => {
      socket.to(`conversation:${data.conversationId}`).emit(CHAT_EVENTS.TYPING_START, data);
    });

    socket.on(CHAT_EVENTS.TYPING_STOP, (data: TypingPayload) => {
      socket.to(`conversation:${data.conversationId}`).emit(CHAT_EVENTS.TYPING_STOP, data);
    });

    // ── Share product ───────────────────────────────────
    socket.on(CHAT_EVENTS.SHARE_PRODUCT, async (data: ProductSharePayload) => {
      try {
        const message = await prisma.chatMessage.create({
          data: {
            conversationId: data.conversationId,
            senderType: "AGENT",
            senderId: socket.data.agentId,
            senderName: socket.data.agentName,
            messageType: "PRODUCT",
            content: data.productName,
            metadata: JSON.stringify({
              productId: data.productId,
              productName: data.productName,
              productPrice: data.productPrice,
              productPromoPrice: data.productPromoPrice,
              productImage: data.productImage,
              productSlug: data.productSlug,
              productGroup: data.productGroup,
              locale: data.locale,
            }),
          },
        });

        io.to(`conversation:${data.conversationId}`).emit(CHAT_EVENTS.NEW_MESSAGE, message);
      } catch (error) {
        console.error("[Socket] Error sharing product:", error);
      }
    });

    // ── Disconnect ──────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);

      // Agent disconnect
      if (socket.data.isAgent && socket.data.agentId) {
        const agentSockets = onlineAgents.get(socket.data.agentId);
        if (agentSockets) {
          agentSockets.delete(socket.id);
          if (agentSockets.size === 0) {
            onlineAgents.delete(socket.data.agentId);
          }
        }
        io.emit(CHAT_EVENTS.AGENTS_STATUS, { online: onlineAgents.size > 0 });
      }

      // Visitor disconnect
      if (socket.data.isVisitor && socket.data.visitorId) {
        const visitorSockets = onlineVisitors.get(socket.data.visitorId);
        if (visitorSockets) {
          visitorSockets.delete(socket.id);
          if (visitorSockets.size === 0) {
            onlineVisitors.delete(socket.data.visitorId);
            // Notify agents that this visitor went offline
            io.to("agents").emit(CHAT_EVENTS.VISITOR_STATUS, {
              visitorId: socket.data.visitorId,
              online: false,
            });
          }
        }
      }
    });
  });

  return io;
}
