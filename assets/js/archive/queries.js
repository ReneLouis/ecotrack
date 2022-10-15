const functions = require("./functions");
const { Pool } = require("pg");

// const isProduction = process.env.NODE_ENV === "production";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // don't check for SSL cert
  },
});

/* ================================================================ */
/* ========================== WELCOME PAGE ======================== */
const welcomePage = (request, response) => {
  // console.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);
  pool.query("SELECT shortname, name FROM vehicles;", (error, result) => {
    if (error) {
      throw error;
    }
    console.log(
      `This is the list of vehicled extract from database: ${result.rows}`
    );
    response.render("layout", {
      pageTitle: "Welcome",
      template: "index",
      vehicleList: result.rows,
    });
    //response.status(200).json(result.rows);  // REMOVED AS response ALREADY SENT.
  });
};

/* ================================================================ */
/* ========================== SUMMARY PAGE ======================== */
const readData = (request, response) => {
  pool.query("SELECT * FROM fuel_log;", (error, result) => {
    if (error) {
      throw error;
    }
    response.status(200).json(result.rows);
    console.log(`'GET' request on '/dbtest' successful.`);
  });
};

const summary = async (request, response) => {
  const shortname = request.params.vehicle;
  let vName = "";
  // ==== PULL name, shortname FROM vehicles: =====
  pool.query(
    "SELECT shortname, name FROM vehicles WHERE shortname = $1;",
    [shortname],
    (error, result) => {
      if (error) {
        throw error;
      }
      vName = result.rows[0].name;
      console.log(result.rows);
      console.log(`(inside pool.query): Vehicle name is ${vName}`);
      // ============ TRIAL 16/05 ============
      console.log(`(Outside pool.query): Vehicle name is ${vName}`);
      console.log(`Vehicle datails: ${vName}, ${shortname}`);
      // ===== PULL FUEL DATA AND RENDER PAGE:
      pool.query(
        "SELECT SUM (distance) AS distanceTotal, SUM (quantity) AS quantityTotal FROM fuel_log WHERE shortname = $1;",
        [shortname],
        (error, result) => {
          if (error) {
            throw error;
          }
          distanceTotal = result.rows[0].distancetotal;
          quantityTotal = result.rows[0].quantitytotal;
          console.log(result.rows);
          console.log(
            `Quantity: ${quantityTotal} ; distance: ${distanceTotal}`
          );
          pool.query(
            "SELECT date, quantity, distance FROM fuel_log WHERE date=(SELECT MAX(date) FROM fuel_log WHERE shortname=$1) AND shortname = $1",
            [shortname],
            (error, result) => {
              if (error) {
                throw error;
              }
              dateLastTopup = result.rows[0].date;
              distLastTopup = result.rows[0].distance;
              quantityLastTopup = result.rows[0].quantity;
              console.log(
                `Last Topup: Date: ${dateLastTopup} ; Distance: ${distLastTopup} ; Quantity: ${quantityLastTopup}`
              );

              // Fuel consumptions:
              let ecoLastTopUp = functions.consumtion(
                quantityLastTopup,
                distLastTopup
              );
              let ecoTotal = functions.consumtion(quantityTotal, distanceTotal);

              // Render Page:
              response.render("layout", {
                pageTitle: "Summary | " + request.params.vehicle,
                template: "summary",
                vehicle: request.params.vehicle,
                // vehicleName: functions.myObj.vehicles[functions.vehicleIndx].name,
                vehicleName: vName,
                //vehicleName: request.params.vehicle,
                // vehicleData: functions.myObj.vehicles[functions.vehicleIndx],
                dateLastTopup: dateLastTopup,
                vehicleEconomy: ecoLastTopUp,
                vehicleEconomyTotal: ecoTotal,
                fuellingData: true,
              });
            }
          );
        }
      );
      // =====================================
    }
  );
  // await query();

  // ======= TAKEN FROM BELOW ========

  // ======= TAKEN FROM ABOVE ========
};

/* ================================================================ */
/* ======================== FUEL TOPUP PAGE ======================= */
const addFuelTopUp = (request, response) => {
  // const { vehicle, date, quantity, distance } = request.body;
  const vehicle = request.params.vehicle;
  const topUpDate = request.body.date;
  const quantity = Number(request.body.quantity);
  const unit = request.body.unit;

  // distance to be assigned as km to database, whether entered as miles on km on app.
  let distance = 0;
  if (unit === "miles") {
    distance = Number(1.609 * request.body.distance);
  } else {
    distance = Number(request.body.distance);
  }
  // const distance = Number(1.609 * request.body.distance);

  const vName = request.params.vehicle.replace(/_/g, " ");

  console.log(`Name: ${vName} ;
  shortname: ${vehicle},
  date topup: ${topUpDate},
  Quantity:${quantity},
  Distance: ${distance}`);

  console.log(request.body);

  pool.query(
    "INSERT INTO fuel_log (vehicle, date, quantity, distance, shortname) VALUES ($1, $2, $3, $4, $5)",
    [vName, topUpDate, quantity, distance, vehicle],
    (error) => {
      if (error) {
        throw error;
      }
      // response
      //   .status(201)
      //   .json({ status: "success", message: "Fuel top up added." });
      // console.log(`'POST' request on '/dbtest' successful.`);
      ecoLastTopUp = functions.consumtion(quantity, distance);
      ecoTotal = { mpg: 0, lphkm: 0 };
      response.render("layout", {
        pageTitle: "Summary | " + request.params.vehicle,
        template: "summary",
        vehicle: request.params.vehicle,
        // vehicleName: functions.myObj.vehicles[functions.vehicleIndx].name,
        vehicleName: vName,
        //vehicleName: request.params.vehicle,
        // vehicleData: functions.myObj.vehicles[functions.vehicleIndx],
        dateLastTopup: request.params.date,
        vehicleEconomy: ecoLastTopUp,
        vehicleEconomyTotal: ecoTotal,
        fuellingData: true,
      });
    }
  );
};

const fuelPage = (request, response) => {
  const shortname = request.params.vehicle;
  const vName = shortname.replace(/_/g, " ");
  response.render("layout", {
    pageTitle: "Fuel Top Up | " + vName,
    template: "fuelTopUp",
    vehicle: request.params.vehicle,
    vehicleName: vName,
  });
};

module.exports = { welcomePage, readData, addFuelTopUp, summary, fuelPage };
