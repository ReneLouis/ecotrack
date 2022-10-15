const consumtion = function (q, d) {
  let clkm;
  let cmpg;

  clkm = Math.round((q / d) * 100 * 100) / 100; // L/100km
  cmpg = Math.round((d / 1.609 / (q / 4.54609)) * 100) / 100;
  //   let economy = { mpg: cmpg, lphkm: clkm };
  //   console.log(`in consumtion, ${clkm} L/100km or ${cmpg} mpg.`);
  //   console.log(`in consumption: ${economy.mpg} mpg`);
  //   module.exports.economy = { mpg: cmpg, lphkm: clkm };
  return { mpg: cmpg, lphkm: clkm };
};
module.exports = { consumtion };
