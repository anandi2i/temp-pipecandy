/**
 * @file Script for autoupdation
 * @author Dinesh Ramasamy <dinesh.r@ideas2it.com>
 */

var dataSource = require(process.cwd() + "/server/server.js").dataSources["psqlDs"];
dataSource.autoupdate(function(err) {
  if(err) {
    console.log("err in autoupdate:: ", err);
  }
  process.exit();
});
