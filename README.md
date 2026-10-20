# 🏰 The Citadel — Kingdom 3903

**More Than a Kingdom.**

[![Website](https://img.shields.io/badge/Website-kingdom3903.com-18365a?style=flat-square)](https://kingdom3903.com/) ![Status](https://img.shields.io/badge/Project-Active%20Development-d8ab5e?style=flat-square) ![Release](https://img.shields.io/badge/Documentation-v3.17.1-2574aa?style=flat-square)

The Citadel is the community website, recruitment portal and information hub for **Kingdom 3903** in *Rise of Kingdoms*. It combines a royal navy-and-gold visual identity with live news, kingdom recruitment, community resources and links to supporting tools.

> **Unofficial fan project.** The Citadel is community-operated and is not affiliated with, endorsed by or an official property of Lilith Games.

**Documentation baseline:** 19 October 2026 · Website release **v3.17.1**  
**Repository:** https://github.com/ROK-Lagertha/kingdom3903-website  
**Production website:** https://kingdom3903.com/

---

## 1. Project at a glance

| Area | URL | Status |
| --- | --- | --- |
| Homepage / Kingdom Pulse | https://kingdom3903.com/ | Implemented; live D1 news rotation |
| Royal Herald | https://kingdom3903.com/news/ | Implemented; published D1 articles |
| Reporter administration | https://kingdom3903.com/news/admin/ | Implemented; Discord Reporter authentication |
| Individual article permalink | `/news/{article-slug}` | Implemented; Discord previews |
| Recruitment Center | https://kingdom3903.com/recruitment/ | Implemented; visual polish in progress |
| FlagFiller Registry | https://flagfiller.kingdom3903.com/ | Linked external/subdomain tool; maintained separately |
| ROK BattleTrack | Linked from homepage | Linked external project; maintained separately |
| Kingdom / alliance information | Navigation and planned pages | Further development planned |

**Current focus:** final visual and responsive polish of the Recruitment Center. Sections 01–05 have been developed, and the six illustrated **Why Choose 3903?** cards still have visible cropping/frame imperfections. Section 06 (*Ready to Join?*) remains a candidate for further design work. Do not describe the Recruitment design as visually finalized.

## 2. What visitors can do

### Homepage

- Browse the Citadel-themed royal-blue and gold landing page, kingdom artwork and navigation.
- Read the **Kingdom Pulse**: up to **four** selected published Royal Herald articles rotate in a compact ticker.
- Open a ticker story directly at its permanent article URL.
- Follow the main cards to **ROK BattleTrack**, **Recruitment Center** and **FlagFiller Registry**.
- Navigate to Recruitment, News and other website sections.

### The Royal Herald — `/news/`

- Browse **Latest News** dynamically loaded from the Cloudflare D1 database, newest published articles first.
- Open complete articles with formatted text and optional individually uploaded article images.
- Share articles via permanent `/news/{slug}` links or the **COPY ARTICLE LINK** action.
- Share a link on Discord and receive an article-specific preview containing its title, summary and the **Royal Herald logo**.
- Article images are deliberately **not** shown in the Latest News preview cards, Kingdom Pulse or Discord previews. They appear only when the complete article is opened.

The previous hardcoded Royal Herald sample headlines were removed from the live news feed.

### Reporter newsroom — `/news/admin/`

- Sign in using Discord OAuth2 and verified membership of the configured **Reporter** role.
- Create, edit, save and publish article drafts; unpublish and archive articles.
- Use the lightweight visual rich-text editor (headings, emphasis, lists, quotes, color and basic formatting).
- Upload, replace or remove **one individual image per article** through the Cloudflare R2-backed image manager.
- Choose, reorder and save up to **four published articles** for the homepage Kingdom Pulse.
- Maintain article and publication history through the audit data stored in D1.

Only authorized Reporters have access to the editing endpoints. Public news reading requires no login.

### Recruitment Center — `/recruitment/`

The Recruitment navigation item **and** the homepage Recruitment card open this internal page, rather than immediately redirecting to the recruitment Discord.

Current page sections:

1. **Welcome to Kingdom 3903** — introduction, values, teamwork and community.
2. **Why Choose 3903?** — six illustrated highlights: International Community, Competitive KvK, Organized Leadership, Regular Events, Tools & Tracking, Respectful Atmosphere.
3. **How We Review Applications** — individual applicant reviews using previous KvK performance, development and activity, including HeroScrolls as an analytical tool.
4. **KvK & Migration Requirements** — participation philosophy, illustrated background and a button opening the **English BattleTrack requirements infographic** in a modal.
5. **Events & Community** — five illustrated event topics with short English descriptions.
6. **Ready to Join?** — invitation to the Recruitment Discord / Migration Station.

The Recruitment page has responsive layouts for desktop, tablet and mobile, illustrated scene backgrounds, numbered gold-and-sapphire ornaments and the approved royal divider graphic. **Section 02 artwork is a known visual issue:** residual borders/cropping need a later redesign with independent, clean illustrations. Avoid reusing cropped multi-card screenshots as production graphics.

> **Visibility note:** Although the original recruitment concept intended to keep numeric performance thresholds within applicant discussions, Section 04 **currently publishes the full requirements chart** via the public button. Leadership should consciously decide whether this remains appropriate. The personal assessment and admission decision still take place through recruitment.

## 3. Hosting and architecture

| Component | Technology / purpose |
| --- | --- |
| Hosting | Cloudflare Workers with static assets |
| Application entry point | `worker.js` |
| Production static assets | `public/` |
| Configuration | `wrangler.jsonc` |
| Article and editorial data | Cloudflare D1: `citadel-herald-db` |
| Article image files | Cloudflare R2: `citadel-herald-images` |
| Reporter login | Discord OAuth2 and Reporter role verification |
| Deployment source | GitHub repository (`main`) linked to Cloudflare |
| Client UI | HTML, CSS and JavaScript |

Production bindings defined in `wrangler.jsonc`:

| Binding | Type | Resource |
| --- | --- | --- |
| `ASSETS` | Static assets | `./public` |
| `HERALD_DB` | D1 | `citadel-herald-db` |
| `HERALD_IMAGES` | R2 | `citadel-herald-images` |

Cloudflare Worker name: `kingdom3903-website`.

**Important source-layout rule:** `public/` is the configured static-assets deployment directory. The repository also includes some older top-level HTML/assets copies. Changes made **only** to root `index.html`, root `news/`, root `assets/` or other duplicate source files do **not** necessarily change what Cloudflare serves. For frontend modifications, always verify the corresponding file under `public/` and confirm the final ZIP/repository tree contains the new assets. A previous mobile Recruitment issue was caused by updating the wrong copy.

### Notable paths

```text
worker.js                                Cloudflare Worker and Herald routes
wrangler.jsonc                           Worker, assets, D1 and R2 bindings
public/index.html                       Homepage
public/recruitment/index.html           Recruitment page
public/news/index.html                  Royal Herald public page
public/news/admin/dashboard.html        Reporter editor (protected by Worker routing)
public/assets/                          Deployed artwork, styles and related assets
migrations/0001_herald_initial.sql      Original Herald D1 tables
migrations/0002_herald_article_images.sql  Article image metadata table
README.md                               Project documentation
```

## 4. Cloudflare and Discord configuration

### Required secrets and settings

Configure sensitive values in Cloudflare **Worker Secrets**, not in GitHub or source files:

- `DISCORD_CLIENT_SECRET` — OAuth2 client secret for the Discord application.
- `HERALD_SESSION_SECRET` — strong random secret for encrypted Reporter sessions (at least 32 characters).
- `HERALD_CALLBACK_URL` — optional environment variable; recommended canonical callback: `https://kingdom3903.com/api/herald/callback`.

The same callback URL must be registered in the Discord Developer Portal for the Discord application used by the Herald. BattleTrack and the website can share a Discord application, while their Worker secrets remain separate.

Reporter authorization uses the following currently configured IDs in `worker.js`:

- Discord guild: `1462581217722368074`
- Reporter role: `1561084418246844477`
- Discord OAuth client/application: `1557797621832360027`

These IDs are configuration identifiers, **not credentials**. Changes to guild, role or application require deliberate backend configuration changes and retesting.

### D1 tables

The applied migrations establish:

| Table | Purpose |
| --- | --- |
| `herald_articles` | Article content, slug, publication state, author and timestamps |
| `herald_pulse_slots` | Selected homepage stories, positions 1–4 |
| `herald_article_audit` | Editorial publication/change history |
| `herald_article_images` | Per-article R2 object metadata |

The schema files live under `migrations/` and have already been used for the production setup. **Do not rerun or replace populated production data blindly.** Take a D1 backup before schema changes. Database records and R2 objects are **not** included in GitHub website ZIP files.

### R2 article images

- Bucket: `citadel-herald-images` bound as `HERALD_IMAGES`.
- Uploaded through the authenticated Reporter editor.
- Supported image formats: JPEG, PNG, WebP and GIF; maximum **5 MB** per uploaded file.
- Image access is handled through the Worker. The R2 bucket does not need public bucket access or a browser-side API key.
- Article images are visible to visitors only for published article detail views, not summary lists or social preview cards.

## 5. Application routes and editorial flow

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Citadel homepage and Kingdom Pulse |
| `/recruitment/` | Public | Recruitment landing page |
| `/news/` | Public | Latest published Herald articles |
| `/news/{slug}` | Public if published | Permanent article page with social metadata |
| `/news/admin/` | Reporter | Editor and Kingdom Pulse Manager |
| `/api/herald/public/articles` | Public | Published article listing |
| `/api/herald/public/articles/{id}` | Public if published | Full published article data |
| `/api/herald/public/pulse` | Public | Selected homepage ticker stories |
| `/api/herald/articles` | Reporter | Editorial article management |
| `/api/herald/articles/{id}` | Reporter | Read/update an editorial article |
| `/api/herald/articles/{id}/image` | Reporter | Upload/replace/remove article image |
| `/api/herald/pulse` | Reporter | Edit homepage ticker selection |
| `/api/herald/login` | Public entry | Discord OAuth login |
| `/api/herald/callback` | OAuth callback | Verify Discord identity/role and set session |
| `/api/herald/me` | Reporter | Check current session |
| `/api/herald/logout` | Reporter | Log out |

The public image delivery endpoint is `/api/herald/images/{id}` (published content only).

**Normal publishing workflow:** log in → create/open draft → format content → save → optionally upload its image → publish → verify at `/news/` → optionally add the article to Kingdom Pulse → share its permalink on Discord. Unpublishing or archiving a selected article removes it from the ticker automatically.

Discord previews use article title/summary and the Herald brand image rather than the uploaded article picture.

## 6. Deployment and verification

The repository's production branch is `main`. Cloudflare is connected to the repository for deployments; successful push and successful production deployment are separate checks.

**GitHub Desktop workflow:**

1. Work from the newest repository state and keep a rollback point.
2. Replace the complete intended files; ensure changed frontend files/assets are inside `public/`.
3. Review the GitHub Desktop **Changes** tab. Check for accidental file deletions or duplicate nested project folders.
4. Commit with a descriptive **Summary** and **Description**, then **Push origin**.
5. Wait until the Cloudflare deployment for `kingdom3903-website` is successful.
6. Test the live production domain on desktop and mobile; use a hard reload/private tab when checking cached assets.

For manual Worker deployment where Wrangler is available, the repository configuration supports:

```bash
npx wrangler deploy
```

No separate frontend build command is defined in the current repository root. The deployment must use the repository root containing `worker.js`, `wrangler.jsonc` and `public/`.

### Smoke-test checklist

- [ ] Homepage, navigation and illustrated cards load without missing assets.
- [ ] Recruitment navigation and homepage card both lead to `/recruitment/`.
- [ ] Recruitment hero, sections, card graphics and dividers work on desktop/tablet/mobile.
- [ ] **VIEW KvK REQUIREMENTS** opens/closes the English infographic on desktop and mobile.
- [ ] `/news/` loads published D1 articles in the correct order.
- [ ] Opening a permanent article URL directly (private browser) works.
- [ ] Discord link preview uses article title, summary and Royal Herald logo.
- [ ] Uploaded image displays inside full published article **only**.
- [ ] Kingdom Pulse shows only selected published articles and follows saved order.
- [ ] Authorized Reporter can log in, edit, publish, manage images and ticker.
- [ ] Unauthorized readers cannot access editorial endpoints; direct `/news/admin/dashboard.html` should return 404.
- [ ] Browser console, worker logs and Cloudflare deployment status show no new errors.

## 7. Security, reliability and backups

- Never commit Discord secrets, session secrets, OAuth tokens or administrator credentials.
- Reporter permissions are checked on the Worker; UI-only hiding is not sufficient authorization.
- The Worker issues secure, HttpOnly, SameSite=Lax session cookies with short-lived verified authorization (currently up to approximately **15 minutes**).
- The admin HTML must remain inaccessible via its direct asset path. The Worker explicitly returns 404 for `/news/admin/dashboard.html` and serves the dashboard through the authenticated `/news/admin/` route.
- HTML submitted by Reporters is subject to backend formatting validation/sanitization. Rich-text pastes are not guaranteed to work with arbitrary HTML, links or embeds.
- Check same-origin write protections and upload limits whenever editorial endpoints change.
- Back up **D1 content** and **R2 objects** separately. A repository ZIP alone is not a complete content backup.
- Retain a known-good Git commit for rollbacks. Reverting a website deployment does not automatically revert database migrations.
- Add automated tests for auth, permissions, endpoints, direct links, asset routing, accessibility and responsive breakpoints (work still outstanding).

## 8. Current quality notes / known issues

| Priority | Topic | Current state / next action |
| --- | --- | --- |
| P1 | Recruitment §02 illustrations | **Still visually imperfect**: inconsistent cropping/remaining decoration; replace with truly independent clean source illustrations. The v3.17.1 release is accepted as a temporary stopgap, not a final visual fix. |
| P2 | Recruitment §06 | Final CTA area is functional but has not had the same dedicated mockup-by-mockup polish as earlier sections. |
| P2 | Recruitment §04 public thresholds | The English popup exposes exact KvK requirements. Confirm leadership wants these numbers public; the earlier concept avoided publishing thresholds. |
| P2 | Repository duplication | Old top-level copies and a nested `kingdom3903 website/` directory are present; determine canonical sources and clean safely after validating deployment paths. |
| P2 | Automated regression tests | No comprehensive automated testing workflow established for Worker, auth or responsive UI. |
| P3 | Editorial improvements | Search/filter, accessibility, SEO and editor ergonomics can be expanded later. |

These notes intentionally distinguish **working functionality** from **remaining visual and engineering debt**.

## 9. Roadmap

### Next — finish Recruitment Center

- [ ] Polish **06 – Ready to Join?** using the approved royal visual language.
- [ ] Revisit the six §02 images with separate border-free source art and a single consistent HTML/CSS frame.
- [ ] Validate the complete Recruitment page on common phone, tablet and desktop widths.
- [ ] Decide whether the full public KvK requirements infographic should remain publicly accessible.

### Next — expand Kingdom identity

- [ ] **The Alliance Network**: dedicated page for all seven alliances and their responsibilities.
- [ ] **Meet the Leadership**: introduce the R5/R4 team, responsibilities and optional member profiles.
- [ ] Improve navigation to Kingdom information as new sections become available.

### Later — tools, content and stability

- [ ] Curate links to external resources such as **HeroScrolls**, **The King's Codex** and **MeTa ROK**.
- [ ] Consider a small account-age calculator as a separate mini-tool.
- [ ] Improve news discovery (archives, search/categories, optional editorial enhancements).
- [ ] Add automated Worker/API smoke tests, deployment validation and accessibility checks.
- [ ] Rationalize duplicate source files and large production image assets safely.

**Deliberate non-goals:** Do not duplicate existing full-featured Seed/Power tools, DKP/KPR systems, speedup calculators or an artifact guide when existing established tools already cover those needs.

## 10. Release history — major milestones

The README tracks the **current** implementation first. Individual historic patch notes are condensed here rather than repeated as contradictory project descriptions.

| Release | Milestone |
| --- | --- |
| v3.13.0–v3.13.3 | Reporter protection, Cloudflare D1 drafts, safe publication, audit trail and public article APIs |
| v3.13.4–v3.13.7 | Publishing compatibility, WYSIWYG editor, legacy RoK color handling and live Latest News |
| v3.13.8 | D1-based Kingdom Pulse Manager: four editorially selected stories |
| v3.13.9 | R2 individual article image uploads, replacement and removal |
| v3.14.0 | Permanent Herald article links and Discord Open Graph previews |
| v3.15.0–v3.15.9 | Recruitment page, responsive hero/highlights, royal section dividers, Welcome layout |
| v3.16.0–v3.16.4 | Section 02 and 03 visual layouts, numbered ornaments and integrated application-review scene |
| v3.16.5–v3.16.8 | KvK Requirements popup, English infographic, Event gallery and updated battlefield background |
| v3.16.9–v3.17.1 | Illustrated Why Choose 3903 gallery and image-framing correction attempts; visual limitations remain |

---

## 11. Contributing and working conventions

- Match the established **royal navy, gold, sapphire and fleur-de-lis** Citadel identity.
- Write public-facing Kingdom/Recruitment content in **English** unless an explicitly multilingual component is planned.
- Support desktop, tablet and smartphone; avoid cropped text and baked-in image labels that conflict with responsive layouts.
- Keep image-only decorations separate from editable textual content where practical.
- Do not add sensitive admission scores, internal operational details or personally identifiable player information without a deliberate review.
- For website releases, deliver complete replacement files or a complete project ZIP, plus a GitHub **Summary** and **Description**; no partial code snippets as the primary deployment artifact.
- Record completed changes, outstanding defects and migration requirements accurately, and verify both the deployed `public/` files and final archive before a release.

**The Citadel — Kingdom 3903 · More Than a Kingdom.**


### V3.17.2 – Why Choose 3903 image cleanup
- Replaced six Recruitment benefit image assets with consistent inner crops.
- Removed edge decorations and suppressed redundant CSS ornaments.
- Kept responsive layout and all other website functions unchanged.

### V3.17.3 – Recruitment invitation section
- Redesigned Section 06 with the approved castle-gate scene and embedded script lettering.
- Matched the Section 06 ornament to the previous five section numbers.
- Added a gold Migration Station CTA, retaining the existing Discord invitation.
- Blended the scene into the page background and added mobile/tablet responsive rules.
