"use client";

import { useState } from "react";
import {
  Globe,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  Star,
  Tag,
  StickyNote,
  Link2,
} from "lucide-react";

const LOCALE_FLAGS: Record<string, string> = {
  vi: "🇻🇳", en: "🇺🇸", ja: "🇯🇵", th: "🇹🇭",
  fil: "🇵🇭", hi: "🇮🇳", my: "🇲🇲", id: "🇮🇩",
};

const LOCALE_NAMES: Record<string, string> = {
  vi: "Tiếng Việt", en: "English", ja: "日本語", th: "ไทย",
  fil: "Filipino", hi: "हिन्दी", my: "မြန်မာ", id: "Bahasa Indonesia",
};

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
  tags?: string | null;
  notes?: string | null;
  rating?: number | null;
  createdAt: string;
}

interface Props {
  conversation: Conversation;
  isVisitorOnline: boolean;
  onUpdateNotes: (notes: string) => void;
  onUpdateTags: (tags: string) => void;
}

function DeviceIcon({ device }: { device?: string | null }) {
  switch (device?.toLowerCase()) {
    case "mobile":
      return <Smartphone size={14} />;
    case "tablet":
      return <Tablet size={14} />;
    default:
      return <Monitor size={14} />;
  }
}

export default function CustomerInfo({
  conversation,
  isVisitorOnline,
  onUpdateNotes,
  onUpdateTags,
}: Props) {
  const [notes, setNotes] = useState(conversation.notes || "");
  const [tags, setTags] = useState(conversation.tags || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingTags, setEditingTags] = useState(false);

  const saveNotes = () => {
    onUpdateNotes(notes);
    setEditingNotes(false);
  };

  const saveTags = () => {
    onUpdateTags(tags);
    setEditingTags(false);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Customer Info</h3>
      </div>

      <div className="space-y-4 p-4">
        {/* Visitor Status */}
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isVisitorOnline ? "bg-green-50" : "bg-gray-50"}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${isVisitorOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
          <span className={`text-xs font-semibold ${isVisitorOnline ? "text-green-700" : "text-gray-500"}`}>
            {isVisitorOnline ? "Visitor is online" : "Visitor is offline"}
          </span>
        </div>

        {/* Identity */}
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">Identity</p>
          <div className="mt-1.5 space-y-1.5">
            <p className="text-sm font-medium text-gray-900">
              {conversation.visitorName || "Anonymous"}
            </p>
            {conversation.visitorEmail && (
              <p className="text-xs text-gray-500">{conversation.visitorEmail}</p>
            )}
            <p className="text-[10px] font-mono text-gray-400">
              ID: {conversation.visitorId.slice(0, 16)}...
            </p>
          </div>
        </div>

        {/* Language - Prominent */}
        <div className="rounded-lg bg-blue-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {LOCALE_FLAGS[conversation.visitorLocale] || "🌐"}
            </span>
            <div>
              <p className="text-sm font-semibold text-blue-900">
                {LOCALE_NAMES[conversation.visitorLocale] || conversation.visitorLocale}
              </p>
              <p className="text-[10px] text-blue-600">
                Locale: {conversation.visitorLocale}
              </p>
            </div>
          </div>
        </div>

        {/* Location */}
        {(conversation.visitorCountry || conversation.visitorCity) && (
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Location</p>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-700">
              <MapPin size={14} className="text-gray-400" />
              {[conversation.visitorCity, conversation.visitorCountry]
                .filter(Boolean)
                .join(", ")}
            </div>
          </div>
        )}

        {/* Device */}
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">Device</p>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <DeviceIcon device={conversation.visitorDevice} />
              <span className="capitalize">{conversation.visitorDevice || "Unknown"}</span>
            </div>
            {conversation.visitorBrowser && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Chrome size={14} className="text-gray-400" />
                {conversation.visitorBrowser}
              </div>
            )}
            {conversation.visitorOs && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Monitor size={14} className="text-gray-400" />
                {conversation.visitorOs}
              </div>
            )}
          </div>
        </div>

        {/* Page URL */}
        {conversation.pageUrl && (
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Page URL</p>
            <div className="mt-1 flex items-start gap-1.5">
              <Link2 size={14} className="mt-0.5 shrink-0 text-gray-400" />
              <a
                href={conversation.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-xs text-blue-600 hover:underline"
              >
                {conversation.pageUrl}
              </a>
            </div>
          </div>
        )}

        {/* Rating */}
        {conversation.rating && (
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Rating</p>
            <div className="mt-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i <= conversation.rating!
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-gray-400">Tags</p>
            <button
              onClick={() => setEditingTags(!editingTags)}
              className="text-[10px] text-blue-600 hover:underline"
            >
              {editingTags ? "Cancel" : "Edit"}
            </button>
          </div>
          {editingTags ? (
            <div className="mt-1">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="sim, billing, support..."
                className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400"
              />
              <button
                onClick={saveTags}
                className="mt-1 rounded bg-blue-600 px-2 py-1 text-[10px] text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="mt-1 flex flex-wrap gap-1">
              {tags ? (
                tags.split(",").map((tag, i) => (
                  <span
                    key={i}
                    className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                  >
                    {tag.trim()}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-gray-400">No tags</span>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase text-gray-400">Internal Notes</p>
            <button
              onClick={() => setEditingNotes(!editingNotes)}
              className="text-[10px] text-blue-600 hover:underline"
            >
              {editingNotes ? "Cancel" : "Edit"}
            </button>
          </div>
          {editingNotes ? (
            <div className="mt-1">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400"
                placeholder="Add internal notes..."
              />
              <button
                onClick={saveNotes}
                className="mt-1 rounded bg-blue-600 px-2 py-1 text-[10px] text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600">
              {notes || <span className="text-gray-400">No notes</span>}
            </p>
          )}
        </div>

        {/* Created */}
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">Started</p>
          <p className="mt-1 text-xs text-gray-600">
            {new Date(conversation.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
