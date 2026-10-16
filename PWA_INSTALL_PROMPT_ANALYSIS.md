# PWA, App Update, Public Image, Community Progress — Analysis Report

Date: 2026-10-16  
Scope: Local repository code review only. Application code, Supabase project, and production data were not changed.

## 1. Executive summary

ഈ project-ൽ അടിസ്ഥാന PWA manifest ഉണ്ട്. എന്നാൽ install prompt controller, Service Worker, app update detector, അല്ലെങ്കിൽ login screen install UI ഇല്ല. അതിനാൽ എല്ലാ browser-ുകളിലും ഒരേ രീതിയിൽ install popup വരുമെന്ന് പ്രതീക്ഷിക്കാനാവില്ല.

Public/member page image ഇപ്പോൾ local static file ആണ്. Supabase-ൽ public `unit-assets` bucket migration നിലവിലുണ്ട്; എന്നാൽ admin upload API, server-side 5 MB validation, active-image setting, storage service wiring എന്നിവ ഇല്ല.

Community page-ൽ payment percentage കാണിക്കാനുള്ള UI/DTO placeholder ഉണ്ട്. പക്ഷേ repository query percentage select/calculate ചെയ്യുന്നില്ല; migration schema-ലും `payment_progress_percent` field/view കണ്ടെത്തിയില്ല. അതിനാൽ ഈ feature നിലവിൽ backend-ുമായി connected അല്ല.

## 2. Current PWA status

### ഇതിനകം ഉള്ളത്

- `src/app/manifest.ts`-ൽ app name, `start_url`, root scope, `display: "standalone"`, theme/background colors എന്നിവ ഉണ്ട്.
- Manifest-ൽ 192 px, 512 px, maskable icon entries ഉണ്ട്.
- `src/app/layout.tsx` `/manifest.webmanifest` link ചെയ്യുന്നു; `appleWebApp.capable` ഉണ്ട്.
- Public login route: `src/app/login/page.tsx`.
- Admin login route: `src/app/admin/login/page.tsx`.

### കണ്ടെത്താത്തത്

- `beforeinstallprompt` listener.
- Saved install event + user-triggered `prompt()` flow.
- `appinstalled` handler.
- Standalone-mode detection.
- Service Worker file/registration.
- App-owned install modal/banner.
- Browser/platform-specific install instructions.
- App version endpoint or update-available UI.

### Icon defect

`public/icons/pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png` എന്നീ മൂന്ന് files-ഉം യഥാർത്ഥത്തിൽ 1254 × 1254 px ആണ്. Manifest അവയെ 192 × 192, 512 × 512 എന്നിങ്ങനെ declare ചെയ്യുന്നു. Production-ിനു മുൻപ് declaration-നോട് match ചെയ്യുന്ന exact-size image files generate ചെയ്യണം. iOS consistency-ക്കായി explicit Apple touch icon-ും നൽകണം.

## 3. എല്ലാ phone/browser-ുകളിലും install ചെയ്യാനുള്ള യാഥാർത്ഥ്യം

Native install dialog website code ഉപയോഗിച്ച് നിർബന്ധമായി auto-open ചെയ്യാൻ കഴിയില്ല. Browser ആണ് install eligibility തീരുമാനിക്കുന്നത്.

- Android Chrome/Chromium: installable ആണെങ്കിൽ `beforeinstallprompt` ലഭിക്കാം. Event save ചെയ്ത് login screen-ലെ **Install App** button user tap ചെയ്തപ്പോൾ മാത്രം native prompt വിളിക്കണം.
- Samsung Internet/മറ്റ് Android browser-ുകൾ: wording, WebAPK/shortcut behavior, event support എന്നിവ വ്യത്യാസപ്പെടാം.
- iPhone/iPad Safari: Chromium `beforeinstallprompt` support ഇല്ല. User Share/Page Menu → **Add to Home Screen** തിരഞ്ഞെടുക്കണം. App-owned modal ഈ steps കാണിക്കാം.
- iOS 16.4+ third-party browsers: browser implementation അനുസരിച്ച് Share menu വഴി Add to Home Screen നൽകാം; എല്ലാ in-app browser-ുകളും ഇത് നൽകുമെന്ന് ഉറപ്പില്ല.
- WhatsApp/Facebook/Instagram പോലുള്ള embedded browsers: installation API ഇല്ലാത്ത സാഹചര്യം സാധാരണമാണ്. **Open in browser** guidance നൽകണം.
- App ഇതിനകം installed ആണെങ്കിൽ install UI hide ചെയ്യണം.

