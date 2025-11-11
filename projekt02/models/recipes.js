import { DatabaseSync } from "node:sqlite";

const db_path = "./db.sqlite";
const db = new DatabaseSync(db_path);

//BAZA DANYCH Z CZATA
console.log("Creating database tables");
db.exec(
  `CREATE TABLE IF NOT EXISTS recipe_categories (
    category_id   INTEGER PRIMARY KEY,
    id            TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS recipes (
    id            INTEGER PRIMARY KEY,
    category_id   INTEGER NOT NULL REFERENCES recipe_categories(category_id) ON DELETE NO ACTION,
    name          TEXT NOT NULL,
    ingredients   TEXT NOT NULL,
    instructions  TEXT NOT NULL
  ) STRICT;`
);

// PRZYKŁADY Z CHATA
const recipe_categories = {
  "zupy": {
    name: "Zupy",
    recipes: [
      { id: 1, name: "Zupa pomidorowa", ingredients: "Pomidory...", instructions: "Gotuj..." },
      { id: 2, name: "Rosół", ingredients: "Kurczak...", instructions: "Gotuj..." },
    ]
  },
  "desery": {
    name: "Desery",
    recipes: [
      { id: 3, name: "Szarlotka", ingredients: "Jabłka...", instructions: "Piecz..." }
    ]
  }
};

export function getCategorySummaries() {
  return Object.entries(recipe_categories).map(([id, category]) => {
    return { id, name: category.name };
  });
}

export function hasCategory(categoryId) {
  return recipe_categories.hasOwnProperty(categoryId);
}

export function getCategory(categoryId) {
  if (hasCategory(categoryId))
    return { id: categoryId, ...recipe_categories[categoryId] };
  return null;
}

export function addRecipe(categoryId, recipe) {
  if (hasCategory(categoryId)) recipe_categories[categoryId].recipes.push(recipe);
}

export function validateRecipeData(recipe) {
  const errors = [];
  const fields = ["name", "ingredients", "instructions"];
  for (let field of fields) {
    if (!recipe.hasOwnProperty(field)) errors.push(`Brak pola '${field}'`);
    else if (typeof recipe[field] !== "string")
      errors.push(`'${field}' tekst`);
    else if (recipe[field].length < 1 || recipe[field].length > 1000)
      errors.push(`'${field}' zla dlugosc`);
  }
  return errors;
}

export default {
  getCategorySummaries,
  hasCategory,
  getCategory,
  addRecipe,
  validateRecipeData,
};

export let favorites = [];

export function addToFavorites(id) {
  for (let category of Object.values(recipe_categories)) {
    const recipe = category.recipes.find(r => r.id === parseInt(id));
    if (recipe && !favorites.includes(recipe)) {
      favorites.push(recipe);
      break;
    }
  }
}

export function removeFromFavorites(id) {
  favorites = favorites.filter(r => r.id !== parseInt(id));
}

export function getFavorites() {
  return favorites;
}