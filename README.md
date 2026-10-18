## V3.13.4 – Publishing compatibility hotfix (18 October 2026)

- Corrected Wrangler Worker name to `kingdom3903-website` to resolve Cloudflare CI warning.
- Publishing accepts common editor formatting attributes but strips all attributes before public rendering.
- Supports `div`, `span`, `h1`, and `h4` as formatting-only input. `span` is unwrapped, `div` becomes `p`, `h1` becomes `h2`, `h4` becomes `h3`.
- Unsupported tags remain blocked, now with a specific tag name in the error message.
- No D1 schema changes. Existing drafts and Discord OAuth flow remain unchanged.

# The Citadel — Kingdom 3903

**Project status:** V3.12.9 · 17 October 2026  
**Website:** https://kingdom3903.com  
**GitHub:** https://github.com/ROK-Lagertha/kingdom3903-website

The Citadel is the community portal and tools hub for Rise of Kingdoms Kingdom 3903. It is a fan project, not an official Lilith Games website.

## Implemented features

### Homepage
- Responsive royal navy-blue and gold design with kingdom panorama, Citadel logo, fleur-de-lis accents and capybara artwork.
- Navigation: **Home, Tools, Recruitment, News, Kingdom, Registry**.
- Three illustrated links: **ROK BattleTrack**, **Recruitment Center**, **FlagFiller Registry**.
- **Kingdom Pulse**: compact rotating carousel of four news items with date, title, summary, arrows, pagination and links to news.
- Matching gold double-border, blue diamond ornaments and tilted crown decoration.
- Royal footer, community slogan and Lilith Games fan-project disclaimer.

### Royal Herald — `/news/`
- Dedicated news landing page with Royal Herald logo.
- Featured **Latest Headline** and **Latest Dispatches** article cards.
- Gold jewel frames, blue diamonds, tilted crowns, responsive spacing and hover effects.
- Public readers do not see ticker-selection checkboxes or editorial controls.
- Current articles are still static sample/seed content.

### Reporter area — `/news/admin/`
- Discord OAuth2 sign-in using the existing BattleTrack Discord application.
- Server ID: `1462581217722368074`; **Reporter** role ID: `1561084418246844477`.
- Cloudflare Worker validates Discord membership at login.
- Encrypted `__Host-herald_session` cookie with HttpOnly, Secure and SameSite=Lax attributes.
- Verified authorization snapshot expires after at most 15 minutes; logout supported.
- Bounded HTTP 429 handling for Discord rate limits.
- Admin dashboard and HTML editor preview exist, but **article publishing is not enabled**.
- Redirect-loop fix: protected admin route internally serves `dashboard.html`.

## Technical structure

| Path | Purpose |
| --- | --- |
| `public/index.html` | Deployed homepage |
| `public/news/index.html` | Deployed public Royal Herald |
| `public/news/admin/dashboard.html` | Admin dashboard asset |
| `public/assets/` | Production artwork |
| `worker.js` | Discord OAuth2, Reporter authorization, sessions, API |
| `wrangler.jsonc` | Cloudflare Worker and asset routing |
| `index.html`, `news/`, `assets/` | Older root copies; not the configured production asset directory |

Cloudflare project: `kingdom3903-website`. Deploy command: `npx wrangler deploy`; no build command. Static asset binding: `env.ASSETS`.

### Configuration (never commit secret values)
- `DISCORD_CLIENT_SECRET` — Cloudflare secret; Discord OAuth client secret.
- `HERALD_SESSION_SECRET` — Cloudflare secret; random key for encrypted sessions.
- `HERALD_CALLBACK_URL` — optional variable; `https://kingdom3903.com/api/herald/callback`.
- Discord Developer Portal must register the exact callback URL.
- BattleTrack and Citadel use the same Discord application, but separate Cloudflare Worker secrets.

## Known limitations / important security review

1. **P0:** The protected admin route serves `public/news/admin/dashboard.html`, but this asset's direct URL may still be publicly accessible through Cloudflare Assets. Verify and prevent direct access or move the dashboard outside the public asset directory. No secrets or privileged data belong in HTML/JS.
2. Article API `/api/herald/articles` deliberately returns HTTP 501 until D1 storage and safe publication controls exist.
3. News items and Kingdom Pulse currently come from static code; no unified CMS database.
4. A revoked Reporter role may retain access until its existing session expires (maximum 15 minutes).
5. Add automated auth, routing, mobile, accessibility and deployment regression tests.

## Roadmap

