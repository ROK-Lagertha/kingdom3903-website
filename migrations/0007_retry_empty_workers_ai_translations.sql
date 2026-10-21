-- V3.18.35: one-time retry for M2M100 empty-result failures after changing language parameters.
-- Preserves source articles and all completed translation records.
-- Run ONCE against the existing production D1, after deploying the corrected Worker.
UPDATE herald_translation_jobs
SET attempts=0, locked_until=0, last_error=''
WHERE attempts > 0
  AND last_error LIKE 'Workers AI returned no translation%';
