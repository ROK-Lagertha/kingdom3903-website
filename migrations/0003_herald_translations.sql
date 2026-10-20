-- V3.18.21: Additive only. Apply to production D1 after taking a backup.
-- Does not modify existing articles, publish translations, or contact Lara.
CREATE TABLE IF NOT EXISTS herald_article_translations (
 article_id INTEGER NOT NULL REFERENCES herald_articles(id) ON DELETE CASCADE,
 language_code TEXT NOT NULL CHECK (language_code IN ('de','ru','tr','fr','ms','fi','uk','uz','id')),
 title TEXT NOT NULL,
 summary TEXT NOT NULL DEFAULT '',
 body_html TEXT NOT NULL DEFAULT '',
 source_updated_at TEXT NOT NULL,
 translation_status TEXT NOT NULL DEFAULT 'machine' CHECK (translation_status IN ('machine','reviewed')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(article_id,language_code)
);
CREATE INDEX IF NOT EXISTS idx_herald_translations_lang ON herald_article_translations(language_code);
