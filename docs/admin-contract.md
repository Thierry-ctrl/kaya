# Kaya administration contract

Public storefront stays accessible to everyone. Admin rights are database grants to verified Clerk user IDs, never self-service signup.

API base: `/api` (separately routed backend). All JSON errors: `{error: string}`. Cookie authentication, no browser bearer-token plumbing.

- `GET /storefront` → `{products: Product[], settings: Settings}` (published only)
- `GET /admin/me` → `{userId: string}` (401 signed out / 403 not administrator)
- `GET /admin/products` → `Product[]`
- `POST /admin/products` body ProductInput → Product (201)
- `PUT /admin/products/:id` body ProductInput + version → Product
- `DELETE /admin/products/:id?version=N` → 204
- `GET /admin/settings` → Settings
- `PUT /admin/settings` body Settings → Settings

ProductInput: existing product fields except id; plus published:boolean. Product adds id:string and version:integer. Existing product/size IDs stay stable; create IDs server-side. Prices integer RWF >=0; available products require at least one size. Duplicate size IDs rejected. Optimistic updates/deletes/settings saves reject stale versions with 409.

Settings: existing siteConfig fields (name,description,whatsappNumber,contactEmail,contactPhone,openingHours,deliveryAreas,deliveryFee,paymentMethods,socialLinks:{instagram,facebook}), plus heroBadge,heroText,storyTitle,storyParagraph1,storyParagraph2,storyImageUrl,storyImageAlt,storyImageCaption,logoUrl,illustrationNotice (all strings), version:integer.

Seed from current products/config/content once, on explicit seed command, not on every boot. Store local seed image URLs as `/images/...`; frontend resolves them relative to its BASE_URL. `/api/media/...` URLs remain API-relative.

Media (admin only): `POST /admin/media/upload-url` body `{contentType:string,size:number}` → `{uploadId:string,uploadUrl:string}`; browser PUT bytes directly to uploadUrl with Content-Type; `POST /admin/media/complete` body `{uploadId:string}` → `{url:string}`. Validate size/type and re-encode image before making it public at `GET /media/:id`. Replit App Storage development, S3 AWS adapter via STORAGE_PROVIDER. No file bytes in DB or local disk.

Do not treat unconfigured ordering/contact details as real data. Keep WhatsApp disabled until valid configured international digits. Product publication and availability determine category exploration and basket validity dynamically.