import logger from "../../server/log";

module.exports = function(List) {
  /**
   * Get all People and its related field data for the given lists id
   * @param ctx
   * @param options
   * @param cb
   */
  List.listPeopleField = function(ctx, options, cb) {
    List.find({
      where: {id: {inq: options.list}, createdBy: ctx.req.accessToken.userId},
      include: {"people" : ["fields"]}
    }, (err, people) => {
      if(err) {
        logger.error("Error in getting people data for lists", options.list);
        return cb(err);
      }
      cb(null, people);
      return;
    });
  };

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  List.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });

  List.remoteMethod(
    "listPeopleField",
    {
      description: "List all the people and its field data for given list id's",
      accepts: [
        {
          arg: "ctx", type: "object",
          http: {source: "context"}
        },
        {
          arg: "options", type: "object", required: true,
          http: {source: "body"}
        },
      ],
      returns: {arg: "peopleData", type: "object", root: true},
      http: {verb: "post"}
    }
  );

};
