module.exports = function(container) {
  container.beforeRemote("upload", function(ctx, modelInstance, next) {
      //OUPTUTS: {orderId:1, customerId:1, otherImageInfo:[]}
      next();
  });

  container.observe("before save", (ctx, next) => {
    if (ctx.instance) {
      ctx.instance.updatedAt = new Date();
    } else {
      ctx.data.updatedAt = new Date();
    }
    next();
  });
};
