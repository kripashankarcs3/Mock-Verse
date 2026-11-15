# Mock-Verse — Audit, Fixes & Remaining Work

**Updated:** 2026-11-14
**Branch:** `feat/monaco-editor` (nothing committed yet — working tree only)
**Method:** 4 parallel deep audits (backend API, practice/judge UI, app shell/auth, live runtime + hygiene) + browser verification of the login screen (light/dark/mobile).
**Live env:** frontend Vite `:5173` ✅ · backend Express `:5001` ✅ · Judge0 public API ✅ · MongoDB ❌ (Atlas IP not allowlisted) · Firebase Admin ❌ (placeholder service-account key)

---

## 1. Live status (what works right now)

| Area | Status |
|------|--------|
| Login page (light / dark / mobile scroll) | ✅ renders, no console errors |
| Run code (Judge0) | ✅ `POST /api/execution/run-code` → 200 in ~2 s |
| Submit code | ⚠️ returns clean `503 DB_UNAVAILABLE` until MongoDB connects |
| Problems / users / submissions API | ⚠️ clean `503` in <1 s (no more 10 s hangs) |
| Auth-protected backend routes | ⚠️ clean `503 AUTH_UNAVAILABLE` until a real service-account key is added |
| Practice workspace | ✅ output visible, blank-case guard, race guard, persistence, mobile stack |
| Production build | ✅ `vite build` passes (1668 modules) |

---

## 2. Fixed and verified

### Repo hygiene / security
| ID | Fix | Where |
|----|-----|-------|
| BLK-3 | Untracked `frontend/.env` + `backend/serviceAccountKey.json` from git (files kept locally) | `git rm --cached` |
| BLK-4 | Untracked build junk: `frontend/dist`, 10 MB `esbuild-local.exe`, build logs, `App`-related scratch files, accidental `et --hard d65e1bf` | git index |
| HYG-1 | `.gitignore` rewritten: env files, service-account keys, `dist/`, `build/`, `*.log`, `*.exe`, editor/tool dirs, scratch files | `.gitignore`, `backend/.gitignore` |
| HYG-2 | Deleted 8 unreachable files: `App.backup.jsx`, `CodingPlatform.jsx`, `ProblemsPage.jsx`, `AppShell.jsx`, `DashboardPremium.jsx`, `ProfileDropdown.jsx`, `ProfileModal.jsx`, `ProtectedRoute.jsx` (zero remaining references, build re-verified) | git index |
| HYG-3 | Dependency bumps: frontend **2 critical → 0** (dompurify pinned to 3.4.18 via `overrides`), backend **3 critical + 9 high → 0 critical / 0 high**. Remaining: 4 high in frontend (unused Firebase Firestore/grpc chain), 9 moderate backend transitives | `frontend/package.json`, both lockfiles |

### Backend — reliability & error contract
| ID | Fix | Where |
|----|-----|-------|
| BE-1 | `mongoose.set("bufferCommands", false)` + `requireDB` gate → instant `503 {code:"DB_UNAVAILABLE"}` instead of 10 s hang | `config/db.js`, `middleware/dbReady.js`, `server.js` |
| BE-10 | Central JSON 404 + error handler; no stack traces/paths; 400 for bad JSON, 413 for oversized body, 400 for Cast/Validation errors | `middleware/errorHandler.js` |
| BE-17 | `/health` + `/api/health` report DB state, Judge0 mode, uptime; added `GET /api/problems/:id`; versioned health response | `server.js`, `routes/problems.js` |
| BE-11/13/14 | ObjectId guards → 400; strict boolean parsing; caps on test cases (50 × 10 k chars), description, code length | `routes/problems.js`, `controllers/codeController.js` |
| BE-15 | Judge0 service: request timeouts, 30 s overall deadline, 429 / 5xx / unreachable mapped to 429 / 502 / 504 (never 500) | `services/judge0Service.js`, `controllers/codeController.js` |
| BE-16 | Clients get generic `Internal server error`; details go to server log only | `middleware/errorHandler.js` |

