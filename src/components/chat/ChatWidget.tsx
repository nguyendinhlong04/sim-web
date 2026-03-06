"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { getSocket, disconnectSocket } from "@/lib/socket-client";
import { CHAT_EVENTS } from "@/lib/chat-events";
import { playNotificationSound } from "@/lib/notification-sound";
import ChatWindow from "./ChatWindow";

interface ChatWidgetProps {
  locale: string;
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

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("chat_visitor_id");
  if (!id) {
    id = "v_" + crypto.randomUUID();
    localStorage.setItem("chat_visitor_id", id);
  }
  return id;
}

export default function ChatWidget({ locale, translations }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [visitorId, setVisitorId] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    setVisitorId(getVisitorId());
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Connect socket when widget opens
  useEffect(() => {
    if (isOpen && !socket) {
      const s = getSocket();
      setSocket(s);
    }
  }, [isOpen, socket]);

  // Register visitor presence when socket is ready
  useEffect(() => {
    if (!socket || !visitorId) return;

    const registerVisitor = () => {
      socket.emit(CHAT_EVENTS.VISITOR_ONLINE, { visitorId });
    };

    if (socket.connected) registerVisitor();
    socket.on("connect", registerVisitor);

    return () => {
      socket.off("connect", registerVisitor);
    };
  }, [socket, visitorId]);

  // Clean up socket on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // Listen for new messages when widget is closed to increment unread
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      if (!isOpen) {
        setUnreadCount((c) => c + 1);
        playNotificationSound();
      }
    };
    socket.on("chat:newMessage", handler);
    return () => {
      socket.off("chat:newMessage", handler);
    };
  }, [socket, isOpen]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsOpen(false);
  }, []);

  if (!visitorId) return null;

  return (
    <>
      {/* Chat Window */}
      {isOpen && socket && (
        <div
          className={
            isMobile
              ? "fixed inset-0 z-[9999]"
              : "fixed bottom-6 right-6 z-[9999]"
          }
        >
          <ChatWindow
            socket={socket}
            visitorId={visitorId}
            locale={locale}
            onClose={handleClose}
            onMinimize={handleMinimize}
            isFullScreen={isMobile}
            translations={translations}
          />
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-700 hover:shadow-xl active:scale-95"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </>
  );
}
