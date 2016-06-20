/**
 * @file Script for automigration
 * @author Ramanavel <ramanavel@pipecandy.com>
 */

var dataSource = require(process.cwd() + "/server/server.js").dataSources["psqlDs"];
var async = require("async");

dataSource.autoupdate(function(err) {
  if(err) {
    console.log("err in autoupdate:: ", err);
    process.exit(1);
  }

  dataSource.automigrate("defaultTemplate", function(err) {
    if(err) {
      console.log("err in automigration:: ", err);
      process.exit(1);
    }

    async.parallel({
      defaultTemplates: defaultTemplate.bind(null),
      defaultFields: defaultFields.bind(null)
      }, function (parallelErr, response) {
        if(parallelErr){
          console.error("Error on default values : ", parallelErr);
        }
        console.log("Data migrated: \n", response);
        process.exit(1);
    });

  });

  var defaultTemplate = function(defaultTemplateCB) {
    dataSource.models.defaultTemplate.create([
      {name: "Blank template", content: " "},
      {name: "My template", content: "<div><span>Hi,</span><br><br><span>You had downloaded our report on the current app development economy and pricing standards. I hope the report was useful.</span><br><br><span>As a marketplace that identifies and aggregates information about over 10000 web &amp; mobile development agencies, ContractIQ had this data all along. So, we went ahead and published the first benchmark of it's kind.</span><br><br><span>How about a quick call sometime tomorrow morning, say 12 pm GMT?</span><br><br><br></div>"},
      {name: "tempplate 1", content: "<div><span>Hi,</span><br><br><span>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book</span><br><br><br></div>"},
      {name: "template2", content: "<div><span>Hi,</span><br><br><span>There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet</span><br><br><br></div>"}
    ], function(err, defaultTemplates) {
      if(err) {
        console.log("err in data creation defaultTemplate:: ", err);
        process.exit(1);
      }
      defaultTemplateCB(null, defaultTemplates);
    });
  }

  var defaultFields = function(defaultFieldsCB) {
    dataSource.models.additionalField.create([
      {name: "First Name", type: "String", isApproved: true },
      {name: "Middle Name", type: "String", isApproved: true },
      {name: "Last Name", type: "String", isApproved: true },
      {name: "Email", type: "String", isApproved: true },
      {name: "Salutation", type: "String", isApproved: true }
    ], function(err, additionalFields) {
      if(err) {
        console.log("err in data creation defaultFields:: ", err);
        process.exit(1);
      }
      defaultFieldsCB(null, additionalFields);
    });
  }

});