### Recommended login experience

Login screen തുറക്കുമ്പോൾ app-owned bottom sheet/modal കാണിക്കുക. അതിൽ browser capability അനുസരിച്ച് content മാറണം:

1. Native install event ലഭ്യമെങ്കിൽ: **Install App** button.
2. iOS Safari ആണെങ്കിൽ: Share → Add to Home Screen instructions.
3. Embedded browser ആണെങ്കിൽ: Chrome/Safari-ൽ തുറക്കാനുള്ള instruction.
4. Already installed/standalone ആണെങ്കിൽ: modal കാണിക്കരുത്.
5. Dismiss ചെയ്താൽ login തടയരുത്; dismiss cooldown local storage-ൽ സൂക്ഷിക്കാം.

Browser native prompt page load-ൽ force ചെയ്യാൻ കഴിയാത്തതിനാൽ app-owned modal auto-show ചെയ്യാം; native confirmation user tap-നുശേഷം മാത്രം തുറക്കണം.

## 4. New Version / App Update system

Installed PWA ഒരു Play Store/App Store binary അല്ല. സാധാരണയായി പുതിയ deployment browser വഴി ലഭിക്കും. എന്നാൽ long-running app window, browser cache, Service Worker waiting state, local persisted data എന്നിവ കാരണം പഴയ version തുടരാം.

ഈ repository-ൽ Service Worker ഇല്ല; അതിനാൽ controlled PWA update lifecycle നിലവിലില്ല. `package.json` version `0.1.0` മാത്രമാണ്; runtime version check ചെയ്യുന്ന code ഇല്ല.

`AppQueryProvider` ചില member query data local storage-ൽ പരമാവധി 21 ദിവസം persist ചെയ്യുന്നു. Financial dashboard/payments exclude ചെയ്തിട്ടുണ്ടെങ്കിലും മറ്റു cached data പഴയതായി തോന്നാം. `buster` ഇപ്പോൾ സ്ഥിരമായ `member-cache-v3` value ആണ്; release-specific invalidation ഇല്ല.

### Recommended update architecture

- ഓരോ deployment-നും unique build/version value നൽകുക: commit SHA, CI build ID, അല്ലെങ്കിൽ `APP_VERSION`.
- `/api/version` പോലൊരു lightweight endpoint `Cache-Control: no-store` ഉപയോഗിച്ച് current version return ചെയ്യണം.
- Client app start, focus, online event, കൂടാതെ safe interval-ൽ version check ചെയ്യണം.
- Version മാറിയാൽ **New version available** banner/modal കാണിക്കുക.
- User **Update now** അമർത്തുമ്പോൾ:
  - pending UI work/save state പരിശോധിക്കുക;
  - relevant client caches invalidate ചെയ്യുക;
  - പുതിയ Service Worker waiting ആണെങ്കിൽ activate message അയയ്ക്കുക;
  - controller മാറിയ ശേഷം ഒരിക്കൽ മാത്രം reload ചെയ്യുക.
- **Later** option നൽകാം; critical security release-ുകൾക്ക് മാത്രം stronger prompt ഉപയോഗിക്കുക.

### Service Worker strategy

