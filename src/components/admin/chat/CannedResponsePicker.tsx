"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface CannedResponse {
  id: string;
  shortcut: string;
  locale: string;
  title: string;
  content: string;
  category?: string | null;
}

interface Props {
  locale: string;
  onSelect: (content: string) => void;
  onClose: () => void;
}

export default function CannedResponsePicker({ locale, onSelect, onClose }: Props) {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat/canned-responses?locale=${locale}`);
        if (res.ok) {
          const data = await res.json();
          setResponses(data);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    };
    load();
  }, [locale]);

  const filtered = responses.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.shortcut.toLowerCase().includes(s) ||
      r.title.toLowerCase().includes(s) ||
      r.content.toLowerCase().includes(s)
    );
  });

  // Group by category
  const grouped = filtered.reduce(
    (acc, r) => {
      const cat = r.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(r);
      return acc;
    },
    {} as Record<string, CannedResponse[]>
  );

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="text-xs font-semibold text-gray-700">Quick Replies</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      </div>
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search responses..."
            className="w-full rounded border border-gray-200 py-1.5 pl-7 pr-2 text-xs outline-none focus:border-blue-400"
          />
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="py-4 text-center text-xs text-gray-400">Loading...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="py-4 text-center text-xs text-gray-400">
            No canned responses found.
            <br />
            Add them in Chat Settings.
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase text-gray-400">
                {category}
              </p>
              {items.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelect(r.content)}
                  className="w-full rounded-lg p-2 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
                      {r.shortcut}
                    </span>
                    <span className="text-xs font-medium text-gray-900">{r.title}</span>
                  </div>
                  <p className="mt-0.5 truncate pl-12 text-[11px] text-gray-500">
                    {r.content}
                  </p>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
