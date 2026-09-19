ALTER TABLE media_uploads
  ADD COLUMN IF NOT EXISTS processing_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_token uuid;

CREATE INDEX IF NOT EXISTS media_uploads_processing_lease_idx
  ON media_uploads (processing_at)
  WHERE status = 'processing';

CREATE UNIQUE INDEX IF NOT EXISTS media_uploads_processing_token_idx
  ON media_uploads (processing_token)
  WHERE processing_token IS NOT NULL;