# Novel Reader — Implementation Plan (Future Use)

> Status: **Partially implemented — novel detail and paginated chapter
> metadata are available. Chapter reading remains planned.**
> Feature goal: click a novel card → see its details and chapter list → click a
> chapter → read it, with chapters crawled on demand by LNcrawl.
>
> Written after live verification against the running LNcrawl server
> (`lightnovel-crawler` container, port 8181) on 2026-10-27. Every endpoint and
> response shape below was probed with real requests, not assumed.

---

## 1. What LNcrawl's server API provides (verified)

The server publishes an OpenAPI spec at `http://<lncrawl>/openapi.json`. The
novel-reader-relevant paths:

| Purpose         | LNcrawl endpoint                                    | Verified behavior                                                                                                                                                                                                                                                                              |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Novel detail    | `GET /api/novel/{novel_id}`                         | Full metadata: `title`, `synopsis` (HTML — must be flattened with `htmlToText`), `authors`, `tags`, `chapter_count`, `volume_count`, `cover_url`, `domain`, `language`, `popularity`                                                                                                           |
| Chapter list    | `GET /api/novel/{novel_id}/chapters?offset=N&limit=M` | Offset/page pagination: `{ total, offset, limit, items: [...] }`. Each chapter: `id` (uuid), `serial` (1-based), `title`, `url`, `is_available` (cached content flag), `volume_id`                                                                                                             |
| Read a chapter  | `GET /api/chapter/{chapter_id}/read`                | Returns `{ novel, chapter, content, next_id, previous_id, word_count, language }`. `content` is clean HTML paragraphs (`<p>…</p>`). `next_id` / `previous_id` give built-in prev/next navigation. If the chapter is not yet crawled, `chapter.is_available` is `false` and `content` is `null` |
| On-demand crawl | `GET /api/chapter/{chapter_id}/fetch`               | Creates an async crawl **job** for that chapter. Response is the job object (`status`, `error`, `failed`, `extra.chapter_id` …). Call this when `is_available` is `false`, then poll `/read` until the content appears                                                                         |

### Verified live example (novelbuddy source)

```
GET /api/novel/1a8aa0ef-…/chapters?page=1&limit=2
→ items[0] = { id: "7a0c8701-…", serial: 1, title: "Chapter 1: The Awakening",
               is_available: false, volume_id: "a13ebd13-…" }

GET /api/chapter/7a0c8701-…/fetch
→ { status: 0, error: null, … }          # job accepted/completed

GET /api/chapter/7a0c8701-…/read
→ { content: "<p>…The asphalt shone w…</p>", word_count: 1308,
    is_available: true, next_id: "8e24bee6-…", previous_id: null }
```

### Known caveat (verified): broken sources fail to crawl

The first novel probed ("Lord of the Truth", `novelfire.net`) returned
`fetch status: 3` with error:

> _"The site answered with an error (HTTP 404) … The page is not there — this
> source's URLs have almost certainly changed."_

This is a property of crawler sources (they rot over time), **not** of our
code. The UI must therefore treat "crawl failed" as a normal, retryable state
with a clear message — never as a crash or an infinite spinner.

### Source-coverage property (already proven by search)

LNcrawl indexes **all** of its installed sources in one catalog
(`/api/sources` lists them; `/api/novels?search=` covers every one). So novel
detail/chapters/reading work for any source the admin adds to the LNcrawl
instance, with **zero frontend changes** — the same property the novel search
feature relies on.

---

## 2. Architecture — follow the existing patterns

The frontend never talks to LNcrawl directly; everything goes through:

```
React page/hook  →  internal Next.js API route  →  service/lncrawl.service.ts  →  LNcrawl server
```

This keeps LNcrawl credentials (`LNCRAWL_USERNAME`/`LNCRAWL_PASSWORD` via
`configuredEnvironmentValue`) server-side only, and reuses:

- `getLncrawlAccessToken(baseUrl)` — cached bearer-token login (module-level
  promise, already in the service).
- `providerRequest<T>(url, { headers })` — fetch wrapper with timeout + error
  normalization (`service/provider-client.service.ts`).
- `serverProviderUrl("NEXT_PUBLIC_LNCRAWL_API_URL", "lncrawl", 8181)` —
  base-URL resolution with the Docker-hostname rewrite.
- `uniqueMediaItems` — dedupe for list responses.
- React Query conventions: debounced keyed queries for search, infinite
  queries for paginated lists (`useNovels`, `useSeriesBrowse` are templates).

### Frontend routes

