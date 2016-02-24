module.exports = function(container) {
  container.beforeRemote("upload", function(ctx, modelInstance, next) {
      //OUPTUTS: {orderId:1, customerId:1, otherImageInfo:[]}
      next();
  });
};
