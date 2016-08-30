import async from "async";
import fs from "fs";
import path from "path";
import csv from "fast-csv";
// import xlsx from "node-xlsx";
import _ from "underscore";
import logger from "../../server/log";
import lodash from "lodash";
import validator from "../../server/utils/validatorUtility";
import {errorMessage as errorMessages} from "../../server/utils/error-messages";
var CONTAINERS_URL = "/api/containers/";

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
      async.apply(File.app.models.additionalField.getAllDefaultFields, listId),
      File.app.models.additionalField.getAllAdditionalFieldsForList,
      generateCSV
    ], (asyncErr, csv) => {
      if(asyncErr){
        logger.error("Error while generating csv for the list",
        {error: asyncErr, stack: asyncErr ? asyncErr.stack : ""});
        downloadCSVCB(asyncErr);
      }
      res.set("Content-Disposition", "attachment;filename=SampleEmailList.csv");
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


  /**
   * API to upload CSV file and save the data in the table
   * @param  {[ctx]} ctx
   * @param  {[options]} options
   * @param  {[listid]} listid
   * @param  {[function]} uploadCB
   * @return {[type]}
   * @author Aswin Raj A
   */
  File.upload = function(ctx, options, listid, uploadCB) {
    if (!options) options = {};
    ctx.req.params.container = "listUploads";
    options = {
      getFilename: function (file, req, res) {
        let fileExt = _.last(file.name.split("."));
        let newFilename = new Date().getTime() + "." + fileExt;
        return newFilename;
      }
    };
    var csvStoragePath = "server/storage/"+ctx.req.params.container;
    if (!fs.existsSync(csvStoragePath)){
        fs.mkdirSync(csvStoragePath);
    }
    async.waterfall([
      async.apply(saveFile, ctx, options, listid),
      getAllFieldsForList,
      parseCSV
    ], (asyncErr, result) => {
      if(asyncErr){
        logger.error("Error while processing csv file", {
          listid:listid,
          error: asyncErr,
          stack: asyncErr ? asyncErr.stack : ""
        });
        uploadCB(asyncErr);
      }
      uploadCB(null, result);
    });
  };

  /**
   * Save the file to the storage
   * @param  {[ctx]} ctx
   * @param  {[options]} options
   * @param  {[listid]} listid
   * @param  {[function]} saveFileCB
   * @return {[fileName, listid, filePath]}
   * @author Aswin Raj A
   */
  let saveFile = (ctx, options, listid, saveFileCB) => {
    File.app.models.container.upload(ctx.req, ctx.result, options,
      (uploadErr, fileObj) => {
      if(uploadErr){
        logger.error("Error while uploading file for list", listid, {
          error: uploadErr,
          stack: uploadErr ? uploadErr.stack : ""
        });
        saveFileCB(uploadErr);
      }
      let fileInfo = fileObj.files.file[0];
      let filePath = path.join("server/storage", fileInfo.container,
        fileInfo.name);
      let fileExt = _.last(fileInfo.name.split("."));
      let acceptableFileTypes = ["csv"]; // ["csv", "xls", "xlsx"];
      if (_.contains(acceptableFileTypes, fileExt)) {
        File.create({
          name: fileInfo.name,
          type: fileInfo.type,
          container: fileInfo.container,
          url: path.join(CONTAINERS_URL, fileInfo.container, "/download/",
            fileInfo.name)
        }, (err, obj) => {
          if (err) {
            logger.error("Error in saving file details for list:", listid,
              " ", err.message);
            saveFileCB(err);
          }
          saveFileCB(null, fileInfo.name, listid, filePath);
        });
      } else {
        fs.unlinkSync(filePath);
        let error = new Error();
        error.message = "File should be in csv format";
        error.name = "InvalidFile";
        logger.error("Error in removing the invalid file", error.message);
        saveFileCB(error);
      }
    });
  };

  /**
   * To get all the additional fields for the current list along with the
   * default fields
   * @param  {[fileName]} fileName
   * @param  {[listid]} listid
   * @param  {[filePath]} filePath
   * @param  {[function]} getAllFieldsForListCB
   * @return {[listid, fieldsForList, filePath]}
   * @author Aswin Raj A
   */
  let getAllFieldsForList = (fileName, listid, filePath,
    getAllFieldsForListCB) => {
    async.waterfall([
      async.apply(File.app.models.additionalField.getAllDefaultFields, listid),
      File.app.models.additionalField.getAllAdditionalFieldsForList
    ], (asyncErr, fieldsForList) => {
      if(asyncErr){
        logger.error("Error while geting all fields for list", {
          error: asyncErr,
          stack: asyncErr ? asyncErr.stack : ""
        });
        return getAllFieldsForListCB(asyncErr);
      }
      getAllFieldsForListCB(null, listid, fieldsForList, filePath);
    });
  };

  /**
   * Parse the CSV and save the person with the corresponding additionalField
   * values
   * @param  {[listid]} listid
   * @param  {[fieldsForList]} fieldsForList
   * @param  {[filePath]} filePath
   * @param  {[function]} parseCSVCB
   * @return {[type]}
   * @author Aswin Raj A
   */
  let parseCSV = (listid, fieldsForList, filePath, parseCSVCB) => {
    async.waterfall([
      async.apply(getDataFromCSV, fieldsForList, filePath, listid),
      validateHeaders,
      savePersonWithAdditionalFields
    ], (asyncErr, result) => {
      if(asyncErr){
        logger.error("Error while parsing csv file", asyncErr);
        return parseCSVCB(asyncErr);
      }
      parseCSVCB(null, result);
    });
  };

  /**
   * Get all data from the uploaded CSV
   * @param  {[fieldsForList]} fieldsForList
   * @param  {[filePath]} filePath
   * @param  {[listid]} listid
   * @param  {[function]} getDataFromCSVCB
   * @return {[streamHeader, streamData, fieldsForList, listid]}
   * @author Aswin Raj A
   */
  let getDataFromCSV = (fieldsForList, filePath, listid, getDataFromCSVCB) => {
    let stream = fs.createReadStream(filePath);
    let streamData = [];
    let streamHeader = [];
    csv.fromStream(stream, {headers: true})
    .on("data", (data) => {
      streamHeader = _.keys(data);
      streamData.push(data);
    })
    .on("end", () => {
      if(lodash.isEmpty(streamData)){
        return getDataFromCSVCB(errorMessages.EMPTY_CSV_UPLOAD);
      }
      return getDataFromCSVCB(null, streamHeader, streamData, fieldsForList,
        listid);
    });
  };

  /**
   * Validate headers from CSV with the additionalField for the current list
   * @param  {[type]} streamHeaders
   * @param  {[type]} streamData
   * @param  {[type]} fieldsForList
   * @param  {[type]} listid
   * @param  {[function]} validateHeadersCB
   * @return {[streamData, listid]}
   * @author Aswin Raj A
   */
  let validateHeaders = (streamHeaders, streamData, fieldsForList, listid,
    validateHeadersCB) => {
    const notFound = -1;
    async.eachSeries(streamHeaders, (streamHeader, streamHeaderCB) => {
      if(fieldsForList.indexOf(streamHeader) !== notFound){
        streamHeaderCB(null);
      } else{
        validateHeadersCB(errorMessages.INVALID_FIELDS);
      }
    }, (err) => {
      if(err){
        return validateHeadersCB(errorMessages.INVALID_FIELDS);
      }
      return validateHeadersCB(null, streamData, listid);
    });
  };


  /**
   * To validate the current person record whether it has anuy invalid data or
   * not
   * @param  {[person]} person
   * @param  {[function]} validateDataCB
   * @return {[validatedData]}
   * @author Aswin Raj A
   */
  const validateData = (person, validateDataCB) => {
    async.waterfall([
      function toValidateEmail(validateCB){
        validator.validateEmail(person.Email, (isValid) => {
          if(isValid){
            validateCB(null, true, person);
          } else {
            validateCB(null, false, person);
          }
        });
      },
      amendData
    ], (asyncErr, result) => {
      if(asyncErr){
        logger.error(asyncErr);
      }
      validateDataCB(result);
    });
  };

  /**
   * To check if there is any data missing for the manadatory fields,
   * if missing and if the email already exist, amend the fields with
   * the existing data
   * if no person exist with the email and there are any invalid fields then
   * return as invalid data
   * @param  {isValidEmail} isValidEmail
   * @param  {[newPerson]}  newPerson
   * @param  {[function]}  amendDataCB
   * @return {isValid, person}
   * @author Aswin Raj A
   */
  const amendData = (isValidEmail, newPersonObj, amendDataCB) => {
    let newPerson = JSON.parse(JSON.stringify(newPersonObj));
    if(isValidEmail){
      File.app.models.person.getPersonForEmail(newPerson.Email,
        (personGetErr, person) => {
        if(personGetErr)
          logger.error({error: personGetErr, stack: personGetErr.stack,
                        input: {email: newPerson.Email}});
        if(person){
          newPerson["First Name"] =
            validator.validateString(newPerson["First Name"]).trim() !== "" ?
              validator.validateString(newPerson["First Name"]) :
                person.firstName;
          newPerson["Last Name"] =
            validator.validateString(newPerson["Last Name"]).trim() !== "" ?
              validator.validateString(newPerson["Last Name"]) :
                person.lastName;
          newPerson["Middle Name"] =
            validator.validateString(newPerson["Middle Name"]).trim() !== "" ?
              validator.validateString(newPerson["Middle Name"]) :
                person.middleName;
          newPerson["Time Zone"] =
              validator.validateTimeZone(newPerson["Time Zone"]) ?
                newPerson["Time Zone"] : person.timeZone;
        } else {
          newPerson["First Name"] =
            validator.validateString(newPerson["First Name"]).trim() !=="" ?
              validator.validateString(newPerson["First Name"]) : "";
          newPerson["Last Name"] =
            validator.validateString(newPerson["Last Name"]).trim() !=="" ?
              validator.validateString(newPerson["Last Name"]) : "";
          newPerson["Middle Name"] =
            validator.validateString(newPerson["Middle Name"]).trim() !=="" ?
              validator.validateString(newPerson["Middle Name"]) : null;
          newPerson["Time Zone"] =
              validator.validateTimeZone(newPerson["Time Zone"]) ?
                newPerson["Time Zone"] : null;
        }
        if(newPerson["First Name"].trim() === "" ||
          newPerson["Last Name"].trim() === ""){
          amendDataCB(null, {
            isValid : false,
            person : newPersonObj,
          });
        } else {
          if(newPerson["Middle Name"])
            newPerson["Middle Name"] =
              validator.validateString(newPerson["Middle Name"]).trim();
          if(newPerson.Salutation && newPerson.Salutation.trim() === "")
            newPerson.Salutation = null;
          amendDataCB(null, {
            isValid : true,
            person : newPerson,
          });
        }
      });
    } else {
      amendDataCB(null, {
        isValid : false,
        person : newPersonObj,
      });
    }
  };

  /**
   * Save person with additionalField
   * If ther is any invlid data, push it to invalidData array
   * Else process it
   * @param  {[streamData]} streamData
   * @param  {[listid]} listid
   * @param  {[function]} savePersonWithAdditionalFieldsCB
   * @return {[responseMsg]}
   * @author Aswin Raj A
   */
  let savePersonWithAdditionalFields = (streamData, listid,
    savePersonWithAdditionalFieldsCB) => {
    let invalidData = [];
    File.app.models.additionalField.getAdditionalFieldsForList(listid,
      (listFieldErr, fieldsForList) => {
      if(listFieldErr){
        logger.error("Error while finding list", {
          input:{listid:listid},
          error: listFieldErr, stack: listFieldErr.stack});
        return savePersonWithAdditionalFieldsCB(listFieldErr);
      }
      async.eachSeries(streamData, (personData, personCB) => {
        validateData(personData, (validateResponse) => {
          if(validateResponse.isValid){
            const newPerson = validateResponse.person;
            async.waterfall([
              async.apply(decouplePersonData, newPerson, fieldsForList,
                listid),
              createOrUpdatePerson,
              createOrUpdateFields
            ], (asyncErr, result) => {
              if(asyncErr){
                invalidData.push(newPerson);
                logger.error("Error while processing person", asyncErr);
                return personCB(asyncErr);
              }
              return personCB(null);
            });
          } else {
            invalidData.push(validateResponse.person);
            return personCB(null);
          }
        });
      }, (personSeriesErr) => {
        if(personSeriesErr){
          logger.error("Error while processing people data", personSeriesErr);
          return savePersonWithAdditionalFieldsCB(personSeriesErr);
        }
        if(lodash.isEmpty(invalidData)){
          savePersonWithAdditionalFieldsCB(null, {
            responseMsg : "All fields are saved successfully!",
            invalidData : invalidData,
            dataCount: streamData.length
          });
        } else{
          savePersonWithAdditionalFieldsCB(null, {
            responseMsg : "There seems to be some invalid data!",
            invalidData : invalidData,
            dataCount: streamData.length
          });
        }
      });
    });
  };

  /**
   * Decouple the personData into person object and additionalFields object
   * @param  {[personData]} personData
   * @param  {[fieldsForList]} fieldsForList
   * @param  {[listid]} listid
   * @param  {[function]} decouplePersonDataCB
   * @return {[decoupledObj, listid]}
   * @author Aswin Raj A
   */
  let decouplePersonData = (personData, fieldsForList, listid,
    decouplePersonDataCB) => {
    async.parallel({
      person : (parallelPersonCB) => {
        let newPersonObj = {
          firstName : personData["First Name"],
          lastName : personData["Last Name"],
          middleName : personData["Middle Name"],
          timeZone : personData["Time Zone"],
          salutation : personData.Salutation,
          email : personData.Email.toLowerCase()
        };
        return parallelPersonCB(null, newPersonObj);
      },
      additionalFields : (parallelFieldsCB) => {
        let additionalFieldObj = [];
        async.eachSeries(fieldsForList, (field, fieldCB) => {
          additionalFieldObj.push({
            fieldId : field.id,
            listId : listid,
            value : personData[field.name] || ""
          });
          return fieldCB(null);
        }, (err) => {
          if(err){
            logger.error("Error while creating additionalFieldObj",
             {error: err, stack: err ? err.stack : ""});
            return parallelFieldsCB(err);
          }
          return parallelFieldsCB(null, additionalFieldObj);
        });
      }
    }, (err, decoupledObj) => {
      if(err){
        return decouplePersonDataCB(err);
      }
      return decouplePersonDataCB(null, decoupledObj, listid);
    });
  };

  /**
   * Create or Update the Person for the current list,
   * Check if there already exist a person entry with the same email id
   * If exist, and if exist in the same list then update Person For CurrentList
   * else update person for the different list
   * Else create a new entry for person and additionalFields
   * @param  {[decoupledObj]} decoupledObj
   * @param  {[listid]} listid
   * @param  {[function]} createOrUpdatePersonCB
   * @return {[personId, listid, newAdditionalFields]}
   * @author Aswin Raj A
   */
  let createOrUpdatePerson = (decoupledObj, listid, createOrUpdatePersonCB) => {
    const newPerson = decoupledObj.person;
    const newAdditionalFields = decoupledObj.additionalFields;
    var pattern = new RegExp(newPerson.email + "$", "i");
    File.app.models.person.find({
      where : {
        email : pattern
      }
    }, (personFindErr, people) => {
      if(personFindErr){
        logger.error("Error while finding person with email:", {
          email: newPerson.email, error: personFindErr,
          stack: personFindErr ? personFindErr.stack : ""
        });
        return createOrUpdatePersonCB(personFindErr);
      }
      if(lodash.isEmpty(people)){
        File.app.models.person.createNewPerson(listid, newPerson,
          (createErr, person) => {
          if(createErr){
            return createOrUpdatePersonCB(createErr);
          }
          return createOrUpdatePersonCB(null, person.id, listid,
            newAdditionalFields);
        });
      } else {
        updatePersonForDifferentList(listid, people[0], newPerson,
          (personUpdateErr, person) => {
          if(personUpdateErr){
            return createOrUpdatePersonCB(personUpdateErr);
          }
          return createOrUpdatePersonCB(null, person.id, listid,
            newAdditionalFields);
        });
      }
    });
  };

  /**
   * If there exist an email in different list, then update the person for
   * another list
   * Associate the person to the new list
   * Update the person if necessary and make an entry in audit table
   * @param  {[listid]} listid
   * @param  {[oldPerson]} oldPerson
   * @param  {[newPerson]} newPerson
   * @param  {[function]} updatePersonCB
   * @return {[person]}
   * @author Aswin Raj A
   */
  let updatePersonForDifferentList = (listid, oldPerson, newPerson,
    updatePersonCB) => {
    File.app.models.List.findById(listid, (listFindErr, list) => {
      if(listFindErr){
        logger.error("Error while finding list", {
          listid: listid,
          error: listFindErr,
          stack: listFindErr ? listFindErr.stack : ""
        });
        updatePersonCB(listFindErr);
      }
      async.waterfall([
        async.apply(File.app.models.person.associatePersonWithList, list,
          oldPerson, newPerson),
        File.app.models.person.generateAuditPersonObj,
        File.app.models.person.savePersonAudit,
        File.app.models.person.updatePersonWithNewData
      ], (asyncErr, person) => {
        if(asyncErr){
          logger.error("Error while updating person who exist in another list",
            asyncErr);
          updatePersonCB(asyncErr);
        }
        updatePersonCB(null, person);
      });
    });
  };

  /**
   * Create or update fields for the current person,
   * If additionalFieldValue doesnot exist already for the current list, person
   * and for the current field id create a new entry
   * If already exist, update the entry
   * If already exist and if new value is empty donot update it
   * @param  {[personId]} personId
   * @param  {[listid]} listid
   * @param  {[newAdditionalFields]} newAdditionalFields
   * @param  {[function]} createOrUpdateFieldsCB
   * @author Aswin Raj A
   */
  let createOrUpdateFields = (personId, listid, newAdditionalFields,
    createOrUpdateFieldsCB) => {
    newAdditionalFields = newAdditionalFields.map(field => {
      field.personId = personId;
      return field;
    });
    async.eachSeries(newAdditionalFields, (newField, fieldCB) => {
      File.app.models.additionalFieldValue.find({
        where:{
          and:[
            {fieldId : newField.fieldId},
            {listId : newField.listId},
            {personId : newField.personId}
          ]
        }
      }, (fieldFindErr, fields) => {
        if(fieldFindErr){
          logger.error("Error while finding list", {
            fieldId : newField.fieldId, listId : newField.listid,
            personId : newField.personId,
            error: fieldFindErr,
            stack: fieldFindErr ? fieldFindErr.stack : ""
          });
          return fieldCB(fieldFindErr);
        }
        if(lodash.isEmpty(fields)){
          if(newField.value !== ""){
            File.app.models.additionalFieldValue.createFields(newField,
              (fieldCreateErr, field) => {
              if(fieldCreateErr){
                logger.error("Error while creating additionalFieldValue", {
                  field: field,
                  error: fieldCreateErr,
                  stack: fieldCreateErr ? fieldCreateErr.stack : ""
                });
                return fieldCB(fieldCreateErr);
              }
              return fieldCB(null);
            });
          } else{
            return fieldCB(null);
          }
        } else{
          if(newField.value !== ""){
            File.app.models.additionalFieldValue.updateFields(fields[0],
              newField, (fieldUpdateErr, result) => {
              if(fieldUpdateErr){
                logger.error("Error while updating additionalFieldValue", {
                  error: fieldUpdateErr,
                  stack: fieldUpdateErr ? fieldUpdateErr.stack : ""
                });
                return fieldCB(fieldUpdateErr);
              }
              return fieldCB(null);
            });
          } else{
            return fieldCB(null);
          }
        }
      });
    }, (err) => {
      if(err){
        logger.error("Error while creating additional field for person", {
          personId: personId,
          error: err,
          stack: err ? err.stack : ""
        });
        return createOrUpdateFieldsCB(err);
      }
      return createOrUpdateFieldsCB(null);
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
