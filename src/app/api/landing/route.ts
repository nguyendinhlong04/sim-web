import { NextRequest, NextResponse } from "next/server";
import { getLandingData } from "@/lib/landing-cache";

/**
 * GET /api/landing?locale=vi
 * Public endpoint — returns cached landing page data for the given locale.
 */
export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") ?? "vi";

  try {
    const data = await getLandingData(locale);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load landing data" }, { status: 500 });
  }
}
