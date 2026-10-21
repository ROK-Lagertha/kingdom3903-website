-- V3.18.33: allow a fresh attempt after correcting M2M100 language parameters.
-- Preserves existing articles and completed translations.
UPDATE herald_translation_jobs
SET attempts = 0, locked_until = 0, last_error = ''
WHERE attempts > 0;
