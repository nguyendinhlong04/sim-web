import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, parseUserAgent } from "@/lib/visitor-tracking";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const ip = getClientIp(request.headers);
  const { deviceType, browser, os } = parseUserAgent(
    request.headers.get("user-agent")
  );
  let geo = { country: body.country, city: body.city, isp: body.isp };

  if (!geo.country && ip && ip !== "0.0.0.0") {
    try {
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,country,city,isp`
      );
      const data = await response.json();
      if (data.status === "success") {
        geo = {
          country: data.country,
          city: data.city,
          isp: data.isp,
        };
      }
    } catch {
      geo = { country: null, city: null, isp: null };
    }
  }

  try {
    await prisma.visitor.create({
      data: {
        ip,
        country: geo.country ?? null,
        city: geo.city ?? null,
        isp: geo.isp ?? null,
        deviceType,
        browser,
        os,
        connectionType: body.connectionType ?? null,
        referrer: request.headers.get("referer"),
        pageUrl: body.pageUrl ?? "unknown",
        locale: body.locale ?? null,
      },
    });
  } catch {
    return NextResponse.json({ status: "skipped" });
  }

  return NextResponse.json({ status: "ok" });
}
