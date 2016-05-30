module.exports = function(Person) {


  /**
   * Returns the peopleList who are all having separate email template
   *
   * @param campaign
   * @return peopleList
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

  Person.observe("after save", function(ctx, next) {
    let person = ctx.instance;
    let personAddtionalData = [];
    let additionalFieldLen = 5;
    for (let i = 1; i <= additionalFieldLen; i++) {
      let field = "field" + i;
      let value = "value" + i;
      if (person[field] && person[value]) {
        personAddtionalData.push({
          name: person[field],
          value: person[value]
        });
      }
    }
    //Updating the addtional fields is difficult and so delete & recreate it
    person.fields.destroyAll((err, data) => {
      if (err) next(err);
      person.fields.create(personAddtionalData, (err, persons) => {
        if (err) next(err);
        next();
      });
    });

  });
};
