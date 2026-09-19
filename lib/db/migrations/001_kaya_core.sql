CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Jam', 'Juices', 'Chilli', 'Tomato Paste')),
  short_description text NOT NULL,
  image_url text NOT NULL,
  alt_text text NOT NULL,
  availability text NOT NULL CHECK (availability IN ('available', 'coming_soon', 'unavailable')),
  sizes jsonb NOT NULL,
  is_sample boolean NOT NULL,
  published boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY CHECK (key = 'site'),
  name text NOT NULL,
  description text NOT NULL,
  whatsapp_number text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  opening_hours text NOT NULL,
  delivery_areas text NOT NULL,
  delivery_fee text NOT NULL,
  payment_methods text NOT NULL,
  social_links jsonb NOT NULL,
  hero_badge text NOT NULL,
  hero_text text NOT NULL,
  story_title text NOT NULL,
  story_paragraph_1 text NOT NULL,
  story_paragraph_2 text NOT NULL,
  story_image_url text NOT NULL,
  story_image_alt text NOT NULL,
  story_image_caption text NOT NULL,
  logo_url text NOT NULL,
  illustration_notice text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_grants (
  clerk_user_id text PRIMARY KEY,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by text NOT NULL
);
