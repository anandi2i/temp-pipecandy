var winston = require("winston");
var fs = require("fs");
var dir = "log";

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      name: "info-file",
      filename: "log/info.log",
      level: "info"
    }),
    new (winston.transports.File)({
      name: "error-file",
      filename: "log/error.log",
      level: "error"
    })
  ]
});

module.exports = logger;
