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
      {name: "Website migration", content: "<div>Hi <span class='tag common' contenteditable='false' data-tag='First Name' data-id='1' data-tag-name='First Name'>&lt;First Name&gt;</span>,</div> <div> </div> <div>I was running through Alexa and came across your website. It seems like your portal is built on .NET and you are trying to get it migrated to Node / Angular. We've been there. I've some tips to share on making the right investments on JS frameworks.</div> <div> </div> <div>If your team would find it useful, I can get on a call.</div>"},
      {name: "Job change", content: "<div>Hi <span class='tag common' contenteditable='false' data-tag='First Name' data-id='1' data-tag-name='First Name'>&lt;First Name&gt;</span>,</div> <div> </div> <div>I used to be in touch with Jason who was the CIO earlier. Congrats on your new role. I discussed digital transformation initiatives with Jason about a quarter ago. I thought I'd drop by to give you a heads up on that conversation.</div> <div> </div> <div>How are you placed in the first week of August?</div>"},
      {name: "Funding", content: "<div>Hi <span class='tag common' contenteditable='false' data-tag='First Name' data-id='1' data-tag-name='First Name'>&lt;First Name&gt;</span>,</div> <div> </div> <div>I came across your startup while looking though Crunchbase. Congrats on the recent closure of your Series B. In a tough climate, what you've raised is a great validation of your business model.</div> <div> </div> <div>I've been a startup operator myself and I know that the responsibility is more now than ever.</div> <div> </div> <div>When we raised our Series B we made some costly mistakes around hiring and premature optimization for scale. I can talk about it over coffee if you are interested.</div> <div> </div> <div>Good luck. Drop me an email from this email <span class='tag common' contenteditable='false' data-tag='Email' data-id='4' data-tag-name='Email'>&lt;Email&gt;</span> if you'd like to pick this thread over a meeting.</div>"}
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
