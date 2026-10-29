-- TEMAN Family Link: explicit, user-initiated check-ins only.
-- Apply only to a dedicated, isolated D1 database (never an existing unrelated DB).
CREATE TABLE IF NOT EXISTS family_channels (
  family_id TEXT PRIMARY KEY,
  write_hash TEXT NOT NULL,
  view_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_family_expires ON family_channels (expires_at);

CREATE TABLE IF NOT EXISTS family_status (
  family_id TEXT PRIMARY KEY REFERENCES family_channels(family_id) ON DELETE CASCADE,
  checkin_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK(status IN ('safe','with-group','at-hotel','need-contact')),
  label TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  pilgrim_name TEXT NOT NULL DEFAULT '',
  hotel_name TEXT NOT NULL DEFAULT '',
  group_code TEXT NOT NULL DEFAULT '',
  bus_number TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS family_rate (
  rate_key TEXT PRIMARY KEY,
  day INTEGER NOT NULL,
  count INTEGER NOT NULL CHECK(count >= 1 AND count <= 5)
);
CREATE INDEX IF NOT EXISTS idx_family_rate_day ON family_rate (day);
