# Implementation Plan — PWA Install, App Updates, Admin Banner, Community Progress

Date: 2026-10-16  
Status: Ready for implementation  
Scope: PWA installation and updates, admin-managed public/member banner, and Community payment progress.

## 1. Locked decisions

- പുതിയ Supabase Storage bucket create ചെയ്യില്ല.
- നിലവിലുള്ള public `unit-assets` bucket മാത്രം ഉപയോഗിക്കും.
- Banner objects `public-dashboard-banners/` folder-ൽ unique versioned paths ആയി upload ചെയ്യും.
- PWA implementation lightweight ആയിരിക്കും; ആദ്യം native Web APIs ഉപയോഗിക്കും. PWA package/workbox dependency നിർബന്ധമായാൽ മാത്രം പിന്നീട് പരിഗണിക്കും.
- Android Chromium-ൽ native install prompt user tap വഴി തുറക്കും.
- iOS Safari-ൽ platform അനുവദിക്കുന്ന പരമാവധി experience നൽകും: manifest, Apple metadata/icon, standalone detection, Add to Home Screen guide.
- Installation login-നെ block ചെയ്യില്ല.
- App updates user-controlled **New version available → Update now** flow ആയിരിക്കും.
- Service Worker auth, payment, receipt, admin API responses cache ചെയ്യില്ല.
- Public/member banner: 1600 × 900 px, maximum 5 MB, JPG/PNG/WebP.
- Community progress current calendar year-ൽ member joined month മുതൽ current India month വരെ കണക്കാക്കും.
- Community progress-ൽ confirmed monthly dues മാത്രം ഉൾപ്പെടും; pending/failed/cancelled/refunded/voided/special-event payments ഒഴിവാക്കും.

## 2. Target architecture

```text
Login / Landing UI
  └─ PWA install controller
      ├─ Android/Chromium native prompt
      ├─ iOS Safari Add to Home Screen guide
      ├─ Embedded browser guidance
      └─ Installed-mode detection

Root application provider
  ├─ Service Worker registration
  ├─ Version endpoint polling
  └─ New-version update prompt

Admin Settings → Public Banner
  └─ Admin API → Banner service → Supabase adapter
      ├─ unit-assets/public-dashboard-banners/<unique-file>
      ├─ storage_files metadata
      ├─ app_settings active pointer
      └─ audit_logs

Community directory
  └─ Authenticated API → directory progress RPC/query
      ├─ members
      ├─ payments
      └─ payment_months
```

## 3. Phase A — PWA foundation and browser compatibility

### A1. Read Next.js 16 local documentation

Implementation ആരംഭിക്കുന്നതിന് മുമ്പ് `node_modules/next/dist/docs/`-ലെ metadata, manifest, route-handler, caching documentation പരിശോധിക്കണം. Project `AGENTS.md` പ്രകാരം ഇത് mandatory ആണ്.

### A2. Correct PWA assets

Existing source icon-ൽ നിന്ന് exact files generate ചെയ്യുക:

- `public/icons/pwa-192.png` → exactly 192 × 192.
- `public/icons/pwa-512.png` → exactly 512 × 512.
- `public/icons/pwa-maskable-512.png` → exactly 512 × 512 with safe-zone padding.
- `public/icons/apple-touch-icon.png` → exactly 180 × 180.

Manifest-declared dimensions actual files-നോട് match ചെയ്യണം. Icon generation existing `scripts/generate-brand-assets.mjs` extend ചെയ്ത് reproducible ആക്കാം.

### A3. Manifest and Apple metadata

Update `src/app/manifest.ts`:

- Stable `id`.
- `start_url` installed-member flow-നായി `/member/dashboard?source=pwa`; unauthenticated user proxy വഴി `/login`-ലേക്ക് പോകും.
- `scope: "/"` and `display: "standalone"` നിലനിർത്തുക.
- Correct exact-size icons.
- Optional mobile/desktop screenshots only after real screenshots are available.

Update `src/app/layout.tsx`:

- Explicit Apple touch icon metadata.
- `appleWebApp.capable`, title, status bar style നിലനിർത്തുക.
- Viewport safe-area support (`viewport-fit=cover`) Next.js 16 metadata API വഴി ചേർക്കുക.
- Theme color light/dark variants supported ആണെങ്കിൽ metadata rules അനുസരിച്ച് നൽകുക.

### A4. Shared install controller

New files:

- `src/components/pwa/PwaInstallProvider.tsx`
- `src/components/pwa/PwaInstallPrompt.tsx`
- `src/lib/pwa/installSupport.ts`
- `src/lib/pwa/types.ts`

Responsibilities:

