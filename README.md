## V3.15.9 — Welcome layout
- Replaced the Welcome section number with a dedicated ornamental SVG image, aligned beside the heading on all screen sizes.
- Removed the nonfunctional video/image placeholder and its caption.
- Added responsive header grid so title/subtitle never wrap underneath the numeral.
- Preserved all other sections, Royal Herald and Worker integrations.

## V3.15.8 – Compact Recruitment spacing

- Cropped transparent padding from royal divider asset without altering ornament motifs.
- Reduced vertical whitespace around every section, highlight strip and join block.
- Responsive spacing for desktop, tablet and mobile.
- Preserved Herald, R2, D1 and existing recruitment content.

## V3.15.7 — Royal Divider (Recruitment)

- Replaced legacy Recruitment section borders and SVG ornaments with the approved transparent gold-and-sapphire image.
- Added responsive image separators between highlights and all six Recruitment sections.
- Kept existing website, Herald, D1 and R2 behavior unchanged.

# The Citadel — Kingdom 3903

## V3.13.8 — Kingdom Pulse Manager (18 October 2026)

- Protected `/news/admin/` now has a Kingdom Pulse Manager listing published articles.
- Select up to four, order with arrows, and save the rotation to the existing D1 `herald_pulse_slots` table.
- The homepage fetches `/api/herald/public/pulse`, a read-only endpoint returning only selected published stories in slot order.
- No sample headlines remain hardcoded in the ticker. Empty selections display a friendly fallback and link to `/news/`.
- `/api/herald/pulse` requires the existing verified Discord Reporter session and same-origin PUT requests.
- Unpublishing or archiving an article removes it from the Pulse automatically.
- No D1 schema migration or additional Cloudflare bindings required. Existing drafts, publishing, login, layout and assets preserved.

## Next: V3.13.9 — Article image uploads

Each article should support a **user-uploaded individual cover image**, stored in Cloudflare R2 and associated with its article. Upload, replace and remove controls will be available in the Reporter editor. Images must render **only on the opened full article**, never on Latest News cards or the Kingdom Pulse ticker. This needs a new R2 bucket/binding and a D1 migration; it is **not yet implemented** in V3.13.8.

---

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

## V3.13.5 — Rich Text Editor (18 October 2026)

- Replaced raw HTML textarea with a visual contenteditable editor in `/news/admin/`.
- Toolbar: bold, italic, underline, paragraph, headings, lists, quote, text color, remove formatting, undo/redo.
- Drafts remain stored as HTML in existing Cloudflare D1 table; no database migration needed.
- When loading old drafts containing RoK `<color=#RRGGBB>` markup, editor attempts to convert those tags to visual colored spans. Review converted legacy content before publishing.
- Publishing sanitizer supports safe hexadecimal text colors on spans/font tags, while stripping other HTML attributes and rejecting unsafe elements.
- Known limitations: this is a lightweight native-browser editor, not a full word processor. Pasting complex rich content may produce unsupported tags; use plain-text paste if publication fails. Links and embedded media are intentionally unsupported. Test cross-browser formatting before production editorial use.


## V3.13.6 — Legacy RoK publishing fix

Publishing now normalizes legacy `<color=#RRGGBB>` and `</color>` markup on the server before applying the HTML allowlist. Existing drafts are not deleted or migrated. For existing articles, open and save the draft before publishing to persist editor conversions. Unknown tags remain rejected.


## V3.13.7 — Live News Layout
- Removed hardcoded Royal Honors, Fort Launches, Fort Joins, and Community Appreciation sample cards and static featured story from `/news/`.
- Public Royal Herald now has one `Latest News` section sourced exclusively from `/api/herald/public/articles`.
- Published articles are sorted newest first and retain the royal card decorations and full article modal.
- Added loading, empty and temporary-error states; Reporter login, article editor, database and Kingdom Pulse homepage remain unchanged.
- Next: manage the four Kingdom Pulse slots from the protected admin dashboard and connect the homepage ticker to D1.


## V3.13.9 — Article Image Manager
- Cloudflare R2 binding `HERALD_IMAGES` -> bucket `citadel-herald-images` in `wrangler.jsonc`.
- **Before deployment**, execute `migrations/0002_herald_article_images.sql` on production D1 `citadel-herald-db` (Cloudflare D1 Console). Safe `CREATE TABLE IF NOT EXISTS`; no existing tables modified.
- In the protected editor, save/open an article, select a JPG/PNG/WebP/GIF (max 5 MB), then **UPLOAD / REPLACE IMAGE**. Use **REMOVE IMAGE** to delete. Images may be changed even after publication; text editing rules remain unchanged.
- Public image access is only granted while the associated article is published; images are not included in public article lists or Kingdom Pulse. Public article detail includes `has_image`.
- Uploads validate session, origin, MIME, file signatures and size; R2 object names are randomized. No public R2 bucket, API tokens or additional secrets needed.
- Test: upload to draft, publish, open article, confirm image; check no image in news cards or homepage ticker; replace and remove image; unpublish and confirm image endpoint is inaccessible.


