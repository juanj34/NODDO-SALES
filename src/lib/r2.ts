import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "noddo-tours";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/* Media bucket (for PDFs, large files, etc.) */
const R2_MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME || "noddo-media";
const R2_MEDIA_PUBLIC_URL = process.env.R2_MEDIA_PUBLIC_URL || R2_PUBLIC_URL;

let _client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

export interface FileToSign {
  path: string;
  contentType: string;
  size: number;
}

export interface SignedFile {
  path: string;
  uploadUrl: string;
  publicUrl: string;
}

/**
 * Generate presigned PUT URLs for direct browser-to-R2 upload.
 */
export async function getPresignedUploadUrls(
  projectId: string,
  files: FileToSign[],
  subpath?: string
): Promise<{ files: SignedFile[]; tourBaseUrl: string }> {
  const client = getR2Client();
  const signed: SignedFile[] = [];
  const basePath = subpath
    ? `tours/${projectId}/${subpath}`
    : `tours/${projectId}`;

  for (const file of files) {
    const key = `${basePath}/${file.path}`;
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: file.contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
    signed.push({
      path: file.path,
      uploadUrl,
      publicUrl: `${R2_PUBLIC_URL}/${basePath}/${file.path}`,
    });
  }

  // Determine entry point — 3DVista uses index.htm
  const hasIndexHtm = files.some(
    (f) => f.path === "index.htm" || f.path === "index.html"
  );
  const entryFile = files.find((f) => f.path === "index.htm")
    ? "index.htm"
    : "index.html";
  const tourBaseUrl = hasIndexHtm
    ? `${R2_PUBLIC_URL}/${basePath}/${entryFile}`
    : `${R2_PUBLIC_URL}/${basePath}/`;

  return { files: signed, tourBaseUrl };
}

/**
 * Upload a single file to R2 server-side (avoids browser CORS issues).
 */
export async function uploadFileToR2(
  projectId: string,
  path: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  const client = getR2Client();
  const key = `tours/${projectId}/${path}`;

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/* ------------------------------------------------------------------ */
/*  Media uploads (PDFs, large files → noddo-media bucket)             */
/* ------------------------------------------------------------------ */

export interface MediaPresignResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/**
 * Generate a presigned PUT URL for a single media file upload.
 * Browser uploads directly to R2 — no serverless size limits.
 */
export async function getPresignedMediaUploadUrl(
  projectId: string,
  folder: string,
  fileName: string,
  contentType: string,
  size: number,
): Promise<MediaPresignResult> {
  const client = getR2Client();
  const key = `${folder}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: R2_MEDIA_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
  const publicUrl = `${R2_MEDIA_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl, key };
}

/**
 * Delete a single media file from R2.
 */
export async function deleteMediaFile(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectsCommand({
      Bucket: R2_MEDIA_BUCKET,
      Delete: { Objects: [{ Key: key }], Quiet: true },
    })
  );
}

/**
 * Delete all files for a project's tour from R2.
 */
export async function deleteTourFiles(projectId: string, subpath?: string): Promise<number> {
  const client = getR2Client();
  const prefix = subpath
    ? `tours/${projectId}/${subpath}/`
    : `tours/${projectId}/`;
  let deleted = 0;

  let continuationToken: string | undefined;

  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      })
    );

    const objects = list.Contents;
    if (!objects || objects.length === 0) break;

    await client.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET_NAME,
        Delete: {
          Objects: objects.map((o) => ({ Key: o.Key! })),
          Quiet: true,
        },
      })
    );

    deleted += objects.length;
    continuationToken = list.IsTruncated
      ? list.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return deleted;
}

/**
 * Ensure CORS is configured on the tours bucket for direct browser uploads.
 * Checks existing rules match expected config — updates if stale or missing.
 */
export async function ensureToursBucketCors(): Promise<void> {
  const client = getR2Client();

  try {
    const existing = await client.send(
      new GetBucketCorsCommand({ Bucket: R2_BUCKET_NAME })
    );
    const rules = existing.CORSRules;
    if (
      rules &&
      rules.length > 0 &&
      rules[0].AllowedHeaders?.includes("*") &&
      rules[0].AllowedMethods?.includes("PUT")
    ) {
      return;
    }
  } catch {
    // NoSuchCORSConfiguration or similar — proceed to set it
  }

  await client.send(
    new PutBucketCorsCommand({
      Bucket: R2_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ["*"],
            AllowedMethods: ["PUT", "GET", "HEAD"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag", "Content-Length"],
            MaxAgeSeconds: 86400,
          },
        ],
      },
    })
  );
}

/**
 * The CORS rules we expect on the media bucket.
 * Compared against existing rules to detect stale configs.
 */
const MEDIA_CORS_RULES = [
  {
    AllowedOrigins: ["*"],
    AllowedMethods: ["PUT", "GET", "HEAD"],
    AllowedHeaders: ["*"],
    ExposeHeaders: ["ETag", "Content-Length"],
    MaxAgeSeconds: 86400,
  },
];

/**
 * Ensure CORS is configured on the media bucket for direct browser uploads.
 * Checks existing rules match expected config — updates if stale or missing.
 */
export async function ensureMediaBucketCors(): Promise<void> {
  const client = getR2Client();

  try {
    const existing = await client.send(
      new GetBucketCorsCommand({ Bucket: R2_MEDIA_BUCKET })
    );
    const rules = existing.CORSRules;
    if (
      rules &&
      rules.length > 0 &&
      rules[0].AllowedHeaders?.includes("*") &&
      rules[0].AllowedMethods?.includes("PUT")
    ) {
      return; // Already has correct permissive config
    }
  } catch {
    // NoSuchCORSConfiguration or similar — proceed to set it
  }

  await client.send(
    new PutBucketCorsCommand({
      Bucket: R2_MEDIA_BUCKET,
      CORSConfiguration: { CORSRules: MEDIA_CORS_RULES },
    })
  );
}
