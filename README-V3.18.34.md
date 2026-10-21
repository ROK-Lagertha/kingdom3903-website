# V3.18.34 – M2M100 response diagnostics

This is a minimal diagnostic patch. Replace only the root `worker.js`. It records the actual type and length of `translated_text`, non-sensitive token usage metadata, and the input character count. It does **not** log article text, translated text or secrets. No D1 migration or reset is needed.

**GitHub Desktop Summary:** `fix: Diagnose empty Workers AI translation responses`

**Description:** `Log safe M2M100 response metadata to identify empty or unexpected translations. Preserve existing article data, retry limits, Cron trigger and website UI.`

After deployment, allow one scheduled Cron event and share the `Herald Workers AI response unavailable` log entry. This will distinguish a null model response from a parsing issue.