```
app/explore/novels/[id]/page.tsx        # Implemented: novel detail + chapter list
app/explore/novels/[id]/[chapterId]/page.tsx   # Reader page
```

Internal API routes:

```
app/api/novel/[id]/route.ts             # Implemented: GET novel detail
app/api/novel/[id]/chapters/route.ts    # Implemented: GET paged chapter list
app/api/chapter/[id]/read/route.ts      # GET chapter content (with crawl-on-demand)
```

---

## 3. Novel detail and chapter-list services

`service/lncrawl.fetch.service.ts` provides `fetchNovelDataPayload` and
`fetchNovelChapterPage`. Both reuse `getLncrawlAccessToken` and
`providerRequest`, and the service is server-only so provider credentials
cannot be imported into a client bundle. The chapter-list service requests
`offset`/`limit` and rejects responses without an `items` array.

Chapter content, on-demand crawl, and reader state handling remain planned.
Chapter content is HTML and should be rendered only through a sanitized
container; use `htmlToText` for previews.

---

## 4. Proposed API route contracts

Follow the existing route conventions (`/api/novel`, `/api/novel/search`):
validate inputs → 400 with `{ error }`; provider failure → 502 with
`{ error: "The novel provider is unavailable right now." }`; log with a
`[api/novel/…]`-style prefix.

### `GET /api/novel/{id}` — implemented

```json
{ "novel": { "id", "title", "description", "coverImage", "authors",
             "genres", "chapterCount", "volumeCount", "domain", "releaseYear?" } }
```

(Service flattens LNcrawl's fields into frontend-friendly names, mirroring
`mapNovelToMediaItem` conventions; `synopsis` HTML → `htmlToText`.)

### `GET /api/novel/{id}/chapters?offset=0&limit=100` — implemented

The detail page removes the `lncrawl:` catalog prefix before calling the
internal routes. These handlers run on the server, where the provider URL and
credentials are read; the browser receives only normalized novel metadata or
chapter items.

The current chapter route supports `offset` and a validated `limit` from 1 to
100, returning `{ items }`. The service sends those values to LNcrawl as
`offset` and `limit`. Confirm that pagination contract against the deployed
LNcrawl version if chapter loading does not advance as expected.

### Planned chapter-list response

```json
{ "items": [ { "id", "serial", "title", "isAvailable" } ],
  "total": 2474, "hasNextPage": true }
```

`limit` validated 1–100 (chapters pages are cheap; 2474-chapter novels must
not be served in one shot). Page out of range → empty `items`, not an error.

### `GET /api/chapter/{id}/read` — planned

```json
// ready
{ "state": "ready", "content": "<p>…</p>", "title": "Chapter 1: The Awakening",
  "serial": 1, "nextId": "8e24bee6-…", "previousId": null, "wordCount": 1308 }

// crawl still running after bounded polling
{ "state": "pending", "message": "The chapter is being fetched. Try again shortly." }

// crawl job failed (source broken, 404, …)
{ "state": "failed", "message": "This chapter could not be fetched from its source." }
```

