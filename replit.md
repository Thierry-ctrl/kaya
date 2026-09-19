# Kaya Foods

A mobile-first client-review website for a starting business selecting locally made Rwandan foods.

## Scope and constraints

- React + Vite storefront with a PostgreSQL-backed Express API and Clerk-protected admin dashboard. Basket state stays in the browser.
- The user authorized secure administration and AWS EC2 preparation. Catalogue, content and launch settings are editable from admin; no online payment gateway or customer order database is included.
- Admin access requires an explicit server-side grant; signing up never grants privileges. Production and development identities are separate.
- AWS deployment uses nginx/systemd, PostgreSQL/RDS, S3 and an external production Clerk instance. See docs/AWS_DEPLOYMENT.md; never replace managed Replit development credentials for this purpose.
- Brand boards are references only, not website or product images.
- Use the original logo and monogram extracted from the supplied boards on the website, as requested by the client. Never recreate their geometry; use original SVG/high-resolution assets when supplied.
- The client approved temporary AI food imagery for presentations on 2026-09-10. Keep it unbranded and visibly labelled illustrative, not actual product/supplier photos. Replace with approved photos before launch. Do not generate branded packaging, approximate the monogram, invent certifications or supplier relationships.
- Clearly identify sample products, sizes and prices. Missing client information must remain obvious.
- WhatsApp opens an order request, never an order confirmation. The customer sends it manually and the business confirms delivery, availability and payment.
- Keep sending disabled while the real WhatsApp number is absent.
- This is a review prototype; do not publish automatically.

## Work on the website

- Package: `artifacts/kaya-foods` (`@workspace/kaya-foods`)
- Preview workflow: `artifacts/kaya-foods: web`
- `pnpm --filter @workspace/kaya-foods run typecheck`
- `pnpm --filter @workspace/kaya-foods run build`
- Static output: `artifacts/kaya-foods/dist/public`

See `artifacts/kaya-foods/README.md` for content editing, image replacement, WhatsApp configuration, DigitalOcean deployment and the pre-launch approval checklist.