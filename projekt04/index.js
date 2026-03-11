import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import books, { addToFavorites, getFavorites, removeFromFavorites, removeBook, getBook, updateBook } from "./models/books.js";
import db from "./db.js";

const port = 8000;
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use((req, res, next) => {
    console.log(`Request ${req.method} ${req.path}`);
    next();
});

function getLoggedUser(req) {
    return req.cookies.username || null;
}

app.get("/", (req, res) => {
    res.render("index", { title: "Strona główna", user: getLoggedUser(req) });
});

app.get("/books", (req, res) => {
    const genres = books.getGenreSummaries();
    res.render("genres", { title: "Gatunki książek", genres, user: getLoggedUser(req) });
});

app.get("/books/:genre_id", (req, res) => {
    const genre = books.getGenre(req.params.genre_id);
    if (!genre) return res.sendStatus(404);
    res.render("genre", { title: genre.name, genre, user: getLoggedUser(req) });
});

app.post("/books/:genre_id/new", (req, res) => {
    const genreId = req.params.genre_id;
    if (!books.hasGenre(genreId)) return res.sendStatus(404);

    const bookData = {
        title: req.body.title,
        author: req.body.author,
        description: req.body.description
    };

    const errors = books.validateBookData(bookData);
    if (errors.length) {
        res.status(400).render("new_book", { title: "Nowa książka", errors, user: getLoggedUser(req) });
    } else {
        books.addBook(genreId, bookData);
        res.redirect(`/books/${genreId}`);
    }
});

app.post("/books/:id/favorite", (req, res) => {
    addToFavorites(req.params.id);
    res.redirect("/favorites");
});

app.get("/favorites", (req, res) => {
    res.render("favorites", { title: "Ulubione książki", favorites: getFavorites(), user: getLoggedUser(req) });
});

app.post("/favorites/:id/remove", (req, res) => {
    removeFromFavorites(req.params.id);
    res.redirect("/favorites");
});

app.post("/books/:id/remove", (req, res) => {
    const bookId = parseInt(req.params.id);
    const book = getBook(bookId);
    removeBook(bookId);
    res.redirect(`/books/${book.genre_name}`);
});

app.get("/books/:id/edit", (req, res) => {
    const bookId = parseInt(req.params.id);
    const book = getBook(bookId);
    if (!book) return res.sendStatus(404);
    res.render("edit_book", { title: `Edytuj: ${book.title}`, book, user: getLoggedUser(req) });
});

app.post("/books/:id/edit", (req, res) => {
    const bookId = parseInt(req.params.id);
    const { title, author, description } = req.body;
    updateBook(bookId, { title, author, description });
    const book = getBook(bookId);
    res.redirect(`/books/${book.genre_name}`);
});

// register
app.get("/register", (req, res) => {
    res.render("register", { title: "Rejestracja", error: null, user: getLoggedUser(req) });
});

app.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render("register", { title: "Rejestracja", error: "Podaj nazwę użytkownika i hasło", user: getLoggedUser(req) });
    }
    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
        return res.render("register", { title: "Rejestracja", error: "Użytkownik o tej nazwie już istnieje", user: getLoggedUser(req) });
    }
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, password);
    res.cookie("username", username, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect("/");
});

// logowanie
app.get("/login", (req, res) => {
    res.render("login", { title: "Logowanie", error: null, user: getLoggedUser(req) });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT id FROM users WHERE username = ? AND password = ?").get(username, password);
    if (!user) {
        return res.render("login", { title: "Logowanie", error: "Nieprawidłowa nazwa użytkownika lub hasło", user: getLoggedUser(req) });
    }
    res.cookie("username", username, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.redirect("/");
});

// Wylogowanie
app.post("/logout", (_req, res) => {
    res.clearCookie("username");
    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
