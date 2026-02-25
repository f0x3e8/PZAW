import { DatabaseSync } from "node:sqlite";

const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);

db.exec(`
CREATE TABLE IF NOT EXISTS recipe_categories (
    category_id   INTEGER PRIMARY KEY,
    id            TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS recipes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id   INTEGER NOT NULL REFERENCES recipe_categories(category_id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    ingredients   TEXT NOT NULL,
    instructions  TEXT NOT NULL
) STRICT;
`);

const existingCategories = db.prepare("SELECT COUNT(*) as cnt FROM recipe_categories").get();
if (existingCategories.cnt === 0) {
    db.prepare("INSERT INTO recipe_categories (id, name) VALUES (?, ?)").run("zupy", "Zupy");
    db.prepare("INSERT INTO recipe_categories (id, name) VALUES (?, ?)").run("desery", "Desery");
}

export let favorites = [];

export function getCategorySummaries() {
    return db.prepare("SELECT id, name FROM recipe_categories").all();
}

export function hasCategory(categoryId) {
    const row = db.prepare("SELECT * FROM recipe_categories WHERE id = ?").get(categoryId);
    return !!row;
}

export function getCategory(categoryId) {
    const category = db.prepare("SELECT * FROM recipe_categories WHERE id = ?").get(categoryId);
    if (!category) return null;
    const recipes = db.prepare("SELECT * FROM recipes WHERE category_id = ?").all(category.category_id);
    return { id: category.id, name: category.name, recipes };
}

export function addRecipe(categoryId, recipe) {
    const category = db.prepare("SELECT * FROM recipe_categories WHERE id = ?").get(categoryId);
    if (!category) return false;

    const stmt = db.prepare(
        "INSERT INTO recipes (category_id, name, ingredients, instructions) VALUES (?, ?, ?, ?)"
    );
    stmt.run(category.category_id, recipe.name, recipe.ingredients, recipe.instructions);
    return true;
}

export function validateRecipeData(recipe) {
    const errors = [];
    const fields = ["name", "ingredients", "instructions"];
    for (let field of fields) {
        if (!recipe.hasOwnProperty(field)) errors.push(`Brak pola '${field}'`);
        else if (typeof recipe[field] !== "string") errors.push(`'${field}' musi być tekstem`);
        else if (recipe[field].length < 1 || recipe[field].length > 1000) errors.push(`'${field}' zła długość`);
    }
    return errors;
}

export function removeRecipe(id) {
    db.prepare("DELETE FROM recipes WHERE id = ?").run(id);
}

export function addToFavorites(id) {
    const recipe = db.prepare("SELECT * FROM recipes WHERE id = ?").get(id);
    if (recipe && !favorites.find(r => r.id === recipe.id)) {
        favorites.push(recipe);
    }
}

export function removeFromFavorites(id) {
    favorites = favorites.filter(r => r.id !== parseInt(id));
}

export function getFavorites() {
    return favorites;
}

export function getRecipe(id) {
  return db.prepare("SELECT * FROM recipes WHERE id = ?").get(id);
}

export function updateRecipe(id, data) {
  const stmt = db.prepare(
    "UPDATE recipes SET name = ?, ingredients = ?, instructions = ? WHERE id = ?"
  );
  stmt.run(data.name, data.ingredients, data.instructions, id);
}

export default {
  addRecipe,
  validateRecipeData,
  getCategory,
  hasCategory,
  getCategorySummaries,
  addToFavorites,
  getFavorites,
  removeFromFavorites,
  removeRecipe
};