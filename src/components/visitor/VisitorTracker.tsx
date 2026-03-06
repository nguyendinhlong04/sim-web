"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export default function VisitorTracker() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    const connection =
      typeof navigator !== "undefined" &&
      "connection" in navigator &&
      (navigator as Navigator & { connection?: { effectiveType?: string } })
        .connection?.effectiveType;

    void fetch("/api/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageUrl: window.location.href,
        locale,
        connectionType: connection ?? null,
      }),
    });
  }, [pathname, locale]);

  return null;
}