- Root layout-ൽ നിന്ന് `beforeinstallprompt` event early ആയി capture ചെയ്യുക.
- Event memory-ൽ retain ചെയ്യുക; browser reload കഴിഞ്ഞാൽ പഴയ event ഉപയോഗിക്കരുത്.
- `appinstalled` listen ചെയ്യുക.
- `display-mode: standalone`, iOS `navigator.standalone`, Android TWA/referrer hints എന്നിവ ഉപയോഗിച്ച് installed state കണ്ടെത്തുക.
- iOS/iPadOS, Safari, Chromium, embedded browser state വേർതിരിക്കുക.
- Native prompt ഒരിക്കൽ മാത്രം user button tap-ൽ വിളിക്കുക.
- Dismiss timestamp local storage-ൽ save ചെയ്ത് configurable cooldown നൽകുക.

### A5. Login/landing placement

Shared install UI ഇവിടങ്ങളിൽ render ചെയ്യുക:

- `/login` mobile login screen.
- `/` landing page-ലെ desktop inline login section സമീപം.

UI behavior:

- Mobile: compact bottom sheet.
- Desktop: login card-ന്റെ താഴെ compact install card/button.
- Android supported: **Install App**.
- iOS Safari: Share icon → **Add to Home Screen** instructions.
- Embedded browser: **Open in Chrome/Safari** guidance; direct handoff URL/browser support ഉള്ളപ്പോൾ മാത്രം action കാണിക്കുക.
- Already installed: UI hidden.
- Login form always usable.

Admin login-ൽ install prompt default ആയി ചേർക്കേണ്ടതില്ല; member app installation ആണ് primary scope.

## 4. Phase B — Service Worker and New Version flow

### B1. Lightweight Service Worker

Add:

- `public/sw.js`
- `src/components/pwa/ServiceWorkerRegistration.tsx`

Initial Service Worker deliberately small ആയിരിക്കണം:

- Navigation requests: network-first.
- Next hashed static assets and safe public icons: conservative runtime cache.
- `/api/**`, auth, admin, payment, receipt, exports: always network; never Cache API.
- POST/PUT/PATCH/DELETE: never cache.
- Offline fallback ആവശ്യമായാൽ later phase-ൽ static shell മാത്രം.
- Development mode-ൽ stale production worker register ചെയ്യരുത്; existing registration cleanup behavior define ചെയ്യണം.

### B2. Build version source

Version priority:

1. Deployment commit SHA/build ID environment variable.
2. Explicit `APP_VERSION`.
3. `package.json` version + build timestamp fallback.

Add:

- `src/lib/appVersion.server.ts`
- `src/app/api/version/route.ts`

Endpoint response:

```json
{
  "version": "<deployment-version>",
  "releasedAt": "<ISO timestamp>"
}
```

Headers:

- `Cache-Control: no-store, max-age=0`.
- No sensitive deployment metadata.

### B3. Update detector UI

Add:

- `src/components/pwa/AppUpdateProvider.tsx`
- `src/components/pwa/AppUpdatePrompt.tsx`

Check version:

- App startup after initial render.
- Window focus.
- Browser returns online.
- Low-frequency interval while app remains open.

When version changes:

- Show **New version available**.
- Actions: **Update now**, **Later**.
- Update now invalidates safe client caches, asks a waiting worker to activate when present, waits for `controllerchange`, and reloads exactly once.
- If no worker is waiting, reload with the new deployment URL normally.
- Do not interrupt an active payment submission or unsaved admin form; postpone prompt until the operation completes.

### B4. Persisted query cache versioning

`src/components/providers/AppQueryProvider.tsx`-ലെ fixed `member-cache-v3` buster release/schema-aware value ആക്കുക.

- App-code-only release-ിൽ unnecessary cache deletion ഒഴിവാക്കുക.
- DTO/schema breaking release-ിൽ buster increment ചെയ്യുക.
- Dashboard/payment data നിലവിലുള്ളതുപോലെ persisted cache-ൽ നിന്ന് exclude ചെയ്യുക.

## 5. Phase C — Admin-managed banner using existing `unit-assets`

### C1. Storage constraints migration

`supabase migration new <descriptive-name>` ഉപയോഗിച്ച് migration generate ചെയ്യുക. Hand-written timestamp filename invent ചെയ്യരുത്.

Migration responsibilities:

- Existing `unit-assets` bucket public ആയി തന്നെ നിലനിർത്തുക.
- Bucket `file_size_limit` = 5,242,880 bytes.
- `allowed_mime_types` = JPEG, PNG, WebP.
- Existing storage policies review ചെയ്യുക; broad access ആവശ്യമില്ലാത്ത roles-ലേക്ക് extend ചെയ്യരുത്.
- `app_settings` seed:
  - namespace: `public_portal`
  - key: `dashboard_banner`
  - value: current local fallback asset metadata
  - `is_public: true`
