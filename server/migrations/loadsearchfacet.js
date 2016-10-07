/**
 * @file Script for automigration
 * @author Ramanavel <ramanavel.s@ideas2it.com>
 */

var dataSource = require(process.cwd() + "/server/server.js").dataSources["psqlDs"];
var async = require("async");
var fs = require("fs");
var path = require("path");
var lodash = require("lodash");
var _ = require("underscore");
var csv = require("fast-csv");

dataSource.autoupdate(function(err) {
  if(err) {
    console.log("err in autoupdate:: ", err);
    process.exit(1);
  }

  dataSource.automigrate("searchfacet", function(err) {
    if(err) {
      console.log("err in automigration:: ", err);
      process.exit(1);
    }

    async.parallel({
      searchfacets: importSearchFacets.bind(null)
      }, function (parallelErr, response) {
        if(parallelErr){
          console.error("Error on loading default values : ", parallelErr);
          process.exit(1);
        }
        console.log("Searchfacet imported: \n", response);
        process.exit(0);
    });

  });


  /**
   * Imports the deafult data for clans data from the csv file
   *
   * @param  {fucntion} defaultTemplateCB [callback]
   * @return {List[clan]}             [persisted clan objects as a list]
   * @author Ramanavel Selvaraju
   */
  const importSearchFacets = (defaultClansCB) => {
    const filePath = process.cwd() + "/server/migrations/data/searchfacet.csv";
    readCSV(filePath, (err, searchDataFromCSV) => {
      async.eachSeries(searchDataFromCSV, (data, callback) => {
        dataSource.models.searchfacet.create(data, (err, persistedData) => {
          callback(null);
        });
      }, (asyncErr) => {
        if(asyncErr)
        console.error({error: asyncErr, stack: asyncErr.stack});
        defaultClansCB(err, "successfully Imported Search Data");
      });//eachSeries
    });//readCSV
  };



  /**
   * Reads the give csv file name and returns as a json object to insert
   *
   * @param  {fucntion} readCSVCB [callback]
   * @return {void}
   * @author Ramanavel Selvaraju
   */
  const readCSV = (filePath, readCSVCB) => {
    let stream = fs.createReadStream(filePath);
    let streamData = [];
    csv.fromStream(stream, {headers: true})
    .on("data", (data) => {
      streamData.push(data);
    })
    .on("end", () => {
      return readCSVCB(null, streamData);
    });
  };
});
