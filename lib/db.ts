import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "interpreteur.db");

let _db: Database.Database | null = null;

function ensureSchema(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS agent (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      handle TEXT NOT NULL DEFAULT 'COMPILATEUR-Δ-7',
      clearance INTEGER NOT NULL DEFAULT 1,
      audio_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS progression (
      anomalie_slug TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'open',
      phase TEXT NOT NULL DEFAULT 'briefing',
      score INTEGER NOT NULL DEFAULT 0,
      state_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lore_fragments (
      id TEXT PRIMARY KEY,
      anomalie_slug TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      unlocked_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS easter_egg (
      id TEXT PRIMARY KEY,
      hits INTEGER NOT NULL DEFAULT 0,
      first_at TEXT,
      last_at TEXT
    );
  `);

  // seed agent if missing
  db.prepare(
    `INSERT OR IGNORE INTO agent (id) VALUES (1)`,
  ).run();
}

export function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  ensureSchema(_db);
  return _db;
}

export type ProgressionRow = {
  anomalie_slug: string;
  status: "open" | "in_progress" | "resolved" | "partial";
  phase: string;
  score: number;
  state_json: string;
  updated_at: string;
};

export type AgentRow = {
  id: 1;
  handle: string;
  clearance: number;
  audio_enabled: 0 | 1;
  created_at: string;
};

export function getAgent(): AgentRow {
  const db = getDb();
  return db.prepare(`SELECT * FROM agent WHERE id = 1`).get() as AgentRow;
}

export function getProgression(slug: string): ProgressionRow | null {
  const db = getDb();
  return (
    (db
      .prepare(`SELECT * FROM progression WHERE anomalie_slug = ?`)
      .get(slug) as ProgressionRow | undefined) ?? null
  );
}

export function upsertProgression(
  slug: string,
  patch: Partial<Omit<ProgressionRow, "anomalie_slug" | "updated_at">>,
) {
  const db = getDb();
  const existing = getProgression(slug);
  const merged = {
    status: patch.status ?? existing?.status ?? "open",
    phase: patch.phase ?? existing?.phase ?? "briefing",
    score: patch.score ?? existing?.score ?? 0,
    state_json: patch.state_json ?? existing?.state_json ?? "{}",
  };
  db.prepare(
    `INSERT INTO progression (anomalie_slug, status, phase, score, state_json, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(anomalie_slug) DO UPDATE SET
       status = excluded.status,
       phase = excluded.phase,
       score = excluded.score,
       state_json = excluded.state_json,
       updated_at = datetime('now')`,
  ).run(slug, merged.status, merged.phase, merged.score, merged.state_json);
}

export function listLoreFragments() {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, anomalie_slug, title, body, unlocked_at
       FROM lore_fragments ORDER BY unlocked_at ASC`,
    )
    .all() as Array<{
    id: string;
    anomalie_slug: string | null;
    title: string;
    body: string;
    unlocked_at: string;
  }>;
}

export function unlockLoreFragment(
  id: string,
  slug: string | null,
  title: string,
  body: string,
) {
  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO lore_fragments (id, anomalie_slug, title, body)
     VALUES (?, ?, ?, ?)`,
  ).run(id, slug, title, body);
}

export function bumpEgg(id: string) {
  const db = getDb();
  db.prepare(
    `INSERT INTO easter_egg (id, hits, first_at, last_at)
     VALUES (?, 1, datetime('now'), datetime('now'))
     ON CONFLICT(id) DO UPDATE SET
       hits = hits + 1,
       last_at = datetime('now')`,
  ).run(id);
  const row = db
    .prepare(`SELECT hits FROM easter_egg WHERE id = ?`)
    .get(id) as { hits: number };
  return row.hits;
}

export function eggHits(id: string): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT hits FROM easter_egg WHERE id = ?`)
    .get(id) as { hits: number } | undefined;
  return row?.hits ?? 0;
}
