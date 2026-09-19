# Kaya Foods on AWS EC2

This is a deployment preparation guide, not a record of a live deployment. No AWS resources have been created. Use a Linux EC2 instance (Ubuntu 24.04 is a suitable baseline), Node.js 24 LTS, pnpm 10.26.1, nginx, a PostgreSQL/RDS database and a private S3 bucket. The slide deck and component-preview artifact are not deployed.

## What can wait

After installation, `/admin` manages catalogue entries, sizes, whole-RWF prices, publication, availability, photos, business contacts, WhatsApp, delivery/payment instructions and site copy. Missing contact information stays visibly unconfigured; sending a WhatsApp order request stays disabled without a valid number. Initial products and prices are samples and must be approved before accepting requests.

Infrastructure cannot wait: configure TLS/domain, production authentication, database, storage, secrets, migrations and an explicit administrator grant before opening administration to operators.

## 1. Provision and restrict infrastructure

- EC2: allow public TCP 80/443 only; use SSM or restrict SSH to operator IPs. Never expose API port 3001 or PostgreSQL port 5432 publicly.
- RDS PostgreSQL: private subnet, inbound 5432 only from the EC2 security group, encrypted storage, automated backups/point-in-time recovery, deletion protection. Use a dedicated application database/user, not the master account. Download the official regional RDS CA bundle to `/etc/kaya/rds-ca.pem`.
- S3: private bucket, Block Public Access enabled, encryption and versioning enabled. Apply `deploy/aws/s3-cors.json`, replacing the example origin with the exact HTTPS site origin.
- Attach an EC2 IAM role with `deploy/aws/s3-iam-policy.json`, replacing the bucket name. Keep its `kaya/` prefix consistent with `S3_PREFIX`. No permanent AWS access keys are needed.
- Add an S3 lifecycle rule to expire `kaya/media/staging/` objects after one day and their noncurrent versions. Signed upload URLs expire after 15 minutes; staging is never served publicly.
- Set up billing/storage alarms, EC2 health alerts and CloudWatch log collection/retention for systemd/nginx. Rate limiting is per API process; add AWS WAF or a shared limiter before running multiple API instances.

## 2. Production authentication

Replit-managed development auth is not assumed to be portable to AWS. Keep the existing managed Replit keys unchanged. Configure a **separate, externally managed Clerk production application** for the AWS domain, with verified DNS/auth domain and email delivery. Use that application's production keys only on AWS. Do not copy development users or grant IDs to production.

Configure allowed origins/redirect URLs for `https://YOUR_DOMAIN/sign-in`, `/sign-up` and `/admin`. Enable administrator MFA and appropriate session/password policies in the external Clerk application before launch. The website does not grant administrator privileges based on signup, email claims, or frontend state.

The external instance uses Clerk's own auth domain; omit `CLERK_PROXY_URL` and leave `VITE_CLERK_PROXY_URL` empty. Replit's managed deployment proxy code remains available for the Replit environment but is not required on AWS.

## 3. Install a release

Install Node 24, pnpm 10.26.1, nginx and your TLS certificate tooling using their maintained installation instructions. The systemd unit assumes Node is `/usr/bin/node`; change it to your actual system installation path if different. Do not use a root-only nvm installation for the service account.

Create an unprivileged `kaya` service account and a release directory, for example `/opt/kaya/releases/2026-09-19`. Copy/clone the repository there; preserve the workspace layout and lockfile. Point `/opt/kaya/current` to this release. Keep `attached_assets/`, `.local/`, `.agents/` and private workspace files out of your public nginx document root.

From the release root:

```sh
corepack enable
corepack prepare pnpm@10.26.1 --activate
pnpm install --frozen-lockfile
```

Use `deploy/aws/frontend.env.example` as the public build configuration. Set `BASE_PATH=/` and the **external production publishable key** in your build environment:

```sh
NODE_ENV=production BASE_PATH=/ pnpm --filter @workspace/kaya-foods run build
pnpm --filter @workspace/api-server run build
```

