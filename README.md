# Kingdom 3903 — Command Center

Static landing page for kingdom3903.com.

## Deploy via Cloudflare Workers & Pages

1. Unzip the archive.
2. Create a new GitHub repository and upload `index.html` (and this README).
3. In Cloudflare, open **Workers & Pages** and create a **Pages** project connected to the repository (if Pages Git integration is offered in your dashboard).
4. Set the framework preset to **None**, build command empty, and output directory to `/` (repository root). Deploy.
5. Under the project's **Custom domains**, add `kingdom3903.com`.

Alternatively use Cloudflare's static assets Workers deployment with an appropriate wrangler configuration. Do not overwrite the existing FlagFiller Worker.

## Before launch

- Replace the FlagFiller link if its URL changes.
- Add verified HeroScrolls and King's Codex URLs.
- Add your official Discord invite after approval.
- Review copy and branding.
