import * as SQLite from "expo-sqlite";
import type { HymnJson, HymnReferenceValue, SongReferenceRow } from "../types/hymn";
import { myanmarDigitsToAscii, normalizeMyTitle, songNumberToSortInt } from "../utils/digits";

export const BUNDLED_DATA_VERSION = 7;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("hymnal.db");
  }
  return dbPromise;
}

async function getMeta(db: SQLite.SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = ?",
    [key]
  );
  return row?.value ?? null;
}

async function setMeta(db: SQLite.SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    "INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value]
  );
}

async function createSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      song_number_raw TEXT NOT NULL,
      song_number_sort INTEGER NOT NULL,
      title_my TEXT NOT NULL,
      title_en TEXT NOT NULL,
      zbc INTEGER,
      mbc INTEGER,
      ss INTEGER,
      created_at TEXT NOT NULL,
      source_version INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_songs_number_sort ON songs (song_number_sort);

    CREATE TABLE IF NOT EXISTS song_paragraphs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      song_id INTEGER NOT NULL REFERENCES songs (id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL,
      body_text TEXT NOT NULL,
      label TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_paragraphs_song ON song_paragraphs (song_id, sort_order);

    CREATE TABLE IF NOT EXISTS song_references (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      song_id INTEGER NOT NULL REFERENCES songs (id) ON DELETE CASCADE,
      ref_key TEXT NOT NULL,
      ref_value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_song_references_song ON song_references (song_id);

    CREATE TABLE IF NOT EXISTS favorites (
      song_id INTEGER PRIMARY KEY NOT NULL REFERENCES songs (id) ON DELETE CASCADE,
      favorited_at TEXT NOT NULL
    );
  `);
}

async function clearHymnData(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM favorites;
    DELETE FROM song_references;
    DELETE FROM song_paragraphs;
    DELETE FROM songs;
  `);
}

function normalizeReferenceValue(value: HymnReferenceValue): string | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function getDynamicReferences(hymn: HymnJson): Array<{ key: string; value: string }> {
  const refs: Array<{ key: string; value: string }> = [];
  const reservedKeys = new Set(["songNumber", "titleMyanmar", "titleEnglish", "paragraphs"]);

  for (const [key, rawValue] of Object.entries(hymn)) {
    if (reservedKeys.has(key)) continue;
    if (typeof rawValue === "undefined" || Array.isArray(rawValue)) continue;
    const normalizedValue = normalizeReferenceValue(rawValue as HymnReferenceValue);
    if (normalizedValue == null) continue;
    refs.push({ key, value: normalizedValue });
  }

  return refs;
}

async function seedFromJson(db: SQLite.SQLiteDatabase, hymns: HymnJson[]): Promise<void> {
  const now = new Date().toISOString();
  for (const h of hymns) {
    const refs = getDynamicReferences(h);
    const zbcRef = refs.find((r) => r.key.toLowerCase() === "zbc");
    const mbcRef = refs.find((r) => r.key.toLowerCase() === "mbc");
    const ssRef = refs.find((r) => r.key.toLowerCase() === "ss");
    const toIntegerOrNull = (value?: string) => {
      if (!value) return null;
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const sort = songNumberToSortInt(h.songNumber);
    const result = await db.runAsync(
      `INSERT INTO songs (song_number_raw, song_number_sort, title_my, title_en, zbc, mbc, ss, created_at, source_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        h.songNumber.trim(),
        sort,
        normalizeMyTitle(h.titleMyanmar),
        h.titleEnglish.trim(),
        toIntegerOrNull(zbcRef?.value),
        toIntegerOrNull(mbcRef?.value),
        toIntegerOrNull(ssRef?.value),
        now,
        BUNDLED_DATA_VERSION,
      ]
    );
    const songId = Number(result.lastInsertRowId);
    let order = 0;
    for (const body of h.paragraphs) {
      await db.runAsync(
        `INSERT INTO song_paragraphs (song_id, sort_order, body_text) VALUES (?, ?, ?)`,
        [songId, order, body]
      );
      order += 1;
    }

    for (const ref of refs) {
      await db.runAsync(
        `INSERT INTO song_references (song_id, ref_key, ref_value) VALUES (?, ?, ?)`,
        [songId, ref.key, ref.value]
      );
    }
  }
  await setMeta(db, "data_version", String(BUNDLED_DATA_VERSION));
}

export async function initDatabase(hymns: HymnJson[]): Promise<SQLite.SQLiteDatabase> {
  const db = await getDatabase();
  await createSchema(db);

  const storedDataVersion = await getMeta(db, "data_version");
  const needsReseed =
    storedDataVersion === null || parseInt(storedDataVersion, 10) < BUNDLED_DATA_VERSION;

  if (needsReseed) {
    await db.withTransactionAsync(async () => {
      await clearHymnData(db);
      await seedFromJson(db, hymns);
    });
  }

  return db;
}

export async function fetchAllSongs(db: SQLite.SQLiteDatabase) {
  return db.getAllAsync<{
    id: number;
    song_number_raw: string;
    song_number_sort: number;
    title_my: string;
    title_en: string;
    zbc: number | null;
    mbc: number | null;
    ss: number | null;
    is_favorite: number;
  }>(
    `SELECT s.*,
            CASE WHEN f.song_id IS NULL THEN 0 ELSE 1 END AS is_favorite
     FROM songs s
     LEFT JOIN favorites f ON f.song_id = s.id
     ORDER BY s.song_number_sort ASC, s.id ASC`
  );
}

export async function fetchSongById(db: SQLite.SQLiteDatabase, id: number) {
  const song = await db.getFirstAsync<{
    id: number;
    song_number_raw: string;
    song_number_sort: number;
    title_my: string;
    title_en: string;
    zbc: number | null;
    mbc: number | null;
    ss: number | null;
    is_favorite: number;
  }>(
    `SELECT s.*,
            CASE WHEN f.song_id IS NULL THEN 0 ELSE 1 END AS is_favorite
     FROM songs s
     LEFT JOIN favorites f ON f.song_id = s.id
     WHERE s.id = ?`,
    [id]
  );
  if (!song) return null;
  const paragraphs = await db.getAllAsync<{ id: number; sort_order: number; body_text: string }>(
    `SELECT id, sort_order, body_text FROM song_paragraphs WHERE song_id = ? ORDER BY sort_order ASC`,
    [id]
  );
  const references = await db.getAllAsync<SongReferenceRow>(
    `SELECT ref_key as key, ref_value as value
     FROM song_references
     WHERE song_id = ?
     ORDER BY id ASC`,
    [id]
  );
  return { song, paragraphs, references };
}

export async function setFavorite(
  db: SQLite.SQLiteDatabase,
  songId: number,
  favorite: boolean
): Promise<void> {
  if (favorite) {
    await db.runAsync(
      `INSERT OR REPLACE INTO favorites (song_id, favorited_at) VALUES (?, ?)`,
      [songId, new Date().toISOString()]
    );
  } else {
    await db.runAsync(`DELETE FROM favorites WHERE song_id = ?`, [songId]);
  }
}