The `pending`/`failed` states are explicit so the UI never guesses. HTTP
status stays 200 for `pending` (it's a valid state, not a failure) — the UI
shows a "crawling…" placeholder with a retry/refresh control.

---

## 5. UI plan (reuse, no redesign)

### Novel detail page — `app/explore/novels/[id]/page.tsx`

- Layout mirrors the existing comics catalog detail patterns (`app/explore/comics/[type]/page.tsx`)
  and the Explore pages' header/section conventions — no new design language.
- Header: cover, title, authors, tags, `htmlToText` synopsis, source domain badge.
- Chapter list: paged list from `/api/novel/{id}/chapters` using the
  **existing infinite-query "Load more" pattern** (`LoadMoreControl` is already
  shared). Each row links to `/explore/novels/{id}/{chapterId}`.
- Data via a small `useNovelDetail(id)` + `useNovelChapters(id)` pair in
  `components/novels/novelsQueries.ts` (additive, same file conventions).

### Reader page — `app/explore/novels/[id]/[chapterId]/page.tsx`

- Renders `content` HTML in a readable column (max-width container, the
  existing text tokens — no new styling system).
- Top bar: back-to-novel link, chapter title, serial.
- Bottom: **Previous / Next** buttons driven by `previousId` / `nextId`
  (server-provided — no client logic needed).
- States:
  - `pending` → "Fetching chapter from source…" with a retry button
    (re-invoking the route re-triggers `/fetch` if still missing).
  - `failed` → clear message + Retry (crawl can succeed later when the
    upstream source is fixed) + a link back to the chapter list.
  - empty `content` on a `ready` chapter → treat as `failed` (defensive).
- Card-click wiring: make novel cards in the search grid / browse grid link to
  `/explore/novels/{id}`. Check `CatalogResultGrid`/`MediaCard` current link
  behavior first; if cards already navigate for comics, novels inherit it by
  supplying the right href, otherwise add a `type`-aware href helper in one
  shared place.

### Optional (phase 2)

- Read-history integration: LNcrawl already exposes
  `POST /api/read-history/add/{chapter_id}` and
  `GET /api/read-history/by-novel` — a "Continue reading" affordance later.
- Volume grouping via `GET /api/novel/{id}/volumes` if flat lists get unwieldy
  for 2000+ chapter novels.

---

## 6. Implementation checklist (in order)

1. **Service additions** in `service/lncrawl.service.ts`:
   `getLncrawlNovel`, `getLncrawlChapters`, `readLncrawlChapter` (+ types).
   Reuse token/`providerRequest`; extend timeout only inside the read path.
2. **API routes**: `/api/novel/[id]`, `/api/novel/[id]/chapters`,
   `/api/chapter/[id]/read` — conventions per §4.
3. **Query hooks** (additive in `components/novels/novelsQueries.ts`):
   `useNovelDetail(id)`, `useNovelChapters(id, page)` (infinite),
   `useChapterRead(chapterId)` (with manual refetch for retry).
4. **Detail page** + chapter list UI; wire card links.
5. **Reader page** with prev/next + the three content states.
6. **Tests**: `tsc --noEmit`, ESLint on changed files, `npm run build`;
   manual browser pass per §7.

Risk notes for implementation:

- `providerRequest`'s default timeout will be too short for cold crawls — pass
  a longer timeout in the read path only (check its options signature first;
  if it's not parameterizable, that's the one justified service change).
- Poll `/read` from the **route** (server-side), not the browser, to keep
  LNcrawl polling out of the client.
- Never modify `searchLncrawlNovels`, `getLncrawlNovels`,
  `getPopularLncrawlNovels`, or the global search route — the read path is
  purely additive.

---

## 7. Verification checklist

1. `docker compose up -d --build frontend` (route needs the Compose network
   to reach `lncrawl:8181`).
2. Browser API checks:
   - `http://localhost:5555/api/novel/search?query=Leveling` → pick an id.
   - `http://localhost:5555/api/novel/{id}` → detail JSON.
   - `http://localhost:5555/api/novel/{id}/chapters?offset=0&limit=5` → chapters.
   - `http://localhost:5555/api/chapter/{chapterId}/read` → first read may
     return `pending`, second (after crawl) `ready` with HTML content.
3. Implemented detail UI: search a novel → click card → detail and initial
   chapter list load. Once the planned reader is implemented, verify chapter
   content, next/previous navigation, and retry states for broken sources.
4. Regression: novel search, movies/series/comics search, and the novels
   browse page behave exactly as before (no shared file was modified).

---

## 8. Quick reference — endpoint map

| Layer           | Path                                       | Backing LNcrawl call                                                               |
| --------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- | -------- |
| Frontend page   | `/explore/novels/{id}`                     | `GET /api/novel/{id}` + `GET /api/novel/{id}/chapters`                             |
| Frontend page   | `/explore/novels/{id}/{chapterId}`         | `GET /api/chapter/{id}/read` (auto `/fetch` on miss)                               |
| Internal API    | `GET /api/novel/{id}`                      | LNcrawl `GET /api/novel/{novel_id}`                                                |
| Internal API    | `GET /api/novel/{id}/chapters?offset&limit`          | LNcrawl `GET /api/novel/{novel_id}/chapters?offset&limit`                          |
| Internal API    | `GET /api/chapter/{id}/read`               | LNcrawl `GET /api/chapter/{id}/read` + `GET /api/chapter/{id}/fetch` when uncached |
| Already shipped | `GET /api/novel/search?query=`             | LNcrawl `GET /api/novels?search=` (all sources)                                    |
| Already shipped | `GET /api/novel`, `GET /api/novel/popular` | LNcrawl `GET /api/novels?sort=updated                                              | popular` |

Auth for every LNcrawl call: bearer token from `POST /api/auth/login`
(`LNCRAWL_USERNAME` / `LNCRAWL_PASSWORD`), cached per server process by
`getLncrawlAccessToken`.
