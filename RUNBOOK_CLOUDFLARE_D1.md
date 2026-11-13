# Cloudflare Workers + D1 Binding Deployment & Operations Runbook

Reviewed against repository configuration on 2026-11-11. This runbook describes intended operations; it does not assert that remote resources have been provisioned. `wrangler.jsonc` still contains a placeholder D1 UUID at review time.

## 1. Architecture
- **Runtime**: Next.js 16.4.6 / React 19.3.1 on Cloudflare Workers via `@opennextjs/cloudflare`. Build tooling requires Node.js >=22.12; use `.nvmrc` and `npm ci` so the audited npm overrides apply.
- **Database Binding**: Direct D1 binding `DB` configured in `wrangler.jsonc` (`d1_databases`) and resolved via `@opennextjs/cloudflare` (`getCloudflareContext().env.DB`) in `src/lib/cf-env.ts` and `src/lib/d1.ts`.
- **Durable Outbox & Cron**: SQLite triggers in `migrations/` enqueue delivery work on commit. Background delivery and Cloudflare Cron (`worker.ts`) drain/retry pending jobs.

## 2. Initial Provisioning
1. Create the D1 database:
   ```bash
   npx wrangler d1 create deanflow-db
   ```
2. Update `database_id` in `wrangler.jsonc` with the returned UUID.
3. Review all migrations through `0011_sanity_staff_identity.sql`. Before upgrading an existing database, export a backup and test the migration in staging. Apply to the intended environment before deploying the new capture API:
   ```bash
   npm run d1:migrate:local
   npm run d1:migrate:remote
   ```
4. Set required production secrets in Cloudflare Workers:
   ```bash
   npx wrangler secret put ADMIN_JWT_SECRET
   npx wrangler secret put SANITY_API_READ_TOKEN
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put RESEND_FROM_EMAIL
   npx wrangler secret put OUTBOX_CRON_SECRET
   npx wrangler secret put ORDER_WEBHOOK_URL
   ```
5. Verify release gates before production deploy:
   ```bash
   npm run verify:production
   ```
   This reads production environment files via `@next/env`; shell variables take precedence. Set `NEXT_PUBLIC_BASE_URL` to the public HTTPS origin in both the build environment and Worker variables. Worker runtime secrets must also be configured remotely; a passing local gate does not inspect remote secrets. `npm run deploy:cf` invokes this strict check before deployment. The GitHub workflow runs it when invoked manually with `workflow_dispatch`.

6. Build and validate the candidate before deployment:
   ```bash
   npm run build:cf
   npm run dry-run:cf
   npm run perf:check -- --ci
   ```
   Product, collection and article pages query D1 at request time. Do not provide production database write credentials merely to prerender these pages during builds.

For Sanity-based staff authentication, apply migration `0011` and explicitly link each active D1 staff account before switching the deployed auth mode. See [Sanity admin sign-in](docs/SANITY_ADMIN_SIGN_IN.md); no external bcrypt host is needed for this mode.

## 3. Health Checks
- **Public readiness probe**: `GET /api/health` -> returns `200 {"ok":true,"database":"connected"}` only when persistent D1 and the required lead submission/assessment/RFQ schema are available, else `503`.
- **Admin diagnostics**: `GET /api/admin/health` (requires `superadmin` or `admin`) -> checks required tables/triggers, applied `d1_migrations`, and outbox queue counts. Check that `healthy` is true, `missingTables` and `missingTriggers` are empty, and the runtime mode matches the intended environment. Avoid relying on fixed table/trigger counts from an older report.

## Lead operations after this release

- Reporting uses UTC calendar days. Follow-up queues and overdue totals include all open leads, regardless of creation date. High-priority/inbound metrics use the selected creation period.
- Migration `0010` adds a unique submission identity and stored receipt. Capture clients retain the same key across retry/reload until a successful response is confirmed. New content gets a new key; reusing a key with different requirements returns 409. Older API integrations without the header remain compatible but do not receive retry deduplication.
- Dossier metadata is committed with the lead and trigger-created outbox job. Old pending jobs resolve their published asset ID at delivery time if metadata is missing. Unresolvable assets retry and eventually enter dead letter; they must not be marked sent without a safe download URL.
- Email sending stops if its exact envelope cannot be durably saved under the current lease. Monitor outbox failures/dead letters and verify retries with a test delivery environment before launch.
- Newsletter/popup submissions now record the displayed consent notice, timestamp and policy version. Existing records are not backfilled with inferred consent.

## 4. Backup & Restore
- **Export SQL backup + SHA-256 checksum**:
  ```bash
  npm run d1:backup -- deanflow-db --remote
  ```
- **Restore from SQL backup**:
  ```bash
  npm run d1:restore -- deanflow-db backups/<file>.sql --remote --confirm
  ```
- **Point-in-time Time Travel restore**:
  ```bash
  npx wrangler d1 time-travel info deanflow-db
  npx wrangler d1 time-travel restore deanflow-db --timestamp="<chosen-UTC-timestamp>"
  ```

## 5. Mobile Performance & Core Web Vitals
- Storefront reports LCP, INP, CLS, and checkout submission latency (`checkoutMs`) via `src/ui/web-vitals-reporter.tsx` and `src/lib/vitals.ts` to `window.__DEANFLOW_VITALS__` and `POST /api/vitals`.
- Run bundle size verification locally or in CI:
  ```bash
  npm run build:cf && npm run perf:check
  ```

