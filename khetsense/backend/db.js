// SQLite storage for query history using Node's built-in node:sqlite module
// (Node 22.5+). No native compilation or extra dependency required.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DB_PATH || "./data/khetsense.sqlite";
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS queries (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    crop           TEXT NOT NULL,
    location       TEXT NOT NULL,
    question       TEXT NOT NULL,
    language       TEXT NOT NULL DEFAULT 'en',
    recommendation TEXT,
    reasoning      TEXT,
    confidence     TEXT,
    weather_json   TEXT,
    price_json     TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const insertStmt = db.prepare(`
  INSERT INTO queries
    (crop, location, question, language, recommendation, reasoning, confidence, weather_json, price_json)
  VALUES
    (:crop, :location, :question, :language, :recommendation, :reasoning, :confidence, :weather_json, :price_json)
`);

export function saveQuery(row) {
  const info = insertStmt.run({
    crop: row.crop,
    location: row.location,
    question: row.question,
    language: row.language,
    recommendation: row.recommendation ?? null,
    reasoning: row.reasoning ?? null,
    confidence: row.confidence ?? null,
    weather_json: row.weather ? JSON.stringify(row.weather) : null,
    price_json: row.price ? JSON.stringify(row.price) : null,
  });
  return info.lastInsertRowid;
}

export function getHistory(limit = 20) {
  const rows = db
    .prepare(`SELECT * FROM queries ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
  return rows.map((r) => ({
    id: r.id,
    crop: r.crop,
    location: r.location,
    question: r.question,
    language: r.language,
    recommendation: r.recommendation,
    reasoning: r.reasoning,
    confidence: r.confidence,
    weather: r.weather_json ? JSON.parse(r.weather_json) : null,
    price: r.price_json ? JSON.parse(r.price_json) : null,
    created_at: r.created_at,
  }));
}

export default db;
