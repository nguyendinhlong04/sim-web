"use client";

import { useEffect, useRef, useState } from "react";
import { UserPlus, X, Package, Slash, Paperclip, RotateCcw } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import ProductPicker from "./ProductPicker";
import CannedResponsePicker from "./CannedResponsePicker";
import { CHAT_EVENTS } from "@/lib/chat-events";
import { Socket } from "socket.io-client";
import type { Session } from "next-auth";

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

interface Conversation {
  id: string;
  visitorLocale: string;
  visitorName?: string | null;
  status: string;
  assignedTo?: string | null;
  agent?: { id: string; name: string } | null;
}

interface Props {
  conversation: Conversation;
  messages: Message[];
  isTyping: boolean;
  isVisitorOnline: boolean;
  onSend: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  onAssign: () => void;
  onClose: () => void;
  onReopen: () => void;
  socket: Socket | null;
  session: Session | null;
}

const LOCALE_FLAGS: Record<string, string> = {
  vi: "🇻🇳", en: "🇺🇸", ja: "🇯🇵", th: "🇹🇭",
  fil: "🇵🇭", hi: "🇮🇳", my: "🇲🇲", id: "🇮🇩",
};

export default function MessageArea({
  conversation,
  messages,
  isTyping,
  isVisitorOnline,
  onSend,
  onTyping,
  onAssign,
  onClose,
  onReopen,
  socket,
  session,
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showCannedPicker, setShowCannedPicker] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleProductSelect = (product: {
    id: string;
    slug: string;
    group: string;
    price: number;
    promoPrice?: number | null;
    translations: { locale: string; name: string }[];
    media: { url: string; type: string }[];
  }) => {
    if (!socket) return;

    const translation = product.translations.find(
      (t) => t.locale === conversation.visitorLocale
    ) || product.translations[0];

    const image = product.media.find((m) => m.type === "IMAGE");

    socket.emit(CHAT_EVENTS.SHARE_PRODUCT, {
      conversationId: conversation.id,
      productId: product.id,
      productName: translation?.name || "Product",
      productPrice: product.price,
      productPromoPrice: product.promoPrice,
      productImage: image?.url,
      productSlug: product.slug,
      productGroup: product.group,
      locale: conversation.visitorLocale,
    });

    setShowProductPicker(false);
  };

  const handleCannedSelect = (content: string) => {
    onSend(content);
    setShowCannedPicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !session?.user) return;

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      alert("Only images (JPG, PNG, GIF, WebP) and PDF files are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be under 10MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();

      const isImage = file.type.startsWith("image/");
      socket.emit(CHAT_EVENTS.SEND_MESSAGE, {
        conversationId: conversation.id,
        senderType: "AGENT",
        senderId: session.user.id,
        senderName: session.user.name || "Agent",
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
      alert("Failed to upload file.");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isClosed = conversation.status === "CLOSED";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">
            {LOCALE_FLAGS[conversation.visitorLocale] || "🌐"}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">
                {conversation.visitorName || "Visitor"}
              </p>
              {isVisitorOnline ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  Offline
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400">
              Language: {conversation.visitorLocale.toUpperCase()}
              {conversation.agent && ` • Agent: ${conversation.agent.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!conversation.assignedTo && !isClosed && (
            <button
              onClick={onAssign}
              className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
            >
              <UserPlus size={14} />
              Assign to me
            </button>
          )}
          {!isClosed && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              <X size={14} />
              Close
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-3">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            senderType={msg.senderType === "AGENT" ? "VISITOR" : msg.senderType === "VISITOR" ? "AGENT" : msg.senderType}
            messageType={msg.messageType}
            content={msg.content}
            metadata={msg.metadata}
            senderName={msg.senderName}
            createdAt={msg.createdAt}
            isRead={msg.isRead}
            locale={conversation.visitorLocale}
          />
        ))}
        {isTyping && (
          <div className="my-1 flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-gray-200 px-4 py-2">
              <div className="flex gap-1">
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Toolbar + Input */}
      {!isClosed && (
        <div>
          {/* Toolbar */}
          <div className="flex items-center gap-1 border-t border-gray-200 bg-white px-3 py-1.5">
            <button
              onClick={() => setShowProductPicker(!showProductPicker)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Send product"
            >
              <Package size={16} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Attach file (image, PDF)"
            >
              <Paperclip size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => setShowCannedPicker(!showCannedPicker)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Canned responses (type /)"
            >
              <Slash size={16} />
            </button>
          </div>

          {/* Product Picker */}
          {showProductPicker && (
            <ProductPicker
              locale={conversation.visitorLocale}
              onSelect={handleProductSelect}
              onClose={() => setShowProductPicker(false)}
            />
          )}

          {/* Canned Response Picker */}
          {showCannedPicker && (
            <CannedResponsePicker
              locale={conversation.visitorLocale}
              onSelect={handleCannedSelect}
              onClose={() => setShowCannedPicker(false)}
            />
          )}

          <ChatInput
            onSend={onSend}
            onTyping={onTyping}
            placeholder="Type a message... (/ for canned responses)"
            showAttachment={false}
          />
        </div>
      )}

      {isClosed && (
        <div className="flex items-center justify-center gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-xs text-gray-400">This conversation is closed ✓</span>
          <button
            onClick={onReopen}
            className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
          >
            <RotateCcw size={14} />
            Reopen
          </button>
        </div>
      )}
    </div>
  );
}
