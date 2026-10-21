-- Run once after deploying V3.18.36; successful cached translations are retained.
UPDATE herald_translation_jobs SET attempts=0, locked_until=0, last_error='' WHERE attempts > 0;
