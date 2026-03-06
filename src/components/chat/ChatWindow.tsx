"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";
import { CHAT_EVENTS } from "@/lib/chat-events";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import ChatRating from "./ChatRating";
import PreChatForm from "./PreChatForm";
import { X, Minus, Wifi, WifiOff } from "lucide-react";

interface Message {
  id: string;
  conversationId: string;
  senderType: string;
  senderId?: string | null;
  senderName?: string | null;
  messageType: string;
  content: string;
  metadata?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface ChatWindowProps {
  socket: Socket;
  visitorId: string;
  locale: string;
  onClose: () => void;
  onMinimize: () => void;
  isFullScreen?: boolean;
  translations: {
    title: string;
    placeholder: string;
    offline: string;
    preChatTitle: string;
    preChatName: string;
    preChatEmail: string;
    startChat: string;
    skip: string;
    ratingTitle: string;
    ratingThanks: string;
    connecting: string;
  };
}

export default function ChatWindow({
  socket,
  visitorId,
  locale,
  onClose,
  onMinimize,
  isFullScreen = false,
  translations: t,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] = useState<string>("WAITING");
  const [agentsOnline, setAgentsOnline] = useState(false);
  const [showPreChat, setShowPreChat] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(socket.connected);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initialize and load existing conversation
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    const loadExisting = async () => {
      try {
        const res = await fetch(
          `/api/chat/conversations?visitorId=${visitorId}`,
          { method: "GET" }
        );
        // This is admin-only endpoint; for visitor, try POST to check existing
        const checkRes = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId, visitorLocale: locale }),
        });
        if (checkRes.ok) {
          const conv = await checkRes.json();
          if (conv.id && conv.messages?.length > 0) {
            setConversationId(conv.id);
            setMessages(conv.messages);
            setConversationStatus(conv.status);
            setShowPreChat(false);
            socket.emit(CHAT_EVENTS.JOIN_ROOM, { conversationId: conv.id });
          }
        }
      } catch {
        // No existing conversation
      }
    };

    loadExisting();
  }, [visitorId, locale, socket]);

  // Socket event listeners
  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onNewMessage = (msg: Message) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mark as read if from agent
        if (msg.senderType === "AGENT" || msg.senderType === "SYSTEM") {
          socket.emit(CHAT_EVENTS.MESSAGES_READ, {
            conversationId,
            readerType: "VISITOR",
          });
        }
      }
    };

    const onTypingStart = () => setIsTyping(true);
    const onTypingStop = () => setIsTyping(false);
    const onAgentsStatus = (data: { online: boolean }) => setAgentsOnline(data.online);
    const onConvClosed = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setConversationStatus("CLOSED");
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(CHAT_EVENTS.NEW_MESSAGE, onNewMessage);
    socket.on(CHAT_EVENTS.TYPING_START, onTypingStart);
    socket.on(CHAT_EVENTS.TYPING_STOP, onTypingStop);
    socket.on(CHAT_EVENTS.AGENTS_STATUS, onAgentsStatus);
    socket.on(CHAT_EVENTS.CLOSE_CONVERSATION, onConvClosed);

    // Check initial agents status
    fetch("/api/chat/online-status")
      .then((r) => r.json())
      .then((d) => setAgentsOnline(d.online))
      .catch(() => {});

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(CHAT_EVENTS.NEW_MESSAGE, onNewMessage);
      socket.off(CHAT_EVENTS.TYPING_START, onTypingStart);
      socket.off(CHAT_EVENTS.TYPING_STOP, onTypingStop);
      socket.off(CHAT_EVENTS.AGENTS_STATUS, onAgentsStatus);
      socket.off(CHAT_EVENTS.CLOSE_CONVERSATION, onConvClosed);
    };
  }, [socket, conversationId]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const startConversation = async (preChatData: { name?: string; email?: string }) => {
    setShowPreChat(false);

    if (conversationId) return; // Already started

    // Get visitor info from navigator
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone/i.test(ua);

    socket.emit(
      CHAT_EVENTS.NEW_CONVERSATION,
      {
        visitorId,
        visitorName: preChatData.name,
        visitorEmail: preChatData.email,
        visitorLocale: locale,
        visitorDevice: isMobile ? "mobile" : "desktop",
        visitorBrowser: getBrowserName(ua),
        visitorOs: getOSName(ua),
        pageUrl: window.location.href,
      },
      (res: { id: string }) => {
        setConversationId(res.id);
        setConversationStatus("WAITING");

        // Load messages
        fetch(`/api/chat/conversations/${res.id}/messages`)
          .then((r) => r.json())
          .then((msgs) => setMessages(msgs))
          .catch(() => {});
      }
    );
  };

  const sendMessage = (content: string) => {
    if (!conversationId) return;

    socket.emit(CHAT_EVENTS.SEND_MESSAGE, {
      conversationId,
      senderType: "VISITOR",
      senderId: visitorId,
      messageType: "TEXT",
      content,
    });
  };

  const sendFile = async (file: File) => {
    if (!conversationId) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();

      const isImage = file.type.startsWith("image/");
      socket.emit(CHAT_EVENTS.SEND_MESSAGE, {
        conversationId,
        senderType: "VISITOR",
        senderId: visitorId,
        messageType: isImage ? "IMAGE" : "FILE",
        content: file.name,
        metadata: JSON.stringify({
          url,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }),
      });
    } catch {
      alert("Failed to upload file. Please try again.");
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!conversationId) return;
    socket.emit(
      isTyping ? CHAT_EVENTS.TYPING_START : CHAT_EVENTS.TYPING_STOP,
      { conversationId, senderType: "VISITOR" }
    );
  };

  const handleRate = async (rating: number) => {
    if (!conversationId) return;
    await fetch(`/api/chat/conversations/${conversationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    }).catch(() => {});
  };

  return (
    <div
      className={`flex flex-col bg-white ${
        isFullScreen
          ? "fixed inset-0 z-[9999]"
          : "h-[520px] w-[380px] overflow-hidden rounded-2xl shadow-2xl"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-600 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{t.title}</p>
            <div className="flex items-center gap-1">
              {connected ? (
                <Wifi size={10} className="text-green-300" />
              ) : (
                <WifiOff size={10} className="text-red-300" />
              )}
              <span className="text-[10px] text-blue-200">
                {!connected ? t.connecting : agentsOnline ? "Online" : t.offline}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isFullScreen && (
            <button
              onClick={onMinimize}
              className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Minus size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {showPreChat ? (
          <PreChatForm
            onSubmit={startConversation}
            title={t.preChatTitle}
            nameLabel={t.preChatName}
            emailLabel={t.preChatEmail}
            startLabel={t.startChat}
            skipLabel={t.skip}
          />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                senderType={msg.senderType}
                messageType={msg.messageType}
                content={msg.content}
                metadata={msg.metadata}
                senderName={msg.senderName}
                createdAt={msg.createdAt}
                isRead={msg.isRead}
                locale={locale}
              />
            ))}
            {isTyping && (
              <div className="my-1 flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2">
                  <div className="flex gap-1">
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            {conversationStatus === "CLOSED" && (
              <ChatRating
                onRate={handleRate}
                title={t.ratingTitle}
                thankYou={t.ratingThanks}
              />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      {!showPreChat && conversationStatus !== "CLOSED" && (
        <ChatInput
          onSend={sendMessage}
          onSendFile={sendFile}
          onTyping={handleTyping}
          placeholder={t.placeholder}
          disabled={!connected}
        />
      )}
    </div>
  );
}

// Helpers
function getBrowserName(ua: string): string {
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
}

function getOSName(ua: string): string {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Other";
}
