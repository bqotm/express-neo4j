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
      const personArr = [];
      result.records.forEach((record) => {
        //console.log(record.get(0));
        personArr.push({
          id: record.get(0).identity.low,
          name: record.get(0).properties.name,
        });
      });

      session.run("MATCH (n:Location) RETURN n").then((result2) => {
        const locationArr = [];
        result2.records.forEach((record) => {
          locationArr.push(record.get(0).properties);
        });
        res.render("index", {
          persons: personArr,
          locations: locationArr,
        });
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

//add person
app.post("/person/add", (req, res) => {
  const name = req.body.name;

  session
    .run("CREATE (n:Person {name:$nameP}) RETURN n.name ", { nameP: name })
    .then((result) => {
      res.redirect("/");
    })
    .catch((error) => {
      console.log(error);
    });
});

//add location
app.post("/location/add", (req, res) => {
  const city = req.body.city;

  session
    .run("CREATE (n:Location {city:$cityP}) RETURN n.name ", { cityP: city })
    .then((result) => {
      res.redirect("/");
    })
    .catch((error) => {
      console.log(error);
    });
});

//connect friends
app.post("/friends/connect", (req, res) => {
  const name1 = req.body.name1;
  const name2 = req.body.name2;

  session
    .run(
      "MATCH (a:Person {name:$name1}), (b:Person {name:$name2}) MERGE (a)-[:FRIEND]->(b)",
      { name1, name2 }
    )
    .then((result) => {
      res.redirect("/");
    })
    .catch((error) => {
      console.log(error);
    });
});

app.listen(3000, () => {
  console.log("server started on port 3000");
});
