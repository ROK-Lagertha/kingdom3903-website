# Citadel V3.18.33 — Workers AI translation fix

This patch corrects the M2M100 request language identifiers to the names used by Cloudflare's official example (`english`, `german`, `spanish`, etc.). It also handles direct and wrapped responses and logs only response field names if translation is empty. No article content is logged.

## Deployment order
1. Back up production D1 (`citadel-herald-db`) using Time Travel.
2. In the D1 SQL console run the full contents of `migrations/0006_reset_translation_attempts.sql` once. This resets failed attempts without deleting content.
3. Replace repository root `worker.js` with the supplied full file, then commit and push through GitHub Desktop.
4. Allow the Cron trigger to run; one language is processed per minute, potentially longer for large articles. Check Cron event logs for errors.

No new bindings, secrets or frontend changes. Existing Worker code and website assets remain unchanged except the translation request/response handling. The change has been syntax-checked but cannot be live-tested without Cloudflare execution.

Summary: fix: Correct Workers AI M2M100 translation requests
Description: Use Cloudflare-documented language names for M2M100; improve response compatibility and safe error logging; reset failed translation jobs without touching articles.
