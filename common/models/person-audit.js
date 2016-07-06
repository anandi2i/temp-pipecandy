module.exports = function(PersonAudit) {




//Observer
/**
 * Updates the updatedAt column with current Time
 * @param ctx Context
 * @param next (Callback)
 */
PersonAudit.observe("before save", (ctx, next) => {
  if (ctx.instance) {
    ctx.instance.updatedAt = new Date();
  } else {
    ctx.data.updatedAt = new Date();
  }
  next();
});
};
