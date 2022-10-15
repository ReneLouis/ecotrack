const express = require("express");
const app = express();
const port = process.env.PORT || 1971;

const path = require("path");

// ========== TEST FILE USED TO TEST CHANGES ON QUERIES ======= //
// const queries = require("./assets/js/queries");
const queries = require("./assets/js/queriesTEST");
// ============================================================ //

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* MODULE TO CHECK AND VALIDATE DATA ENTERED ON FORM */
const { check, validationResult } = require("express-validator");

/* =================== SETUP EJS TEMPLATE ===================== */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));

/*  * STATIC FILES MIDDLEWARE: allows server to see statics files such as imaes for sites.
   BELOW MIDDLEWARE FEED ALL IN ROOT FOLDER "./" TO THE SERVER: */
app.use(express.static(path.join(__dirname, "static")));

// ============================================================ //
// ======================= R O U T E S ======================== //

// app.get("/", (req, res) => {
//   // let data = fs.readFileSync('./assets/json/fuelTopUp.json');
//   // let myObj = JSON.parse(data);
//   res.render("layout", {
//     pageTitle: "Welcome",
//     template: "index",
//     vehicleList: myObj.vehicles,
//   });
// });
app.get("/", queries.welcomePage);
app.get("/summary/:vehicle", queries.summary);
app.get("/fueling/:vehicle", queries.fuelPage);
app.post(
  "/fueling/:vehicle",
  [
    check("date")
      .trim() // remove empty characters at beginning and end
      .escape() // remove any html
      .isDate()
      .notEmpty(),
    check("quantity")
      .trim()
      .escape()
      .isDecimal({ decimal_digits: 2 })
      .notEmpty(),
    check("distance")
      .trim()
      .escape()
      .isDecimal({ decimal_digits: 1 })
      .notEmpty(),
  ],
  queries.addFuelTopUp
);

app
  .route("/dbtest")
  //GET
  .get(queries.readData)
  //POST
  .post(queries.addFuelTopUp);

app.listen(port, () => {
  console.log(`Express listening on port ${port}`);
});
