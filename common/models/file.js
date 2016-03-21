import async from "async";
import fs from "fs";
import path from "path";
import csv from "fast-csv";
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
        let newFilename = new Date().getTime() + fileExt;
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
        if (fileInfo.type === "text/csv") {
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
            callback(null, filePath);
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

    function readFileAndCreateCompanies(filePath, callback) {
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
        companies = companies.map(company => ({"name": company}));
        File.app.models.Company.create(companies, (err, companies) => {
          if(err) {
            logger.error("Error in creating companies for the list::", listid,
              " ", err.message);
          }
          logger.info("Companies created successfully for the list::", listid);
          callback(null, people);
        });
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
      readFileAndCreateCompanies,
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
