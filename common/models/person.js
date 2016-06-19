"use strict";

import logger from "../../server/log";
import async from "async";
import lodash from "lodash";

module.exports = function(Person) {

  /**
   * Gets people using list object and checks if email is already
   * generated or not if not it generates the email
   *
   * @param  {[campaign]} campaign
   * @param  {[list]} list
   * @param  {[List]} listIds
   * @param  {[function]} getPoepleAndGenerateEmailCB [callback]
   * @author Ramanavel Selvaraju
   */
  Person.getPoepleAndGenerateEmail = (campaign, list, listIds,
    getPoepleAndGenerateEmailCB) => {

    list.people((peopleFindErr, people) => {

      if (peopleFindErr) {
        logger.error("Error on fing the people using list", {
          list: list,
          error: peopleFindErr
        });
        return getPoepleAndGenerateEmailCB(peopleFindErr);
      }

      async.eachSeries(people, (person, peopleEachCB) => {

        Person.app.models.emailQueue.checkEmailExists(campaign, person,
          (checkEmailExistsErr, isEmailgenerated) => {

            if (checkEmailExistsErr || isEmailgenerated) {
              return peopleEachCB(checkEmailExistsErr);
            }
            //return peopleEachCB(null);
            Person.app.models.campaign.generateEmail(campaign, person,
              listIds, (generateEmailErr) => {
                if (generateEmailErr) {
                  logger.error({
                    person: person,
                    error: generateEmailErr
                  });
                }
                peopleEachCB(generateEmailErr);
              }); //campaign.generateEmail

          }); //emailQueue.checkEmailExists

      }, (asyncEachPeopleErr) => {
        return getPoepleAndGenerateEmailCB(asyncEachPeopleErr);
      }); //async.each
    }); //list.people
  };

  Person.preparePersonWithExtraFields = (campaign, person, listIds,
    preparePersonWithExtraFieldsCB) => {
    Person.app.models.additionalFieldValue.find({
      where: {
        personId: person.id,
        listId: {
          inq: listIds
        }
      },
      order: "updatedat DESC"
    }, (additionalFieldValueFindErr, fieldValues) => {
      let addtionalFields = lodash.uniqBy(fieldValues, "fieldId");
      addtionalFields.push(personToFieldValues(person));
      return preparePersonWithExtraFieldsCB(null, addtionalFields);
    });
  };

  let personToFieldValues = (person) => {
    let personValues = [];
    person.firstName ? personValues.push({
      fieldId: 1,
      value: person.firstName
    }) : "";
    person.middleName ? personValues.push({
      fieldId: 2,
      value: person.middleName
    }) : "";
    person.lastName ? personValues.push({
      fieldId: 3,
      value: person.lastName
    }) : "";
    person.email ? personValues.push({
      fieldId: 4,
      value: person.email
    }) : "";
    person.salutation ? personValues.push({
      fieldId: 5,
      value: person.salutation
    }) : "";
    return personValues;
  };

  /**
   * Returns the peopleList who are all having separate email template
   * @param  {[type]} campaign
   * @param  {[type]} individualTemplatePeopleCB
   * @author Ramanavel Selvaraju
   */
  Person.getIndividualTemplatePeople = (campaign,
    individualTemplatePeopleCB) => {
    Person.find({
        where: {
          campaignTemplate: {
            campaignId: campaign.id
          }
        }
      },
      function(err, individualTemplatePeople) {
        individualTemplatePeopleCB(err, individualTemplatePeople);
      });
  };


  Person.observe("before save", function(ctx, next) {
    //instance for entity creation
    //data for entity updation
    let instance = ctx.instance || ctx.data;
    instance.updatedAt = new Date();
    let companyName;
    if (instance.email) {
      companyName = instance.email.split("@")[1];
    } else {
      let error = new Error();
      error.message = "Email id is not found";
      error.name = "emailNotFound";
      next(error);
    }

    if (!companyName) {
      let error = new Error();
      error.message = "Email id is invalid";
      error.name = "InvalidEmail";
      next(error);
    }

    Person.app.models.Company.findOrCreate({
      "name": companyName
    }, (err, company) => {
      Person.app.models.Prospect.findOrCreate({
        "companyId": company.id
      }, (err, prospect) => {
        instance.prospectId = prospect.id;
        next();
      });
    });
  });

  // Person.observe("after save", function(ctx, next) {
  //   let person = ctx.instance;
  //   let personAddtionalData = [];
  //   let additionalFieldLen = 5;
  //   for (let i = 1; i <= additionalFieldLen; i++) {
  //     let field = "field" + i;
  //     let value = "value" + i;
  //     if (person[field] && person[value]) {
  //       personAddtionalData.push({
  //         name: person[field],
  //         value: person[value]
  //       });
  //     }
  //   }
  //   //Updating the addtional fields is difficult and so delete & recreate it
  //   person.fields.destroyAll((err, data) => {
  //     if (err) next(err);
  //     person.fields.create(personAddtionalData, (err, persons) => {
  //       if (err) next(err);
  //       next();
  //     });
  //   });
  // });


};
