var log4js = require("log4js");
const logger = log4js.getLogger();
log4js.configure("./log4js.config.json");

module.exports = logger;