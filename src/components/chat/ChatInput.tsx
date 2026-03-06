"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, X, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onSendFile?: (file: File) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  showAttachment?: boolean;
}

export default function ChatInput({
  onSend,
  onSendFile,
  onTyping,
  placeholder = "Type a message...",
  disabled = false,
  showAttachment = true,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const typingRef = useRef(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (uploading) return;

    // If there's a pending file, send it
    if (pendingFile && onSendFile) {
      setUploading(true);
      onSendFile(pendingFile);
      clearPendingFile();
      setUploading(false);
      return;
    }

    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage("");
    if (onTyping && typingRef.current) {
      typingRef.current = false;
      onTyping(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (value: string) => {
    setMessage(value);
    if (onTyping) {
      if (!typingRef.current && value.length > 0) {
        typingRef.current = true;
        onTyping(true);
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (typingRef.current) {
          typingRef.current = false;
          onTyping(false);
        }
      }, 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      alert("Only images (JPG, PNG, GIF, WebP) and PDF files are allowed.");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be under 10MB.");
      return;
    }

    setPendingFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Reset file input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearPendingFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* File preview */}
      {pendingFile && (
        <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
          {previewUrl ? (
            <img src={previewUrl} alt="preview" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-red-50">
              <span className="text-xs font-bold text-red-500">PDF</span>
            </div>
          )}
          <div className="flex-1 truncate">
            <p className="truncate text-sm text-gray-700">{pendingFile.name}</p>
            <p className="text-xs text-gray-400">{(pendingFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            onClick={clearPendingFile}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 p-3">
        {/* Attachment button */}
        {showAttachment && onSendFile && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
          </>
        )}

        <textarea
          value={message}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={pendingFile ? "Add a caption (optional)..." : placeholder}
          disabled={disabled || uploading}
          rows={1}
          className="max-h-24 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:bg-white disabled:opacity-50"
          style={{ minHeight: "38px" }}
        />
        <button
          onClick={handleSend}
          disabled={(!message.trim() && !pendingFile) || disabled || uploading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
