const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const CLOUDFLARE_ACCOUNT_ID =
  process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID!;

const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;

async function streamFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export interface DirectUploadResult {
  uid: string;
  uploadURL: string;
}

/**
 * Create a direct upload URL for the client to upload a video file.
 * The client POSTs the file as multipart/form-data to the uploadURL.
 */
export async function createDirectUpload(
  projectId: string,
  maxDurationSeconds = 1800
): Promise<DirectUploadResult> {
  const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const res = await streamFetch("/direct_upload", {
    method: "POST",
    body: JSON.stringify({
      maxDurationSeconds,
      expiry,
      allowedOrigins: ["noddo.io", "*.noddo.io", "localhost:3000"],
      meta: { proyecto_id: projectId },
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    const msg =
      data.errors?.[0]?.message || `Stream API error: ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  return {
    uid: data.result.uid,
    uploadURL: data.result.uploadURL,
  };
}

export interface StreamVideoStatus {
  readyToStream: boolean;
  state: string;
  pctComplete: string | null;
  errorReasonCode: string | null;
  errorReasonText: string | null;
  duration: number | null;
  size: number | null;
  thumbnail: string | null;
  playbackHls: string | null;
  playbackDash: string | null;
}

/**
 * Get the current status of a video by its Stream UID.
 */
export async function getVideoStatus(
  uid: string
): Promise<StreamVideoStatus> {
  const res = await streamFetch(`/${uid}`);

  if (!res.ok) {
    const data = await res.json();
    const msg =
      data.errors?.[0]?.message || `Stream API error: ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const r = data.result;

  return {
    readyToStream: r.readyToStream ?? false,
    state: r.status?.state ?? "unknown",
    pctComplete: r.status?.pctComplete ?? null,
    errorReasonCode: r.status?.errorReasonCode ?? null,
    errorReasonText: r.status?.errorReasonText ?? null,
    duration: r.duration ?? null,
    size: r.size ?? null,
    thumbnail: r.thumbnail ?? null,
    playbackHls: r.playback?.hls ?? null,
    playbackDash: r.playback?.dash ?? null,
  };
}

/**
 * Delete a video from Cloudflare Stream.
 */
export async function deleteStreamVideo(uid: string): Promise<void> {
  const res = await streamFetch(`/${uid}`, { method: "DELETE" });

  // 404 = already deleted, treat as success
  if (!res.ok && res.status !== 404) {
    const data = await res.json();
    const msg =
      data.errors?.[0]?.message || `Stream API error: ${res.status}`;
    throw new Error(msg);
  }
}
