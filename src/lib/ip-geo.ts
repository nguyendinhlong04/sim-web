/**
 * IP Geolocation helper using ip-api.com
 * Free tier: 45 requests/minute, non-commercial use
 */

export async function lookupGeo(
  ip: string
): Promise<{ country?: string; city?: string }> {
  if (
    !ip ||
    ip === "0.0.0.0" ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    return {};
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city`
    );
    const data = await res.json();
    if (data.status === "success") {
      return { country: data.country, city: data.city };
    }
  } catch {
    // Silently fail – geolocation is non-critical
  }

  return {};
}

/**
 * Extract client IP from Socket.io handshake
 */
export function getSocketIp(socket: {
  handshake: {
    headers: Record<string, string | string[] | undefined>;
    address: string;
  };
}): string {
  const forwarded = socket.handshake.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }

  const realIp = socket.handshake.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return socket.handshake.address || "0.0.0.0";
}
