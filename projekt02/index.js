import express from "express";
import morgan from "morgan";
import recipes, { addToFavorites, getFavorites, removeFromFavorites } from "./models/recipes.js";

const port = 8000;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

function log_request(req, res, next) {
  console.log(`Request ${req.method} ${req.path}`);
  next();
}

app.use(log_request);   
app.get("/recipes", (req, res) => {
  res.render("categories", {
    title: "Kategorie przepisów",
    categories: recipes.getCategorySummaries(),
  });
});

app.get("/recipes/:category_id", (req, res) => {
  const category = recipes.getCategory(req.params.category_id);
  if (category != null) {
    res.render("category", {
      title: category.name,
      category,
    });
  } else {
    res.sendStatus(404);
  }
});

app.post("/recipes/:category_id/new", (req, res) => {
  const category_id = req.params.category_id;
  if (!recipes.hasCategory(category_id)) {
    res.sendStatus(404);
  } else {
    let recipe_data = {
      name: req.body.name,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
    };
    const errors = recipes.validateRecipeData(recipe_data);
    if (errors.length === 0) {
      recipes.addRecipe(category_id, recipe_data);
      res.redirect(`/recipes/${category_id}`);
    } else {
      res.status(400);
      res.render("new_recipe", {
        errors,
        title: "Nowy przepis",
        name: req.body.name,
        ingredients: req.body.ingredients,
        instructions: req.body.instructions,
        category: { id: category_id },
      });
    }
  }
});

app.post("/recipes/:id/favorite", (req, res) => {
  addToFavorites(req.params.id);
  res.redirect("/favorites");
});

app.get("/favorites", (req, res) => {
  res.render("favorites", {
    title: "Ulubione przepisy",
    favorites: getFavorites(),
  });
});
app.get("/", (req, res) => {
  res.render("index", {
    title: "Strona główna",
  });
});

app.post("/favorites/:id/remove", (req, res) => {
  removeFromFavorites(req.params.id);
  res.redirect("/favorites");
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});