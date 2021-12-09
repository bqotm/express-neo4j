const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const neo4j = require("neo4j-driver");

var app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const driver = neo4j.driver(
  "bolt://localhost",
  neo4j.auth.basic("neo4j", "neo4j")
);
const session = driver.session();

//home
app.get("/", (req, res) => {
  session
    .run("MATCH (n:Person) RETURN n")
    .then((result) => {
      var personArr = [];
      result.records.forEach((record) => {
        //console.log(record.get(0));
        personArr.push({
          id: record.get(0).identity.low,
          name: record.get(0).properties.name,
        });
      });
      res.render("index", {
        persons: personArr,
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

app.listen(3000, () => {
  console.log("server started on port 3000");
});
