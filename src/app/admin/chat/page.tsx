"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getSocket } from "@/lib/socket-client";
import { CHAT_EVENTS } from "@/lib/chat-events";
import ConversationList from "@/components/admin/chat/ConversationList";
import MessageArea from "@/components/admin/chat/MessageArea";
import CustomerInfo from "@/components/admin/chat/CustomerInfo";
import { playNotificationSound, startTitleFlash, stopTitleFlash } from "@/lib/notification-sound";
import { Socket } from "socket.io-client";

interface Conversation {
  id: string;
  visitorId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorLocale: string;
  visitorCountry?: string | null;
  visitorCity?: string | null;
  visitorDevice?: string | null;
  visitorBrowser?: string | null;
  visitorOs?: string | null;
  pageUrl?: string | null;
  status: string;
  assignedTo?: string | null;
  agent?: { id: string; name: string } | null;
  tags?: string | null;
  notes?: string | null;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  messages?: Message[];
  _count?: { messages: number };
}

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

export default function AdminChatPage() {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState({ status: "", locale: "", search: "" });
  const [isTyping, setIsTyping] = useState(false);
  const [onlineVisitors, setOnlineVisitors] = useState<Set<string>>(new Set());

  // Use refs for values needed inside socket handlers to avoid stale closures
  const selectedIdRef = useRef<string | null>(null);
  const sessionRef = useRef(session);

  // Keep refs in sync
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { sessionRef.current = session; }, [session]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  // ── Socket initialization (mount-only) ──────────────────
  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    // Register as agent once connected
    const registerAgent = () => {
      const sess = sessionRef.current;
      if (sess?.user) {
        s.emit(CHAT_EVENTS.AGENT_ONLINE, {
          agentId: sess.user.id,
          agentName: sess.user.name || sess.user.email || "Agent",
        });
      }
      // Re-join selected conversation room after reconnect
      const selId = selectedIdRef.current;
      if (selId) {
        s.emit(CHAT_EVENTS.JOIN_ROOM, { conversationId: selId });
      }
    };

    if (s.connected) {
      registerAgent();
    }
    s.on("connect", registerAgent);

    // ── Event handlers using refs (never stale) ───────────
    const onNewConversation = (conv: Conversation) => {
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      playNotificationSound(0.5);
      startTitleFlash("New chat!");
    };

    const onConversationUpdated = (conv: Conversation) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c))
      );
    };

    const onNewMessage = (msg: Message) => {
      const currentSelectedId = selectedIdRef.current;

      // Update messages if this conversation is selected
      if (msg.conversationId === currentSelectedId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mark as read
        s.emit(CHAT_EVENTS.MESSAGES_READ, {
          conversationId: msg.conversationId,
          readerType: "AGENT",
        });
      }

      // Update conversation list (move to top, update last message)
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === msg.conversationId);

        // FIX B: If conversation not in list, fetch it from API and add
        if (!exists) {
          fetch(`/api/chat/conversations/${msg.conversationId}`)
            .then((r) => r.ok ? r.json() : null)
            .then((conv) => {
              if (conv) {
                setConversations((p) => {
                  if (p.some((c) => c.id === conv.id)) return p;
                  return [{ ...conv, messages: [msg], _count: { messages: 1 } }, ...p];
                });
              }
            })
            .catch(() => {});
          return prev;
        }

        const updated = prev.map((c) => {
          if (c.id === msg.conversationId) {
            return {
              ...c,
              messages: [msg],
              updatedAt: msg.createdAt,
              _count: {
                messages:
                  msg.senderType === "VISITOR" && msg.conversationId !== currentSelectedId
                    ? (c._count?.messages || 0) + 1
                    : c._count?.messages || 0,
              },
            };
          }
          return c;
        });
        return updated.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

      // Play sound for visitor messages
      if (msg.senderType === "VISITOR") {
        playNotificationSound(0.4);
        if (document.hidden) {
          startTitleFlash("New message!");
        }
      }
    };

    const onTypingStart = (data: { conversationId: string; senderType: string }) => {
      if (data.conversationId === selectedIdRef.current && data.senderType === "VISITOR") {
        setIsTyping(true);
      }
    };

    const onTypingStop = (data: { conversationId: string; senderType: string }) => {
      if (data.conversationId === selectedIdRef.current && data.senderType === "VISITOR") {
        setIsTyping(false);
      }
    };

    const onClose = (data: { conversationId: string }) => {
      if (data.conversationId === selectedIdRef.current) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === data.conversationId ? { ...c, status: "CLOSED" } : c
          )
        );
      }
    };

    const onVisitorStatus = (data: { visitorId: string; online: boolean }) => {
      setOnlineVisitors((prev) => {
        const next = new Set(prev);
        if (data.online) {
          next.add(data.visitorId);
        } else {
          next.delete(data.visitorId);
        }
        return next;
      });
    };

    s.on(CHAT_EVENTS.NEW_CONVERSATION, onNewConversation);
    s.on(CHAT_EVENTS.CONVERSATION_UPDATED, onConversationUpdated);
    s.on(CHAT_EVENTS.NEW_MESSAGE, onNewMessage);
    s.on(CHAT_EVENTS.TYPING_START, onTypingStart);
    s.on(CHAT_EVENTS.TYPING_STOP, onTypingStop);
    s.on(CHAT_EVENTS.CLOSE_CONVERSATION, onClose);
    s.on(CHAT_EVENTS.VISITOR_STATUS, onVisitorStatus);

    return () => {
      s.off("connect", registerAgent);
      s.off(CHAT_EVENTS.NEW_CONVERSATION, onNewConversation);
      s.off(CHAT_EVENTS.CONVERSATION_UPDATED, onConversationUpdated);
      s.off(CHAT_EVENTS.NEW_MESSAGE, onNewMessage);
      s.off(CHAT_EVENTS.TYPING_START, onTypingStart);
      s.off(CHAT_EVENTS.TYPING_STOP, onTypingStop);
      s.off(CHAT_EVENTS.CLOSE_CONVERSATION, onClose);
      s.off(CHAT_EVENTS.VISITOR_STATUS, onVisitorStatus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-register agent when session becomes available ────
  useEffect(() => {
    if (socket?.connected && session?.user) {
      socket.emit(CHAT_EVENTS.AGENT_ONLINE, {
        agentId: session.user.id,
        agentName: session.user.name || session.user.email || "Agent",
      });
    }
  }, [socket, session]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter.status) params.set("status", filter.status);
    if (filter.locale) params.set("locale", filter.locale);
    if (filter.search) params.set("search", filter.search);

    const res = await fetch(`/api/chat/conversations?${params}`);
    if (res.ok) {
      const data = await res.json();
      setConversations(data);

      // Query online status for all visitors
      const s = socket;
      if (s?.connected) {
        const visitorIds = [...new Set(data.map((c: { visitorId: string }) => c.visitorId))];
        visitorIds.forEach((vid) => {
          s.emit(CHAT_EVENTS.VISITOR_STATUS, { visitorId: vid as string }, (statusRes: { online: boolean }) => {
            if (statusRes.online) {
              setOnlineVisitors((prev) => {
                const next = new Set(prev);
                next.add(vid as string);
                return next;
              });
            }
          });
        });
      }
    }
  }, [filter, socket]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Select conversation
  const selectConversation = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setIsTyping(false);

      // Join room
      if (socket) {
        const prevId = selectedIdRef.current;
        if (prevId) {
          socket.emit(CHAT_EVENTS.LEAVE_ROOM, { conversationId: prevId });
        }
        socket.emit(CHAT_EVENTS.JOIN_ROOM, { conversationId: id });
      }

      // Load messages
      const res = await fetch(`/api/chat/conversations/${id}/messages`);
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
      }

      // Mark as read
      if (socket) {
        socket.emit(CHAT_EVENTS.MESSAGES_READ, {
          conversationId: id,
          readerType: "AGENT",
        });
      }

      // Clear unread count
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, _count: { messages: 0 } } : c))
      );

      // Query visitor online status
      const conv = conversations.find((c) => c.id === id);
      if (conv && socket) {
        socket.emit(CHAT_EVENTS.VISITOR_STATUS, { visitorId: conv.visitorId }, (res: { online: boolean }) => {
          setOnlineVisitors((prev) => {
            const next = new Set(prev);
            if (res.online) next.add(conv.visitorId);
            else next.delete(conv.visitorId);
            return next;
          });
        });
      }
    },
    [socket, conversations]
  );

  // Send message
  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !selectedIdRef.current || !sessionRef.current?.user) return;

      socket.emit(CHAT_EVENTS.SEND_MESSAGE, {
        conversationId: selectedIdRef.current,
        senderType: "AGENT",
        senderId: sessionRef.current.user.id,
        senderName: sessionRef.current.user.name || "Agent",
        messageType: "TEXT",
        content,
      });
    },
    [socket]
  );

  // Assign self
  const assignSelf = useCallback(async () => {
    if (!socket || !selectedIdRef.current || !sessionRef.current?.user) return;
    socket.emit(CHAT_EVENTS.ASSIGN_AGENT, {
      conversationId: selectedIdRef.current,
      agentId: sessionRef.current.user.id,
      agentName: sessionRef.current.user.name || "Agent",
    });
    loadConversations();
  }, [socket, loadConversations]);

  // Close conversation
  const closeConversation = useCallback(async () => {
    if (!socket || !selectedIdRef.current) return;
    socket.emit(CHAT_EVENTS.CLOSE_CONVERSATION, {
      conversationId: selectedIdRef.current,
      agentName: sessionRef.current?.user?.name || "Agent",
    });
    loadConversations();
  }, [socket, loadConversations]);

  // Reopen conversation
  const reopenConversation = useCallback(async () => {
    const convId = selectedIdRef.current;
    if (!convId) return;
    await fetch(`/api/chat/conversations/${convId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, status: "ACTIVE", closedAt: null } : c))
    );
  }, []);

  // Update notes
  const updateNotes = useCallback(
    async (notes: string) => {
      const convId = selectedIdRef.current;
      if (!convId) return;
      await fetch(`/api/chat/conversations/${convId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, notes } : c))
      );
    },
    []
  );

  // Update tags
  const updateTags = useCallback(
    async (tags: string) => {
      const convId = selectedIdRef.current;
      if (!convId) return;
      await fetch(`/api/chat/conversations/${convId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, tags } : c))
      );
    },
    []
  );

  // Stop title flash when window gains focus
  useEffect(() => {
    const handler = () => {
      if (!document.hidden) {
        stopTitleFlash();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Handle typing
  const handleTyping = useCallback(
    (typing: boolean) => {
      if (!socket || !selectedIdRef.current) return;
      socket.emit(
        typing ? CHAT_EVENTS.TYPING_START : CHAT_EVENTS.TYPING_STOP,
        { conversationId: selectedIdRef.current, senderType: "AGENT" }
      );
    },
    [socket]
  );

  return (
    <div className="-mx-6 -mt-8 flex h-[calc(100vh-64px)]">
      {/* Left: Conversation List */}
      <div className="w-80 shrink-0 border-r border-gray-200 bg-white">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          filter={filter}
          onFilterChange={setFilter}
          onSelect={selectConversation}
          onlineVisitors={onlineVisitors}
        />
      </div>

      {/* Center: Messages */}
      <div className="flex flex-1 flex-col">
        {selectedConversation ? (
          <MessageArea
            conversation={selectedConversation}
            messages={messages}
            isTyping={isTyping}
            isVisitorOnline={onlineVisitors.has(selectedConversation.visitorId)}
            onSend={sendMessage}
            onTyping={handleTyping}
            onAssign={assignSelf}
            onClose={closeConversation}
            onReopen={reopenConversation}
            socket={socket}
            session={session}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            <div className="text-center">
              <svg
                className="mx-auto mb-3 h-16 w-16 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Customer Info */}
      {selectedConversation && (
        <div className="w-72 shrink-0 border-l border-gray-200 bg-white">
          <CustomerInfo
            key={selectedConversation.id}
            conversation={selectedConversation}
            isVisitorOnline={onlineVisitors.has(selectedConversation.visitorId)}
            onUpdateNotes={updateNotes}
            onUpdateTags={updateTags}
          />
        </div>
      )}
    </div>
  );
}
