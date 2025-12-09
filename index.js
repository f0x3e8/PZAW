import express from "express";
import morgan from "morgan";
import recipes, { addToFavorites, getFavorites, removeFromFavorites, removeRecipe, getRecipe, updateRecipe } from "./models/recipes.js";

const port = 8000;
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use((req, res, next) => {
    console.log(`Request ${req.method} ${req.path}`);
    next();
});

app.get("/", (req, res) => {
    res.render("index", { title: "Strona główna" });
});

app.get("/recipes", (req, res) => {
    const categories = recipes.getCategorySummaries();
    res.render("categories", { title: "Kategorie przepisów", categories });
});

app.get("/recipes/:category_id", (req, res) => {
    const category = recipes.getCategory(req.params.category_id);
    if (!category) return res.sendStatus(404);
    res.render("category", { title: category.name, category });
});

app.post("/recipes/:category_id/new", (req, res) => {
    const categoryId = req.params.category_id;
    if (!recipes.hasCategory(categoryId)) return res.sendStatus(404);

    const recipeData = {
        name: req.body.name,
        ingredients: req.body.ingredients,
        instructions: req.body.instructions
    };

    const errors = recipes.validateRecipeData(recipeData);
    if (errors.length) {
        res.status(400).render("new_recipe", { title: "Nowy przepis", errors });
    } else {
        recipes.addRecipe(categoryId, recipeData);
        res.redirect(`/recipes/${categoryId}`);
    }
});

app.post("/recipes/:id/favorite", (req, res) => {
    addToFavorites(req.params.id);
    res.redirect("/favorites");
});

app.get("/favorites", (req, res) => {
    res.render("favorites", { title: "Ulubione przepisy", favorites: getFavorites() });
});

app.post("/favorites/:id/remove", (req, res) => {
    removeFromFavorites(req.params.id);
    res.redirect("/favorites");
});

app.post("/recipes/:id/remove", (req, res) => {
  const recipeId = parseInt(req.params.id);

  let categoryId = null;
  for (const [cid, category] of Object.entries(recipe_categories)) {
    if (category.recipes.find(r => r.id === recipeId)) {
      categoryId = cid;
      break;
    }
  }

  removeRecipe(recipeId);

  if (categoryId) {
    res.redirect(`/recipes/${categoryId}`);
  } else {
    res.redirect("/recipes");
  }
});

app.get("/reset-db", (req, res) => {
    db.exec("DELETE FROM recipes");
    db.exec("DELETE FROM recipe_categories");
    res.send("Baza wyczyszczona");
});

app.get("/recipes/:id/edit", (req, res) => {
  const recipeId = parseInt(req.params.id);
  const recipe = getRecipe(recipeId);

  if (!recipe) return res.sendStatus(404);

  res.render("edit_recipe", { title: `Edytuj: ${recipe.name}`, recipe });
});

app.post("/recipes/:id/edit", (req, res) => {
  const recipeId = parseInt(req.params.id);
  const { name, ingredients, instructions } = req.body;

  updateRecipe(recipeId, { name, ingredients, instructions });

  const recipe = getRecipe(recipeId);
  res.redirect(`/recipes/${recipe.category_id}`);
});

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});