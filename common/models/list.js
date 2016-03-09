module.exports = function(List) {
  List.beforeRemote("create", function(context, data, next) {
    context.req.body.createdBy = context.req.accessToken.userId;
    return next();
  });
};