### Backend — auth, ownership, abuse control
| ID | Fix | Where |
|----|-----|-------|
| BE-2 | Strict `Bearer <token>` parsing; `503 AUTH_UNAVAILABLE` when Firebase Admin is missing (was 500); token errors logged without secrets | `middleware/auth.js` |
| BE-3/12 | Problem create/update/delete require auth; `createdBy` derived from token; ownership enforced; field whitelist (no mass assignment) | `routes/problems.js` |
| BE-4 | `Submission` stores `firebaseUID` (string) instead of casting a UID into an ObjectId (was 500 on every submission route) | `models/Submission.js`, `routes/submissions.js` |
| BE-5/6 | `POST /api/users` derives UID from the token, validates email; `GET /api/users/:uid` and `/me` are self-only, email exposed only to the owner | `routes/users.js` |
| BE-7 | Submissions are self-only (`/user/:userId` → 403 for someone else) | `routes/submissions.js` |
| BE-8 | `submit-code` no longer trusts a body `userId`; attributes history from the verified token; ignores DB failures so a verdict is never lost | `controllers/codeController.js` |
| BE-9 | In-memory rate limiter (60 req/min/IP on execution), 1 MB JSON cap, CORS allowlist via `CLIENT_ORIGIN`, `x-powered-by` off | `middleware/rateLimit.js`, `server.js` |
| BE-19 | Axios client adds `Authorization: Bearer <idToken>`, 45 s timeout | `frontend/src/services/api.js` |
| BE-21 | User upsert returns 200/201 correctly, `returnDocument: "after"`, defaults on insert | `routes/users.js` |
| — | Graceful shutdown (SIGINT/SIGTERM), explicit `EADDRINUSE` message | `server.js` |
| — | `.env.example` documents `NODE_ENV`, `CLIENT_ORIGIN`, `MONGO_TIMEOUT_MS`, `FIREBASE_SERVICE_ACCOUNT_PATH`, Judge0 defaults | `backend/.env.example` |

### Practice workspace (`PracticeWorkspace.jsx`)
| ID | Fix |
|----|-----|
| UI-1 | **Run output is now visible** — new Terminal pane (status, stdout, compiler/stderr, time, memory, clear button) |
| UI-2 | Blank input/expected cases are skipped; if none remain, submit is blocked with a clear message (no more false “Accepted”) |
| UI-3 | Code fallback uses `??`, so clearing the editor no longer resurrects the template |
| UI-4 | Run/submit guarded by a run token + question ref + `isJudging`; stale results are discarded when switching questions |
| UI-5 | Logout no longer wipes `localStorage`/`sessionStorage` (saved problems and code survive) |
| UI-6 | Deleting the last question clears the active selection, shows a proper empty state, and removes orphaned problem/code records |
| UI-7 | Pass/fail icon + colour per case; expected/actual are safe against missing fields; compiler/stderr shown in a red block |
| UI-8 | Language choice persisted (`pw_language`) |
| UI-9 | Monaco gets a per-question/per-language `path` → separate undo history; Reset no longer bleeds across questions |
| UI-10 | New-question numbering uses the last numeric segment (26.1.5 → Q6) |
| UI-11 | Deleting no longer renumbers everything (kept ids stable); storage side effects moved out of state updaters |
| UI-12 | Test-case edits are immutable copies (no shared default-object corruption) |
| UI-13 | localStorage writes debounced (400 ms) + flushed on unmount; quota errors no longer crash |
| UI-16 | Below 1024 px the two panels stack vertically (each 50 %) instead of overflowing; divider hidden |
| — | Dark-mode pass: left-panel background, description text, results stat cards, case headers, output pills, progress bar, close button |
| UI-17 | Removed dead “Debug”/“View” buttons |
| UI-18 | Timer stops on successful submit (still starts on first keystroke) |
| UI-19 | `ProgressSummary` shows a neutral state for 0 test cases (was 100 % green) |
| UI-20 | Removed dead `mockTestCases`, `defaultCode`, `expandedCase`, `bottomTab`, `showResultsPanel`, unused imports |
| — | Mobile/desktop: sidebar, Monaco layout, and terminal sizes re-measure correctly |

### App shell / auth / dashboard
| ID | Fix |
|----|-----|
| APP-1 | Profile is built from the real Firebase user (name, email, photo, initials, member-since). Fake “Alex Johnson / 2120 / 487” stats replaced with neutral values |
| APP-2 | Firebase config is validated; a clear “Authentication unavailable” screen replaces blank/forever-spinner; `onAuthStateChanged` has an error path + 8 s safety timeout |
| APP-3 | Current view persists in `sessionStorage` (refresh no longer kicks you back to the dashboard) |
| APP-4 | Logout resets view/profile/menus, and profile is re-hydrated for the next user |
| APP-5 | Dashboard: fake 128 solved / 12-day streak / #1,204 replaced with “—”; Quiz/Mock/Public are visibly disabled “Coming soon” |
| APP-6 | Calendar defaults to today, prev/next work, fake dropdown chevrons removed, pill days are keyboard-operable |
| APP-7 | Profile edits persist per user in localStorage |
| APP-8 | Login scrolls on short screens (no more clipped card) |
| APP-9 | Login has a proper dark theme (background, card, inputs, logo, links, alerts) |
| APP-10 | Pre-paint theme script prevents the white flash in dark mode |
| APP-11 | Closed profile menu is unmounted (no hidden tab stops) |
| APP-12 | Login: submit disabled while pending, generic auth errors, no account enumeration on password reset, GitHub button disabled with “coming soon”, divider copy fixed |
| APP-14 | Header dark gradient now actually applies |
| APP-15 | Theme toggle has `aria-label`/`title`; logo is a real button; profile dialog closes on `Escape` |
| — | Footer year is dynamic (was hard-coded 2024) |

