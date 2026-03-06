"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Edit2, X } from "lucide-react";

const LOCALES = [
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "th", name: "ไทย", flag: "🇹🇭" },
  { code: "fil", name: "Filipino", flag: "🇵🇭" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "my", name: "မြန်မာ", flag: "🇲🇲" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
];

interface CannedResponse {
  id: string;
  shortcut: string;
  locale: string;
  title: string;
  content: string;
  category?: string | null;
}

interface FormData {
  shortcut: string;
  locale: string;
  title: string;
  content: string;
  category: string;
}

const emptyForm: FormData = {
  shortcut: "",
  locale: "vi",
  title: "",
  content: "",
  category: "",
};

export default function CannedResponseSettings() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterLocale, setFilterLocale] = useState("");

  const loadResponses = async () => {
    setLoading(true);
    try {
      const params = filterLocale ? `?locale=${filterLocale}` : "";
      const res = await fetch(`/api/chat/canned-responses${params}`);
      if (res.ok) {
        setResponses(await res.json());
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    loadResponses();
  }, [filterLocale]);

  const handleSave = async () => {
    if (!form.shortcut || !form.title || !form.content) return;
    setSaving(true);
    try {
      if (editingId) {
        await fetch(`/api/chat/canned-responses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/chat/canned-responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      await loadResponses();
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this canned response?")) return;
    await fetch(`/api/chat/canned-responses/${id}`, { method: "DELETE" });
    await loadResponses();
  };

  const handleEdit = (r: CannedResponse) => {
    setForm({
      shortcut: r.shortcut,
      locale: r.locale,
      title: r.title,
      content: r.content,
      category: r.category || "",
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Canned Responses</h2>
          <p className="text-xs text-gray-500">
            Quick reply templates. Type / in chat to search.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterLocale}
            onChange={(e) => setFilterLocale(e.target.value)}
            className="rounded border border-gray-200 px-2 py-1.5 text-xs outline-none"
          >
            <option value="">All languages</option>
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {editingId ? "Edit Response" : "New Response"}
            </h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-500">Shortcut</label>
              <input
                type="text"
                value={form.shortcut}
                onChange={(e) => setForm({ ...form, shortcut: e.target.value })}
                placeholder="/hello"
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-500">Language</label>
              <select
                value={form.locale}
                onChange={(e) => setForm({ ...form, locale: e.target.value })}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
              >
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-500">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Greeting"
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-500">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="General"
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[10px] font-medium text-gray-500">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={3}
                placeholder="The response message..."
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !form.shortcut || !form.title || !form.content}
            className="mt-3 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editingId ? "Update" : "Create"}
          </button>
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : responses.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            No canned responses yet. Click &ldquo;Add&rdquo; to create one.
          </div>
        ) : (
          responses.map((r) => {
            const localeInfo = LOCALES.find((l) => l.code === r.locale);
            return (
              <div key={r.id} className="flex items-start justify-between px-6 py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
                      {r.shortcut}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{r.title}</span>
                    <span className="text-xs">{localeInfo?.flag}</span>
                    {r.category && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">
                        {r.category}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{r.content}</p>
                </div>
                <div className="ml-4 flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(r)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