Vite reads `VITE_*` variables at build time; rebuilding is required if those values change. Never put database passwords, the Clerk secret key or AWS credentials in `VITE_*` variables. Do not run a monorepo-wide build for deployment: that also builds the unrelated slide deck.

Retain installed dependencies with the release: the API intentionally externalizes native/cloud libraries. Keep the development command dependencies (`tsx`) available to the controlled migration/operator environment.

## 4. Configure runtime and initialize data

Copy `deploy/aws/api.env.example` to `/etc/kaya/api.env`, fill in real values through your secure provisioning process, set root ownership and mode `0600`. systemd reads it before switching to the unprivileged service user. Do not commit this file. Use AWS Secrets Manager/SSM for managed secret distribution if available.

`APP_ORIGIN` must exactly match the HTTPS site origin, without a trailing slash. `HOST=127.0.0.1`, `TRUST_PROXY=1` and the supplied nginx forwarding rules go together. `DB_SSL=true` verifies the RDS certificate using `DB_CA_CERT_PATH`; do not add `sslmode=no-verify` or disable certificate verification in the connection URL.

Run these commands in a controlled operator shell with the same runtime variables securely loaded (do not echo them):

```sh
pnpm --filter @workspace/db run migrate
pnpm --filter @workspace/db run seed
```

Migrations are explicit, transactional and tracked; they are not run on API startup. Seed is idempotent and does not overwrite existing products/settings. Back up the database before every later schema deployment. Never use `push-force` against production.

## 5. Start API and nginx

Install `deploy/aws/kaya-api.service` into `/etc/systemd/system/`. Install `deploy/aws/nginx.conf` into your nginx sites configuration, replacing the example hostname and certificate paths. Obtain a valid certificate first (e.g. DNS validation or temporary HTTP challenge configuration). The supplied final configuration assumes certificate files already exist.

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now kaya-api
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status kaya-api
```

nginx serves `artifacts/kaya-foods/dist/public` and forwards `/api/` to loopback. It supports direct navigation to `/admin` and Clerk callback paths. Uploads go directly to S3, not through nginx. Renew TLS automatically.

## 6. Grant the first administrator

1. Visit `/sign-up` on the production site and complete identity verification.
2. Visit `/admin`. The account is denied access until granted. Copy the Clerk user ID shown there.
3. In the controlled operator shell, using that environment's database and Clerk secret:

   ```sh
   pnpm --filter @workspace/api-server run admin:grant user_REPLACE --by deployment-operator
   ```

4. Reload `/admin`. Confirm the account can manage content.
5. To revoke:

   ```sh
   pnpm --filter @workspace/api-server run admin:revoke user_REPLACE
   ```

The CLI checks that the user exists in the configured Clerk application. Never grant a random user or grant by unverified email. Limit operator access to runtime secrets and the database.

## 7. Verify before accepting order requests

- `/api/healthz` and `/api/storefront` return successfully over HTTPS.
- Signed-out `/api/admin/me` returns 401; a signed-in ungranted account gets 403.
- Admin edit survives refresh and appears on the public storefront in another session.
- Upload a JPEG/PNG/WebP (maximum 5 MB), confirm its processed image loads after an API restart.
- Configure real WhatsApp number, delivery fees/areas, hours, contacts and payment instructions.
- Replace sample prices/content and illustrative images with approved business information. Only remove sample/illustration labels when accurate.
- Verify mobile basket and WhatsApp request text. This remains a manually sent request, not checkout, payment or an accepted order.
- Review food labelling/allergen, privacy and consumer information requirements for your business before public launch. No legal compliance approval is implied.
- Confirm database restore and S3 recovery procedures, not just that backups are enabled.

## Updates and recovery

Build a new version in a separate release directory, run checks, take a database backup, then apply reviewed migrations. Switch `/opt/kaya/current` atomically and restart `kaya-api`; reload nginx if its configuration changed. Keep the previous release for code rollback. Database rollback is a separate operation: prefer backward-compatible schema changes and a tested restore plan, not automatic destructive down-migrations.

Use `journalctl -u kaya-api` and nginx logs for diagnostics. Logs should not contain credentials, cookies or request bodies; restrict access and retention. Do not publish log files containing private data.