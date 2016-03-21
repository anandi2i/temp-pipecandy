import async from "async";
import fs from "fs";
import path from "path";
import csv from "fast-csv";
import xlsx from "node-xlsx";
import _ from "underscore";
import logger from "../../server/log";
var CONTAINERS_URL = "/api/containers/";

module.exports = function(File) {

  File.upload = function(ctx, options, listid, cb) {
    if (!options) options = {};
    ctx.req.params.container = "listUploads";
    options = {
      getFilename: function (file, req, res) {
        let fileExt = _.last(file.name.split("."));
        let newFilename = new Date().getTime() + "." + fileExt;
        return newFilename;
      }
    };
    let filePath;

    function saveFile(callback) {
      File.app.models.container.upload(ctx.req, ctx.result, options,
        function(err, fileObj) {
        if (err) {
          logger.error("Error in uploading file for the list::", listid, " ",
            err.message);
          callback(err);
        }
        let fileInfo = fileObj.files.file[0];
        filePath = path.join("server/storage", fileInfo.container,
          fileInfo.name);
        let fileExt = _.last(fileInfo.name.split("."));
        let acceptableFileTypes = ["csv", "xls", "xlsx"];
        if (_.contains(acceptableFileTypes, fileExt)) {
          File.create({
            name: fileInfo.name,
            type: fileInfo.type,
            container: fileInfo.container,
            url: path.join(CONTAINERS_URL, fileInfo.container, "/download/",
              fileInfo.name)
          }, function(err, obj) {
            if (err) {
              logger.error("Error in saving file details for list::", listid,
                " ", err.message);
              callback(err);
            }
            callback(null, fileInfo.name);
          });
        } else {
          fs.unlinkSync(filePath);
          let error = new Error();
          error.message = "File should be in csv/excel format";
          error.name = "InvalidFile";
          logger.error("Error in removing the invalid file", error.message);
          callback(error);
        }
      });
    }

    function parseUploadedFile(fileName, callback) {
      let fileExt = _.last(fileName.split("."));
      fileExt === "csv" ? parseCSV(callback) : parseExcel(callback);
    }

    function parseExcel(callback) {
      let people = [];
      let companies = [];
      let header = ["firstName", "middleName", "lastName", "email", "field1",
        "value1", "field2", "value2", "field3", "value3", "field4", "value4",
        "field5", "value5"];
      let obj = xlsx.parse(filePath);
      let headerIndex = 0;
      _.each(obj, function(object) {
        _.each(object.data, function(row, index) {
          if(index !== headerIndex) {
            let domain = row[3].split("@")[1];
            if(!domain) {
              let error = new Error();
              error.message = "One or more rows doesn't have valid email Id";
              error.name = "InvalidEmail";
              logger.error("Not a valid email", error.message);
              callback(error);
            } else {
              companies.push(domain);
            }
            people.push(_.object(header, row));
          }
        });
      });
      callback(null, companies, people);
    }

    function parseCSV(callback){
      let people = [];
      let companies = [];
      let stream = fs.createReadStream(filePath);
      csv.fromStream(stream, {headers : true}).on("data", (data) => {
        let domain = data.email.split("@")[1];
        if(!domain) {
          let error = new Error();
          error.message = "One or more rows doesn't have valid email Id";
          error.name = "InvalidEmail";
          logger.error("Not a valid email", error.message);
          callback(error);
        } else {
          companies.push(domain);
        }
        people.push(data);
      }).on("end", () => {
        callback(null, companies, people);
      });
    }

    function createCompanies(companies, people, callback) {
      companies = companies.map(company => ({"name": company}));
      File.app.models.Company.create(companies, (err, companies) => {
        if(err) {
          logger.error("Error in creating companies for the list::", listid,
            " ", err.message);
        }
        logger.info("Companies created successfully for the list::", listid);
        callback(null, people);
      });
    }

    function populatePeople(peopleData, callback) {
      File.app.models.List.findById(listid, (err, list) => {
        if(err) {
          logger.error("Error in finding list::", listid, " ", err.message);
          callback(err);
        }
        list.people.create(peopleData, (err, peopleData) => {
          if(err) {
            logger.error("Error in creating people for the list::", listid, " ",
              err.message);
            callback(err);
          }
          logger.info("File uploaded successfully for the list::", listid);
          callback(null, peopleData);
        });
      });
    }

    async.waterfall([
      saveFile,
      parseUploadedFile,
      createCompanies,
      populatePeople
    ], cb);
  };

  File.remoteMethod(
    "upload", {
      description: "Uploads a file",
      accepts: [{
        arg: "ctx",
        type: "object",
        http: {
          source: "context"
        }
      }, {
        arg: "options",
        type: "object",
        http: {
          source: "query"
        }
      }, {
        arg: "listid",
        type: "number",
        http: {
          source: "query"
        }
      }],
      returns: {
        arg: "fileObject",
        type: "object",
        root: true
      },
      http: {
        verb: "post"
      }
    }
  );

};
