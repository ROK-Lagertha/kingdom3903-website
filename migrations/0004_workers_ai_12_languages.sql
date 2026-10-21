-- V3.18.31 — Non-destructive multilingual storage, 12 target languages.
-- Run ONCE in production D1 before deploying Worker changes.
-- Existing herald_articles and herald_article_translations remain untouched.
CREATE TABLE IF NOT EXISTS herald_article_translations_v2 (
 article_id INTEGER NOT NULL REFERENCES herald_articles(id) ON DELETE CASCADE,
 language_code TEXT NOT NULL CHECK(language_code IN ('de','ru','tr','fr','ms','fi','uk','uz','id','es','pt-BR','pl')),
 title TEXT NOT NULL,
 summary TEXT NOT NULL DEFAULT '',
 body_html TEXT NOT NULL DEFAULT '',
 source_updated_at TEXT NOT NULL,
 translation_status TEXT NOT NULL DEFAULT 'machine' CHECK(translation_status IN ('machine','reviewed')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(article_id,language_code)
);
CREATE INDEX IF NOT EXISTS idx_herald_translations_v2_lang ON herald_article_translations_v2(language_code);
INSERT OR IGNORE INTO herald_article_translations_v2(article_id,language_code,title,summary,body_html,source_updated_at,translation_status,updated_at)
 SELECT article_id,language_code,title,summary,body_html,source_updated_at,translation_status,updated_at FROM herald_article_translations;
