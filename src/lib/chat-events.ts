// ── Socket.io event names ────────────────────────────────

export const CHAT_EVENTS = {
  // Connection
  JOIN_ROOM: "chat:join",
  LEAVE_ROOM: "chat:leave",

  // Messages
  SEND_MESSAGE: "chat:message",
  NEW_MESSAGE: "chat:newMessage",
  MESSAGES_READ: "chat:read",

  // Conversations
  NEW_CONVERSATION: "chat:newConversation",
  CONVERSATION_UPDATED: "chat:conversationUpdated",
  ASSIGN_AGENT: "chat:assignAgent",
  CLOSE_CONVERSATION: "chat:close",

  // Typing
  TYPING_START: "chat:typingStart",
  TYPING_STOP: "chat:typingStop",

  // Product sharing
  SHARE_PRODUCT: "chat:productShare",

  // Agent presence
  AGENT_ONLINE: "chat:agentOnline",
  AGENT_OFFLINE: "chat:agentOffline",
  AGENTS_STATUS: "chat:agentsStatus",

  // Visitor presence
  VISITOR_ONLINE: "chat:visitorOnline",
  VISITOR_OFFLINE: "chat:visitorOffline",
  VISITOR_STATUS: "chat:visitorStatus",
} as const;

// ── TypeScript types ─────────────────────────────────────

export type SenderType = "VISITOR" | "AGENT" | "SYSTEM";
export type MessageType = "TEXT" | "PRODUCT" | "IMAGE" | "FILE" | "SYSTEM";
export type ConversationStatus = "WAITING" | "ACTIVE" | "CLOSED";

export interface ChatMessagePayload {
  conversationId: string;
  senderType: SenderType;
  senderId?: string;
  senderName?: string;
  messageType: MessageType;
  content: string;
  metadata?: string; // JSON string
}

export interface ConversationPayload {
  visitorId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorLocale: string;
  visitorCountry?: string;
  visitorCity?: string;
  visitorDevice?: string;
  visitorBrowser?: string;
  visitorOs?: string;
  pageUrl?: string;
}

export interface TypingPayload {
  conversationId: string;
  senderType: SenderType;
  senderName?: string;
}

export interface ProductSharePayload {
  conversationId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productPromoPrice?: number;
  productImage?: string;
  productSlug: string;
  productGroup: string;
  locale: string;
}
