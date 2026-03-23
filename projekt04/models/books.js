import { DatabaseSync } from "node:sqlite";
import usersDb from "../db.js";

const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);

db.exec(`
CREATE TABLE IF NOT EXISTS genres (
    genre_id      INTEGER PRIMARY KEY,
    id            TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS books (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    genre_id      INTEGER NOT NULL REFERENCES genres(genre_id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    author        TEXT NOT NULL,
    description   TEXT NOT NULL,
    added_by      TEXT
) STRICT;

`);

try {
    db.exec("ALTER TABLE books ADD COLUMN added_by TEXT");
} catch (_) {
}

const insertGenre = db.prepare("INSERT OR IGNORE INTO genres (id, name) VALUES (?, ?)");
insertGenre.run("fantastyka", "Fantastyka");
insertGenre.run("romans", "Romans");
insertGenre.run("klasyka", "Klasyka");
insertGenre.run("science-fiction", "Science Fiction");
insertGenre.run("kryminal", "Kryminał");

export function getGenreSummaries() {
    return db.prepare("SELECT id, name FROM genres").all();
}

export function hasGenre(genreId) {
    const row = db.prepare("SELECT * FROM genres WHERE id = ?").get(genreId);
    return !!row;
}

export function getGenre(genreId) {
    const genre = db.prepare("SELECT * FROM genres WHERE id = ?").get(genreId);
    if (!genre) return null;
    const books = db.prepare("SELECT * FROM books WHERE genre_id = ?").all(genre.genre_id);
    return { id: genre.id, name: genre.name, books };
}

export function addBook(genreId, book, username) {
    const genre = db.prepare("SELECT * FROM genres WHERE id = ?").get(genreId);
    if (!genre) return false;

    const stmt = db.prepare(
        "INSERT INTO books (genre_id, title, author, description, added_by) VALUES (?, ?, ?, ?, ?)"
    );
    stmt.run(genre.genre_id, book.title, book.author, book.description, username || null);
    return true;
}

export function validateBookData(book) {
    const errors = [];
    const fields = ["title", "author", "description"];
    for (let field of fields) {
        if (!book.hasOwnProperty(field)) errors.push(`Brak pola '${field}'`);
        else if (typeof book[field] !== "string") errors.push(`'${field}' musi być tekstem`);
        else if (book[field].length < 1 || book[field].length > 1000) errors.push(`'${field}' zła długość`);
    }
    return errors;
}

export function removeBook(id) {
    db.prepare("DELETE FROM books WHERE id = ?").run(id);
}

export function addToFavorites(id, username) {
    usersDb.prepare("INSERT OR IGNORE INTO favorites (username, book_id) VALUES (?, ?)").run(username, parseInt(id));
}

export function removeFromFavorites(id, username) {
    usersDb.prepare("DELETE FROM favorites WHERE username = ? AND book_id = ?").run(username, parseInt(id));
}

export function getFavorites(username) {
    const favRows = usersDb.prepare("SELECT book_id FROM favorites WHERE username = ?").all(username);
    if (favRows.length === 0) return [];
    const ids = favRows.map(r => r.book_id);
    const placeholders = ids.map(() => "?").join(",");
    return db.prepare(`SELECT * FROM books WHERE id IN (${placeholders})`).all(...ids);
}

export function getBook(id) {
    return db.prepare("SELECT books.*, genres.id as genre_name FROM books LEFT JOIN genres ON books.genre_id = genres.genre_id WHERE books.id = ?").get(id);
}

export function updateBook(id, data) {
    const stmt = db.prepare(
        "UPDATE books SET title = ?, author = ?, description = ? WHERE id = ?"
    );
    stmt.run(data.title, data.author, data.description, id);
}

export default {
    addBook,
    validateBookData,
    getGenre,
    hasGenre,
    getGenreSummaries,
    addToFavorites,
    getFavorites,
    removeFromFavorites,
    removeBook,
    getBook,
    updateBook
};
