module.exports = function(FollowUpMetric) {

  /**
   * updaets the followup metrics campagin metrics not found it will create
   * new one
   *
   * @param  {[campaign]} campaign
   * @param  {[function]} updateMertricsOnGenCB
   * @author Aswin Raj A
   */
  FollowUpMetric.updateMertricsOnGen = (followUp, updateMertricsOnGenCB) => {
    async.waterfall([
      async.apply(getFollowUpMetrics, followUp),
      createFollowUpMetrics,
      updateAssemblerMetrics
    ], (waterfallErr) => {
      return updateMertricsOnGenCB(waterfallErr);
    });
  };


  /**
   * returns followUp metrics for a followupObject
   *
   * @param  {[followUp]} followUp
   * @param  {[function]} getFollowUpMetricsCB
   * @author Aswin Raj A
   */
  const getFollowUpMetrics = (followUp, getFollowUpMetricsCB) => {
    FollowUpMetric.find({where: {followUpId: followUp.id}
    }, (findErr, followUpMetrics) => {
      if(findErr) {
        logger.error({error: findErr, stack: findErr.stack,
                      input: {followUp: followUp}});
        return getFollowUpMetricsCB(findErr);
      }
      return getFollowUpMetricsCB(null, followUp,
                  lodash.isEmpty(followUpMetrics) ? null : followUpMetrics[0]);
    });
  };

  /**
   * if metrics object null creates metrics object
   * @param  {[followUp]} followUp
   * @param  {[metric]} FollowUpMetric
   * @param  {[function]} createFollowUpMetricsCB [callback]
   * @author Aswin Raj A
   */
  const createFollowUpMetrics = (followUp, metric, createFollowUpMetricsCB) => {
    if(metric) {
      return createFollowUpMetricsCB(null, followUp, metric);
    }
    FollowUpMetric.create({followUpId: followUp.id}, (err, metrics) => {
      if(err) {
        logger.error({error: err, stack: err.stack,
                      input: {followUp: followUp}});
        return createFollowUpMetricsCB(err);
      }
      return createFollowUpMetricsCB(null, followUp, metrics);
    });
  };


  /**
   * updates the already sent mails as assembeled emails count
   * because already sent means already assembed from assember so that metrics
   * also should caputured here
   *
   * @param  {[followUp]} followUp
   * @param  {[followUpMetric]} metric
   * @param  {[function]} updateAssemblerMetricsCB [callback]
   * @author Aswin Raj A
   */
  const updateAssemblerMetrics = (followUp, metrics, updateAssemMetricsCB) => {
    metrics.assembled = metrics.sentEmails;
    metrics.errorInAssmebler = 0;
    metrics.updateAttributes(metrics, (err, updatedMetrics) => {
      if(err) {
        logger.error({error: err, stack: err.stack,
          input: {followUp: followUp}});
        return updateAssemMetricsCB(err);
      }
      return updateAssemMetricsCB(null);
    });
  };

//observe
/**
 * Updates the updatedAt column with current Time
 * @param ctx Context
 * @param next (Callback)
 */
FollowUpMetric.observe("before save", (ctx, next) => {
  if (ctx.instance) {
    ctx.instance.updatedAt = new Date();
  } else {
    ctx.data.updatedAt = new Date();
  }
  next();
});
};
