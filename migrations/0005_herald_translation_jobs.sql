-- V3.18.32: track background translation attempts, preserve all articles and translations.
CREATE TABLE IF NOT EXISTS herald_translation_jobs (
 article_id INTEGER NOT NULL REFERENCES herald_articles(id) ON DELETE CASCADE,
 language_code TEXT NOT NULL CHECK(language_code IN ('de','ru','tr','fr','ms','fi','uk','uz','id','es','pt-BR','pl')),
 source_updated_at TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0,
 locked_until INTEGER NOT NULL DEFAULT 0,
 last_error TEXT NOT NULL DEFAULT '',
 PRIMARY KEY(article_id,language_code)
);
