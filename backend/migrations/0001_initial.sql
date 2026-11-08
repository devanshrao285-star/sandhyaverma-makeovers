PRAGMA foreign_keys = ON;
CREATE TABLE enquiries (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL DEFAULT '',
  interest TEXT NOT NULL, preferred_date TEXT NOT NULL DEFAULT '', message TEXT NOT NULL DEFAULT '',
  contact_consent INTEGER NOT NULL CHECK (contact_consent = 1),
  marketing_consent INTEGER NOT NULL DEFAULT 0, consent_version TEXT NOT NULL,
  created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','qualified','closed'))
);
CREATE INDEX enquiries_created ON enquiries(created_at DESC);
CREATE TABLE content_drafts (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
CREATE TABLE publications (id TEXT PRIMARY KEY, body TEXT NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL);
CREATE INDEX publications_created ON publications(created_at DESC);
CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE media (id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, name TEXT NOT NULL, bytes INTEGER NOT NULL, mime TEXT NOT NULL, state TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE budgets (key TEXT PRIMARY KEY, amount INTEGER NOT NULL DEFAULT 0);
