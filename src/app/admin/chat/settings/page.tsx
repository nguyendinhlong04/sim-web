"use client";

import { useState } from "react";
import GreetingSettings from "@/components/admin/chat/GreetingSettings";
import CannedResponseSettings from "@/components/admin/chat/CannedResponseSettings";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Tab = "greetings" | "canned";

export default function ChatSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("greetings");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/chat"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Chat Settings</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab("greetings")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "greetings"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Greetings
        </button>
        <button
          onClick={() => setActiveTab("canned")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "canned"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Canned Responses
        </button>
      </div>

      {/* Content */}
      {activeTab === "greetings" && <GreetingSettings />}
      {activeTab === "canned" && <CannedResponseSettings />}
    </div>
  );
}