- Navigation/HTML: network-first അല്ലെങ്കിൽ freshness-first.
- Version endpoint, auth, payment, receipt, admin API: cache ചെയ്യരുത്.
- Hashed JS/CSS/static assets: safe cache strategy ഉപയോഗിക്കാം.
- Public banner image: unique versioned object path ഉപയോഗിക്കുക; പഴയ URL overwrite ചെയ്യാതിരിക്കുക.
- `skipWaiting()` blindly വിളിക്കരുത്. പഴയ page code-നും പുതിയ worker-നും ഇടയിൽ incompatibility വരാം. User-controlled update flow സുരക്ഷിതമാണ്.
- Offline support ആവശ്യമെങ്കിൽ മാത്രം limited offline shell ചേർക്കുക; payment/auth data offline cache ചെയ്യരുത്.

## 5. Public/member image: current status

രണ്ട് static image usages ശ്രദ്ധേയമാണ്:

- Landing page logo/hero: `/logo/atiyya-hero.png` (2172 × 724).
- Member dashboard welcome banner: `/social/ssf-alparamba-share.png` (1200 × 630).

`MemberWelcomeBanner` 16:9 container-ൽ `object-cover` ഉപയോഗിക്കുന്നു. നിലവിലെ 1200 × 630 image 16:9 അല്ലാത്തതിനാൽ ചെറിയ crop ഉണ്ടാകാം. User പറഞ്ഞ admin-managed image-നുള്ള ഏറ്റവും സാധ്യതയുള്ള target ഈ dashboard welcome banner ആണ്.

### Hardcoded upload specification

- Recommended canvas: **1600 × 900 px (16:9)**.
- Maximum file size: **5 MB (5,242,880 bytes)**.
- Allowed MIME types: `image/webp`, `image/jpeg`, `image/png`.
- Recommended output: WebP/JPEG, സാധാരണയായി 500 KB-ൽ താഴെ ലക്ഷ്യമിടുക.
- SVG, GIF എന്നിവ ഈ banner upload-ൽ അനുവദിക്കാതിരിക്കുന്നത് സുരക്ഷയ്ക്കും performance-നും നല്ലത്.
- Admin UI-ൽ: “Recommended size: 1600 × 900 px · Maximum: 5 MB · JPG, PNG or WebP” എന്ന് hardcode ചെയ്ത് കാണിക്കുക.

5 MB validation client-ൽ മാത്രം മതിയല്ല. Client preview validation + server validation + bucket-level file-size/MIME restriction എന്നിങ്ങനെ മൂന്ന് തലത്തിൽ വേണം. Server content type, decoded dimensions/file signature എന്നിവയും പരിശോധിക്കണം.

## 6. Supabase Storage status and recommended wiring

### Repository-ൽ ഇതിനകം ഉള്ളത്

- `supabase/migrations/012_storage_buckets.sql` public `unit-assets` bucket create ചെയ്യുന്നു.
- അതേ migration public read policy, admin storage policy എന്നിവ define ചെയ്യുന്നു.
- `storage_files` metadata table migration ഉണ്ട്.
- Backend architecture public-safe unit assets Storage metadata വഴി കൈകാര്യം ചെയ്യണമെന്ന് പറയുന്നു.

### ഇപ്പോൾ ഇല്ലാത്തത്

- Banner upload service/repository/API.
- Admin banner management section.
- 5 MB server-side validation.
- Banner image setting/active pointer.
- Public page-ൽ runtime Storage URL fetch.
- Upload/replace/delete audit log.
- Existing image rollback/history UI.

### Recommended implementation

പുതിയ bucket നിർബന്ധമല്ല; നിലവിലെ public `unit-assets` bucket-ിലെ `public-dashboard-banners/` folder ഉപയോഗിക്കുന്നത് ലളിതമാണ്. Banner-ിന് പ്രത്യേക bucket-level 5 MB/MIME policy വേണമെങ്കിൽ `public-banners` എന്ന dedicated public bucket create ചെയ്യാം.

Recommended data flow:

