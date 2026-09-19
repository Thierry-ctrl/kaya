import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import sharp from "sharp";
import { requireAdmin } from "../middlewares/require-admin";
import {
  getMediaStorage,
  MAX_MEDIA_BYTES,
  MediaValidationError,
  readObjectWithLimit,
} from "../lib/media-storage";

const router: IRouter = Router();
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const TYPE_FORMATS: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};
const UPLOAD_TTL_MS = 15 * 60 * 1000;
const PROCESSING_LEASE_MS = 2 * 60 * 1000;

type UploadRow = {
  id: string;
  admin_user_id: string;
  declared_content_type: string;
  declared_size: string | number;
  staging_key: string;
  status: string;
  media_id: string | null;
  completed_key: string | null;
  completed_size: string | number | null;
  expires_at: Date;
  processing_at: Date | null;
  processing_token: string | null;
};

function sendError(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
}

function adminUserId(req: Request, res: Response): string {
  const requestAuth = (req as Request & { auth?: { userId?: string } }).auth;
  const value = res.locals.adminUserId ?? res.locals.userId ?? requestAuth?.userId;
  if (typeof value !== "string" || !value) {
    throw new Error("requireAdmin did not expose the authenticated user ID");
  }
  return value;
}

router.post("/admin/media/upload-url", requireAdmin, async (req, res) => {
  try {
    const { contentType, size } = req.body ?? {};
    if (typeof contentType !== "string" || !ALLOWED_TYPES.has(contentType)) {
      return sendError(res, 400, "Unsupported image content type");
    }
    if (!Number.isSafeInteger(size) || size < 1 || size > MAX_MEDIA_BYTES) {
      return sendError(res, 400, `Image size must be between 1 and ${MAX_MEDIA_BYTES} bytes`);
    }

    const uploadId = randomUUID();
    const stagingKey = `media/staging/${uploadId}`;
    const uploadUrl = await getMediaStorage().createUploadUrl(stagingKey, contentType, size);
    await pool.query(
      `INSERT INTO media_uploads
        (id, admin_user_id, declared_content_type, declared_size, staging_key, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
      [uploadId, adminUserId(req, res), contentType, size, stagingKey, new Date(Date.now() + UPLOAD_TTL_MS)],
    );
    return res.json({ uploadId, uploadUrl });
  } catch (error) {
    req.log?.error({ err: error }, "Failed to create media upload intent");
    return sendError(res, 500, "Unable to create upload URL");
  }
});

router.post("/admin/media/complete", requireAdmin, async (req, res) => {
  const uploadId = req.body?.uploadId;
  if (typeof uploadId !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(uploadId)) {
    return sendError(res, 400, "A valid uploadId is required");
  }

  let row: UploadRow | undefined;
  let claimToken: string | undefined;
  try {
    const result = await pool.query<UploadRow>("SELECT * FROM media_uploads WHERE id = $1", [uploadId]);
    row = result.rows[0];
    if (!row || row.admin_user_id !== adminUserId(req, res)) {
      return sendError(res, 404, "Upload not found");
    }
    if (row.status === "completed" && row.media_id) {
      return res.json({ url: `/api/media/${row.media_id}` });
    }
    const staleProcessing = row.status === "processing"
      && row.processing_at !== null
      && new Date(row.processing_at).getTime() < Date.now() - PROCESSING_LEASE_MS;
    if (row.status !== "pending" && !staleProcessing) {
      return sendError(res, 409, "Upload is already being processed");
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await pool.query(
        `UPDATE media_uploads
         SET status = 'expired', processing_at = NULL, processing_token = NULL
         WHERE id = $1
           AND (status = 'pending' OR (status = 'processing' AND processing_token IS NOT DISTINCT FROM $2::uuid))`,
        [uploadId, row.processing_token],
      );
      return sendError(res, 410, "Upload intent has expired");
    }

    claimToken = randomUUID();
    const claimed = await pool.query(
      `UPDATE media_uploads
       SET status = 'processing', processing_at = NOW(), processing_token = $2
       WHERE id = $1
         AND (
           status = 'pending'
           OR (status = 'processing' AND processing_at < NOW() - INTERVAL '2 minutes')
         )
       RETURNING id`,
      [uploadId, claimToken],
    );
    if (claimed.rowCount !== 1) return sendError(res, 409, "Upload is already being processed");

    const storage = getMediaStorage();
    const staged = await storage.get(row.staging_key);
    if (staged.contentType && staged.contentType.split(";")[0].trim().toLowerCase() !== row.declared_content_type) {
      throw new MediaValidationError("Uploaded content type does not match the declared type");
    }
    const source = await readObjectWithLimit(staged);
    if (source.length !== Number(row.declared_size)) {
      throw new MediaValidationError("Uploaded byte size does not match the declared size");
    }

    const image = sharp(source, {
      failOn: "warning",
      limitInputPixels: 40_000_000,
      sequentialRead: true,
      animated: false,
    });
    const metadata = await image.metadata();
    if (!metadata.format || metadata.format !== TYPE_FORMATS[row.declared_content_type]) {
      throw new MediaValidationError("Uploaded bytes do not match the declared image type");
    }
    if (!metadata.width || !metadata.height) throw new MediaValidationError("Image has invalid dimensions");

    const output = await image
      .rotate()
      .resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    if (output.length > MAX_MEDIA_BYTES) {
      throw new MediaValidationError("Processed image exceeds the media size limit");
    }

    const mediaId = randomUUID();
    const completedKey = `media/completed/${mediaId}.webp`;
    await storage.put(completedKey, output, "image/webp");
    try {
      const completed = await pool.query(
        `UPDATE media_uploads
         SET status = 'completed', media_id = $2, completed_key = $3,
             completed_size = $4, completed_at = NOW(),
             processing_at = NULL, processing_token = NULL
         WHERE id = $1 AND status = 'processing' AND processing_token = $5
         RETURNING id`,
        [uploadId, mediaId, completedKey, output.length, claimToken],
      );
      if (completed.rowCount !== 1) {
        await storage.delete(completedKey).catch(() => undefined);
        return sendError(res, 409, "Upload processing lease was reclaimed");
      }
    } catch (error) {
      await storage.delete(completedKey).catch(() => undefined);
      throw error;
    }
    await storage.delete(row.staging_key).catch((error) => {
      req.log?.warn({ err: error, uploadId }, "Failed to remove staged media object");
    });
    return res.json({ url: `/api/media/${mediaId}` });
  } catch (error) {
    if (row && claimToken) {
      const invalid = error instanceof MediaValidationError;
      const released = await pool.query(
        `UPDATE media_uploads
         SET status = $2, processing_at = NULL, processing_token = NULL
         WHERE id = $1 AND status = 'processing' AND processing_token = $3
         RETURNING id`,
        [row.id, invalid ? "rejected" : "pending", claimToken],
      ).catch(() => undefined);
      if (invalid && released?.rowCount === 1) {
        await getMediaStorage().delete(row.staging_key).catch(() => undefined);
      }
    }
    if (error instanceof MediaValidationError) return sendError(res, 400, error.message);
    req.log?.error({ err: error, uploadId }, "Failed to complete media upload");
    return sendError(res, 500, "Unable to complete media upload");
  }
});

router.get("/media/:id", async (req, res) => {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(req.params.id)) {
    return sendError(res, 404, "Media not found");
  }
  try {
    const result = await pool.query<{ completed_key: string; completed_size: string | number }>(
      `SELECT completed_key, completed_size FROM media_uploads
       WHERE media_id = $1 AND status = 'completed'`,
      [req.params.id],
    );
    const media = result.rows[0];
    if (!media) return sendError(res, 404, "Media not found");

    const object = await getMediaStorage().get(media.completed_key);
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Content-Length", String(media.completed_size));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    object.body.on("error", (error) => {
      req.log?.error({ err: error, mediaId: req.params.id }, "Media stream failed");
      if (!res.headersSent) sendError(res, 500, "Unable to read media");
      else res.destroy(error);
    });
    return object.body.pipe(res);
  } catch (error) {
    req.log?.error({ err: error, mediaId: req.params.id }, "Failed to serve media");
    if (!res.headersSent) return sendError(res, 500, "Unable to read media");
    return res.destroy(error instanceof Error ? error : undefined);
  }
});

export default router;