"use client";

import { Search, Filter } from "lucide-react";

const LOCALE_FLAGS: Record<string, string> = {
  vi: "🇻🇳",
  en: "🇺🇸",
  ja: "🇯🇵",
  th: "🇹🇭",
  fil: "🇵🇭",
  hi: "🇮🇳",
  my: "🇲🇲",
  id: "🇮🇩",
};

const LOCALE_NAMES: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
  ja: "日本語",
  th: "ไทย",
  fil: "Filipino",
  hi: "हिन्दी",
  my: "မြန်မာ",
  id: "Bahasa",
};

const STATUS_COLORS: Record<string, string> = {
  WAITING: "bg-yellow-400",
  ACTIVE: "bg-green-400",
  CLOSED: "bg-gray-400",
};

interface Conversation {
  id: string;
  visitorId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorLocale: string;
  status: string;
  agent?: { id: string; name: string } | null;
  tags?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: { content: string; senderType: string; messageType: string }[];
  _count?: { messages: number };
}

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  filter: { status: string; locale: string; search: string };
  onFilterChange: (filter: { status: string; locale: string; search: string }) => void;
  onSelect: (id: string) => void;
  onlineVisitors: Set<string>;
}

export default function ConversationList({
  conversations,
  selectedId,
  filter,
  onFilterChange,
  onSelect,
  onlineVisitors,
}: Props) {
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Conversations</h2>
        {/* Search */}
        <div className="relative mt-2">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
            placeholder="Search..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-xs outline-none focus:border-blue-400"
          />
        </div>
        {/* Filters */}
        <div className="mt-2 flex gap-2">
          <select
            value={filter.status}
            onChange={(e) => onFilterChange({ ...filter, status: e.target.value })}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400"
          >
            <option value="">All status</option>
            <option value="WAITING">Waiting</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            value={filter.locale}
            onChange={(e) => onFilterChange({ ...filter, locale: e.target.value })}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400"
          >
            <option value="">All languages</option>
            {Object.entries(LOCALE_NAMES).map(([code, name]) => (
              <option key={code} value={code}>
                {LOCALE_FLAGS[code]} {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-gray-400">
            No conversations
          </div>
        ) : (
          conversations.map((conv) => {
            const lastMsg = conv.messages?.[0];
            const unread = conv._count?.messages || 0;
            const isSelected = conv.id === selectedId;
            const isOnline = onlineVisitors.has(conv.visitorId);

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                  isSelected ? "bg-blue-50 hover:bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {/* Status dot */}
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_COLORS[conv.status] || "bg-gray-400"}`}
                    />
                    {/* Flag */}
                    <span className="text-base" title={LOCALE_NAMES[conv.visitorLocale]}>
                      {LOCALE_FLAGS[conv.visitorLocale] || "🌐"}
                    </span>
                    {/* Name */}
                    <span className="text-sm font-medium text-gray-900">
                      {conv.visitorName || conv.visitorId.slice(0, 12)}
                    </span>
                    {/* Online indicator */}
                    {isOnline ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" title="Online" />
                    ) : (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-gray-300" title="Offline" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {formatTime(conv.updatedAt)}
                    </span>
                  </div>
                </div>
                {/* Locale label + Tags */}
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                    {conv.visitorLocale.toUpperCase()}
                  </span>
                  {conv.tags &&
                    conv.tags
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                      .map((tag, i) => (
                        <span
                          key={i}
                          className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600"
                        >
                          {tag}
                        </span>
                      ))}
                  {conv.agent && (
                    <span className="text-[10px] text-blue-500">
                      → {conv.agent.name}
                    </span>
                  )}
                </div>
                {/* Last message preview */}
                {lastMsg && (
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {lastMsg.senderType === "VISITOR" ? "" : "You: "}
                    {lastMsg.messageType === "PRODUCT"
                      ? "📦 Product shared"
                      : lastMsg.messageType === "IMAGE"
                        ? "🖼️ Image"
                        : lastMsg.messageType === "FILE"
                          ? "📎 File"
                          : lastMsg.content}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
