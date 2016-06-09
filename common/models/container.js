module.exports = function(container) {
  container.beforeRemote("upload", function(ctx, modelInstance, next) {
      //OUPTUTS: {orderId:1, customerId:1, otherImageInfo:[]}
      next();
  });

  /**
   * Updates the updatedAt column with current Time
   * @param ctx Context
   * @param next (Callback)
   */
  container.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
