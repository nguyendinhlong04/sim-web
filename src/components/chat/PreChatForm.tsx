"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

interface PreChatFormProps {
  onSubmit: (data: { name?: string; email?: string }) => void;
  title?: string;
  nameLabel?: string;
  emailLabel?: string;
  startLabel?: string;
  skipLabel?: string;
}

export default function PreChatForm({
  onSubmit,
  title = "Start a conversation",
  nameLabel = "Your name (optional)",
  emailLabel = "Your email (optional)",
  startLabel = "Start chat",
  skipLabel = "Skip",
}: PreChatFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
        <MessageCircle className="h-7 w-7 text-blue-600" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mb-5 text-center text-xs text-gray-500">
        Fill in your details or skip to start chatting right away.
      </p>
      <div className="w-full max-w-xs space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={nameLabel}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailLabel}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
        <button
          onClick={() => onSubmit({ name: name || undefined, email: email || undefined })}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {startLabel}
        </button>
        <button
          onClick={() => onSubmit({})}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
        >
          {skipLabel}
        </button>
      </div>
    </div>
  );
}
