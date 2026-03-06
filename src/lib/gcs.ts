import { Storage, type Bucket } from "@google-cloud/storage";
import { getSiteConfig } from "@/lib/site-config";

// ---------------------------------------------------------------------------
// Static GCS client (from environment variables -- used as fallback)
// ---------------------------------------------------------------------------
const envProjectId = process.env.GCS_PROJECT_ID;
const envClientEmail = process.env.GCS_CLIENT_EMAIL;
const envPrivateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const storage = new Storage({
  projectId: envProjectId,
  credentials:
    envClientEmail && envPrivateKey
      ? {
          client_email: envClientEmail,
          private_key: envPrivateKey,
        }
      : undefined,
});

export const bucketName = process.env.GCS_BUCKET_NAME ?? "";

export const gcsBucket = bucketName ? storage.bucket(bucketName) : null;

// ---------------------------------------------------------------------------
// Dynamic GCS client (from database SiteConfig -- preferred when available)
// ---------------------------------------------------------------------------

/**
 * Returns a GCS bucket instance using credentials stored in the database
 * SiteConfig. Falls back to env-var-based `gcsBucket` when the database
 * config is incomplete.
 */
export async function getGcsBucket(): Promise<{
  bucket: Bucket | null;
  bucketName: string;
}> {
  try {
    const config = await getSiteConfig();

    const dbProjectId = config.gcsProjectId || undefined;
    const dbBucket = config.gcsBucketName || undefined;
    const dbEmail = config.gcsClientEmail || undefined;
    const dbKey = config.gcsPrivateKey?.replace(/\\n/g, "\n") || undefined;

    // If the database has GCS configuration, use it
    if (dbProjectId && dbBucket && dbEmail && dbKey) {
      const dbStorage = new Storage({
        projectId: dbProjectId,
        credentials: {
          client_email: dbEmail,
          private_key: dbKey,
        },
      });
      return { bucket: dbStorage.bucket(dbBucket), bucketName: dbBucket };
    }
  } catch {
    // Database not reachable – fall through to env-based client
  }

  // Fallback to environment-variable-based client
  return { bucket: gcsBucket, bucketName };
}
