"use client";

import { useEffect } from "react";

export default function PortalDebugProbe() {
  useEffect(() => {
    const runId = "pre-fix";

    const nextJsPortal = document.querySelector("nextjs-portal");
    const nextJsPortalRect = nextJsPortal?.getBoundingClientRect();

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/044ff711-7294-4ea7-9de0-90b09ddca5a3", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, hypothesisId: "H1", location: "PortalDebugProbe.tsx:14", message: "Portal probe mounted", data: { pathname: window.location.pathname, isDev: process.env.NODE_ENV !== "production" }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/044ff711-7294-4ea7-9de0-90b09ddca5a3", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, hypothesisId: "H2", location: "PortalDebugProbe.tsx:18", message: "nextjs-portal runtime snapshot", data: { exists: Boolean(nextJsPortal), childElementCount: nextJsPortal?.childElementCount ?? 0, width: nextJsPortalRect?.width ?? null, height: nextJsPortalRect?.height ?? null, top: nextJsPortalRect?.top ?? null, left: nextJsPortalRect?.left ?? null }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion

    const firstPortalLike = document.querySelector(
      "[id*='portal'], [class*='portal'], nextjs-portal",
    );

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/044ff711-7294-4ea7-9de0-90b09ddca5a3", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, hypothesisId: "H3", location: "PortalDebugProbe.tsx:27", message: "Potential selector collision snapshot", data: { firstPortalLikeTag: firstPortalLike?.tagName ?? null, firstPortalLikeId: (firstPortalLike as HTMLElement | null)?.id ?? null, firstPortalLikeClass: (firstPortalLike as HTMLElement | null)?.className ?? null }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion

    const dialogs = document.querySelectorAll("dialog, [role='dialog']");

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/044ff711-7294-4ea7-9de0-90b09ddca5a3", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, hypothesisId: "H4", location: "PortalDebugProbe.tsx:34", message: "Dialog/modal snapshot", data: { dialogCount: dialogs.length }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const addedNextJsPortal = Array.from(mutation.addedNodes).find(
          (node) => node instanceof HTMLElement && node.tagName === "NEXTJS-PORTAL",
        ) as HTMLElement | undefined;
        const removedNextJsPortal = Array.from(mutation.removedNodes).find(
          (node) => node instanceof HTMLElement && node.tagName === "NEXTJS-PORTAL",
        ) as HTMLElement | undefined;

        if (addedNextJsPortal) {
          const rect = addedNextJsPortal.getBoundingClientRect();
          // #region agent log
          fetch("http://127.0.0.1:7242/ingest/044ff711-7294-4ea7-9de0-90b09ddca5a3", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, hypothesisId: "H5", location: "PortalDebugProbe.tsx:49", message: "nextjs-portal added via mutation", data: { width: rect.width, height: rect.height, top: rect.top, left: rect.left, childElementCount: addedNextJsPortal.childElementCount }, timestamp: Date.now() }) }).catch(() => {});
          // #endregion
        }

        if (removedNextJsPortal) {
          // #region agent log
          fetch("http://127.0.0.1:7242/ingest/044ff711-7294-4ea7-9de0-90b09ddca5a3", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, hypothesisId: "H5", location: "PortalDebugProbe.tsx:56", message: "nextjs-portal removed via mutation", data: {}, timestamp: Date.now() }) }).catch(() => {});
          // #endregion
        }
      }
    });

    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/044ff711-7294-4ea7-9de0-90b09ddca5a3", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, hypothesisId: "H5", location: "PortalDebugProbe.tsx:69", message: "Mutation observer active", data: { readyState: document.readyState }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion

    const onError = (event: ErrorEvent) => {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/044ff711-7294-4ea7-9de0-90b09ddca5a3", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, hypothesisId: "H6", location: "PortalDebugProbe.tsx:75", message: "window error event", data: { message: event.message, filename: event.filename }, timestamp: Date.now() }) }).catch(() => {});
      // #endregion
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/044ff711-7294-4ea7-9de0-90b09ddca5a3", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, hypothesisId: "H6", location: "PortalDebugProbe.tsx:82", message: "window unhandledrejection event", data: { reasonType: typeof event.reason }, timestamp: Date.now() }) }).catch(() => {});
      // #endregion
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      mutationObserver.disconnect();
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
