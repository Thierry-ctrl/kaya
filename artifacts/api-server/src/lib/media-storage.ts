import { Readable } from "node:stream";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Storage } from "@google-cloud/storage";

export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export type StoredObject = {
  body: Readable;
  contentLength?: number;
  contentType?: string;
};

export interface MediaStorage {
  createUploadUrl(key: string, contentType: string, contentLength: number): Promise<string>;
  get(key: string): Promise<StoredObject>;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
}

function parseGcsPrivateDir(): { bucket: string; prefix: string } {
  const raw = process.env.PRIVATE_OBJECT_DIR?.replace(/^\/+|\/+$/g, "");
  if (!raw) {
    throw new Error("PRIVATE_OBJECT_DIR is required for Replit App Storage");
  }
  const [bucket, ...prefix] = raw.split("/");
  if (!bucket) throw new Error("PRIVATE_OBJECT_DIR does not contain a bucket");
  return { bucket, prefix: prefix.join("/") };
}

function withPrefix(prefix: string, key: string): string {
  return [prefix, key.replace(/^\/+/, "")].filter(Boolean).join("/");
}

// This is the canonical Replit App Storage sidecar authentication configuration.
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const gcsClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

async function signReplitObjectUrl(bucket: string, objectName: string): Promise<string> {
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: bucket,
        object_name: objectName,
        method: "PUT",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`);
  }
  const payload = await response.json() as { signed_url?: string };
  if (!payload.signed_url) throw new Error("Object storage signer returned no URL");
  return payload.signed_url;
}

class ReplitMediaStorage implements MediaStorage {
  private file(key: string) {
    const { bucket, prefix } = parseGcsPrivateDir();
    return gcsClient.bucket(bucket).file(withPrefix(prefix, key));
  }

  async createUploadUrl(key: string): Promise<string> {
    const { bucket, prefix } = parseGcsPrivateDir();
    // Replit's canonical sidecar signing API does not expose a signed byte-length
    // constraint. Oversized staging objects can therefore exist temporarily; the
    // completion path streams with a hard limit, rejects them, and deletes them.
    return signReplitObjectUrl(bucket, withPrefix(prefix, key));
  }

  async get(key: string): Promise<StoredObject> {
    const file = this.file(key);
    const [metadata] = await file.getMetadata();
    return {
      body: file.createReadStream(),
      contentLength: metadata.size === undefined ? undefined : Number(metadata.size),
      contentType: metadata.contentType,
    };
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.file(key).save(body, {
      resumable: false,
      metadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
    });
  }

  async delete(key: string): Promise<void> {
    await this.file(key).delete({ ignoreNotFound: true });
  }
}

class S3MediaStorage implements MediaStorage {
  private readonly client = new S3Client({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
  });

  private get bucket(): string {
    if (!process.env.S3_BUCKET) throw new Error("S3_BUCKET is required when STORAGE_PROVIDER=s3");
    return process.env.S3_BUCKET;
  }

  private objectKey(key: string): string {
    return withPrefix(process.env.S3_PREFIX?.replace(/^\/+|\/+$/g, "") || "", key);
  }

  async createUploadUrl(key: string, contentType: string, contentLength: number): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.objectKey(key),
        ContentType: contentType,
        ContentLength: contentLength,
      }),
      {
        expiresIn: 15 * 60,
        signableHeaders: new Set(["content-length"]),
      },
    );
  }

  async get(key: string): Promise<StoredObject> {
    const input = { Bucket: this.bucket, Key: this.objectKey(key) };
    const [head, object] = await Promise.all([
      this.client.send(new HeadObjectCommand(input)),
      this.client.send(new GetObjectCommand(input)),
    ]);
    if (!object.Body) throw new Error("Storage object has no body");
    return {
      body: object.Body as Readable,
      contentLength: head.ContentLength,
      contentType: head.ContentType,
    };
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.objectKey(key),
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }));
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this.objectKey(key),
    }));
  }
}

let instance: MediaStorage | undefined;

export function getMediaStorage(): MediaStorage {
  if (!instance) {
    instance = process.env.STORAGE_PROVIDER?.toLowerCase() === "s3"
      ? new S3MediaStorage()
      : new ReplitMediaStorage();
  }
  return instance;
}

export async function readObjectWithLimit(object: StoredObject, maxBytes = MAX_MEDIA_BYTES): Promise<Buffer> {
  if (object.contentLength !== undefined && object.contentLength > maxBytes) {
    object.body.destroy();
    throw new MediaValidationError(`Uploaded image exceeds the ${maxBytes} byte limit`);
  }

  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of object.body) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      object.body.destroy();
      throw new MediaValidationError(`Uploaded image exceeds the ${maxBytes} byte limit`);
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, total);
}

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}