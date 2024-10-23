const express = require("express");
const log4js = require("log4js");
const logger = log4js.getLogger("Apis");
const router = express.Router();

var apiService = require("../../services/service.api");
var modelService = require("../../services/service.models");
var endpointsService = require("../../services/service.endpoints");

/* The admin api for CRUD api's */
// See https://stackoverflow.com/questions/4059126/how-does-mongodb-index-arrays
// I cannot get express to route the paths correctly to two different routers, so I need to combine all in one 'controller'

/****************** GET ******************/ 
router.get("/", async function (req, res) {
    logger.debug("Get apis ");   

    var apis = await apiService.getApis();

    if (!apis.success){
        res.status(500).send(apis.error);
        return;
    }
    
    res.json(apis.payload);  
});

router.get("/:apiId", async function (req, res) {
    logger.debug("Get api " + req.params.apiId);   

    var apis = await apiService.getApi(req.params.apiId);

    if (!apis.success){
        res.status(500).send(apis.error);
        return;
    }
    
    res.json(apis.payload);   
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

router.get("/:apiId/endpoints", async function (req, res) {
    logger.debug("Get api " + req.params.apiId + " endpoints");   

    let result = await endpointsService.getByApiId(req.params.apiId);
    if (!result.success){
        res.status(500).send(result.error);
        return;
    }  

    res.json(result.payload);
});

/****************** POST ******************/ 
router.post("/", async function (req, res) {
    
    var apiToSave = req.body;  

    var savedApi = await apiService.createApi(apiToSave);

    if (!savedApi.success){
        res.status(500).send(savedApi.error);
        return;
    }
    
    res.json(savedApi.payload);
});

router.post("/:apiId", async function (req, res) {
    
    var apiToSave = req.body;  

    var savedApi = await apiService.updateApi(apiToSave, req.params.apiId);

    if (!savedApi.success){
        res.status(500).send(savedApi.error);
        return;
    }
    
    res.json(savedApi.payload);
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
    
    logger.debug("Save new endpoint");   
    var epToSave = req.body;  

    var api = await apiService.getApi(req.params.apiId);

    if (!api.success){
        res.status(500).send(api.error);
    }
   
    var result = await endpointsService.saveEndpoint(api.payload, epToSave);

    if (!result.success){
        res.status(500).send(result.error);
    }

    res.json(result.payload);
});

router.post("/:apiId/endpoints/:epId", async function (req, res) {
    
    logger.debug("Save new endpoint");   
    var epToSave = req.body;  

    var api = await apiService.getApi(req.params.apiId);

    if (!api.success){
        res.status(500).send(api.error);
    }
   
    epToSave.id = req.params.epId;
    var result = await endpointsService.saveEndpoint(api.payload, epToSave);

    if (!result.success){
        res.status(500).send(result.error);
    }

    res.json(result.payload);
});

/****************** DELETE ******************/ 
router.delete("/:apiId/models/:modelId", async function (req, res) {
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

router.delete("/:apiId/endpoints/:endpointId", async function (req, res) {
    logger.debug("Deleting endpoint with id " + req.params.endpointId);   

    var api = await apiService.getApi(req.params.apiId);

    if (!api.success){
        res.status(500).send(api.error);
    }

    var result = await endpointsService.deleteEndpoint(req.params.endpointId);
    if (!result.success){
        res.status(500).send(result.error);
        return;
    }
    
    res.status(200).send();
});

module.exports = router;