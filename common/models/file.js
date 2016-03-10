import async from "async";
import fs from "fs";
import path from "path";
import csv from "fast-csv";
import _ from "underscore";
var CONTAINERS_URL = "/api/containers/";

module.exports = function(File) {

  File.upload = function(ctx, options, listid, cb) {
    if (!options) options = {};
    ctx.req.params.container = "listUploads";

    options = {
      getFilename: function (req, res) {
        var newFilename = new Date().getTime()+".csv";
        return newFilename;
      }
    };
    let filePath;

    function saveFile(callback) {
      File.app.models.container.upload(ctx.req, ctx.result, options,
        function(err, fileObj) {
        if (err) {
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
              callback(err);
            }
            callback(null, filePath);
          });
        } else {
          fs.unlinkSync(filePath);
          let error = new Error();
          error.message = "Please upload only csv/excel file";
          error.name = "InvalidFile";
          callback(error);
        }
      });
    }

    function readFileAndGetEmails(filePath, callback) {
      let people = [];
      let stream = fs.createReadStream(filePath);
      csv.fromStream(stream, {headers : true}).on("data", (data) => {
        data.domain = data.email.split("@")[1];
        console.log("data.domain", data.domain);
        if(!data.domain) {
          let error = new Error();
          error.message = "One or more rows doesn't have valid email Id";
          error.name = "InvalidEmail";
          callback(error);
        }
        people.push(data);
      }).on("end", () => {
        let domains = _.pluck(people, "domain");
        callback(null, people, domains);
      });
    }

    function findCompanies(people, domains, callback) {
      File.app.models.Company.find({
         where: {name: {inq: domains}},
         include: ["prospects"]
      }, (err, companies) => {
        if(err) callback(err);
        let existingCompanies = _.pluck(companies, "name");
        let newCompanies = _.difference(domains, existingCompanies);
        newCompanies = newCompanies.map(company => ({"name": company}));
        callback(null, people, domains, newCompanies);
      });
    }

    function createCompanies(people, domains, newCompanies, callback) {
      if(!newCompanies.length) callback(null, people, domains);
      File.app.models.Company.create(newCompanies, (err, companies) => {
        if(err) callback(err);
        let companyIds = _.pluck(companies, "id");
        companyIds = companyIds.map(companyId => ({"companyId": companyId}));
        File.app.models.Prospect.create(companyIds, (err, prospects) => {
          if(err) callback(err);
          callback(null, people, domains);
        });
      });
    }

    function constructPeople(people, domains, callback) {
      let prospectData = {};
      File.app.models.Company.find({
         where: {name: {inq: domains}},
         include: ["prospects"]
      }, (err, companies) => {
        if(err) callback(err);
        companies.forEach(company => {
          company = company.toJSON();
          prospectData[company.name] = company.prospects.id;
        });
        _.each(people, person => {
            person.prospectId = prospectData[person.domain];
        });
        callback(null, people);
      });
    }

    function createPeople(people, callback){
      File.app.models.List.findById(listid, (err, list) => {
        if(err) callback(err);
        list.people.create(people, (err, person) => {
          if(err) callback(err);
          callback(null, person);
        });
      });
    }

    async.waterfall([
      saveFile,
      readFileAndGetEmails,
      findCompanies,
      createCompanies,
      constructPeople,
      createPeople
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
