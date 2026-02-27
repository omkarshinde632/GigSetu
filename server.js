const express = require("express");
const app = express();
const PORT = 3000;
const path = require("path");


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get('/', (req, res) => res.render('landing'));
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));