### Next session — Security and stability (P0)
- [ ] Protect **all** admin dashboard asset paths, not only `/news/admin/`.
- [ ] Test Discord login, callback, Reporter denial, session expiry, logout and 429 response handling.
- [ ] Verify homepage, Herald, links, mobile layouts and Cloudflare deployment after changes.

### Next 1–2 days — V3.13.0: Cloudflare D1
- [ ] Create D1 database and versioned schema migrations.
- [ ] Article fields: ID, slug, title, summary, safe HTML content, category, author, timestamps, draft/published/archived state.
- [ ] Build authenticated server-side article CRUD with Reporter authorization.
- [ ] Validate/sanitize HTML, enforce CSRF protections, and record publication changes.
- [ ] Migrate existing four news items without disrupting the public page.

### Following days — V3.14.x: Royal Herald CMS
- [ ] Protected list view of all articles with filtering and status.
- [ ] HTML editor with preview, draft saving, editing, publishing and archiving.
- [ ] **Admin-only** checkbox/selection controls for up to four Kingdom Pulse articles, with ordering.
- [ ] Feed both homepage ticker and Royal Herald from published D1 articles.
- [ ] Add safe caching and fallback behavior for database outages.

### Later enhancements
- [ ] Dedicated article URLs, archive, search, categories, SEO and sharing.
- [ ] Reporter/Administrator editorial permissions and optional review workflow.
- [ ] Media management, accessibility and performance improvements.
- [ ] Curated tools directory linking HeroScrolls, The King's Codex and MeTa ROK.
- [ ] Optional account-age calculator mini-tool.

## Established decisions
- Preserve the royal navy/gold visual identity and capybara cards.
- Public users never control which articles appear in Kingdom Pulse.
- Do not duplicate existing Seed/Power, DKP/KPR, speedup or Artifact Guide tools when HeroScrolls, BattleTrack, The King's Codex or established resources already cover the need.
- Publish complete ZIP releases with a GitHub commit Summary and Description.

## Backup / recovery

This repository archive contains the website source and production assets **without `.git` history**. GitHub holds commit history separately. The ZIP does **not** contain Cloudflare secrets, live Discord credentials or future D1 database records.

For a restore, use a known Git commit or the archived ZIP, deploy with Wrangler, ensure Cloudflare secrets and domain routing remain configured, then test the public site and Reporter login. Back up D1 separately before future schema migrations.

## V3.13.0 security patch

The Worker now returns 404 for direct requests to `/news/admin/dashboard.html`, while the authenticated `/news/admin/` route continues to serve it internally. Verify both cases after deployment.

## D1 preparation (V3.13.1)

The `HERALD_DB` D1 binding is configured in `wrangler.jsonc`. The initial schema is in `migrations/0001_herald_initial.sql`. In Cloudflare Dashboard → Storage & Databases → D1 → `citadel-herald-db` → Console, paste and execute that SQL once. Verify with `SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'herald_%' ORDER BY name;`. The public website and editor remain unchanged; this release does not enable publishing. Before applying migrations to a populated D1 database, take a database backup.


## V3.13.2 — Protected D1 draft newsroom

- Worker now provides authenticated `GET /api/herald/articles`, `GET /api/herald/articles/:id`, `POST /api/herald/articles`, `PUT /api/herald/articles/:id`.
- Reporter role required for every endpoint; cross-origin writes rejected, request size limited, SQL parameterized.
- New drafts are saved to D1 with author and audit records. Only drafts can be edited.
- Admin dashboard lists articles and allows creating, opening and saving drafts.
- **No publishing or public news synchronization yet.** HTML input is stored as draft only; it is not rendered on public pages. A server-side HTML sanitizer and publication review are mandatory before adding publish endpoints.
- Ensure the existing `HERALD_DB` binding remains configured in Cloudflare and deploy the complete repository.
- Smoke test: login, create a test draft, reload dashboard, reopen it and confirm persistence.


## V3.13.3 — Publishing Engine (2026-10-18)

- Reporter-only Publish, Unpublish and Archive controls, logged in `herald_article_audit`.
- Server-side strict allowlist for formatting-only HTML. Unsupported tags and **all attributes** are rejected with HTTP 422. No links, images, iframes or inline styles are supported in this version.
- Published articles available via read-only `/api/herald/public/articles` and `/api/herald/public/articles/:id`; drafts remain private.
- Royal Herald displays published D1 articles under Published Dispatches, retaining existing static cards as fallback.
- Publishing requires a non-empty body; unpublishing/archiving removes any assigned Pulse slots.
- Next: dedicated article pages, full public feed migration, admin-only Kingdom Pulse selection, robust automated tests and CSRF hardening.
- Do not deploy without verifying production D1 binding and testing Discord Reporter login.
