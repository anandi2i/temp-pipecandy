import async from "async";
import fs from "fs";
import path from "path";
import csv from "fast-csv";
import xlsx from "node-xlsx";
import _ from "underscore";
import logger from "../../server/log";
import lodash from "lodash";
var CONTAINERS_URL = "/api/containers/";
const emptycount = 0;

module.exports = function(File) {

  File.remoteMethod(
    "downloadCSV", {
      accepts: [{
        arg: "listId",
        type: "number"
      },
      {
        arg: "res",
        type: "object",
        "http": {
          source: "res"
        }
      }],
      returns: {
        arg: "csv",
        type: "object"
      },
      http: {
        verb: "GET",
        path: "/list/:listId/downloadcsv"
      }
    }
  );

  /**
   * Download a sample csv file with all additional fields for the current list
   * @param  {[listId]} listId
   * @param  {[res]} response
   * @param  {[function]} downloadCSVCB
   * @return {[csv]}
   * @sample: http://localhost:3000/api/file/list/4/downloadCSV
   * @author Aswin Raj A
   */
  File.downloadCSV = (listId, res, downloadCSVCB) => {
    async.waterfall([
      async.apply(getAllDefaultFields, listId),
      getAllAdditionalFieldsForList,
      generateCSV
    ], (asyncErr, csv) => {
      if(asyncErr){
        logger.error("Error while generating csv for the list",
        {error: asyncErr, stack: asyncErr ? asyncErr.stack : ""});
        downloadCSVCB(asyncErr);
      }
      res.set("Content-Disposition", "attachment;filename=sampleEmailList.csv");
      res.send(csv);
    });
  };

  /**
   * Generate csv with additional fields
   * @param  {[type]} allAdditionalFields [description]
   * @param  {[type]} generateCSVCB       [description]
   * @return {[type]}                     [description]
   * @author Aswin Raj A
   */
  let generateCSV = (allAdditionalFields, generateCSVCB) => {
    csv.write([allAdditionalFields], {headers: true})
    .on("data", function(data){
      generateCSVCB(null, data);
    });
  };


  File.upload = function(ctx, options, listid, uploadCB) {
    let invalidData = [];

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
          logger.error("Error in uploading file for the list:", listid, " ",
            err.message);
          return callback(err);
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
              logger.error("Error in saving file details for list:", listid,
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


    /**
     * Get all the additionalFields for the current list
     * @param  {[fileName]} fileName
     * @param  {[function]} getAllFieldsForListCB
     * @return {[fileName, fields]}
     * @author Aswin Raj A
     */
    let getAllFieldsForList = (fileName, getAllFieldsForListCB) => {
      async.waterfall([
        async.apply(getAllDefaultFields, listid),
        getAllAdditionalFieldsForList
      ], (asyncErr, fields) => {
        if(asyncErr){
          logger.error("Error while geting all fields for list", {
            error: asyncErr,
            stack: asyncErr ? asyncErr.stack : ""
          });
          return getAllFieldsForListCB(asyncErr);
        }
        return getAllFieldsForListCB(null, fileName, fields);
      });
    };

    function parseUploadedFile(fileName, fields, callback) {
      let fileExt = _.last(fileName.split("."));
      fileExt === "csv" ? parseCSV(fields, callback) : parseExcel(fields,
        callback);
    }

    function parseExcel(fields, callback) {
      let people = [];
      let companies = [];
      let header = ["firstName", "middleName", "lastName", "email", "field1",
        "value1", "field2", "value2", "field3", "value3", "field4", "value4",
        "field5", "value5"];
      let err = false;
      let obj = xlsx.parse(filePath);
      _.each(obj, function(object) {
        let rowData = [];
        if(object.data) {
          if(_.isEqual(object.data[0], header)) {
            rowData = _.rest(object.data);
          } else {
            let error = new Error();
            error.message = "Please upload file in valid format";
            error.name = "FileUploadInvalidHeader";
            logger.error("File is not in valid format", error.message);
            err = true;
            callback(error);
          }
        }
        _.each(rowData, function(row) {
          if(!row[0]) {
            let error = new Error();
            error.message = "One or more rows doesn't have first name";
            error.name = "FileUploadFnameEmpty";
            logger.error("First name is empty", error.message);
            err = true;
            callback(error);
          }
          let domain = row[3].split("@")[1];
          if(!domain) {
            let error = new Error();
            error.message = "One or more rows doesn't have valid email Id";
            error.name = "FileUploadInvalidEmail";
            logger.error("Not a valid email", error.message);
            err = true;
            callback(error);
          } else {
            companies.push(domain);
          }
          people.push(_.object(header, row));
        });
      });
      if(!err) {
        callback(null, companies, people);
      }
    }


    /**
     * Parse the csv file and validate it
     *  - Check if the header fields are same comparing it with the additional
     *  fields for the list and the csv coloumn headers
     *  - Generate an array of companies
     *  - Generate an array of people where all required fields are filled
     *  - Generate an array of invalid data where the required fields would have
     *  been missing
     *  - And Generate the responseMessage
     * @param  {[fields]}   fields
     * @param  {function} callback
     * @return {[companies, people, invalidData, responseMessage]}
     * @author: modified by Aswin Raj A
     */
    function parseCSV(fields, callback){
      let people = [];
      let companies = [];
      let responseMessage = "";
      let domain;
      let stream = fs.createReadStream(filePath);
      let header = fields;
      let headerCheck = true;
      let err = false;
      csv.fromStream(stream, {headers: true}).on("data", (data) => {
        const streamHeader = _.keys(data);

        if(headerCheck) {
          headerCheck = false;
          if(!_.isEqual(streamHeader, header)) {
            let error = new Error();
            error.message = "Please upload file in valid format";
            error.name = "FileUploadInvalidHeader";
            logger.error("File is not in valid format", error.message);
            err = true;
            return callback(error);
          }
        }

        if(!data["First Name"] || !data["Last Name"] || !data.Email){
          responseMessage = "One or more rows have unfilled or invalid data!";
          invalidData.push(data);
        } else{
          domain = data.Email.split("@")[1];
          if(!domain) {
            responseMessage = "One or more rows have unfilled or invalid data!";
            invalidData.push(data);
          } else{
            companies.push(domain);
            people.push(data);
          }
        }

      }).on("end", () => {
        if(!err) {
          return callback(null, companies, people, invalidData,
             responseMessage);
        }
      });
    }

    function createCompanies(companies, newPeople, invalidData, responseMessage,
      createCompaniesCB) {
      companies = _.uniq(companies);
      async.eachSeries(companies, (company, companyCB) => {
        File.app.models.company.findOrCreate({
          where: {
            name: company
          }
        }, {
          name:company
        },
        (companyCreateErr, company) => {
          if(companyCreateErr){
            logger.error("Error while finding or creating company",
             {error: companyCreateErr,
               stack: companyCreateErr ? companyCreateErr.stack : ""});
               return createCompaniesCB(companyCreateErr);
          }
          companyCB(null);

        });
      }, (asyncErr) => {
        if(asyncErr){
          logger.error("Error while creating companie",
           {error: asyncErr, stack: asyncErr ? asyncErr.stack : ""});
          return createCompaniesCB(asyncErr);
        }
        return createCompaniesCB(null, newPeople, invalidData, responseMessage);
      });
    }

    /**
     * Populate the validated person data and corresponding field values for
     * the person and
     * @param  {[people]} people
     * @param  {[invalidData]} invalidData
     * @param  {[responseMessage]} responseMessage
     * @param  {[function]} populatePeopleAndFieldsCB
     * @return {[uploadResponse]} Has invalid data if any and the responseMessage
     * @author Aswin Raj A
     */
    let populatePeopleAndField = (newPeople, invalidData, responseMessage,
      populatePeopleAndFieldsCB) => {
      File.app.models.List.findById(listid, (err, list) => {
        if(err) {
          logger.error("Error in finding list:", listid, " ", err.message);
          return populatePeopleAndFieldsCB(err);
        }
        async.waterfall([
          async.apply(getAdditionalfield, list, newPeople),
          populateFieldsForPerson
        ], (asyncErr, result) => {
          if(asyncErr){
            logger.error("Error while populating people and field valued",
             {error: asyncErr, stack: asyncErr ? asyncErr.stack : ""});
          }
          let uploadResponse = {
            "invalidData": invalidData,
            "responseMessage":responseMessage
          };
          return populatePeopleAndFieldsCB(null, uploadResponse);
        });
      });
    };

    /**
     * Check if there exist any email in the table with the email in the newly
     * uploaded file,
     * if the current email exist in the table already, then return that person
     * @param  {[personEmail]} personEmail
     * @param  {[function]} emailExistCheckCB
     * @return {[people]}
     * @author Aswin Raj A
     */
    let emailExistCheck = (personEmail, listId, emailExistCheckCB) =>{
      let response = {};
      File.app.models.person.find({
        where : {
          email : personEmail,
        }
      }, (emailFindErr, people) => {
        if(emailFindErr){
          logger.error("Error while finding email",
           {error: emailFindErr, stack: emailFindErr ? err.stack : ""});
          return emailExistCheckCB(emailFindErr);
        }
        if(lodash.isEmpty(people)){
          response = {
            msg : "doesnotExist",
            people : people
          };
          return emailExistCheckCB(null, response);
        }
        people[0].lists((listfindErr, lists) => {
          if(listfindErr){
            logger.error("Error while finding list for person",
             {error: listfindErr, stack: listfindErr ? err.stack : ""});
            return emailExistCheckCB(listfindErr);
          }
          async.eachSeries(lists, (list, listCB) => {
            if(list.id === listId){
              response = {
                msg : "exist",
                people : people
              };
              emailExistCheckCB(null, response);
            } else {
              response = {
                msg : "existInDiffList",
                people : people
              };
              emailExistCheckCB(null, response);
            }
          });
        });
      });
    };

    /**
     * To get all the additionalFields for the list
     * @param  {[list]} list
     * @param  {[people]} people
     * @param  {[function]} getAdditionalfieldCB
     * @return {[additionalFields, list, people]}
     * @author Aswin Raj A
     */
    let getAdditionalfield = (list, newPeople, getAdditionalfieldCB) => {
        list.fields((fieldErr, fields) => {
          let additionalFields = fields.map((field) => {
            const fieldObj = {
              "name" : field.name,
              "id" : field.id
            };
            return fieldObj;
          });
          return getAdditionalfieldCB(null, additionalFields, list, newPeople);
        });
    };

    /**
     * Populate person from the csv and the corresponding additional field values
     * - Create an entry for if there is no duplicate entry in the table for the person
     * - Update the person if the email already exist with a different name
     * @param  {[additionalFields]} additionalFields
     * @param  {[list]} list
     * @param  {[people]} people
     * @param  {[function]} populateFieldsForPersonCB
     * @author Aswin Raj A
     */
    let populateFieldsForPerson = (additionalFields, list, newPeople,
      populateFieldsForPersonCB) => {
      async.eachSeries(newPeople, (newPerson, newPersonCB) => {
      emailExistCheck(newPerson.Email, list.id,
        (emailExistCheckErr, response) => {
        if(emailExistCheckErr){
          logger.error("Error while checking if emailId already exist",
          {error: emailExistCheckErr,
          stack: emailExistCheckErr ? err.stack : ""});
          return populateFieldsForPersonCB(emailExistCheckErr);
        }
        if(response.msg === "doesnotExist"){
          let newPersonObject = {
            firstName: newPerson["First Name"],
            middleName: newPerson["Middle Name"],
            lastName: newPerson["Last Name"],
            salutation: newPerson.Salutation,
            email: newPerson.Email
          };
          createPersonAndAdditionalFieldValue(newPersonObject, additionalFields,
             list, newPerson,
            (creatErr, response) => {
            if(creatErr){
              logger.error(creatErr, {error: creatErr,
                stack: creatErr ? creatErr.stack : ""});
              return populateFieldsForPersonCB(creatErr);
              }
            newPersonCB(null);
          });
        } else if(response.msg === "exist"){
          updatePersonAndAdditionalFieldValues(response.people[0],
            additionalFields, list, newPerson, (updateErr, response) => {
          if(updateErr){
            logger.error(updateErr,
            {error: updateErr,
            stack: updateErr ? updateErr.stack : ""});
            return populateFieldsForPersonCB(updateErr);
          }
          newPersonCB(null);
          });
        } else if(response.msg === "existInDiffList"){
          let personObject = {
            firstName: newPerson["First Name"],
            middleName: newPerson["Middle Name"],
            lastName: newPerson["Last Name"],
            salutation: newPerson.Salutation,
            email: newPerson.Email
          };
          list.people.add(response.people[0].id,
          (peopleCreateErr, people) => {
            if(peopleCreateErr){
              logger.error("Error while associating person",
              {error: peopleCreateErr,
                stack: peopleCreateErr ? peopleCreateErr.stack : ""});
              return populateFieldsForPersonCB(peopleCreateErr);
            }
            let auditPersonObj = {};
            if(response.people[0].firstName !== newPerson["First Name"]){
              auditPersonObj.firstName = response.people[0].firstName;
            }
            if(response.people[0].middleName !== newPerson["Middle Name"]){
              auditPersonObj.middleName = response.people[0].middleName;
            }
            if(response.people[0].lastName !== newPerson["Last Name"]){
              auditPersonObj.lastName = response.people[0].lastName;
            }
            if(response.people[0].salutation !== newPerson.Salutation){
              auditPersonObj.salutation = response.people[0].salutation;
            }
            let objLength = Object.getOwnPropertyNames(auditPersonObj).length;
            if(objLength!== emptycount){
              auditPersonObj.personId = response.people[0].id;
              File.app.models.personAudit.create(auditPersonObj,
                (auditCreateErr, createdPersonAudit) => {
                if(auditCreateErr){
                  logger.error("auditCreateErr",
                  {error: auditCreateErr,
                  stack: auditCreateErr ? auditCreateErr.stack : ""});
                  return populateFieldsForPersonCB(auditCreateErr);
                }
                File.app.models.person.findById(response.people[0].id,
                  (findErr, person) => {
                  person.updateAttributes(personObject,
                    (updateErr, updatedperson) => {
                    if(updateErr){
                      logger.error("person update err",
                      {error: updateErr,
                      stack: updateErr ? updateErr.stack : ""});
                      return populateFieldsForPersonCB(updateErr);
                    }
                    async.each(additionalFields, (additionalField,
                      additionalFieldsCB) => {
                      let additionalFieldValueObj = {
                        "fieldId":additionalField.id,
                        "listId": list.id,
                        "personId":person.id,
                        "value": newPerson[additionalField.name]
                      };
                      if(additionalFieldValueObj.value){
                        File.app.models.additionalFieldValue
                        .create(additionalFieldValueObj,
                          (fieldValueCreateErr, createdFields) => {
                        if(fieldValueCreateErr){
                          logger.error("Error in creating fields for\
                           the person", createdPerson.id, " ",
                           fieldValueCreateErr.message);
                        return populateFieldsForPersonCB(fieldValueCreateErr);
                        }
                        additionalFieldsCB(null);
                        });
                      } else{
                        additionalFieldsCB(null);
                      }
                    }, (err) => {
                      if(err){
                        return populateFieldsForPersonCB(err);
                      }
                      logger.info("File uploaded successfully for the list:",
                      listid);
                      return newPersonCB(null);
                    });
                  });
                });
              });
            } else{
              return newPersonCB(null);
            }
          });
        }
      });
      }, (err) => {
      if(err){
      return populateFieldsForPersonCB(err);
      }
      return populateFieldsForPersonCB(null);
      });
    };


    /**
     * Create person and additionalFields values
     * @param  {[personObject]} personObject
     * @param  {[additionalFields]} additionalFields
     * @param  {[list]} list
     * @param  {[person]} person
     * @param  {[function]} createPersonAndAdditionalFieldValueCB
     * @author Aswin Raj A
     */
    let createPersonAndAdditionalFieldValue = (personObject,
      additionalFields, list, person,
      createPersonAndAdditionalFieldValueCB) => {
        async.waterfall([
            async.apply(createPerson, personObject,
              additionalFields, list, person),
            createAdditionalFields
        ], function (asyncErr, result) {
          if(asyncErr){
            logger.error("Error while creating person and field\
             values", {error: asyncErr,
               stack: asyncErr ? asyncErr.stack : ""});
             return createPersonAndAdditionalFieldValueCB(asyncErr);
          }
            return createPersonAndAdditionalFieldValueCB(null);
        });
    };


    /**
     * Create an entry in the person table
     * @param  {[personObject]} personObject
     * @param  {[additionalFields]} additionalFields
     * @param  {[list]} list
     * @param  {[person]} person
     * @param  {[function]} createPersonCB
     * @return {[createdPerson, additionalFields, list, person]}
     * @author Aswin Raj A
     */
    let createPerson = (personObject, additionalFields, list, person,
      createPersonCB) => {
      list.people.create(personObject, (err, createdPerson) => {
        if(err) {
          logger.error("Error in creating people for the list:",
          listid, " ", err.message);
          return createPersonCB(err);
        }
        return createPersonCB(null, createdPerson, additionalFields,
           list, person);
      });
    };


    /**
     * Create additionalFields value for the current created person
     * @param  {[createdPerson]} createdPerson
     * @param  {[additionalFields]} additionalFields
     * @param  {[list]} list
     * @param  {[person]} person
     * @param  {[type]} createAdditionalFieldsCB
     * @author Aswin Raj A
     */
    let createAdditionalFields = (createdPerson, additionalFields,
      list, person, createAdditionalFieldsCB) => {
      async.each(additionalFields, (additionalField, additionalFieldsCB) => {
        let additionalFieldValueObj = {
          "fieldId":additionalField.id,
          "listId": list.id,
          "personId":createdPerson.id,
          "value": person[additionalField.name]
        };
        if(additionalFieldValueObj.value){
          File.app.models.additionalFieldValue.create(additionalFieldValueObj,
            (fieldValueCreateErr, createdFields) => {
              if(fieldValueCreateErr){
                logger.error("Error in creating fields for the person",
                createdPerson.id, " ", fieldValueCreateErr.message);
                return createAdditionalFieldsCB(fieldValueCreateErr);
              }
              additionalFieldsCB(null);
          });
        }else{
          additionalFieldsCB(null);
        }
      }, (err) => {
        if(err){
          return createAdditionalFieldsCB(err);
        }
        logger.info("File uploaded successfully for the list:",
        listid);
        return createAdditionalFieldsCB(null);
      });
    };


    /**
     * When the list has email which already exist in the person table, we need
     * to update the personaudit, person and additionalFieldsvalue table
     * @param  {[oldPerson]} oldPerson
     * @param  {[additionalFields]} additionalFields
     * @param  {[list]} list
     * @param  {[person]} person
     * @param  {[function]} updatePersonAndAdditionalFieldValuesCB
     * @author Aswin Raj A
     */
    let updatePersonAndAdditionalFieldValues = (oldPerson, additionalFields,
      list, newperson,
      updatePersonAndAdditionalFieldValuesCB) => {
        async.waterfall([
          async.apply(createPersonAudit, oldPerson, additionalFields, list,
            newperson),
          updatePerson,
          updateAdditionalFieldValues
        ], (asyncErr, result) => {
          if(asyncErr){
            logger.error("Error while updating person and person\
            audit and additionalFields", {error: asyncErr,
               stack: asyncErr ? asyncErr.stack : ""});
             return updatePersonAndAdditionalFieldValuesCB(asyncErr);
           }
           return updatePersonAndAdditionalFieldValuesCB(null);
        });
    };

    /**
     * To create person audit for the person
     * - While uploading csv file if the email already exist with different name
     *   we need to create an audit for the person
     * @param  {[oldPerson]} oldPerson
     * @param  {[additionalFields]} additionalFields
     * @param  {[list]} list
     * @param  {[newPerson]} newPerson
     * @param  {[function]} createPersonAuditCB
     * @return {[newPerson, oldPersonId, list, additionalFields]}
     * @author Aswin Raj A
     */
    let createPersonAudit = (oldPerson, additionalFields, list, newPerson,
      createPersonAuditCB) => {
      let auditPersonObj = {};
      if(oldPerson.firstName !== newPerson["First Name"]){
        auditPersonObj.firstName = oldPerson.firstName;
      }
      if(oldPerson.middleName !== newPerson["Middle Name"]){
        auditPersonObj.middleName = oldPerson.middleName;
      }
      if(oldPerson.lastName !== newPerson["Last Name"]){
        auditPersonObj.lastName = oldPerson.lastName;
      }
      if(oldPerson.salutation !== newPerson.Salutation){
        auditPersonObj.salutation = oldPerson.salutation;
      }
      let objectLenth = Object.getOwnPropertyNames(auditPersonObj).length;
      if(objectLenth!== emptycount){
        auditPersonObj.personId = oldPerson.id;
        File.app.models.personAudit.create(auditPersonObj,
          (auditCreateErr, createdPersonAudit) => {
          if(auditCreateErr){
            logger.error("auditCreateErr",
            {error: auditCreateErr,
              stack: auditCreateErr ? auditCreateErr.stack : ""});
            return createPersonAuditCB(auditCreateErr);
          }
          return createPersonAuditCB(null, newPerson, oldPerson.id, list,
            additionalFields);
        });
      } else{
      return createPersonAuditCB(null, newPerson, oldPerson.id, list,
        additionalFields);
      }
    };

    /**
     * To update the person table after creating person audit for that person
     * - Insert the old person data in the personaudit table and update the new
     *   data in the person table
     * @param  {[newPerson]} newPerson
     * @param  {[personId]} personId
     * @param  {[list]} list
     * @param  {[additionalFields]} additionalFields
     * @param  {[function]} updatePersonCB
     * @return {[newPerson, personId, list, additionalFields]}
     * @author Aswin Raj A
     */
    let updatePerson = (newPerson, personId, list, additionalFields,
      updatePersonCB) => {
      let newPersonObj = {
        firstName: newPerson["First Name"],
        middleName: newPerson["Middle Name"],
        lastName: newPerson["Last Name"],
        salutation: newPerson.Salutation,
        email: newPerson.Email
      };
      File.app.models.person.findById(personId,
        (personFindErr, person) => {
        if(personFindErr){
          logger.error("Error while finding person",
           {error: personFindErr,
             stack: personFindErr ? personFindErr.stack : ""});
          return updatePersonCB(personFindErr);
        }
        person.updateAttributes(newPersonObj,
          (personUpdateErr, updatedPerson) => {
          if(personUpdateErr){
            logger.error("personUpdateErr",
             {error: personUpdateErr,
               stack: personUpdateErr ? personUpdateErr.stack : ""});
            return updatePersonCB(personUpdateErr);
          }
          return updatePersonCB(null, newPerson, personId, list,
            additionalFields);
        });
      });
    };


    /**
     * Update the additionalFields values after updating the person audit and
     * the person table
     * @param  {[newPerson]} newPerson
     * @param  {[personId]} personId
     * @param  {[list]} list
     * @param  {[additionalFields]} additionalFields
     * @param  {[function]} updateAdditionalFieldValuesCB
     * @author Aswin Raj A
     */
    let updateAdditionalFieldValues = (newPerson, personId, list,
      additionalFields, updateAdditionalFieldValuesCB) => {
      async.eachSeries(additionalFields, (additionalField,
        additionalFieldsCB) => {
        File.app.models.additionalFieldValue.find({
          where: {
            and: [
              {personId : personId},
              {listId: list.id},
              {fieldId: additionalField.id}
            ]
          }
        }, (fieldFindErr, fieldData) => {
          if(fieldFindErr){
            logger.error("Error while finding field", {error: fieldFindErr,
              stack: fieldFindErr ? fieldFindErr.stack : ""});
            return updateAdditionalFieldValuesCB(fieldFindErr);
          }
          if(lodash.isEmpty(fieldData)){
            let addFieldValueObj = {
              personId : personId,
              listId: list.id,
              fieldId: additionalField.id,
              value: newPerson[additionalField.name]
            };
            File.app.models.additionalFieldValue.create(addFieldValueObj,
              (fieldCreateErr, createdField) => {
                if(fieldCreateErr){
                  logger.error("Error while creating fields",
                   {error: fieldCreateErr,
                     stack: fieldCreateErr ? fieldCreateErr.stack : ""});
                  return updateAdditionalFieldValuesCB(fieldCreateErr);
                }
               additionalFieldsCB(null);
            });
          } else{
            fieldData[0].updateAttribute("value",
            newPerson[additionalField.name],
              (fieldUpdateErr, updatedField) => {
              if(fieldUpdateErr){
                logger.error("Error while updating additionalField\
                 value", {error: fieldUpdateErr,
                 stack: fieldUpdateErr ? fieldUpdateErr.stack : ""});
                 return updateAdditionalFieldValuesCB(fieldUpdateErr);
              }
              additionalFieldsCB(null);
            });
          }
        });
      }, (err) => {
        if(err){
          logger.error("Error while updating additionalField",
           {error: err, stack: err ? err.stack : ""});
           return updateAdditionalFieldValuesCB(err);
        }
        return updateAdditionalFieldValuesCB(null);
      });

    };


    async.waterfall([
      saveFile,
      getAllFieldsForList,
      parseUploadedFile,
      createCompanies,
      populatePeopleAndField
    ], (asyncErr, asyncResult) => {
      if(asyncErr){
        uploadCB(asyncErr);
      }
      uploadCB(null, asyncResult);
    });

  };

  /**
   * Get all the additionalField where userId is null, implying common
   * additionalField
   * @param  {[listid]} listid
   * @param  {[function]} getAllDefaultFieldsCB
   * @return {[defaultAdditionalFields, listid]}
   * @author Aswin Raj A
   */
  let getAllDefaultFields = (listid, getAllDefaultFieldsCB) => {
    File.app.models.additionalField.find({
      where : {
        userId : null
      }
    }, (fieldsFindErr, defaultFields) => {
      if(fieldsFindErr){
        logger.error("Error while finding default fields for the\
         list", {
          error: fieldsFindErr,
          stack: fieldsFindErr ? fieldsFindErr.stack : ""
        });
        return getAllDefaultFieldsCB(fieldsFindErr);
      }
      let defaultAdditionalFields = _.pluck(defaultFields, "name");
      return getAllDefaultFieldsCB(null, defaultAdditionalFields,
         listid);
    });
  };


  /**
   * Get all additionalField for the listid,
   * @param  {[type]} defaultAdditionalFields         [description]
   * @param  {[type]} listid                          [description]
   * @param  {[type]} getAllAdditionalFieldsForListCB [description]
   * @return {[type]}                                 [description]
   * @author Aswin Raj A
   */
  let getAllAdditionalFieldsForList = (defaultAdditionalFields,
     listid, getAllAdditionalFieldsForListCB) => {
    File.app.models.list.findById(listid, (listFindErr, list) => {
      if(listFindErr){
        logger.error("Error while finding list", {
          error: listFindErr,
          stack: listFindErr ? listFindErr.stack : ""
        });
        return getAllAdditionalFieldsForListCB(listFindErr);
      }
      list.fields((fieldErr, fields) => {
        if(fieldErr){
          logger.error("Error while finding fields for list", {
            error: fieldErr,
            stack: fieldErr ? fieldErr.stack : ""
          });
          return getAllAdditionalFieldsForListCB(fieldErr);
        }
        let allAdditionalFields = lodash
        .concat(defaultAdditionalFields, _.pluck(fields, "name"));
        return getAllAdditionalFieldsForListCB(null,
          allAdditionalFields);
      });
    });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  File.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });

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
