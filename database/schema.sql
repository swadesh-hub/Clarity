-- USAII Cognitive Load Triage Tool - SQLite Schema
-- Priority Score Formula: ROUND((urgency * impact) / reversibility, 2)
-- Lower reversibility = harder to undo = HIGHER score

PRAGMA foreign_keys = ON;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    user_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL DEFAULT 'Default User',
    email     TEXT    UNIQUE NOT NULL DEFAULT 'user@clarity.local',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed a default user so user_id=1 always exists
INSERT OR IGNORE INTO users (user_id, name, email) VALUES (1, 'Default User', 'user@clarity.local');

-- 2. Brain Dumps table
CREATE TABLE IF NOT EXISTS brain_dumps (
    dump_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER DEFAULT 1,
    original_text TEXT   NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Thoughts table  (priority_score is REAL to support decimals)
CREATE TABLE IF NOT EXISTS thoughts (
    thought_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    dump_id          INTEGER NOT NULL,
    thought_text     TEXT    NOT NULL,
    category         TEXT    CHECK(category IN ('decide_now','needs_info','task','let_go')) NOT NULL,
    category_details TEXT,
    urgency          INTEGER DEFAULT 5,      -- 1–10
    impact           INTEGER DEFAULT 5,      -- 1–10  (alias: stakes)
    reversibility    INTEGER DEFAULT 5,      -- 1–10  (lower = harder to undo = higher priority)
    priority_score   REAL    DEFAULT 0,      -- ROUND((urgency * impact) / reversibility, 2)
    is_resolved      INTEGER DEFAULT 0,
    resolution_summary TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dump_id) REFERENCES brain_dumps(dump_id) ON DELETE CASCADE
);

-- 4. Follow-up Questions table
CREATE TABLE IF NOT EXISTS follow_up_questions (
    question_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    thought_id         INTEGER NOT NULL,
    generated_question TEXT    NOT NULL,
    user_answer        TEXT,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thought_id) REFERENCES thoughts(thought_id) ON DELETE CASCADE
);

-- 5. Safety Flags table
CREATE TABLE IF NOT EXISTS safety_flags (
    flag_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    dump_id         INTEGER NOT NULL,
    flag_type       TEXT    NOT NULL,
    matched_keyword TEXT    NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dump_id) REFERENCES brain_dumps(dump_id) ON DELETE CASCADE
);

-- 6. App Settings (key-value store, always uppercase keys)
CREATE TABLE IF NOT EXISTS app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 7. Safety Intercepts dictionary
CREATE TABLE IF NOT EXISTS safety_intercepts (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword  TEXT    NOT NULL UNIQUE,
    category TEXT    NOT NULL DEFAULT 'distress'
);

-- Seed default distress keywords
INSERT OR IGNORE INTO safety_intercepts (keyword, category) VALUES
  ('suicide',       'distress'),
  ('kill myself',   'distress'),
  ('self harm',     'distress'),
  ('hurt myself',   'distress'),
  ('panic attack',  'distress'),
  ('depression',    'distress'),
  ('anxiety attack','distress'),
  ('ending it all', 'distress'),
  ('can''t go on',  'distress'),
  ('hopeless',      'distress');

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_thoughts_dump_id     ON thoughts(dump_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_category    ON thoughts(category);
CREATE INDEX IF NOT EXISTS idx_thoughts_priority    ON thoughts(priority_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follow_up_thought    ON follow_up_questions(thought_id);
CREATE INDEX IF NOT EXISTS idx_safety_flags_dump    ON safety_flags(dump_id);