### Backend smoke tests (after changes)
| Request | Result |
|---------|--------|
| `GET /health` | `503 {"status":"degraded","database":"disconnected",...}` |
| `GET /api/problems` (DB down) | `503 {"error":"Database unavailable...","code":"DB_UNAVAILABLE"}` **in <1 s** |
| `POST /api/execution/run-code` C++ | `200 {"stdout":"42",...,"status":"Accepted"}` |
| `POST /api/execution/run-code` python | `400 Unsupported language...` (was 500) |
| `POST /api/execution/submit-code` (DB down) | `503` with a clear message |
| `GET /api/nope` | `404 {"error":"Route not found",...}` |
| Malformed JSON | `400 {"error":"Invalid JSON body"}` (was an HTML stack trace) |

---

## 3. Still open (not blocking the live UI)

| ID | Sev | Task | Notes |
|----|-----|------|-------|
| BE-18 | P3 | `connectDB()` is still fire-and-forget | `requireDB` makes this safe; awaiting would delay boot |
| BE-20 | P3 | Remove unused `uuid` dep / `JDOODLE_*` env entries | cosmetic |
| UI-14 | P2 | No per-case progress or cancel for long submissions | axios timeout 45 s; token guard prevents stale writes |
| UI-15 | P2 | “Hidden” test cases and expected outputs live in the browser | Real hiding requires server-side verification |
| UI-21 | P3 | Auto-Parse overwrites title/description without preview/undo | add preview + non-empty output check |
| APP-3 | P2 | No real URL routing (back/forward/deep links) | `BrowserRouter` is mounted but unused; view is state + sessionStorage |
| APP-13 | P3 | Contact/Settings still show the generic “under development” page | hide or build |
| HYG-4 | P3 | Root `package.json` + duplicate root `node_modules` + 3 lockfiles | remove root install tree |
| HYG-5 | P2 | No ESLint / Prettier / tests / CI | recommended next |
| — | P3 | Monaco loads from CDN by default | online-only; can be switched to the installed `monaco-editor` package |

---

## 4. Needs your action

1. **MongoDB** — allowlist your current IP in Atlas (or point `MONGO_URI` at a local DB). Until then problems/users/submissions intentionally return `503`.
2. **Firebase Admin** — put a real service-account JSON at `backend/serviceAccountKey.json` (or set `FIREBASE_SERVICE_ACCOUNT_PATH`). Until then auth-protected routes return `503 AUTH_UNAVAILABLE`.
3. ~~E2E login test~~ — done with a QA account created via the app's signup flow (see chat for credentials).
4. ~~Dead-file deletion~~ — done (HYG-2).
5. The previously tracked `serviceAccountKey.json` was a placeholder (invalid PEM), but it is now untracked; if a real key was ever committed elsewhere, rotate it in GCP.

---

## 5. Verification log

| When | Check | Result |
|------|-------|--------|
| pre-fix | `GET /api/problems` | 500 after 10.03 s (DB down) |
| pre-fix | blank test case submit | false “Accepted” |
| pre-fix | logout | `localStorage.clear()` wiped saved work |
| post-fix | `GET /api/problems` | 503 in <1 s |
| post-fix | run-code C++ / python | 200 / 400 |
| post-fix | malformed JSON | 400 JSON |
| post-fix | `vite build` | ✅ 1668 modules, no errors |
| post-fix | login page light/dark/mobile | ✅ screenshots, zero console errors |
| post-fix | `npm audit` frontend | 0 critical, 4 high (unused Firestore chain) |
| post-fix | `npm audit` backend | 0 critical, 0 high, 9 moderate |
| post-fix | **E2E** QA signup → dashboard (Firebase) | ✅ real profile initials “QT”, neutral stats, “Coming soon” cards |
| post-fix | **E2E** Practice → Run (C++ template) | ✅ terminal: `Status: Accepted`, `Output: (empty)`, time + memory |
| post-fix | **E2E** Practice → Submit (2 cases, template outputs nothing) | ✅ `0 out of 2 … passed`, per-case red ✗, expected vs actual shown — **no false “Accepted”** |
| post-fix | **E2E** dark mode workspace/results | ✅ left panel, description, stat cards, pills, progress bar all readable |
| post-fix | **E2E** mobile login (375 × 667) | ✅ card scrolls, nothing clipped |
