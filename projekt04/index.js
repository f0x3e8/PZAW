import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import books, { addToFavorites, getFavorites, removeFromFavorites, removeBook, getBook, updateBook } from "./models/books.js";

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

app.get("/", (req, res) => {
    res.render("index", { title: "Strona główna" });
});

app.get("/books", (req, res) => {
    const genres = books.getGenreSummaries();
    res.render("genres", { title: "Gatunki książek", genres });
});

app.get("/books/:genre_id", (req, res) => {
    const genre = books.getGenre(req.params.genre_id);
    if (!genre) return res.sendStatus(404);
    res.render("genre", { title: genre.name, genre });
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
        res.status(400).render("new_book", { title: "Nowa książka", errors });
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
    res.render("favorites", { title: "Ulubione książki", favorites: getFavorites() });
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
    res.render("edit_book", { title: `Edytuj: ${book.title}`, book });
});

app.post("/books/:id/edit", (req, res) => {
    const bookId = parseInt(req.params.id);
    const { title, author, description } = req.body;
    updateBook(bookId, { title, author, description });
    const book = getBook(bookId);
    res.redirect(`/books/${book.genre_name}`);
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
