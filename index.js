const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de vistas y middlewares
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SECRET || "secretito", resave: false, saveUninitialized: false }));

// Conexión a base de datos
const db = new sqlite3.Database(path.join(__dirname, "db", "recetas.db"));

// Rutas
app.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  db.all("SELECT * FROM recetas WHERE user_id = ?", [req.session.user.id], (err, recetas) => {
    if (err) return res.send("Error al cargar recetas");
    res.render("recetas", { user: req.session.user, recetas });
  });
});

app.get("/login", (req, res) => res.render("login"));

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM usuarios WHERE username=? AND password=?", [username, password], (err, row) => {
    if (row) {
      req.session.user = row;
      return res.redirect("/");
    }
    res.send("Usuario o contraseña incorrectos");
  });
});

app.get("/register", (req, res) => res.render("register"));

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  db.run("INSERT INTO usuarios (username, password) VALUES (?, ?)", [username, password], function (err) {
    if (err) return res.send("Error al registrar usuario");
    res.redirect("/login");
  });
});

app.post("/recetas", (req, res) => {
  const { titulo, ingredientes, pasos } = req.body;
  db.run("INSERT INTO recetas (titulo, ingredientes, pasos, user_id) VALUES (?, ?, ?, ?)", [titulo, ingredientes, pasos, req.session.user.id], function (err) {
    if (err) return res.send("Error al guardar receta");
    res.redirect("/");
  });
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));