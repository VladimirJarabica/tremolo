# Tremolo — Code Review

**Date:** 2026-07-06
**Scope:** Full repository (`be/`, `app/`, `lib/`, `services/`, config, migrations, docs).
**Method:** Read-only review. Backend, frontend, and infra reviewed in depth; every CRITICAL/HIGH finding below was verified first-hand against the actual source (not just relayed). No code was modified and no commits were made.

---

## Executive summary

Tremolo is a well-structured Next.js 16 app with a clean `FE → Server Action → BE function → ApiResponse<T>` architecture, consistent Zod validation, a soft-delete/trash flow, and Prisma+Kysely type generation. Secrets are handled correctly (`.env` is **not** committed).

However, there is **one systemic problem that dominates everything else: broken access control.** Writes are correctly ownership-scoped (`requireSheetOwnership`, `userId` filters), but the **read and hard-delete paths have no authorization at all**, there is **no `isPublic`/visibility model** despite a `userId` owner column, and **Next.js Server Actions are public HTTP endpoints unless the function authorizes internally.** The result: an unauthenticated attacker can list, read (full ABC content), and permanently delete any sheet belonging to any user. A global, user-unscoped Redis cache makes this worse and will silently re-introduce the leak the moment a per-user filter is added unless the cache keys are fixed at the same time.

Beyond access control: no security headers/CSP, no rate limiting, a credible stored-XSS path through `abcjs`, several React correctness bugs, an entirely unreachable Trash page (`_page.tsx`), and `CLAUDE.md`/the `api-function` skill being significantly out of date.

**Top 3 things to fix first (do them together):**
1. Authorize all reads/deletes and decide the visibility model (C1–C4, M-visibility).
2. Make every Redis cache key user-scoped and stop caching error responses (H-cache).
3. Add a CSP + security headers, and enforce auth in `proxy.ts` as a single choke point (H-headers, M-proxy).

---

## Findings by severity

Legend: each finding lists **Location · Problem · Impact · Fix**. Line numbers were verified at review time.

### CRITICAL

#### C1 — Unauthenticated IDOR: any sheet's full content + owner ID is readable
- **Location:** `be/sheet/get-sheet.ts:11-67`, `be/sheet/get-sheet-by-slug.ts:15-75`; actions `app/actions/get-sheet.ts:7-9`, `app/actions/get-sheet-by-slug.ts:7-9`.
- **Problem:** Neither function calls `getUserContext` / `requireSheetOwnership` / `requireUser`, and neither filters by `userId`. They return `content`, `author`, `source`, and **`userId`** for any sheet by `id` or `slug`. Contrast `be/sheet/update-sheet.ts` and `delete-sheet.ts`, which do guard.
- **Impact:** A Server Action is a public HTTP endpoint unless it authorizes internally. An attacker extracts the action id from the client bundle (or just scrapes slugs via C2) and reads every private sheet's full ABC content plus the owning user's DB id. `userId` leakage also enables targeting the other IDORs.
- **Fix:** Add `const { user } = await requireSheetOwnership(input.sheetId)` (or `getUserContext` + `.where("userId","=",user.id)`) before querying, in both functions. Drop `userId` from the response unless the caller is the owner.

#### C2 — Unauthenticated global listing leaks every user's sheets
- **Location:** `be/sheet/get-all-sheets.ts:17-70`, `be/sheet/get-public-sheets.ts`; action `app/actions/get-all-sheets.ts:5-7` (no `handleGuardedApi`, no auth).
- **Problem:** Queries select every non-deleted sheet with only `where deletedAt is null` — no `userId` filter, no auth. The `Sheet` model (`be/db/schema.prisma:71-92`) has **no `isPublic`/visibility column**, so `getPublicSheets` literally means "every sheet in the database."
- **Impact:** `getAllSheets()` returns titles, authors, slugs, and tags for all users' sheets — a full data-exfiltration primitive that also enumerates slugs for C1.
- **Fix:** Decide the visibility model. If sheets are private-by-default, add `isPublic Boolean @default(false)` and filter on it; scope owned reads by `userId`. Gate the listing behind auth either way.

