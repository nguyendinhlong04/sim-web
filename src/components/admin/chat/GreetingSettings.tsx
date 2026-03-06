"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

const LOCALES = [
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳", defaultGreeting: "Xin chào! Chúng tôi có thể giúp gì cho bạn?" },
  { code: "en", name: "English", flag: "🇺🇸", defaultGreeting: "Hello! How can we help you today?" },
  { code: "ja", name: "日本語", flag: "🇯🇵", defaultGreeting: "こんにちは！何かお手伝いできることはありますか？" },
  { code: "th", name: "ไทย", flag: "🇹🇭", defaultGreeting: "สวัสดีค่ะ! มีอะไรให้ช่วยไหมคะ?" },
  { code: "fil", name: "Filipino", flag: "🇵🇭", defaultGreeting: "Kumusta! Paano ka namin matutulungan?" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳", defaultGreeting: "नमस्ते! हम आपकी कैसे मदद कर सकते हैं?" },
  { code: "my", name: "မြန်မာ", flag: "🇲🇲", defaultGreeting: "မင်္ဂလာပါ! ဘာကူညီပေးရမလဲ?" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩", defaultGreeting: "Halo! Ada yang bisa kami bantu?" },
];

interface Greeting {
  id?: string;
  locale: string;
  greeting: string;
  isActive: boolean;
}

export default function GreetingSettings() {
  const [greetings, setGreetings] = useState<Greeting[]>(
    LOCALES.map((l) => ({
      locale: l.code,
      greeting: l.defaultGreeting,
      isActive: true,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/chat/greetings");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setGreetings((prev) =>
              prev.map((g) => {
                const existing = data.find((d: Greeting) => d.locale === g.locale);
                return existing ? { ...g, ...existing } : g;
              })
            );
          }
        }
      } catch {
        // use defaults
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/chat/greetings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ greetings }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
    }
    setSaving(false);
  };

  const updateGreeting = (locale: string, field: string, value: string | boolean) => {
    setGreetings((prev) =>
      prev.map((g) => (g.locale === locale ? { ...g, [field]: value } : g))
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-base font-semibold text-gray-900">Auto-Greetings</h2>
        <p className="text-xs text-gray-500">
          Configure the greeting message sent automatically when a visitor starts a chat in each language.
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {greetings.map((g) => {
          const localeInfo = LOCALES.find((l) => l.code === g.locale)!;
          return (
            <div key={g.locale} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{localeInfo.flag}</span>
                  <span className="text-sm font-medium text-gray-900">{localeInfo.name}</span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                    {g.locale}
                  </span>
                </div>
                <label className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Active</span>
                  <input
                    type="checkbox"
                    checked={g.isActive}
                    onChange={(e) => updateGreeting(g.locale, "isActive", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                </label>
              </div>
              <textarea
                value={g.greeting}
                onChange={(e) => updateGreeting(g.locale, "greeting", e.target.value)}
                rows={2}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-200 px-6 py-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? "Saved!" : "Save Greetings"}
        </button>
      </div>
    </div>
  );
}
