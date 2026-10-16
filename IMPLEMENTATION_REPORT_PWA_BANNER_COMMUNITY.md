# PWA, Dashboard Banner, Community Progress — Implementation Report

Date: 2026-10-16

## നടപ്പാക്കിയ ഭാഗങ്ങൾ

### 1. PWA install experience

- Login/public entry screen-ൽ custom install panel ചേർത്തു.
- Chromium browsers നൽകുന്ന native `beforeinstallprompt` event ലഭിക്കുമ്പോൾ direct **Install App** action കാണിക്കും.
- iPhone/iPad Safari-ൽ **Share → Add to Home Screen** guidance കാണിക്കും.
- WhatsApp, Instagram, Facebook പോലുള്ള embedded browsers-ൽ Chrome/Safari-ൽ തുറക്കാനുള്ള guidance കാണിക്കും.
- Already installed standalone app-ൽ install panel കാണിക്കില്ല.
- Supported Chromium browsers installed PWA കണ്ടെത്തുമ്പോൾ website panel **Open App** action ആയി മാറും.
- `Open App` member dashboard deep link ഉപയോഗിക്കും; browser link capture enable ചെയ്തിട്ടുണ്ടെങ്കിൽ installed app focus ചെയ്യും.
- User dismiss ചെയ്താൽ മൂന്ന് ദിവസം വീണ്ടും panel കാണിക്കില്ല.
- Manifest start URL member dashboard-ലേക്ക് മാറ്റി; unauthenticated user നിലവിലുള്ള auth redirect വഴി login screen-ലേക്ക് എത്തും.
- Correct-size 192 px, 512 px, maskable 512 px, Apple 180 px icons ചേർത്തു.

### 2. Installed app update notification

- Production build-ൽ lightweight service worker register ചെയ്യും.
- Service worker authenticated/payment responses cache ചെയ്യുന്നില്ല.
- Version endpoint deployment commit/version expose ചെയ്യും.
- Version check standalone app-ൽ മാത്രം നടക്കും.
- Fixed interval polling ഇല്ല. App open ചെയ്തതിന് ശേഷം ഒരിക്കൽ, പിന്നീട് focus/online event വന്നാൽ 30-minute throttle സഹിതം മാത്രം check ചെയ്യും.
- New version കണ്ടെത്തുമ്പോൾ **New version available** panel, **Later**, **Update now** actions കാണിക്കും.

### 3. Admin-managed member dashboard banner

- പുതിയ Supabase bucket ഉണ്ടാക്കിയിട്ടില്ല; existing `unit-assets` bucket reuse ചെയ്യുന്നു.
- Admin route: `/admin/settings/banner`.
- Recommended image size UI-ൽ hardcode ചെയ്തു: **1600 × 900 px (16:9)**.
- Accepted formats: JPG, PNG, WebP.
- Maximum file size: 5 MB.
- Browser-side size/type/aspect-ratio validation ഉണ്ട്.
- Server-side size/type/file-signature validation ഉണ്ട്.
- Upload permission: `settings.update`.
- Current banner read permission: `settings.view` or `settings.update`.
- Upload metadata `storage_files`-ലും active reference `app_settings`-ലും save ചെയ്യും.
- Successful replacement കഴിഞ്ഞാൽ പഴയ banner file best-effort cleanup ചെയ്യും.
- Change audit log-ൽ record ചെയ്യും.
- Member dashboard banner React Query shared cache ഉപയോഗിക്കുന്നു; mobile/desktop duplicate components ഒരേ request share ചെയ്യും.
- Banner query fixed polling ചെയ്യുന്നില്ല. Five-minute stale window കഴിഞ്ഞ് page mount/focus സമയത്ത് മാത്രം refresh ചെയ്യും.
- API/storage unavailable ആയാലും bundled fallback banner കാണും.

### 4. Community payment progress

- Member directory-യിലെ payment percentage backend data-യുമായി ബന്ധിപ്പിച്ചു.
- Current calendar year-ൽ member join ചെയ്ത മാസം മുതൽ current month വരെ expected monthly dues calculate ചെയ്യും.
- `confirmed` + `monthly_dues` + non-voided payments മാത്രം count ചെയ്യും.
- Paid percentage 100-ൽ cap ചെയ്യും; UI paid and remaining percentages കാണിക്കും.
- ഓരോ member-നും separate API/database call ഇല്ല.
- Filter, payment aggregation, percentage, pagination, total count എന്നിവ single SQL RPC-ൽ നടക്കും.
- Search debounce, infinite pagination, React Query cache എന്നിവ നിലവിലെ optimized flow-ൽ തുടരുന്നു.

## Supabase migration

Deploy ചെയ്യേണ്ട migration:

`supabase/migrations/20261016035650_pwa_banner_and_community_progress.sql`

Migration ചെയ്യുന്നത്:

1. Existing `unit-assets` bucket-ന് 5 MB limit, supported MIME types set ചെയ്യുന്നു.
2. Confirmed monthly-payment aggregation-ന് partial indexes ചേർക്കുന്നു.
3. `member_directory_with_progress` paginated RPC create ചെയ്യുന്നു.
4. RPC execute permission `service_role`-ലേക്ക് മാത്രം പരിമിതപ്പെടുത്തുന്നു.

## Performance and side-effect controls

- Service worker response caching intentionally ഒഴിവാക്കി.
- Browser users-ന് version API call ഇല്ല; standalone app-ൽ മാത്രം event-driven check.
- Banner request shared and cached; interval polling ഇല്ല.
- Community progress N+1 query ഇല്ല; one RPC per directory page.
- Existing bucket reuse ചെയ്തതിനാൽ extra storage infrastructure ഇല്ല.
- Existing fallback banner retains availability during backend errors.
- Existing auth and route hierarchy മാറ്റിയിട്ടില്ല.

## Verification completed

- `npx tsc --noEmit` — passed.
- Changed TypeScript/TSX files ESLint check — passed after removing the only unused import warning.
- PWA icon dimensions verified: 192×192, 512×512, 512×512 maskable, 180×180 Apple icon.
- Automated test suite run ചെയ്തിട്ടില്ല.

## Deployment notes

1. Supabase migration deploy ചെയ്യുക.
2. Production environment-ൽ `APP_VERSION` set ചെയ്യാം. ഇത് ഇല്ലെങ്കിൽ supported deployment commit environment variables ഉപയോഗിക്കും.
3. Next.js application deploy ചെയ്യുക.
4. Real Android Chrome, iPhone Safari, installed standalone mode എന്നിവയിൽ install/update flow verify ചെയ്യുക. Native install prompt display timing browser control ചെയ്യുന്നതാണ്; custom install guidance login screen-ൽ application control ചെയ്യുന്നു.