1. Admin Settings-ൽ **Public Banner** section.
2. Client file size/type/dimension preview.
3. Permission-protected server API (`settings.update` അല്ലെങ്കിൽ dedicated permission).
4. Server validates file and uploads unique path, ഉദാ. `dashboard/2026-10/<uuid>.webp`.
5. `storage_files`-ൽ bucket/path/MIME/size/checksum/metadata save ചെയ്യുക.
6. `app_settings`-ൽ active banner pointer സൂക്ഷിക്കുക, ഉദാ. namespace `public_portal`, key `dashboard_banner`.
7. Public/member UI active setting വായിച്ച് runtime public URL generate ചെയ്യുക.
8. Upload + activation audit log create ചെയ്യുക.
9. New object activate ചെയ്ത ശേഷം old object delayed cleanup/rollback policy അനുസരിച്ച് കൈകാര്യം ചെയ്യുക.

Same object path overwrite ചെയ്യാതിരിക്കുക; CDN/browser cache കാരണം പഴയ image തുടരാം. ഓരോ upload-നും unique path ഉപയോഗിച്ചാൽ admin save ചെയ്ത ഉടൻ പുതിയ URL ലഭിക്കും.

UI component Supabase client നേരിട്ട് import ചെയ്യരുത്. Existing architecture അനുസരിച്ച് UI → API/service → repository → Supabase adapter flow പാലിക്കണം. Service-role key server-side മാത്രം വേണം.

## 7. Community payment percentage: actual backend status

### UI/data contract-ൽ ഉള്ളത്

- `MemberDirectoryItemDTO`-ൽ optional `paymentProgressPercent` field ഉണ്ട്.
- Mapper `row.payment_progress_percent` വായിക്കുന്നു.
- Community drawer percentage/progress bar render ചെയ്യുന്നു.
- Value ഇല്ലെങ്കിൽ UI “Payment progress will appear after payment setup” എന്നും `--` എന്നും കാണിക്കുന്നു.

### Backend gap

`SupabaseMemberRepository.listDirectory()` members table-ൽ നിന്ന് താഴെപ്പറയുന്ന fields മാത്രം select ചെയ്യുന്നു:

`id, member_code, name, phone, area, blood_group, is_blood_donor, donor_available`

`payment_progress_percent` select ചെയ്യുന്നില്ല. Members schema-ലും migrations-ലും ആ column/view/calculation കണ്ടെത്തിയില്ല. Payments aggregate ചെയ്ത് percentage calculate ചെയ്യുന്ന directory query/RPC-യും ഇല്ല.

**Conclusion:** Community payment percentage നിലവിൽ backend-connected feature അല്ല; UI placeholder മാത്രം ആണ്.

### Percentage definition ആദ്യം സ്ഥിരപ്പെടുത്തണം

Percentage കൃത്യമായി നിർവചിക്കാതെ implementation ചെയ്യരുത്. Recommended formula:

`confirmed monthly-dues amount for selected period ÷ expected monthly-dues amount for same period × 100`

Rules:

- `confirmed` payments മാത്രം count ചെയ്യുക.
- `pending`, `failed`, `cancelled`, `refunded`, voided payments ഒഴിവാക്കുക.
- Special-event donations monthly payment progress-ൽ ചേർക്കരുത്.
- Period വ്യക്തമാക്കണം: current calendar year, financial year, അല്ലെങ്കിൽ membership start മുതൽ current month വരെ.
- Custom monthly amount/tier changes ചരിത്രപരമായി എങ്ങനെ കണക്കാക്കണം എന്ന് തീരുമാനിക്കണം.
- Percentage 0–100 clamp ചെയ്യണോ, advance payment 100% കവിഞ്ഞ് കാണിക്കണോ എന്ന് product rule വേണം.
- ഇത് sensitive financial status ആണെങ്കിൽ Community directory-ൽ എല്ലാ members-ക്കും കാണിക്കുന്നതിന് privacy approval വേണം. Public anonymous API ആക്കരുത്.

### Recommended backend shape