#### C3 — `hardDeleteSheet` has no authorization: unauthenticated permanent deletion of any sheet
- **Location:** `be/sheet/hard-delete-sheet.ts:13-44`; action `app/actions/hard-delete-sheet.ts:8-15`.
- **Problem:** Parses input, deletes `_SheetToTag` by `A = sheetId`, then deletes `Sheet` by `id` only. **No `requireSheetOwnership`, no `getUserContext`, no `userId` filter.** `deleteSheet` (soft) and `restoreSheet` both guard correctly — this one was missed.
- **Impact:** Any caller can permanently destroy any sheet, bypassing the trash/restore safety net entirely. This is destructive and irreversible.
- **Fix:** Add `requireSheetOwnership(input.sheetId)` at the top and scope both deletes to the owning user. Wrap the two deletes in a transaction.

#### C4 — `getDeletedSheets` is not user-scoped; leaks all users' trashed content
- **Location:** `be/sheet/get-deleted-sheets.ts:10-25`.
- **Problem:** `selectAll().where("deletedAt","is not",null)` — global, returns `content` and `userId` of every soft-deleted sheet.
- **Impact:** Any caller reads the content of every other user's trashed sheets.
- **Fix:** Add `getUserContext` + `.where("userId","=",user.id)`; select only the fields the Trash UI needs (not `content`/`userId`).

---

### HIGH

#### H1 — `deleteList` destroys another user's list items before checking ownership
- **Location:** `be/list/delete-list.ts:22-41`.
- **Problem:** It deletes `ListItem` rows by `listId` (lines 24-27) with **no ownership filter**, and only afterward deletes the `List` row filtered by `userId` (lines 30-35). If the caller doesn't own the list, the `List` delete returns nothing and the function reports `NOT_FOUND` — but the items are already gone.
- **Impact:** Any authenticated user can wipe the contents of any other user's list (data destruction / DoS) while the list itself survives, emptied.
- **Fix:** Verify ownership first (query `List` by `id` + `userId`, bail on miss), then delete items and list inside a transaction.

#### H2 — Redis cache is not user-scoped and caches 404s (cross-user leak + will sabotage the auth fix)
- **Location:** `be/db/cache.ts:8-26`; callers `be/sheet/get-sheet-by-slug.ts:37-74`, `be/sheet/get-all-sheets.ts:68-70`.
- **Problem:** Cache keys carry no user/tenant dimension: `getSheetBySlug:${slug}` and a single global `getAllSheets`. `getSheetBySlug` also caches the **entire `apiError(NOT_FOUND)` response** for up to 1 hour.
- **Impact:** (a) Once any caller warms `getSheetBySlug:foo`, that owner's `content` + `userId` is served from Redis to everyone. (b) A cached 404 masks a sheet created seconds later and enables slug enumeration. (c) **Critical interaction:** the moment you add a `userId` filter to fix C1, the cache will keep serving the old, broader result — so this *must* be fixed in the same change.
- **Fix:** Include `userId` (or a literal `public` scope) in every cache key. Only cache successful payloads; give 404s a very short TTL or none.

#### H3 — `AuthError` is swallowed and reported as `INTERNAL_ERROR`; raw `error.message` is leaked
- **Location:** `app/utils/handle-guarded-api.ts:3-15`; errors thrown in `be/auth/guards.ts:14,32,48`.
- **Problem:** Guards throw `AuthError(AUTH_NOT_AUTHENTICATED | AUTH_NOT_AUTHORIZED)`. `handleGuardedApi` catches **all** errors and returns `{ code: INTERNAL_ERROR, details: error.message }`, discarding the dedicated auth code and forwarding the raw message to the client.
- **Impact:** (a) The client cannot distinguish 401 vs 403 vs 500 — an unauthenticated user and a forbidden user both see `INTERNAL_ERROR`, so correct UX (redirect to login, show "not allowed") is impossible. (b) For non-auth throws, Postgres/Kysely error text (and occasionally connection-string fragments) is shipped to the browser.
- **Fix:** Branch on `error instanceof AuthError` and return a dedicated `UNAUTHENTICATED`/`UNAUTHORIZED` code (add them to `ApiErrorCode`). In production, do not forward `error.message` to the client — log it server-side and return a correlation id.