## V3.14.0 — Royal Herald permalinks and Discord previews
- Every published article has a shareable `/news/{slug}` URL, resolved against D1 on the Worker. Draft, archived and unpublished articles are not publicly routable.
- Discord and other crawlers receive article-specific Open Graph and Twitter Card title/summary/canonical URL. Preview artwork uses the Royal Herald logo, **not** individual article images.
- Clicking READ DISPATCH opens the article and updates the browser URL; direct links open the article automatically. A COPY ARTICLE LINK button is provided in the article view.
- Homepage Kingdom Pulse now links to the actual article permalink instead of the legacy query-string link.
- No database migration or new bindings required. Existing OAuth, Reporter CMS, R2 article images and D1 pulse selections remain unchanged.
- Test: publish an article, open its direct URL in a private browser, copy/share to Discord and confirm the preview contains its title/summary and Herald logo. Discord may cache older previews.


## V3.15.0 — Recruitment Center
- New responsive `/recruitment/` landing page (desktop, tablet, mobile).
- Homepage Recruitment navigation and Recruitment card now link internally to `/recruitment/`.
- Recruitment Discord invitation is available on the new page; original invitation URL retained.
- Sections: Welcome, Why 3903, Individual Performance Review, KvK & Migration Requirements (no internal thresholds), Events, Join.
- Existing Herald, D1, R2, OAuth and Kingdom Pulse implementation unchanged.
- No SQL migration or new bindings required.


### V3.15.1 — Recruitment hero visual
- Replaced plain recruitment hero with custom cinematic Kingdom 3903 banner matching approved visual direction.
- Removed Our Story / Why 3903 hero buttons.
- Preserved accessible mobile headline and copy, with mobile-specific background crop and overlay.
- No changes to backend, database, bindings, Herald or recruitment links.


## V3.15.2 — Recruitment mobile hero correction
- Added dedicated mobile hero artwork crop without embedded headline text.
- Rebuilt mobile hero overlay for clean, readable typography and visible mascot.
- Desktop hero and existing features remain unchanged.
- No D1 migration or Cloudflare binding changes.


### V3.15.3 — Recruitment mobile hero refinement
- Reworked the mobile hero to match the compact castle-background mockup.
- Removed the oversized capybara/banner composition on mobile and avoided baked-in duplicate lettering.
- Preserved the desktop banner, all Recruitment sections, and existing integrations.
- Mobile CTA buttons remain removed as requested.


## V3.15.4 — Recruitment mobile asset deployment fix
Corrected the actual Cloudflare assets under `public/`: synchronized `public/recruitment/index.html` and added `public/assets/recruitment-mobile-castle-v3.15.3.webp`. This resolves the V3.15.2 mobile view persisting after V3.15.3 deployment. No D1 or R2 changes.


## V3.15.5 — Recruitment highlight ribbon
- Rebuilt the four-item ribbon beneath the Recruitment hero in royal navy/gold.
- Replaced emoji icons with consistent inline gold SVG icons.
- Desktop: one full-width horizontal row; tablet: responsive compact row; mobile: clean two-column/two-row grid.
- Applied the same change to both source and deployed `public/recruitment/index.html`.
- No D1, R2, Worker or Discord changes.


## V3.15.6 — Recruitment ornament dividers
- Replaced boxy highlight ribbon borders with a delicate gold filigree and blue jewel SVG separator above and below.
- Removed mobile inner cell borders while preserving the responsive 4-column / 2-column layout.
- Updated both root and public Recruitment pages. No D1/R2 changes.

## V3.16.0 — Why Choose 3903 visual redesign
- Ornamental 02 numeral matching Welcome 01.
- Six gold-icon feature cards with decorative corners.
- Responsive six-column wide, three-column standard/tablet and two-column mobile grids.
- All other sections and Cloudflare bindings unchanged.


## V3.16.1 — Section 02 ornament fix
- Rendered the Section 02 ornament inline using the identical SVG artwork as Section 01, with the numeral changed to 02.
- Kept the matching standalone asset in public/assets as well.
- Preserved all existing responsive layouts and cards. No database or Cloudflare configuration changes required.


## V3.16.2 — How We Review Applications
- Section 03 now uses the matching inline gold-and-sapphire numbered ornament.
- Removed the Recruitment Discord card from section 03.
- Added the approved mockup’s parchment/candle visual as a responsive background with foreground copy.
- Mobile layout retains readable text with a contrast gradient.


## V3.16.3 — Seamless application review artwork
- Removed the rectangular image-block appearance in Section 03 by blending the parchment scene into the page background with responsive gradient and edge fades.
- Kept copy, ornament and other website functions unchanged.


## V3.16.4 — Review scene color integration
Removed opaque overlay gradients in Recruitment section 03. The parchment artwork now fades to true transparency, showing the exact underlying page background rather than a separate navy rectangle. Responsive mobile image fade maintained.

## V3.16.5 – KvK & Migration Requirements
- Reworked section 04 with matching ornamental 04, blended background and responsive layout.
- Added accessible button and modal displaying the user-provided BattleTrack KvK requirements image.
- No database or Cloudflare binding changes.