- Per-row N+1 queries ഒഴിവാക്കുക.
- ഒരു server-side aggregate query/RPC അല്ലെങ്കിൽ security-invoker view ഉപയോഗിക്കുക.
- API authenticated member/admin actor മാത്രം സ്വീകരിക്കുക.
- Raw payment rows/amount details expose ചെയ്യാതെ percentage DTO മാത്രം return ചെയ്യുക.
- Appropriate indexes ഉപയോഗിക്കുക: `payments(member_id, status, category, paid_at/recorded_at)` and relevant `payment_months` index.
- Exact period/formula unit tests, RLS tests, confirmed-only tests നിർബന്ധമാണ്.

## 8. Implementation order

1. PWA icons exact dimensions + Apple touch icon.
2. Login install controller/modal with Android/iOS/in-app-browser fallbacks.
3. Version endpoint + update banner; ശേഷം carefully scoped Service Worker.
4. Banner setting/schema + Storage upload service + admin section + runtime image.
5. Community progress business rule approval.
6. Aggregate backend query/RPC + authenticated API + UI wiring.
7. Physical-device verification and production HTTPS smoke test.

## 9. Acceptance checklist

- Android Chrome-ൽ login screen install CTA കാണുകയും tap ചെയ്താൽ native confirmation തുറക്കുകയും ചെയ്യുന്നു.
- iOS Safari-ൽ correct Add to Home Screen instructions കാണുന്നു.
- Unsupported/in-app browser-ൽ full-browser guidance കാണുന്നു.
- Already-installed mode-ൽ install prompt ആവർത്തിക്കില്ല.
- New deployment വന്നാൽ installed app-ൽ **New version available** കാണുന്നു; update safe ആയി reload ചെയ്യുന്നു.
- Auth/payment/admin endpoints Service Worker cache ചെയ്യുന്നില്ല.
- Admin 5 MB-ൽ കൂടുതലുള്ള banner upload ചെയ്യാൻ കഴിയില്ല.
- 1600 × 900 specification UI-ൽ വ്യക്തമായി കാണുന്നു.
- Saved banner public/member page-ൽ പുതിയ versioned URL ഉപയോഗിച്ച് സ്വയം മാറുന്നു.
- Upload/activation permission-protected and audited ആണ്.
- Community percentage confirmed monthly payments മാത്രം ഉപയോഗിച്ച് approved period-നായി calculate ചെയ്യുന്നു.
- Pending/failed/cancelled/refunded/voided payment percentage-ൽ വരില്ല.

## 10. Verification limitation

ഈ report local source/migrations അടിസ്ഥാനമാക്കിയതാണ്. Live Supabase schema/data പരിശോധിച്ചിട്ടില്ല. `http://127.0.0.1:3000/manifest.webmanifest` request ഈ repository-ന്റെ Atiyya app-ിനു പകരം വേറൊരു Raihsoft site-ന്റെ 404 return ചെയ്തു. അതിനാൽ correct local port അല്ലെങ്കിൽ production URL ഉപയോഗിച്ച് manifest headers, icons, Service Worker, Storage policies, physical-device install behavior എന്നിവ പിന്നീട് verify ചെയ്യണം.

## 11. Official references

- MDN — `beforeinstallprompt`: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event
- MDN — Trigger PWA installation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt
- web.dev — Browser/platform installation behavior: https://web.dev/learn/pwa/installation
- web.dev — PWA update lifecycle: https://web.dev/learn/pwa/update
- MDN — Service Worker `updatefound`: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/updatefound_event
- Apple Support — Add a website as an iPhone web app: https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/27/ios/27
- WebKit — iOS/iPadOS Home Screen web apps: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- Supabase — Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase — Storage schema and bucket constraints: https://supabase.com/docs/guides/storage/schema/design
- Supabase — Upload file size restrictions: https://supabase.com/docs/guides/troubleshooting/upload-file-size-restrictions-Y4wQLT