- No new bucket.

Storage schema tables നേരിട്ട് alter ചെയ്യരുത്. Bucket configuration supported bucket record/API pattern അനുസരിച്ച് മാത്രം update ചെയ്യണം.

### C2. Banner data contract

Add DTO:

```ts
type PublicBannerDTO = {
  bucket: "unit-assets";
  path: string;
  url: string;
  width: number;
  height: number;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  checksum: string;
  updatedAt: string;
};
```

Business tables/settings-ൽ hardcoded Supabase public URL save ചെയ്യരുത്. Bucket/path metadata save ചെയ്ത് URL runtime-ൽ generate ചെയ്യണം.

### C3. Backend layers

Create/extend:

- `src/lib/backend/contracts/publicBanner.contract.ts`
- `src/lib/backend/dto/publicBanner.dto.ts`
- `src/lib/backend/validation/fileSchemas.ts`
- `src/lib/backend/services/publicBannerService.ts`
- `src/lib/backend/adapters/supabase/repositories/supabasePublicBannerRepository.ts`
- `src/lib/backend/composition/publicBannerService.server.ts`

Validation:

- Maximum 5,242,880 bytes.
- Allowed MIME types only.
- Binary signature must match declared MIME.
- Exact recommended aspect 16:9; accepted dimensions may be bounded, but admin UI should prefer 1600 × 900.
- Reject empty/corrupt files.
- Generate checksum server-side.
- Generate safe unique object name; never trust original file path.

Upload sequence:

1. Authenticate admin and require `settings.update`.
2. Validate file.
3. Upload to `unit-assets/public-dashboard-banners/<uuid>.<ext>` without upsert.
4. Insert `storage_files` metadata.
5. Update `app_settings` active pointer and create audit record through one database RPC/transaction.
6. If DB activation fails, delete the just-uploaded object as compensation.
7. Keep previous active file temporarily for rollback; scheduled/manual cleanup can remove older unreferenced files later.

### C4. API routes

Add:

- `GET /api/v1/settings/public-banner` — safe public metadata/URL only.
- `GET /api/v1/admin/settings/public-banner` — admin state/history needed by the form.
- `POST /api/v1/admin/settings/public-banner` — multipart upload + activate.
- Optional `POST /api/v1/admin/settings/public-banner/reset` — restore packaged fallback.

All admin mutations:

- Server-side permission check.
- Normalized backend errors (`UPLOAD_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`, `STORAGE_UPLOAD_FAILED`).
- Request ID.
- Audit log.

### C5. Admin UI

Add settings entry and page:

- `src/components/admin/settings/SettingsDashboard.tsx`
- `src/app/admin/settings/banner/page.tsx`
- `src/components/admin/settings/PublicBannerManager.tsx`

UI content:

- Current image preview.
- File picker/drop zone.
- Hardcoded help text: **Recommended 1600 × 900 px · Maximum 5 MB · JPG, PNG or WebP**.
- Client validation before upload.
- New image preview before save.
- Upload progress/loading state.
- Clear success/error feedback.
- Responsive layout and dark-mode support.

### C6. Public/member consumption

Primary binding:

- `src/components/member/MemberWelcomeBanner.tsx` receives runtime banner DTO/URL instead of static `/social/ssf-alparamba-share.png`.

Fallback:

- API/Storage failure ഉണ്ടായാൽ packaged `/social/ssf-alparamba-share.png` ഉപയോഗിക്കുക.
- New uploads always use unique URL, so browser/CDN പഴയ image നിലനിർത്തില്ല.
- `next/image` remote host configuration ആവശ്യമുണ്ടെങ്കിൽ Next.js 16 local docs അനുസരിച്ച് exact Supabase host pattern configure ചെയ്യുക. Alternative: server proxy/loader only if it gives a real security or caching benefit.

Public landing page-ലും ഇതേ banner ആവശ്യമാണെങ്കിൽ same public endpoint/DTO reuse ചെയ്യുക; duplicate storage setting ഉണ്ടാക്കരുത്.

## 6. Phase D — Community payment progress backend

### D1. Product calculation rule

For each active member:

- Period start = later of January 1 of current India year or member `joined_at` month.
- Period end = current India month, inclusive.
- Expected amount = number of eligible months × member current `monthly_amount`.
- Paid amount = sum of `payment_months.amount` joined to payments that are:
  - category `monthly_dues`
  - status `confirmed`
  - not voided
  - month key within period
