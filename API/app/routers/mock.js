var express = require("express");
var log4js = require("log4js");

var logger = log4js.getLogger("Mock");
var router = express.Router();

var mockService = require("../services/service.mock");

router.get("", async function (req, res) {
    logger.debug("Checking --> " + req.protocol + "://" + req.hostname + ":" + req.connection.localPort + req.originalUrl);   
    return await mockService.createResponse(req, res);  
});

router.post("", async function (req, res) {
    logger.debug("Checking --> " + req.protocol + "://" + req.hostname + ":" + req.connection.localPort + req.originalUrl);   
    return await mockService.createResponse(req, res);  
});

module.exports = router;