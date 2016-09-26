"use strict";

import {errorMessage as errorMessages} from "../../server/utils/error-messages";
import logger from "../../server/log";
import lodash from "lodash";
import async from "async";

module.exports = function(DefaultTemplate) {

  DefaultTemplate.remoteMethod(
    "saveTemplate",
    {
      description: "Saves Campaign Template for User",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "template", type: "defaultTemplate", required: true,
          http: {source: "body"}}
      ],
      returns: {arg: "template", type: "defaultTemplate", root: true},
      http: {verb: "post", path: "/saveTemplate"}
    }
  );

  /**
   * Method to save Campaign Template
   * sampleObjInput: {
     name: "Save template",
     content: "<div>Test save template</div>",
     followUps: [
       {
         stepNo: 1,
         content: "<div>Test save followUp 1 template</div>"
       },
       {
         stepNo: 2,
         content: "<div>Test save followUp 2 template</div>"
       },
       {
         stepNo: 3,
         content: "<div>Test save followUp 3 template</div>"
       }
     ]
   }
   * @param  {Context}   ctx
   * @param  {DefaultTemplate}   template
   * @param  {Function} callback
   * @return {DefaultTemplate}
   * @author Syed Sulaiman M, Aswin Raj(Modified)
   */
  DefaultTemplate.saveTemplate = (ctx, template, callback) => {
    let userId = ctx.req.accessToken.userId;
    let templateJSON = JSON.parse(JSON.stringify(template));
    if(!templateJSON.name) {
      return callback(errorMessages.BLANK_TEMPLATE_NAME);
    }
    if(!templateJSON.content) {
      return callback(errorMessages.BLANK_TEMPLATE_CONTENT);
    }
    const myTemplate = {
      name: templateJSON.name,
      content: templateJSON.content,
      createdBy: userId
    };
    let followUps = templateJSON.followUps || [];
    DefaultTemplate.create(myTemplate, (error, defaultTemplate) => {
      if(error) {
        logger.error({error: error, stack: error.stack});
        return callback(errorMessages.SERVER_ERROR);
      }
      if(lodash.isEmpty(followUps)) return callback(null, defaultTemplate);
      const followUpObj = followUps.map((followUp) => {
        followUp.name = templateJSON.name;
        followUp.createdBy = userId;
        followUp.parentId = defaultTemplate.id;
        return followUp;
      });
      DefaultTemplate.create(followUpObj, (createErr, followUps) => {
        if(createErr) {
          logger.error("Error while creating my followup templates",
          {error: createErr, stack: createErr.stack});
          return callback(errorMessages.SERVER_ERROR);
        }
        const savedTemplate = {
          name: defaultTemplate.name,
          content: defaultTemplate.content,
          followUps: followUps
        };
        return callback(null, savedTemplate);
      });
    });
  };

  DefaultTemplate.remoteMethod(
    "updateTemplate",
    {
      description: "Update Campaign Template for User",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}},
        {arg: "id", type: "number", required: true, http: {source: "path"}},
        {arg: "template", type: "defaultTemplate", required: true,
          http: {source: "body"}}
      ],
      returns: {arg: "template", type: "defaultTemplate", root: true},
      http: {verb: "put", path: "/:id/updateTemplate"}
    }
  );

  /**
   * Method to update existing Campaign Template
   * @param  {Context}   ctx
   * @param  {Number}   id       DefaultTemplateId
   * @param  {DefaultTemplate}   template
   * @param  {Function} callback
   * @return {DefaultTemplate}
   * @author Syed Sulaiman M
   */
  DefaultTemplate.updateTemplate = (ctx, id, template, callback) => {
    if(!template.name) {
      return callback(errorMessages.BLANK_TEMPLATE_NAME);
    }
    if(!template.content) {
      return callback(errorMessages.BLANK_TEMPLATE_CONTENT);
    }
    DefaultTemplate.findById(id, (error, defaultTemplate) => {
      if(error) {
        logger.error({error: error, stack: error.stack, input: {id: id}});
        return callback(errorMessages.SERVER_ERROR);
      }
      if(!defaultTemplate) return callback(errorMessages.INVALID_TEMPLATE_ID);
      let properties = {
        name: template.name,
        content: template.content
      };
      defaultTemplate.updateAttributes(properties, (error, updatedTemplate) => {
        if(error) {
          logger.error({error: error, stack: error.stack});
          return callback(errorMessages.SERVER_ERROR);
        }
        return callback(null, updatedTemplate);
      });
    });
  };

  DefaultTemplate.remoteMethod(
    "myTemplates",
    {
      description: "Get all user's saved Templates",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}}
      ],
      returns: {arg: "templates", type: "[defaultTemplate]", root: true},
      http: {verb: "get", path: "/myTemplates"}
    }
  );

  /**
   * Method to get Campaign Template created by User
   * @param  {Context}   ctx
   * @param  {Function} callback
   * @return {DefaultTemplates}
   * @author Syed Sulaiman M, Aswin Raj A(Modified)
   */
  DefaultTemplate.myTemplates = (ctx, callback) => {
    let userId = ctx.req.accessToken.userId;
    async.waterfall([
      async.apply(getMyMaintemplates, userId),
      getFollowUpsforMainTemplates,
    ], (asyncErr, myDefaultTemplates) => {
      return callback(null, myDefaultTemplates);
    });
  };

  /**
   * To get all the main defaultTemplates for the current user
   * @param  {[number]} userId
   * @param  {[function]} getTemplateCB
   * @return {[array]} defaultTemplates
   * @author Aswin Raj A
   */
  const getMyMaintemplates = (userId, getTemplateCB) => {
    DefaultTemplate.find({
      where : {and : [{createdBy : userId}, {parentId: null}]},
      order: "createdAt DESC"
    }, (error, defaultTemplates) => {
      if(error) {
        logger.error({error: error, stack: error.stack,
            input: {userId: userId}});
        return getTemplateCB(errorMessages.SERVER_ERROR);
      }
      return getTemplateCB(null, defaultTemplates);
    });
  };

  /**
   * To get the followUpTemplates for each defatult template and generate
   * default Templates with followUps
   * @param  {[type]} defaultTemplates [description]
   * @param  {[type]} getFollowUpsCB   [description]
   * @return {[type]}                  [description]
   * @author Aswin Raj A
   */
  const getFollowUpsforMainTemplates = (defaultTemplates, getFollowUpsCB) => {
    const templatesWithFollowUp = [];
    async.eachSeries(defaultTemplates, (template, templateCB) => {
      DefaultTemplate.find({
        where : {parentId: template.id},
        order: "stepNo ASC"
      }, (error, followUpTemplates) => {
        if(error) {
          logger.error({error: error, stack: error.stack,
              input: {userId: userId}});
          return callback(errorMessages.SERVER_ERROR);
        }
        template.followUps = followUpTemplates;
        templatesWithFollowUp.push(template);
        return templateCB(null);
      });
    }, (asyncErr) => {
      return getFollowUpsCB(asyncErr, templatesWithFollowUp);
    });
  };


  DefaultTemplate.remoteMethod(
    "templates",
    {
      description: "Get Default Campaign Templates",
      accepts: [
        {arg: "ctx", type: "object", http: {source: "context"}}
      ],
      returns: {arg: "templates", type: "[defaultTemplate]", root: true},
      http: {verb: "get", path: "/templates"}
    }
  );

  /**
   * Method to get Campaign Template created by User
   * @param  {Context}   ctx
   * @param  {Function} callback
   * @return {DefaultTemplates}
   * @author Syed Sulaiman M
   */
  DefaultTemplate.templates = (ctx, callback) => {
    DefaultTemplate.find({
      where : {
        createdBy : null,
      }
    }, (error, defaultTemplates) => {
      if(error) {
        logger.error({error: error, stack: error.stack});
        return callback(errorMessages.SERVER_ERROR);
      }
      return callback(null, defaultTemplates);
    });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  DefaultTemplate.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
