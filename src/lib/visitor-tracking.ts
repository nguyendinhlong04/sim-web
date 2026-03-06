import { UAParser } from "ua-parser-js";

export function parseUserAgent(userAgent: string | null) {
  const result = UAParser(userAgent ?? "");
  const deviceType = result.device?.type ?? "desktop";

  return {
    deviceType,
    browser: result.browser?.name ?? undefined,
    os: result.os?.name ?? undefined,
  };
}

export function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }

  return headers.get("x-real-ip") ?? "0.0.0.0";
}
