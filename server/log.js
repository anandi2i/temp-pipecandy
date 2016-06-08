import winston from "winston";
import fs from "fs";
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
    }),
    new (winston.transports.File)({
      name: "assembler-info-file",
      filename: "log/mailAssemblerInfo.log",
      level: "mailAssemblerInfo"
    }),
    new (winston.transports.File)({
      name: "assembler-error-file",
      filename: "log/mailAssemblerError.log",
      level: "mailAssemblerError"
    }),
    new (winston.transports.File)({
      name: "mailSender-info-file",
      filename: "log/mailSenderInfo.log",
      level: "mailSenderInfo"
    }),
    new (winston.transports.File)({
      name: "mailSender-error-file",
      filename: "log/mailSenderError.log",
      level: "mailSenderError"
    })
  ]
});

module.exports = logger;
