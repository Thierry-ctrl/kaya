CREATE TABLE IF NOT EXISTS media_uploads (
  id uuid PRIMARY KEY,
  admin_user_id text NOT NULL,
  declared_content_type text NOT NULL
    CHECK (declared_content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  declared_size bigint NOT NULL CHECK (declared_size BETWEEN 1 AND 5242880),
  staging_key text NOT NULL UNIQUE,
  status text NOT NULL
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'expired')),
  media_id uuid UNIQUE,
  completed_key text UNIQUE,
  completed_size bigint CHECK (completed_size BETWEEN 1 AND 5242880),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  CHECK (
    (status = 'completed' AND media_id IS NOT NULL AND completed_key IS NOT NULL
      AND completed_size IS NOT NULL AND completed_at IS NOT NULL)
    OR status <> 'completed'
  )
);

CREATE INDEX IF NOT EXISTS media_uploads_admin_created_idx
  ON media_uploads (admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS media_uploads_expiry_idx
  ON media_uploads (expires_at)
  WHERE status IN ('pending', 'processing');