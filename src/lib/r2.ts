import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "noddo-tours";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

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
  files: FileToSign[]
): Promise<{ files: SignedFile[]; tourBaseUrl: string }> {
  const client = getR2Client();
  const signed: SignedFile[] = [];

  for (const file of files) {
    const key = `tours/${projectId}/${file.path}`;
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: file.contentType,
      ContentLength: file.size,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
    signed.push({
      path: file.path,
      uploadUrl,
      publicUrl: `${R2_PUBLIC_URL}/tours/${projectId}/${file.path}`,
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
    ? `${R2_PUBLIC_URL}/tours/${projectId}/${entryFile}`
    : `${R2_PUBLIC_URL}/tours/${projectId}/`;

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

/**
 * Delete all files for a project's tour from R2.
 */
export async function deleteTourFiles(projectId: string): Promise<number> {
  const client = getR2Client();
  const prefix = `tours/${projectId}/`;
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
