"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSocket } from "@/lib/socket-client";
import { CHAT_EVENTS } from "@/lib/chat-events";

export default function AdminChatBadge() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const isActive = pathname?.startsWith("/admin/chat");

  useEffect(() => {
    // Poll for conversations with unread visitor messages
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/chat/conversations");
        if (res.ok) {
          const data = await res.json();
          // Count conversations that have at least 1 unread visitor message
          const count = data.filter(
            (c: { status: string; _count?: { messages: number } }) =>
              c.status !== "CLOSED" && (c._count?.messages || 0) > 0
          ).length;
          setUnread(count);
        }
      } catch {
        // ignore
      }
    };

    fetchUnread();

    // Listen for new conversations via socket
    let socket: ReturnType<typeof getSocket> | null = null;
    const onNewConv = () => setUnread((c) => c + 1);
    const onConvUpdated = () => fetchUnread();

    try {
      socket = getSocket();
      socket.on(CHAT_EVENTS.NEW_CONVERSATION, onNewConv);
      socket.on(CHAT_EVENTS.CONVERSATION_UPDATED, onConvUpdated);
    } catch {
      // socket not available
    }

    const interval = setInterval(fetchUnread, 30000);

    return () => {
      clearInterval(interval);
      if (socket) {
        // Remove only OUR specific handlers, not all handlers for these events
        socket.off(CHAT_EVENTS.NEW_CONVERSATION, onNewConv);
        socket.off(CHAT_EVENTS.CONVERSATION_UPDATED, onConvUpdated);
      }
    };
  }, []);

  // Update tab title with unread count
  useEffect(() => {
    if (unread > 0) {
      document.title = `(${unread}) Chat - Admin`;
    }
  }, [unread]);

  return (
    <Link
      href="/admin/chat"
      className={`relative flex items-center gap-1 ${
        isActive ? "font-semibold text-blue-600" : ""
      }`}
    >
      Chat
      {unread > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
