import {EventEmitter} from "events";
import _ from "underscore";
import Constants from "../constants/Constants";
import AppDispatcher from "../dispatcher/AppDispatcher";
import EmailListApi from "../API/EmailListApi";
import appHistory from "../RouteContainer";

let _allEmailList = {};
let _getEmailList = {};
let _error = "";

// Extend Reviewer Store with EventEmitter to add eventing capabilities
const EmailListStore = _.extend({}, EventEmitter.prototype, {

  // Emit Change event
  emitChange() {
    this.emit("change");
  },

  // Add change listener
  addChangeListener(callback) {
    this.on("change", callback);
  },

  // Remove change listener
  removeChangeListener(callback) {
    this.removeListener("change", callback);
  },

  getAllList() {
    return _allEmailList;
  },

  getEmailListByID() {
    return _getEmailList;
  },

  getPeopleByList() {
    let _emailList = [{
      "name": "testing",
      "type": null,
      "query": null,
      "id": 10,
      "createdBy": 27,
      "createdFor": null,
      "people": [{
        "firstName": "Dinesh",
        "middleName": "fh",
        "lastName": "Ramasamy",
        "salutation": null,
        "email": "dinesh.r@ideas2it.com",
        "id": 187,
        "prospectId": 2,
        "fields": [{
          "name": "k1",
          "value": "v1",
          "type": null,
          "id": 416,
          "personId": 187
        }, {
          "name": "k2",
          "value": "v2",
          "type": null,
          "id": 417,
          "personId": 187
        }]
      }, {
        "firstName": "Dinesh",
        "middleName": "fh",
        "lastName": "Ramasamy",
        "salutation": null,
        "email": "dinesh.r@mnc.com",
        "id": 188,
        "prospectId": 1,
        "fields": [{
          "name": "key1",
          "value": "val1",
          "type": null,
          "id": 418,
          "personId": 188
        }, {
          "name": "key2",
          "value": "val2",
          "type": null,
          "id": 419,
          "personId": 188
        }, {
          "name": "key3",
          "value": "val3",
          "type": null,
          "id": 420,
          "personId": 188
        }, {
          "name": "key4",
          "value": "val4",
          "type": null,
          "id": 421,
          "personId": 188
        }, {
          "name": "key5",
          "value": "val5",
          "type": null,
          "id": 422,
          "personId": 188
        }]
      }, {
        "firstName": "Rajesh",
        "middleName": "drg",
        "lastName": "Rasappan",
        "salutation": null,
        "email": "rajesh@fgh.com",
        "id": 189,
        "prospectId": 4,
        "fields": []
      }, {
        "firstName": "Anand",
        "middleName": "Nambi",
        "lastName": "Gobinath",
        "salutation": null,
        "email": "anand@mnc.com",
        "id": 190,
        "prospectId": 1,
        "fields": [{
          "name": "1",
          "value": "1",
          "type": null,
          "id": 423,
          "personId": 190
        }, {
          "name": "2",
          "value": "2",
          "type": null,
          "id": 424,
          "personId": 190
        }, {
          "name": "3",
          "value": "3",
          "type": null,
          "id": 425,
          "personId": 190
        }, {
          "name": "4",
          "value": "4",
          "type": null,
          "id": 426,
          "personId": 190
        }, {
          "name": "5",
          "value": "5",
          "type": null,
          "id": 427,
          "personId": 190
        }]
      }, {
        "firstName": "stsfring",
        "middleName": "strwering",
        "lastName": "strwsring",
        "salutation": "strwrting",
        "email": "sertring@gh.com",
        "id": 191,
        "prospectId": 5,
        "fields": []
      }]
    }];
    let _peopleData = [];
    _.each(_emailList, function(obj, index) {
      _.each(obj.people, function(obj, index) {
        let _temp = { 
          id: obj.id, 
          firstName: obj.firstName || "", 
          middleName: obj.middleName || "", 
          lastName: obj.lastName || "", 
          email: obj.email || "", 
          addField1: "", 
          addField2: "", 
          addField3: "", 
          addField4: "", 
          addField5: "", 
          edit: ""};
        _.each(obj.fields, function(obj, index) {
          if (obj.name && obj.value) {
            _temp["addField"+(++index)] = obj.name + ": "+obj.value;
          }
        });
        _peopleData.push(_temp);
      });
    });
    return _peopleData;
  },

  getError() {
    return _error;
  }

});

// Register callback with AppDispatcher
AppDispatcher.register(function(payload) {
  let action = payload.action;
  switch (action.actionType) {
    case Constants.ALL_EMAIL_LIST:
      EmailListApi.findAll().then((response) => {
        _allEmailList = response.data;
        _error = "";
        EmailListStore.emitChange();
      }, (err)=> {
        _allEmailList = {};
        _error = err;
        EmailListStore.emitChange();
      });
      break;
    case Constants.CREATE_NEW_LIST:
      EmailListApi.crateList(action.data).then((response) => {
        _allEmailList = {};
        _error = "";
        appHistory.push("list/"+response.data.id);
      }, (err)=> {
        _error = err;
        EmailListStore.emitChange();
      });
      break;
    case Constants.GET_LIST_BY_ID:
      EmailListApi.getList(action.data).then((response) => {
        _getEmailList = response.data;
        _error = "";
        EmailListStore.emitChange();
      }, (err)=> {
        _error = err;
        EmailListStore.emitChange();
      });
      break;
    case Constants.FILE_UPLOAD:
      EmailListApi.uploadFile(action.data).then((response) => {
        //TODO: Change it to success message
        _error = "The file has been uploaded successfully";
        EmailListStore.emitChange();
      }, (err)=> {
        _error = err;
        EmailListStore.emitChange();
      });
      break;
    case Constants.SAVE_SINGLE_PERSON:
      EmailListApi.saveSinglePerson(action.data).then((response) => {
        //TODO: Change it to success message
        _error = "Subscriber details saved successfully";
        EmailListStore.emitChange();
      }, (err)=> {
        console.log("err", err);
        _error = err;
        EmailListStore.emitChange();
      });
      break;
    default:
      return true;
  }
  return true;
});

export default EmailListStore;
