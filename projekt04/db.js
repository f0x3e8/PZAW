import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("users.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        is_admin INTEGER NOT NULL DEFAULT 0
    );
`);

try {
    db.exec("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0");
} catch (_) {
}

db.exec(`

    CREATE TABLE IF NOT EXISTS favorites (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        book_id  INTEGER NOT NULL,
        UNIQUE(username, book_id)
    );
`);

export default db;
