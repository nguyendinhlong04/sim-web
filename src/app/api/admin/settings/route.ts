import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { invalidateSiteConfigCache } from "@/lib/site-config";

const MASKED = "****";

const settingsSchema = z.object({
  companyName: z.string().max(200).optional(),
  companyDesc: z.string().max(2000).optional(),
  companyAddress: z.string().max(500).optional(),
  companyPhone: z.string().max(50).optional(),
  companyEmail: z.string().max(200).optional(),
  logoUrl: z.string().max(1000).optional(),
  gcsProjectId: z.string().max(200).optional(),
  gcsBucketName: z.string().max(200).optional(),
  gcsClientEmail: z.string().max(500).optional(),
  gcsPrivateKey: z.string().optional(),
});

async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  return !!token;
}

export async function GET(request: NextRequest) {
  const adminCheck = await isAdmin(request);

  if (!adminCheck) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await prisma.siteConfig.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });

    return NextResponse.json({
      ...config,
      // Mask sensitive field
      gcsPrivateKey: config.gcsPrivateKey ? MASKED : "",
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Handle JSON key file paste in gcsPrivateKey
  if (data.gcsPrivateKey && data.gcsPrivateKey.trim().startsWith("{")) {
    try {
      const jsonKey = JSON.parse(data.gcsPrivateKey);
      if (jsonKey.private_key) {
        data.gcsPrivateKey = jsonKey.private_key;
      }
      if (jsonKey.client_email) {
        data.gcsClientEmail = jsonKey.client_email;
      }
      if (jsonKey.project_id) {
        data.gcsProjectId = jsonKey.project_id;
      }
    } catch (e) {
      // Ignore parse error, treat as raw key
    }
  }

  // If the private key is still masked, do not overwrite it
  if (data.gcsPrivateKey === MASKED) {
    delete data.gcsPrivateKey;
  }

  // Remove undefined values so Prisma only updates provided fields
  const updateData: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateData[key] = value;
    }
  }

  const config = await prisma.siteConfig.upsert({
    where: { id: "default" },
    update: updateData,
    create: { id: "default", ...updateData },
  });

  // Invalidate cached config so changes take effect immediately
  invalidateSiteConfigCache();

  return NextResponse.json({
    ...config,
    gcsPrivateKey: config.gcsPrivateKey ? MASKED : "",
  });
}
