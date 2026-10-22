<div align="center">

# 🏰 Kingdom 3903 | The Citadel

**A royal home for the citizens of Kingdom 3903.**

[![Website](https://img.shields.io/badge/Website-kingdom3903.com-C7A467?style=for-the-badge)](https://kingdom3903.com/)
![Project status](https://img.shields.io/badge/Project-Feature%20Complete-18324E?style=for-the-badge)
![Hosting](https://img.shields.io/badge/Hosting-Cloudflare%20Workers-F38020?style=for-the-badge)

*A community website for the Rise of Kingdoms kingdom — built around its citizens, alliances, stories and tools.*

**Current project milestone: V3.18.74 · 22 October 2026**  
**Status: initial website scope complete; maintenance mode**

</div>

---

## ✨ About the Citadel

**The Citadel** is the official community portal for **Rise of Kingdoms — Kingdom #3903**. It brings our kingdom's information, people, storytelling, recruitment and helpful resources together in one coherent experience.

The design follows a royal fantasy visual language: dark navy and black, gold detailing, illustrative widescreen headers and our signature crowned capybaras. The website is responsive for desktop and mobile and offers a **13-language interface**.

> This is a community-created project for Kingdom 3903. *Rise of Kingdoms* and related game assets remain the property of their respective owners. This website is not an official Lilith Games product.

## 🧭 Explore the website

| Section | Purpose | Link |
| --- | --- | --- |
| **The Citadel** | Kingdom landing page and navigation | [kingdom3903.com](https://kingdom3903.com/) |
| **The Royal Herald** | Kingdom news, articles and editorial updates | [Royal Herald](https://kingdom3903.com/news/) |
| **Recruitment** | Information for potential new citizens and migrants | [Recruitment](https://kingdom3903.com/recruitment/) |
| **The Alliance Network** | The kingdom's alliance directory and role-based alliance finder | [Alliance Network](https://kingdom3903.com/alliances/) |
| **Citizens of 3903** | Community profiles and citizen gallery | [Citizens](https://kingdom3903.com/citizens/) |
| **Kingdom Tools** | Kingdom-built tools and selected third-party resources | [Kingdom Tools](https://kingdom3903.com/tools/) |
| **Help & FAQ** | Frequently asked questions and administrator contact | [Help & FAQ](https://kingdom3903.com/support/) |

### ⚔️ Kingdom tools

The tools directory distinguishes projects operated for Kingdom 3903 from independent third-party resources.

**Our tools:**

- [ROK BattleTrack](https://battletrack.kingdom3903.com/) — a separate kingdom tracking application.
- [FlagFiller Registry](https://flagfiller.kingdom3903.com/) — a separate flag-filler registration application.

**Selected external resources:** [HeroScrolls](https://heroscroll.com/), [TKC CodexHelper](https://codexhelper.com/) and [Meta ROK](https://meta-rok.com/tierlist/field/). These are independently operated services, not components of this repository.

## 👥 Citizens & alliances

The **Citizens of 3903** section gives community members a place to introduce themselves. Core functionality includes:

- Discord-based sign-in and identification.
- Personal profile creation and editing, including profile pictures and in-game information.
- Draft / review / approval workflow before a profile becomes publicly visible.
- Profile deletion by its owner.
- Browseable, filterable, mobile-friendly citizen gallery.
- Display of eligible kingdom role titles, subject to Discord role information.

The **Alliance Network** explains the responsibilities of the kingdom's main, secondary, filler, farm and seller alliances and provides a guide for choosing an appropriate alliance. Alliance assignments and leadership change over time; the live page is the source for current information.

## 📰 Royal Herald

The **Royal Herald** provides an editorial area for kingdom articles, including a protected Reporter interface.

- Articles, drafts, publishing workflows and audit records are stored in **Cloudflare D1**.
- Uploaded article media is stored in **Cloudflare R2**.
- Reporter access uses **Discord OAuth** with server membership and role checks.
- Public news and article endpoints can serve available language variants.
- An automatic translation/backfill mechanism uses **Cloudflare Workers AI** and scheduled execution; English remains the fallback when a translation is missing or unsuccessful.

**Editorial caveat:** Automated translations are helpful but not equivalent to reviewed human translations. Very long articles, formatting or execution limits can leave some language variants unavailable. The public site must remain usable with English fallback.

## 🌐 Languages

The Citadel's language selector supports:

**English · Deutsch · Русский · Türkçe · Français · Español · Português (Brasil) · Polski · Українська · Suomi · Bahasa Melayu · Bahasa Indonesia · Oʻzbekcha**

The selected website language is stored client-side under `citadel-language`. Localization coverage differs between features: some long-form Help & FAQ answers may fall back to English. The Royal Herald has its own server-side article translation workflow. Text embedded in decorative images is not automatically translated.

## 🛠️ Technical overview

| Layer | Technology / responsibility |
| --- | --- |
| Hosting / runtime | Cloudflare Workers |
| Static frontend | HTML, CSS, vanilla JavaScript, served from `public/` |
| API / authentication | Cloudflare Worker (`worker.js`), Discord OAuth |
| Database | Cloudflare D1 — `HERALD_DB` binding |
| Image storage | Cloudflare R2 — `HERALD_IMAGES` binding |
| Editorial translation | Cloudflare Workers AI and scheduled translation processing |
| Deployment | GitHub repository → Cloudflare build/deployment integration |
| Domain | [kingdom3903.com](https://kingdom3903.com/) |

The BattleTrack and FlagFiller applications have their **own subdomains and deployments**. They are linked here, but their respective application source and infrastructure are managed separately.

### Repository layout

```text
.
├── README.md                 # This project overview
├── worker.js                 # Main Worker and API/OAuth logic
├── wrangler.jsonc            # Cloudflare Worker configuration
├── package.json              # Project metadata
├── migrations/               # Versioned D1 database migrations
└── public/                   # Live website assets (configured asset root)
    ├── index.html            # Landing page
    ├── news/                 # Royal Herald and editorial UI
    ├── recruitment/          # Recruitment page
    ├── alliances/            # Alliance Network
    ├── citizens/             # Citizen profiles and gallery
    ├── tools/                # Kingdom Tools directory
    ├── support/              # Help & FAQ
    └── assets/               # Illustrations, shared JS/CSS and media
```

**Important:** This repository also contains some historical / duplicate top-level assets and older version-specific README files. The deployment asset root declared in `wrangler.jsonc` is **`./public`**. When updating website pages, use the paths inside `public/` rather than assuming similarly named top-level files are deployed.

## 🚀 Deployment & maintenance

The standard maintainer workflow is:

1. Make changes locally in the GitHub Desktop working copy, usually by replacing **complete files** at their original paths.
2. Review the changed files before committing; do not commit credentials or private player data.
3. Commit with a descriptive **Summary** and **Description** in GitHub Desktop.
4. Push to `main`, then check the connected Cloudflare deployment result.
5. Verify affected URLs on desktop and mobile, test the language selector, and check any login-dependent features when applicable.

### Configuration

The existing `wrangler.jsonc` defines the Worker entry point, the public asset directory and the D1/R2 bindings. Discord OAuth and session management also depend on Cloudflare environment secrets. **Do not store tokens, application secrets, session secrets or production environment values in the repository or README.**

Before first-time setup or infrastructure changes, review the current Worker code and Cloudflare bindings rather than copying old instructions verbatim. The website is already deployed; this document is **not** a request to reinitialize its production database.

### Database migrations

The `migrations/` directory contains the historical Royal Herald / translation schema updates and subsequent Citizens profile updates, currently numbered **0001 through 0011**.

**Never rerun all migrations blindly against production.** When a future release adds a migration:

1. Back up D1 or create a suitable restore point / Time Travel bookmark.
2. Review the exact new SQL and check which migrations have already been applied.
3. Apply only the needed migration through the approved Cloudflare workflow.
4. Deploy the matching application code and verify both public and protected flows.

The original translation tables and legacy migrations are retained for compatibility/history. See individual SQL files and commit history for the details of previous releases.

## 🔐 Access, privacy & safety

- Public pages can be read without a Discord login; profile editing and editorial management require the relevant authorization.
- Sensitive operations should be protected server-side, not merely hidden in the browser interface.
- Discord roles and kingdom permissions determine access to restricted actions.
- Citizen profiles are **public once approved**; members should only publish details and images they are comfortable sharing.
- Citizen profile removal does not remove a Discord account or membership in the kingdom's Discord server.
- Keep production credentials exclusively in the appropriate Cloudflare secrets / settings.
- For support requests, never send passwords, login tokens or private credentials.

## 💬 Help & contact

Please check [Help & FAQ](https://kingdom3903.com/support/) before contacting the administrator.

- **In-game:** `义Lagertha义`
- **Discord:** `_queenofragnarok_`

For bugs, include the page URL, a short description, your browser/device and the steps that reproduce the issue. Do not include secrets or sensitive account data.

## 🏁 Project milestone: initial scope complete

**As of 22 October 2026, the planned initial website experience is considered feature complete and the Citadel is entering a maintenance-first phase.**

Completed areas include the home portal, Royal Herald, Recruitment, Alliance Network, Citizens gallery, Kingdom Tools directory, Help & FAQ, responsive royal styling, favicon/app icons and multilingual navigation.

This milestone **does not** mean the repository is archived or that software can never require corrections. Future work may include bug fixes, security updates, content revisions, new articles, more complete FAQ translations, accessibility improvements and carefully selected additions when the kingdom needs them.

**Project status:** `Feature complete · Maintained as needed`  
**Milestone version:** `V3.18.74`  
**Repository:** [ROK-Lagertha/kingdom3903-website](https://github.com/ROK-Lagertha/kingdom3903-website)

---

<div align="center">

**Built for the citizens of Kingdom 3903.**  
*One kingdom. Many stories. One Citadel.* 🏰

</div>
