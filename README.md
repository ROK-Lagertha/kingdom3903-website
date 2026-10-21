# Kingdom 3903 — The Citadel

Cloudflare Workers website with Royal Herald, Reporter CMS, D1 articles, R2 images, and 13-language selector.

## Translation architecture (v3.18.31)

- English is the canonical editorial language.
- Cloudflare Workers AI (`@cf/meta/m2m100-1.2b`) translates published articles into 12 target languages.
- Translation records are stored in `herald_article_translations_v2`; the original translation table is preserved for data safety.
- Public article and news APIs accept `?lang=de` (or another supported language); missing/outdated translations fall back to English.
- The language selector stores the preference under `citadel-language`.
- Translating happens on publish via Worker background execution, not on page reads. For long articles the work may exceed Worker background execution limits; a durable Queue-based pipeline is recommended before heavy production use.
- Translating rich text splits HTML tags from text nodes; editorial review is recommended for complex content.
- Model code `pt` corresponds to Portuguese; Brazilian regional wording is not guaranteed.

## Deployment sequence

1. Back up production D1 / create Time Travel bookmark.
2. Execute `migrations/0004_workers_ai_12_languages.sql` in production D1.
3. Copy replacement files to the repository, commit and push to GitHub Desktop.
4. Cloudflare deploys the Worker with the `AI` binding from `wrangler.jsonc`.
5. Remove obsolete translation-service secrets from Cloudflare Worker settings.

## Notes

The older `0003_herald_translations.sql` remains as historical migration. It is not used by the new runtime.
Existing articles are not automatically backfilled: newly published articles start translation. Backfill requires a separate authorized workflow.
