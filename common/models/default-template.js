"use strict";

import {errorMessage as errorMessages} from "../../server/utils/error-messages";
import logger from "../../server/log";

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
   * @param  {Context}   ctx
   * @param  {DefaultTemplate}   template
   * @param  {Function} callback
   * @return {DefaultTemplate}
   * @author Syed Sulaiman M
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
    templateJSON.createdBy = userId;
    delete templateJSON.id;
    DefaultTemplate.create(templateJSON, (error, defaultTemplate) => {
      if(error) {
        logger.error({error: error, stack: error.stack});
        return callback(errorMessages.SERVER_ERROR);
      }
      return callback(null, defaultTemplate);
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
      description: "Get Campaign Templates",
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
   * @author Syed Sulaiman M
   */
  DefaultTemplate.myTemplates = (ctx, callback) => {
    let userId = ctx.req.accessToken.userId;
    DefaultTemplate.find({
      where : {
        createdBy : userId,
      },
      order: "createdAt DESC"
    }, (error, defaultTemplates) => {
      if(error) {
        logger.error({error: error, stack: error.stack,
            input: {userId: userId}});
        return callback(errorMessages.SERVER_ERROR);
      }
      return callback(null, defaultTemplates);
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
