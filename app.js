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
  const id = req.body.id;

  session
    .run(
      "MATCH (a:Person {name:$name1}), (b:Person {name:$name2}) MERGE (a)-[:FRIEND]->(b)",
      { name1, name2 }
    )
    .then((result) => {
      console.log(id);
      if (id && id != 0) {
        res.redirect("/person/" + id);
      } else {
        res.redirect("/");
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

//person born in [:BORN_IN]
app.post("/person/born/add", (req, res) => {
  const name = req.body.name;
  const city = req.body.city;

  session
    .run(
      "MATCH (a:Person {name:$name}), (b:Location {city:$city}) MERGE (a)-[:BORN_IN]->(b)",
      { name, city }
    )
    .then((result) => {
      res.redirect("/");
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/person/:id", (req, res) => {
  const id = req.params.id;
  session
    .run("MATCH (n:Person) WHERE id(n)=toInteger($idP) RETURN n.name as name", {
      idP: id,
    })
    .then((result) => {
      const name = result.records[0].get("name");
      session
        .run(
          "OPTIONAL MATCH (n:Person)-[r:BORN_IN]-(l:Location) WHERE id(n)=toInteger($idP) RETURN l.city as city",
          { idP: id }
        )
        .then((result2) => {
          const city = result2.records[0].get("city");
          session
            .run(
              "OPTIONAL MATCH (n:Person)-[r:FRIEND]-(m:Person) WHERE id(n)=toInteger($idP) RETURN m",
              { idP: id }
            )
            .then((result3) => {
              const friendsArr = [];
              result3.records.forEach((record) => {
                if (record.get(0) != null) {
                  friendsArr.push({
                    id: record.get(0).identity.low,
                    name: record.get(0).properties.name,
                  });
                }
              });
              res.render("person", {
                id,
                name,
                city,
                friends: friendsArr,
              });
            })
            .catch((err) => {
              console.log(err);
            });
        });
    });
});

app.listen(3000, () => {
  console.log("server started on port 3000");
});
