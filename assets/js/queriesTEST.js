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

  /* ========================================================== */
  /* ========== PULL name, shortname FROM vehicles: =========== */
  const loadVehicleDetails = () => {
    return new Promise((resolve) => {
      pool.query(
        "SELECT shortname, name FROM vehicles WHERE shortname = $1;",
        [shortname],
        (error, result) => {
          if (error) {
            throw error;
          }
          vName = result.rows[0].name;
        }
      );
      resolve();
    });
  };

  /* ========================================================== */
  /* ================== OVERALL FUEL DATA ===================== */
  let fuelDataAvailable = true;
  let distanceTotal;
  let quantityTotal;
  const loadOverallFuelData = () => {
    return new Promise((resolve) => {
      pool.query(
        "SELECT SUM (distance) AS distanceTotal, SUM (quantity) AS quantityTotal FROM fuel_log WHERE shortname = $1;",
        [shortname],
        (error, result) => {
          if (error) {
            throw error;
          }
          distanceTotal = result.rows[0].distancetotal;
          quantityTotal = result.rows[0].quantitytotal;
          resolve();
        }
      );
    });
  };

  /* ========================================================== */
  /* ================== LAST TOP UP FUEL DATA ================= */
  let dateLastTopup;
  let distLastTopup = 0;
  let quantityLastTopup = 0;
  const loadFuelDataTEST = () => {
    return new Promise((resolve) => {
      pool.query(
        "SELECT date, quantity, distance FROM fuel_log WHERE date=(SELECT MAX(date) FROM fuel_log WHERE shortname=$1) AND shortname = $1",
        [shortname],
        (error, result) => {
          if (error) {
            throw error;
          }
          if (result.rowCount > 0) {
            dateLastTopup = result.rows[0].date;
            distLastTopup = result.rows[0].distance;
            quantityLastTopup = result.rows[0].quantity;
          } else {
            fuelDataAvailable = false;
          }
          resolve();
        }
      );
    });
  };

  /* ============================================================ */
  /* ================= SUMMARY PAGE RENDERING =================== */
  const pageRendring = () => {
    return new Promise((resolve) => {
      response.render("layout", {
        pageTitle: "Summary | " + request.params.vehicle,
        template: "summary",
        vehicle: request.params.vehicle,
        vehicleName: vName,
        dateLastTopup: dateLastTopup,
        vehicleEconomy: ecoLastTopUp,
        vehicleEconomyTotal: ecoTotal,
        fuellingData: fuelDataAvailable,
      });
      resolve();
    });
  };

  /* ============================================================ */
  /* =========== FUNCTION TO CALL ALL ASYNCHRONEOUSLY =========== */
  const playAll = async () => {
    await loadVehicleDetails();
    await loadOverallFuelData();
    ecoTotal = functions.consumtion(quantityTotal, distanceTotal);
    console.log(
      `OUTSIDE 'loadOverallFuelData' function. 
            Quantity: ${quantityTotal} ; 
            distance: ${distanceTotal} ; 
            ecoTotal: ${ecoTotal.lphkm} L/100km.`
    );

    await loadFuelDataTEST();
    ecoLastTopUp = functions.consumtion(quantityLastTopup, distLastTopup);
    console.log(
      `OUTSIDE 'loadFuelDataTEST' function. 
            Quantity: ${quantityLastTopup} ; 
            distance: ${distLastTopup} ; 
            eco: ${ecoLastTopUp.lphkm} L/100km.`
    );

    console.log(`Fuel data available for ${vName}? ${fuelDataAvailable}.`);
    await pageRendring();
  };

  /* ============================================================== */
  /* =========> M A I N <=|====== CALL playAll FUNCTION =========== */
  playAll();
};

/* ================================================================ */

/* ================================================================ */
/* ======================== FUEL TOPUP PAGE ======================= */

const addFuelTopUp = (request, response) => {
  // const { vehicle, date, quantity, distance } = request.body;
  const shortname = request.params.vehicle;
  const topUpDate = request.body.date;
  const quantity = Number(request.body.quantity);
  const unit = request.body.unit;
  const vName = request.params.vehicle.replace(/_/g, " ");

  // distance to be assigned as km to database, whether entered as miles on km on app.
  let distance = 0;
  if (unit === "miles") {
    distance = Number(1.609 * request.body.distance);
  } else {
    distance = Number(request.body.distance);
  }
  // unit === miles ? distance = Number(1.609 * request.body.distance) : distance = Number(request.body.distance);

  /* ============================================================ */
  /* ============= ADD FUELING DATA TO DATABASE ================= */
  // let ecoLastTopUp;
  const addFuelTopUp = () => {
    return new Promise((resolve) => {
      pool.query(
        "INSERT INTO fuel_log (vehicle, date, quantity, distance, shortname) VALUES ($1, $2, $3, $4, $5)",
        [vName, topUpDate, quantity, distance, shortname],
        (error) => {
          if (error) {
            throw error;
          }
          // response
          //   .status(201)
          //   .json({ status: "success", message: "Fuel top up added." });
          // console.log(`'POST' request on '/dbtest' successful.`);
          // ecoLastTopUp = functions.consumtion(quantity, distance);
          // ecoTotal = { mpg: 0, lphkm: 0 };
          resolve();
        }
      );
    });
  };

  /* ========================================================== */
  /* ================== OVERALL FUEL DATA ===================== */
  let fuelDataAvailable = true;
  let distanceTotal;
  let quantityTotal;
  const loadOverallFuelData = () => {
    return new Promise((resolve) => {
      pool.query(
        "SELECT SUM (distance) AS distanceTotal, SUM (quantity) AS quantityTotal FROM fuel_log WHERE shortname = $1;",
        [shortname],
        (error, result) => {
          if (error) {
            throw error;
          }
          distanceTotal = result.rows[0].distancetotal;
          quantityTotal = result.rows[0].quantitytotal;

          console.log(`Inside 'loadOverallFuelDate':
           Total distance: ${distanceTotal} ;
           Total Quantity: ${quantityTotal}`);
          resolve();
        }
      );
    });
  };

  /* ============================================================ */
  /* ================= FUEL TOP-UP PAGE RENDERING =============== */
  let ecoLastTopUp;
  let ecoTotal;
  const pageRendring = () => {
    return new Promise((resolve) => {
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
      resolve();
    });
  };

  /* ============================================================ */
  /* =========== FUNCTION TO CALL ALL ASYNCHRONEOUSLY =========== */
  const playAll = async () => {
    await addFuelTopUp();
    ecoLastTopUp = functions.consumtion(quantity, distance);
    await loadOverallFuelData();
    ecoTotal = functions.consumtion(quantityTotal, distanceTotal);
    console.log(`Inside 'playAll' function:
    Total Distance: ${distanceTotal} ;
    Total quantity: ${quantityTotal} ;
    Eco Overall: ${ecoTotal}`);
    await pageRendring();
  };

  /* ============================================================== */
  /* =========> M A I N <=|====== CALL playAll FUNCTION =========== */
  playAll();
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