- Progress = `round(min(100, paid / expected × 100))`.
- If expected amount is zero, percentage is undefined/null rather than falsely showing 100%.

This produces “current year so far” progress. Historical monthly-tier changes are not stored as an obligations ledger; therefore the current `monthly_amount` is the available baseline. If historical rate accuracy becomes required, add a separate monthly obligations ledger in a later scoped migration.

### D2. Efficient database query

Generate a Supabase migration for a set-based RPC/function that returns paginated directory rows plus `payment_progress_percent`.

Requirements:

- No N+1 queries.
- Filter/search/pagination behavior must remain compatible with the current directory.
- `SECURITY INVOKER` preferred.
- Revoke execute from `PUBLIC`, `anon`, `authenticated`; grant only to `service_role` because the application API authenticates the actor.
- Add/verify indexes supporting confirmed member monthly-payment lookup and `payment_months.month_key` joins.
- Do not expose raw payment totals in the Community DTO.

### D3. Repository/API wiring

Update:

- `SupabaseMemberRepository.listDirectory()` to call the aggregate RPC.
- Existing mapper can consume returned `payment_progress_percent`.
- Existing authenticated `/api/v1/member/directory` route remains the public boundary.
- `MemberDirectoryItemDTO.paymentProgressPercent` can remain optional/null-safe.

### D4. UI behavior

Update Community drawer:

- Show `NN% paid` and `100 - NN% remaining`.
- Progress bar width clamp 0–100.
- Zero expected amount: “Payment plan not configured”.
- Backend failure: directory error state; never fabricate a percentage.
- Keep exact amount details private; percentage only.

## 7. Security and privacy checks

- Service-role key server-only.
- UI components never call Supabase directly.
- Banner upload requires `settings.update`.
- Validate upload on client, server, and bucket.
- Use unique object paths; no untrusted filenames.
- Do not permit SVG/scriptable image uploads.
- Audit banner upload, activation, reset, and deletion.
- Community directory remains authenticated.
- Community API returns percentage only, not another member's payment rows or exact paid/due amount.
- Service Worker excludes all sensitive API/cache paths.

## 8. Verification plan

### PWA/install matrix

- Android Chrome: install CTA and native prompt.
- Android Samsung Internet: available install/shortcut path.
- Android Firefox/Edge/Brave: fallback behavior and manual install path.
- iPhone Safari: Add to Home Screen guidance and standalone launch.
- iPhone third-party browser: Share/Add to Home Screen availability or fallback.
- WhatsApp/Instagram/Facebook embedded browser: full-browser guidance.
- Already-installed state: no repeated prompt.

### Update flow

- Deploy version A, install/open app, deploy version B.
- App detects version B on focus/online/interval.
- Update now reloads once and displays version B.
- Active payment submission is not interrupted.
- Auth/payment/admin API responses do not appear in Cache Storage.

### Banner

- Valid 1600 × 900 JPG/PNG/WebP under 5 MB succeeds.
- Over 5 MB, invalid MIME, renamed executable, corrupt image fail.
- Admin without `settings.update` is denied.
- New image becomes visible without stale CDN/browser copy.
- Storage metadata, active setting, and audit log agree.
- Failed DB activation cleans the orphaned upload.

### Community progress

- Confirmed monthly payment increases percentage.
- Pending/failed/cancelled/refunded/voided payment does not.
- Special event does not.
- Member joined during current year uses joined month.
- Zero monthly amount returns undefined state.
- Pagination/search/blood-group filtering remain correct.
- RLS/API prevents anonymous access and raw payment disclosure.

## 9. Deployment order

1. Apply generated database migration(s) and review advisors.
2. Confirm existing `unit-assets` bucket constraints/policies.
3. Deploy backend DTO/service/repository/API changes.
4. Deploy PWA assets, install UI, Service Worker, and update controller.
5. Deploy admin banner UI and runtime banner consumption.
6. Deploy Community progress UI wiring.
7. Verify production HTTPS manifest, icons, worker scope, version endpoint, and banner URL.
8. Run the physical-device matrix before announcing installation support.

## 10. Completion criteria

Implementation is complete only when:

- Chrome-supported devices can install from the login/landing UI.
- Safari users receive correct native Add to Home Screen instructions and the installed web app opens standalone.
- Existing installed app detects and applies a new deployment through the version prompt.
- Admin can upload and activate a validated banner through `unit-assets`.
- Banner automatically changes on the member/public surface using a new versioned URL.
- Community percentages are calculated by backend confirmed-payment data.
- Security, RLS/API permissions, audit logs, and physical-device checks pass.
