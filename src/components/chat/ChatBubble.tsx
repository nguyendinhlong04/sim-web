"use client";

import { useMemo } from "react";
import { FileText, Download } from "lucide-react";

interface ChatBubbleProps {
  senderType: string;
  messageType: string;
  content: string;
  metadata?: string | null;
  senderName?: string | null;
  createdAt: string;
  isRead?: boolean;
  locale?: string;
}

export default function ChatBubble({
  senderType,
  messageType,
  content,
  metadata,
  senderName,
  createdAt,
  isRead,
  locale,
}: ChatBubbleProps) {
  const isVisitor = senderType === "VISITOR";
  const isSystem = senderType === "SYSTEM" || messageType === "SYSTEM";

  const viewDetailText: Record<string, string> = {
    vi: "Xem chi tiết",
    en: "View details",
    ja: "詳細を見る",
    th: "ดูรายละเอียด",
    fil: "Tingnan ang detalye",
    hi: "विवरण देखें",
    my: "အသေးစိတ်ကြည့်ရန်",
    id: "Lihat detail",
  };

  const time = useMemo(() => {
    const d = new Date(createdAt);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [createdAt]);

  // System messages
  if (isSystem) {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
          {content}
        </span>
      </div>
    );
  }

  // Product card message
  if (messageType === "PRODUCT" && metadata) {
    try {
      const product = JSON.parse(metadata);
      return (
        <div className={`my-1 flex ${isVisitor ? "justify-end" : "justify-start"}`}>
          <div className="max-w-[280px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {product.productImage && (
              <img
                src={product.productImage}
                alt={product.productName}
                className="h-32 w-full object-cover"
              />
            )}
            <div className="p-3">
              <p className="text-sm font-semibold text-gray-900">{product.productName}</p>
              <p className="text-xs text-gray-500">{product.productGroup}</p>
              <div className="mt-1 flex items-center gap-2">
                {product.productPromoPrice ? (
                  <>
                    <span className="text-sm font-bold text-red-600">
                      ¥{product.productPromoPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      ¥{product.productPrice.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-blue-600">
                    ¥{product.productPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <a
                href={`/${locale || "vi"}/sim-the/${product.productSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block rounded bg-blue-600 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-blue-700"
              >
                {viewDetailText[locale || "vi"] || viewDetailText.en}
              </a>
            </div>
            <div className="px-3 pb-2 text-right text-[10px] text-gray-400">{time}</div>
          </div>
        </div>
      );
    } catch {
      // fall through to text render
    }
  }

  // Image message
  if (messageType === "IMAGE" && metadata) {
    try {
      const data = JSON.parse(metadata);
      return (
        <div className={`my-1 flex ${isVisitor ? "justify-end" : "justify-start"}`}>
          <div className="max-w-[280px]">
            {!isVisitor && senderName && (
              <p className="mb-0.5 text-[10px] font-semibold text-blue-600">{senderName}</p>
            )}
            <a href={data.url} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={data.url}
                alt={data.fileName || "Image"}
                className="max-h-60 rounded-lg object-cover shadow-sm"
                loading="lazy"
              />
            </a>
            {content && content !== data.fileName && (
              <p className={`mt-1 whitespace-pre-wrap text-sm ${isVisitor ? "text-gray-700" : "text-gray-700"}`}>
                {content}
              </p>
            )}
            <div className={`mt-0.5 text-right text-[10px] text-gray-400`}>
              <span>{time}</span>
              {isVisitor && isRead && (
                <svg className="ml-1 inline h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 2.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z" />
                  <path d="M15.354 4.354a.5.5 0 0 0-.708-.708L8 10.293l-.708-.708a.5.5 0 1 0-.708.708l1.062 1.061a.5.5 0 0 0 .708 0l7-7z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      );
    } catch {
      // fall through
    }
  }

  // File (PDF) message
  if (messageType === "FILE" && metadata) {
    try {
      const data = JSON.parse(metadata);
      return (
        <div className={`my-1 flex ${isVisitor ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[280px] rounded-2xl px-3.5 py-2.5 ${
              isVisitor
                ? "rounded-br-md bg-blue-600 text-white"
                : "rounded-bl-md bg-gray-100 text-gray-900"
            }`}
          >
            {!isVisitor && senderName && (
              <p className="mb-1 text-[10px] font-semibold text-blue-600">{senderName}</p>
            )}
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                isVisitor
                  ? "border-blue-400 bg-blue-500 hover:bg-blue-400"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <FileText size={24} className={isVisitor ? "text-white" : "text-red-500"} />
              <div className="flex-1 truncate">
                <p className={`truncate text-sm font-medium ${isVisitor ? "text-white" : "text-gray-700"}`}>
                  {data.fileName || "Document"}
                </p>
                {data.fileSize && (
                  <p className={`text-xs ${isVisitor ? "text-blue-200" : "text-gray-400"}`}>
                    {(data.fileSize / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
              <Download size={16} className={isVisitor ? "text-white" : "text-gray-400"} />
            </a>
            {content && content !== data.fileName && (
              <p className="mt-1 whitespace-pre-wrap text-sm">{content}</p>
            )}
            <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${isVisitor ? "text-blue-200" : "text-gray-400"}`}>
              <span>{time}</span>
              {isVisitor && isRead && (
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 2.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z" />
                  <path d="M15.354 4.354a.5.5 0 0 0-.708-.708L8 10.293l-.708-.708a.5.5 0 1 0-.708.708l1.062 1.061a.5.5 0 0 0 .708 0l7-7z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      );
    } catch {
      // fall through
    }
  }

  // Default text message
  return (
    <div className={`my-1 flex ${isVisitor ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
          isVisitor
            ? "rounded-br-md bg-blue-600 text-white"
            : "rounded-bl-md bg-gray-100 text-gray-900"
        }`}
      >
        {!isVisitor && senderName && (
          <p className="mb-0.5 text-[10px] font-semibold text-blue-600">{senderName}</p>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${isVisitor ? "text-blue-200" : "text-gray-400"}`}>
          <span>{time}</span>
          {isVisitor && isRead && (
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.354 4.354a.5.5 0 0 0-.708-.708L5 10.293 2.354 7.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z" />
              <path d="M15.354 4.354a.5.5 0 0 0-.708-.708L8 10.293l-.708-.708a.5.5 0 1 0-.708.708l1.062 1.061a.5.5 0 0 0 .708 0l7-7z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
