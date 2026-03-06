import { prisma } from "@/lib/prisma";
import type { SiteConfig } from "@prisma/client";

let cachedConfig: SiteConfig | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Returns the site configuration, creating a default row if none exists.
 * Uses a simple in-memory cache with 1-minute TTL.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  const config = await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  cachedConfig = config;
  cacheTime = now;
  return config;
}

/**
 * Invalidate the in-memory cache so the next call to getSiteConfig()
 * will re-read from the database.
 */
export function invalidateSiteConfigCache() {
  cachedConfig = null;
  cacheTime = 0;
}
