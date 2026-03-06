import { NextRequest, NextResponse } from "next/server";
import { getGcsBucket } from "@/lib/gcs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { bucket, bucketName } = await getGcsBucket();

  if (!bucket) {
    return NextResponse.json({ error: "GCS not configured" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `uploads/${Date.now()}-${file.name}`;
  const blob = bucket.file(fileName);

  try {
    await blob.save(buffer, {
      contentType: file.type,
      resumable: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("denied") || message.includes("Permission")) {
      return NextResponse.json({ error: "GCS permission denied. Check service account roles." }, { status: 403 });
    }
    return NextResponse.json({ error: "Upload failed: " + message.slice(0, 200) }, { status: 500 });
  }

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
  return NextResponse.json({ url: publicUrl });
}