#### H4 — No rate limiting anywhere
- **Location:** `app/actions/auth.ts:6-49` (signUp/signIn/signOut) and all mutation/read actions.
- **Problem:** No limiter is wired (a transitive `express-rate-limit` exists via `shadcn`'s MCP dep but is unused by app code; `ioredis` is available but unused for limiting).
- **Impact:** Unthrottled credential stuffing/brute force on `signIn`; cost-abuse/DoS via `signUp` and the unauthenticated `getAllSheets`/`getPublicSheets` (each fans out to multiple DB queries + Redis).
- **Fix:** Add a Redis-backed limiter (e.g. `@upstash/ratelimit` or a manual `INCR`+`EXPIRE` sliding window) keyed by IP+email on auth and by IP on expensive reads.

#### H5 — No security headers / CSP (`next.config.ts` is empty)
- **Location:** `next.config.ts:3-5`.
- **Problem:** `nextConfig` is `{}` — no `headers()`, no CSP, no `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, or HSTS. No `<meta>` CSP in `app/layout.tsx` either.
- **Impact:** No clickjacking protection, no MIME-sniff protection, and — given H6 — no backstop if any XSS path executes.
- **Fix:** Add a `headers()` map: `Content-Security-Policy` (start restrictive; allow what `abcjs`/Supabase actually need), `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security` on the production host. Also set `poweredByHeader: false` and `reactStrictMode: true`.

#### H6 — Stored-XSS candidate: `abcjs` renders unsanitized user content, with no CSP
- **Location:** `app/utils/abc-notation.ts:56-64` (builds the ABC string), consumed by `app/components/abc-viewer.tsx:124` and `app/components/multi-abc-viewer.tsx:70`.
- **Problem:** `getAbcNotationFromSheet` interpolates **raw** `sheet.title`, `sheet.author`, `sheet.source`, and the entire freeform `sheet.content` into the ABC string passed verbatim to `abcjs.renderAbc(...)`. There is no sanitization anywhere in the pipeline, and no CSP (H5).
- **Impact / honesty note:** `abcjs` renders header fields (`T:`/`C:`/`S:`) via DOM `textContent`, so a naive `<script>` in the *title* likely won't execute. **However**, the ABC *body* (`sheet.content`) supports directives such as `%%text` / annotations that `abcjs` renders into the DOM, and `abcjs` is **not** a sanitization boundary. Combined with the missing CSP this is a credible stored-XSS vector that also affects other users (shared `/list/[id]/all` view, `/sheet/[slug]`). **Exploitability was not confirmed by a runtime PoC** — see Fix.
- **Fix:** (1) Add a PoC test: a sheet with markup in `title` and a `%%text <img src=x onerror=…>` directive in `content`. (2) Regardless of the PoC outcome, sanitize every user field before building the ABC string (strip `<`, `>`, `"`, `'`, and control chars; cap length). (3) Add the CSP from H5. Defense-in-depth is warranted either way.

#### H7 — The Trash page is unreachable (`_page.tsx`)
- **Location:** `app/trash/_page.tsx` (the whole file).
- **Problem:** In the App Router, prefixing a file/folder with `_` makes it private and excludes it from routing. So `/trash` returns 404. The restore/hard-delete actions even call `revalidatePath("/trash")`, which can't work.
- **Impact:** The entire Trash feature is non-functional via the UI; users cannot restore or permanently delete sheets. (The actions themselves still work if invoked directly — see C3.)
- **Fix:** Rename to `app/trash/page.tsx`. While there, fix `deletedAt.toLocaleDateString()` (line 60) — `code-style.md` mandates `date-fns` `format`.

#### H8 — Several React correctness bugs
- **`app/components/list-dialogs.tsx:109-159`** — `EditListDialog` abuses `useState(() => { if (list) setName(list.name) })` (a side effect inside a lazy initializer) **and** calls `setName(list.name)` during render. This can show stale names when switching between lists and risks render loops. **Fix:** sync via `useEffect` on `list?.id`; remove the render-time `setState`.
- **`app/components/sheet-list.tsx:20`** (rendered by `AppShell` in `app/(app)/layout.tsx:22`) — `useSearchParams()` in the sidebar is a **sibling** of the `<Suspense>` that wraps `children`, so it is outside any Suspense boundary. This either errors the production build or deopts the whole `(app)` route group to dynamic rendering. **Fix:** wrap `<SheetList/>` (or `<AppShell/>`) in its own `<Suspense>`.
- **`app/hooks/use-search-params-state.ts:33-34`** — local state initializes from the URL once on mount and never re-syncs when the URL changes (back/forward, `<Link>`). It also writes via `window.history.replaceState` instead of Next's `useRouter().replace`, so the router/`useSearchParams` cache isn't notified. **Fix:** add a `useEffect` syncing from `urlValue`, or drive the URL through `router.replace`.
- **`app/components/list-detail.tsx:42-116`, `sidebar-list-section.tsx:61-123`** — drag/arrow reorder handlers close over a snapshot of `items` and roll back to `previousItems` on failure, so two rapid mutations overwrite/clobber each other (lost updates, UI/DB divergence). **Fix:** use functional `setItems(prev => …)` for optimistic updates and an in-flight request token.

---

### MEDIUM

- **M1 — `createSheetSlug` TOCTOU race** (`be/sheet/create-sheet-slug.ts:3-33`, also `update-sheet.ts:39-54`). Reads existing slugs, computes a counter in JS, then inserts. Two concurrent creates of the same title both pick the same suffix; the second fails on the `slug @unique` constraint and surfaces as `FAILED_TO_CREATE` with no retry. **Fix:** catch Postgres SQLSTATE `23505`, bump the suffix, retry N times (or append a short random/uuid suffix).

- **M2 — Missing validation bounds.** `tempo: z.number().int().positive()` has no `.max()` (`be/sheet/validation-schema.ts:10,24`); `transpose` has no bounds (`be/list/validation-schema.ts:33,50`); `title` has no `.max()`; `tagIds` is an unbounded `z.array(z.string())` (not even UUID-shaped). **Fix:** `tempo` e.g. `.min(20).max(400)`, `transpose` e.g. `.min(-12).max(12)`, `title` `.max(200)`, `tagIds: z.array(z.string().uuid()).max(20)`.

- **M3 — `updateListOrder` / `reorderListItem` don't validate membership** (`be/list/update-list-order.ts:36-41`, `reorder-list-item.ts:42-55`). The client-supplied `sheetIdsOrder` is written verbatim with no check that the IDs belong to this list's `ListItem` rows. Auth is fine (ownership is checked); this is a data-integrity gap. **Fix:** assert the new order is a permutation of the list's current `ListItem.sheetId` set before persisting.

- **M4 — `sheetIdsOrder` array and `ListItem` table are redundant and can diverge.** Ordering lives in both `List.sheetIdsOrder` (denormalized) and `ListItem` (source of truth for membership/transpose). `hardDeleteSheet`/`deleteSheet` don't clean `sheetIdsOrder`, leaving stale IDs; concurrent add/remove can make the array and table disagree. **Fix:** pick one source of truth. If `sheetIdsOrder` stays, maintain it transactionally on every membership change, or add an `order` column to `ListItem` and derive ordering.

- **M5 — `getCurrentUser` link/create race + invited-user takeover risk** (`be/auth/get-user.ts:18-68`). `linkInvitedUser` doesn't require `authId is null`, so two concurrent first-login requests can both pass the email check and the second hits `authId @unique` (surfaced as `INTERNAL_ERROR`). Worse: if **Supabase email confirmation is OFF**, an attacker who registers with a victim's email is linked to the pre-created invited `User` row and inherits its sheets/lists. **Fix:** make `linkInvitedUser` conditional on `where authId is null`, gate it on `email_confirmed_at`, and confirm email confirmation is required in the Supabase project.

- **M6 — `proxy.ts` refreshes the session but never enforces auth (default-open posture).** `updateSession` only refreshes cookies; it never redirects or denies. There is no route-protection layer anywhere, so any handler that forgets a guard (C1–C4) is anonymously reachable by default. **Fix:** in `proxy.ts`, redirect unauthenticated requests away from `/(app)/*` (minus an allow-list) to the login route, making function-level guards defense-in-depth instead of the primary control.

- **M7 — Redis: no TLS, no error handling, eager init** (`be/db/cache.ts:6`). `new Redis(process.env.REDIS_URL!)` throws at import time if the var is unset; no `rediss://`/`tls` enforcement; no `retryStrategy`/`maxRetriesPerRequest`, so a Redis outage hangs requests instead of degrading to a cache miss. **Fix:** validate env at boot, lazy-init, require `rediss://` in prod, and cap retries so outages degrade gracefully.

- **M8 — Docker: weak creds + host-exposed port** (`docker-compose.yml`). `POSTGRES_USER/PASSWORD: postgres`, port `5434:5432` bound to all interfaces, committed to git; no Redis service defined despite the app depending on Redis. **Fix:** bind `127.0.0.1:5434:5432`, source the password from `.env`, add a Redis service and a non-root app role.

- **M9 — `getAllSheets` action bypasses `handleGuardedApi`** (`app/actions/get-all-sheets.ts:5-7`), unlike every other action. Errors aren't normalized and the BE function has no try/catch, so an unexpected throw propagates uncaught. **Fix:** wrap consistently (and add auth per C2).

- **M10 — Missing indexes on foreign-key columns.** Migration scan shows the only non-PK/non-unique index is `_SheetToTag_B_index`. There are **no** indexes on `Sheet.userId`, `List.userId`, or `ListItem.listId`/`sheetId` (Prisma/Postgres do not auto-index the referencing side of an FK). Every ownership-filtered query (`where userId = ?`) and every `ListItem` join will table-scan as data grows. **Fix:** add `@@index([userId])` on `Sheet`/`List` and `@@index([listId])`/`@@index([sheetId])` on `ListItem`.

- **M11 — Auth actions echo raw Supabase error messages** (`app/actions/auth.ts:21,39`), enabling user-enumeration ("Invalid login credentials" vs "User not found"). **Fix:** map to a generic "Invalid email or password" client-side; log details server-side only.

- **M12 — Minimal test coverage.** Only `app/utils/abc-wrap.test.ts` exists (Vitest is configured). No tests for auth guards, ownership enforcement, or the BE functions where the CRITICAL bugs live. **Fix:** add tests that assert a second user cannot read/delete another user's sheets/lists — these would have caught C1–C4 and H1 automatically.

---

### LOW

- **L1 — Enums contradict `code-style.md`.** `ApiErrorCode`/`AuthErrorCode` are TS `enum`s (`be/response.ts:1-8`, `be/auth/auth-error.ts:1-4`) while the rule says "avoid enums, prefer type unions." The generated `be/db/enums.ts` already uses the preferred `as const` + union pattern, so the hand-written enums are internally inconsistent too.
- **L2 — `console.log("error", …)` and bare `catch {}`** swallow diagnostics (`be/sheet/create-sheet.ts:64`, `get-sheet.ts:64`, `get-public-sheets.ts:152`, etc.). Use a structured logger; never lose the error object.
- **L3 — Import-ordering inconsistencies** vs the documented "external → types → `@/` → relative" order (`be/auth/get-user.ts:1-2`, `guards.ts:1-5`).
- **L4 — `meter`/`scale` widened to `string`** in `getSheet`/`getSheetBySlug` return types (`get-sheet.ts:19,21`, `get-sheet-by-slug.ts:24,26`), losing the enum type safety that `get-all-sheets.ts`/`get-public-sheets.ts` keep.
- **L5 — `tsconfig` lacks `noUncheckedIndexedAccess`; ESLint is stock.** Array/`Map.get` access types as `T` not `T|undefined` (the `tagsBySheetId.get(id) ?? []` pattern already relies on this). No `eslint-plugin-security`, no rule enforcing "every `be/*` function calls a guard." `target: ES2017` is older than necessary.
- **L6 — `be/db/index.ts:5-7` falls back to `localhost:5432`** built from loose env vars — note Docker exposes `5434`, so a misconfigured env can silently connect to the wrong/empty DB.
- **L7 — Docs drift.** `README.md` is default `create-next-app` boilerplate. `.claude/skills/api-function/SKILL.md` is copied from a different project — it references `requireAdmin`, "Memorials", and "funeral services" that don't exist here, and a guard table that doesn't match tremolo's actual guards.
- **L8 — Dead code.** `lib/supabase/admin.ts` (service-role client) has **zero importers**; `sheet-editor.tsx:265-300` defines a second `NewSheetButton` that shadows the real one in `new-sheet-button.tsx`; the `user` from `getClaims()` in `lib/supabase/middleware.ts:31-34` is computed and discarded.
- **L9 — Minor frontend nits.** `TrashItem` uses `toLocaleDateString()` (forbidden by `code-style.md`); `header.tsx` uses non-existent `z-1` Tailwind class; drag handles lack `aria-label`; `QueryProvider` sets `staleTime: 1h` with no invalidation, so the home grid stays stale after create/delete; `CreateListDialog` doesn't `router.refresh()`, so the sidebar doesn't update after list creation.
- **L10 — `CLAUDE.md` is out of date** (no auth, Lists, Trash, Redis, public-sheet reads, `proxy.ts`, or the `meter`/`scale`/`author`/`source`/`slug` fields). Updated separately in this pass.

---

## Cross-cutting recommendations

1. **Decide and enforce one access-control model.** Today: writes are per-owner, reads are global, and there's no visibility flag. Pick private-by-default (+ optional `isPublic`) or fully public, then enforce it in `proxy.ts` *and* in every BE function. Add a lint rule / CI check that every file under `be/*/` invokes a guard.
2. **Treat the cache as part of the access-control surface.** Every cache key must encode the user/visibility scope, and errors must never be cached. Fixing reads without fixing the cache re-creates the leak.
3. **Normalize error handling.** Let `AuthError` surface as a distinct code; stop leaking `error.message`; wrap all actions in `handleGuardedApi` consistently.
4. **Add security defaults:** CSP + headers, rate limiting, `rediss://` in prod, and `npm audit` in CI.
5. **Add guard/ownership tests.** The CRITICAL class here (missing authz) is exactly what a small "user B cannot read/delete user A's sheet" test suite would have caught.
6. **Refresh project docs** (`CLAUDE.md`, `README.md`, the `api-function` skill) so future work follows the real architecture, not a stale or borrowed template.

---

## What's done well

- **Secrets hygiene:** `.env*` is gitignored and not tracked; the service-role client is unused (no client-bundle leak). `git check-ignore .env` and `git ls-files` both confirm.
- **Consistent `ApiResponse<T>` pattern** with typed error codes and `ApiResponseData<typeof fn>` derivation — clean and ergonomic.
- **Zod `safeParse`** is used throughout; validation lives next to the logic that uses it.
- **Ownership guards exist for most mutations** (`createSheet`, `updateSheet`, `deleteSheet`, `restoreSheet`, list mutations) — the pattern is right, it just wasn't applied uniformly.
- **Soft-delete/trash + restore** is a thoughtful UX layer (once the Trash route is reachable).
- **Supabase SSR is wired correctly** — `getUser()` validates the JWT server-side per request rather than trusting the client; `proxy.ts` is the correct Next.js 16 middleware convention (the framework renamed `middleware.ts` → `proxy.ts`).
- **Prisma + Kysely type generation** keeps the query builder fully typed without raw SQL.
- **Data fetching in pages, not components** — server components fetch and pass data down, matching `web/ui-components.md`.

---

## Appendix — authorization posture at a glance

| Operation | Ownership enforced? | Note |
|---|---|---|
| `createSheet` | ✅ | user from context |
| `updateSheet` / `deleteSheet` (soft) / `restoreSheet` | ✅ | `requireSheetOwnership` |
| **`hardDeleteSheet`** | ❌ | **C3** — unauthenticated permanent delete |
| **`getSheet` (by id)** | ❌ | **C1** — IDOR |
| **`getSheetBySlug`** | ❌ | **C1** — IDOR (+ cached globally, **H2**) |
| **`getAllSheets` / `getPublicSheets`** | ❌ | **C2** — global; no `isPublic` field |
| **`getDeletedSheets`** | ❌ | **C4** — global trash dump |
| `createList` / `updateList` / `getList` / `getLists` | ✅ | `userId` filter |
| **`deleteList`** | ⚠️ partial | **H1** — items deleted before ownership check |
| `addSheetToList` / `removeSheetFromList` / `updateListItemTranspose` / `reorderListItem` / `updateListOrder` | ✅ auth / ⚠️ integrity | ownership ok; **M3/M4** membership & redundancy |
| `createTag` / `getTags` | n/a | global tags by design (`Tag.name @unique` is global → name collisions across users) |
