const express = require("express"); 
const logger = require("./app/logger.js");

if (process.env.NODE_ENV !== 'production') {
    // load .env file it not in PROD mode
    // In prod the env variables will be set on the VM
    require('dotenv').config();
}

var app = express({ mergeParams: true });
var port = process.env.serverPort;

app.use(express.json());

//Routers
var r_mock = require("./app/routers/mock");
var r_apis = require("./app/routers/api/apis");

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    //res.setHeader("Access-Control-Allow-Origin", "http://localhost:8888");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "content-type, Authorization, x-api-key");
    next();
});

app.options("*", function (req, res) {
    if (req.headers.userid){
        logger.debug(req.headers.userid + "|options requested: " + req.url);
    }
    else{
        logger.debug("options requested: " + req.url);
    }
    
    res.status(200).send();
});

app.use("/api/version", function(req, res, next) {
    var pjson = require('./package.json');
    res.status(200).send(pjson.version);
});

app.use("/mock/*", r_mock);
app.use("/api/apis", r_apis);

app.use("/time", function(req, res, next) {
    var dt = new Date();
    dt = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate());
	res.status(200).send(String(dt));  
});

app.use("*", function(req, res, next) {
    //TODO: Add 404 here
    res.status(404).send("Function not found");
    next();    
});

logger.info("Server started on PORT:" + port);

app.listen(port);
