const express = require("express");
const log4js = require("log4js");
const logger = log4js.getLogger("Apis");
const router = express.Router();

var apiService = require("../../services/service.apis");
var modelService = require("../../services/service.models");
var endpointsService = require("../../services/service.endpoints");

/* The admin api for CRUD api's */
// See https://stackoverflow.com/questions/4059126/how-does-mongodb-index-arrays
// I cannot get express to route the paths correctly to two different routers, so I need to combine all in one 'controller'

/****************** GET ******************/ 
router.get("/", function (req, res) {
    logger.debug("Get apis ");   

    apiService.getApis(function(result){
        if (result.success){
            res.send(result.payload);
        }
        else{
            res.status(500).send(result.error);
        }
    });   
});

router.get("/:apiId", function (req, res) {
    logger.debug("Get api " + req.params.apiId);   

    apiService.getApi(req.params.apiId, function(result){
        if (result.success){
            res.json(result.payload);
        }
        else{
            res.status(500).send(result.error);
        }
    });   
});

router.get("/:apiId/models", function (req, res) {
    logger.debug("Get api " + req.params.apiId + " models");   

    modelService.getApiModels(req.params.apiId, function(result){
        if (result.success){
            res.json(result.payload);
        }
        else{
            res.status(500).send(result.error);
        }
    });   
});

router.get("/:apiId/endpoints", function (req, res) {
    logger.debug("Get api " + req.params.apiId + " endpoints");   
    endpointsService.getAll(req.params.apiId, function(result){
        if (result.success){
            res.json(result.payload);
        }
        else{
            res.status(500).send(result.error);
        }
    });   
});

/****************** POST ******************/ 
router.post("/", function (req, res) {
    
    var apiToSave = req.body;  
    
    apiService.saveApi(apiToSave, function(result){
        if (result.success){
            res.json(result.payload);
        }
        else{
            res.status(500).send(result.error);
        }
    }); 
});

router.post("/:apiId/models", function (req, res) {
    
    logger.debug("Save model ");   
    var modelToSave = req.body;  
    
    modelService.saveApiModel(req.params.apiId, modelToSave, function(result){
        if (result.success){
            res.json(result.payload);
        }
        else{
            res.status(500).send(result.error);
        }
    }); 
});

router.post("/:apiId/endpoints", async function (req, res) {
    
    logger.debug("Save endpoint");   
    var epToSave = req.body;  

    var api = await apiService.getApi(req.params.apiId);

    if (!api.success){
        res.status(500).send(api.error);
    }
   
    var result = await endpointsService.saveOne(api.payload, epToSave);

    if (!result.success){
        res.status(500).send(result.error);
    }

    res.json(result.payload);
});

/****************** DELETE ******************/ 
router.delete("/:apiId/models/:modelId", function (req, res) {
    logger.debug("Deleting model with id " + req.params.responseId);   

    modelService.deleteApiModel(req.params.apiId, req.params.responseId, function(result){
        if (result.success){
            res.status(200).send();
        }
        else{
            res.status(500).send(result.error);
        }
    });   
});

router.delete("/:apiId/endpoints/:endpointId", function (req, res) {
    logger.debug("Deleting endpoint with id " + req.params.endpointId);   

    endpointsService.deleteOne(req.params.apiId, req.params.endpointId, function(result){
        if (result.success){
            res.status(200).send();
        }
        else{
            res.status(500).send(result.error);
        }
    });   
});

module.exports = router;