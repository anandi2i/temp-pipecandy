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
        process.exit(0);
    });

  });

  var defaultTemplate = function(defaultTemplateCB) {
    dataSource.models.defaultTemplate.create([
      {name: "Blank template", content: " "},
      {name: "Conference Attendees", content: "<p><strong>Preface:</strong></p><p><span>Conference attendees are great prospects because they have communicated their intent to know the latest and perhaps meet interesting companies in their space.</span></p><p><strong>Email Guide:</strong></p><p><span>Salutation: Hi Name</span></p><p><span>Introduce Yourself: Name &amp; what you do for your company (Don’t explain what your company does. That’s called a pitch. So, don’t pitch in the first email)</span></p><p><span>Reference: They attended a conference. You did. But you both couldn’t spend good deal of time together.</span></p><p><span>Hook: Quote a very interesting conversation with their competitor during the conference (or) share how a specific product / feature / offering / solution resonated well with your booth visitors.</span></p><p><span>Ask: Make it personal. Say you missed spending time but you were hoping to. Ask if you can still speak sometime. Be specific. Quote a free slot.</span></p><p><span>Thank: Appreciate their time</span></p><p><br /><span>Sign Off.</span></p>"},
      {name: "Problem Solving", content: "<p><strong>Preface:</strong></p><p><span>If you’ve solved a problem that’s common to many in your prospect’s industry, you could quote your learnings and offer to provide your insights for free. It’s a great way to lower the guards and make the prospects respond warmly.</span></p><p><strong>Email Guide:</strong></p><p><span>Salutation: Hi Name</span></p><p><span>Introduce Yourself: Name &amp; what you do for your company (Don’t explain what your company does. That’s called a pitch. So, don’t pitch in the first email)</span></p><p><span>Reference: Quote the technology they use and the problem that’s typical to your prospect’s industry / stage of the company.</span></p><p><span>Hook: Make the prospect feel that you (or their competitors) were on the same boat as them &amp; how you solved it for them. Link this to a blog post that adds credibility to your claims of how you solved it.</span></p><p><span>Ask: Don’t ask. Give. Offer to speak to their people who grapple with the problem. Offer your experience. Don’t sell.</span></p><p><span>Thank: Appreciate their time</span></p><p><br /><span>Sign Off.</span></p>"},
      {name: "Better way of doing something", content: "<p><strong>Preface:</strong></p><p><span>If you know that your prospect is using a competitor’s product  (or a process that is inefficient) and you think yours is just better on some specific reference parameters, you could talk about them to influence a change in how they perceive their current product. Done well, you can push them out of their inertia (of not having to make any decision) to make a decision in your favor.</span></p><p><strong>Email Guide:</strong></p><p><span>Salutation: Hi Name</span></p><p><span>Introduce Yourself: Name &amp; what you do for your company (Don’t explain what your company does. That’s called a pitch. So, don’t pitch in the first email)</span></p><p><span>Reference: By doing X in a manner that’s done by the competition you lose time / cost / both that accounts to … (quantifiable metric) over a year. </span></p><p><span>Hook: Smarter customers like (mention names) have done (tell what they did and link to a case study)</span></p><p><span>Ask: Communicate your inertia killer (free import of data or free usage or any offer that makes them want to switch)</span></p><p><span>Thank: Appreciate their time</span></p><p><br /><span>Sign Off.</span></p>"},
      {name: "Reacting to news", content: "<p><strong>Preface:</strong></p><p><span>If your prospect(s) have been on news (ex: funding), you could email them under the assumption that what you’ve to offer is tied to the context the news talked about. Such emails have to be very convincing and have to stand out, because even your competitors have access to the news and they might reach out as well. </span></p><p><span>Moreover, the new isn’t important to them (because it’s a past event and mostly PR). So focus on what insight the news delivers for you and use that for the conversation.</span></p><p><span>Typically it’s better to reach out a few days after the news had been published (to avoid being a part of the crowd that rushed to mark their presence).</span></p><p><strong>Email Guide:</strong></p><p><span>Salutation: Hi Name</span></p><p><span>Introduce Yourself: Name &amp; what you do for your company (Don’t explain what your company does. That’s called a pitch. So, don’t pitch in the first email)</span></p><p><span>Reference: I read what you had mentioned / Now that you’ve raised funds / You had nailed it in the interview - talk about what issue the interview focused on </span></p><p><span>Hook: Relate your offering to the news. Example: Many recently funded companies are using us as a channel to scale leads Guys at XYZ just love it &amp; their investor updates have never looked better.</span></p><p><span>Ask: Typically fund-raise emails are sent to founders. Ask them if they can intro you to the person who is your ultimate user. Better yet, name them if you could.</span></p><p><span>Thank: Appreciate their time</span></p><p><br /><span>Sign Off.</span></p>"},
      {name: "Job moves at a prospect company", content: "<p><strong>Preface:</strong></p><p><span>If there is a new person in the role of your interest in a prospect company, you could write a note to them to continue the conversation you’ve had with the predecessor.</span></p><p><strong>Email Guide:</strong></p><p><span>Salutation: Hi Name</span></p><p><span>Introduce Yourself: Name &amp; what you do for your company (Don’t explain what your company does. That’s called a pitch. So, don’t pitch in the first email)</span></p><p><span>Reference: (Your familiarity with the person who previously handled his role)</span></p><p><span>Hook: Explain what transpired so far or make a solution pitch to a common problem.</span></p><p><span>Ask: You’re extending a relationship over from another person in the organization to a new person. So make it appear natural. Suggest that you are around where they are and can drop by on specific days or ask if you could re-introduce over a coffee.</span></p><p><span>Thank: Appreciate their time</span></p><p><br /><span>Sign Off.</span></p>"},
      {name: "Partner Acquisition Email", content: "<p><strong>Preface:</strong></p><p><span>If your product sells via channel partners and your sales is primarily about acquiring such partners, this guide will come in handy.</span></p><p><strong>Email Guide:</strong></p><p><span>Salutation: Hi Name</span></p><p><span>Introduce Yourself: Name &amp; what you do for your company (You could explain about your company here so that the prospective partner makes a connect immediately)</span></p><p><span>Reference: Quote your awareness that the prospect is working with companies in your space</span></p><p><span>Hook: Explain how it’s a win-win</span></p><p><span>Ask: Offer a slot or two and ask for a call.</span></p><p><span>Thank: Appreciate their time</span></p><p><br /><span>Sign Off.</span></p>"}
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
      {name: "Salutation", type: "String", isApproved: true },
      {name: "Time Zone", type: "String", isApproved: true }
    ], function(err, additionalFields) {
      if(err) {
        console.log("err in data creation defaultFields:: ", err);
        process.exit(1);
      }
      defaultFieldsCB(null, additionalFields);
    });
  }

});
