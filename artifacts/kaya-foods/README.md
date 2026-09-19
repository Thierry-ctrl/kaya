# Kaya Foods

React + Vite storefront, Express/PostgreSQL catalogue and content API, and a Clerk-authenticated administrator dashboard. The customer basket is stored in the browser; WhatsApp is an order **request**, not online payment or order confirmation.

## Development

From the repository root, with provisioned database and Clerk environment:

```sh
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run migrate
pnpm --filter @workspace/db run seed
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/kaya-foods run dev
```

Use the managed Replit workflows for the preview so `/api` is routed to the API service. A standalone Vite server alone does not provide the backend.

## Administration

Visit `/admin` (relative to the website's base path). Create an account through the sign-in screen if needed. Signing up does **not** grant admin access. An operator must grant the verified Clerk user ID from a trusted shell:

```sh
pnpm --filter @workspace/api-server run admin:grant user_REPLACE --by operator
pnpm --filter @workspace/api-server run admin:revoke user_REPLACE
```

The dashboard manages products, stable size IDs, RWF prices, draft/publication and availability, images, contact details, WhatsApp, delivery/payment instructions, hero/story copy and notices. Save errors and stale-version conflicts are explicit. Uploaded images are validated and converted to WebP in object storage; files are not persisted to the API's local disk.

Products and settings are seeded only on explicit command. Later catalogue changes belong in the dashboard, not source files. Keep product and size IDs stable for customers' existing baskets. Removing/unpublishing products or changing availability reconciles those baskets after a successful API refresh.

## Content safeguards

Initial products, sizes and prices are samples, not approved offers. Current food scenes are illustrative, not actual supplier/product photographs. Replace them with approved photos before launch; keep truthful image captions and alt text.

Use the original Kaya logo/monogram crops in `public/images/brand/` until approved high-resolution originals are supplied. Never redraw their geometry or display the original presentation boards as product photographs.

The WhatsApp number intentionally starts blank. Configure real business details in admin; do not invent contacts, delivery fees or supplier claims. Sending remains disabled without a valid international number. A customer must manually send the request and the business must confirm availability, delivery and payment.

## Checks and deployment

```sh
pnpm run typecheck:libs
pnpm --filter @workspace/kaya-foods run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-server run test
pnpm --filter @workspace/api-server exec tsx --test ../kaya-foods/src/lib/basket.test.ts
pnpm --filter @workspace/kaya-foods run build
pnpm --filter @workspace/api-server run build
```

AWS preparation, first-admin setup, required production services and launch checks: [AWS deployment guide](../../docs/AWS_DEPLOYMENT.md). Deployment templates are in `deploy/aws/`. No AWS infrastructure or domain has been configured automatically. The separate presentation and design-preview artifacts are not part of the deployed website.