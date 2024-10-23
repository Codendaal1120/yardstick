var data = require("../data/data.js");
var util = require("../utility.js");
var logger = require("../logger.js");

const apiCollection = "apis";

var epService = require("./service.endpoints");

async function getApis(){
    let response = await data.getManyAsync(apiCollection, {});

    if (!response.success) 
    { 
        return response;
    }

    let retList = [];
    for (let i = 0; i < response.payload.length; i++) {
        let eps = await epService.getByApiId(response.payload[i].id);
        if (!eps.success){
            return { success : false, error : `Error fetching endpoints for ${response.payload[i].id}` };
        }
        retList.push(toApiObject(response.payload[i], eps.payload));        
    }

    if (response.success) 
    { 
        return { success : true, payload : retList };
    }
    
    return response;
}

async function getApi(id){
    let response = await data.getOneAsync(apiCollection, { "_id" : data.createId(id) });

    if (!response.success) 
    { 
        return response;
    }

    let eps = await epService.getByApiId(response.payload.id);    

    if (!eps.success){
        return { success : false, error : `Error fetching endpoints for ${response.payload.id}` };
    }

    return { success : true, payload : toApiObject(response.payload, eps.payload) };
}

async function getApiByUniqueName(uniqueName){
    let response = await data.getOneAsync(apiCollection, { "uniqueName" : uniqueName });

    if (response.success) 
    { 
        return { success : true, payload : toApiObject(response.payload) };
    }
    
    return response;
}

async function updateApi(api, id){
    if (!api){
        return { success : false, error : "Invalid api supplied" };
    }

    let apiModel = {
        "id" : id,
        "name" : api.name,
        "basePath" : api.basePath,
    }

    let response = await data.updateOneAsync(apiCollection, apiModel);

    if (response.success) 
    { 
        // save endpoints
        await epService.deleteEndpoints(response.payload.id);
        var epsResponse = await epService.saveEndpoints(response.payload, api.endpoints);

        if (!epsResponse.success){
            return epsResponse;
        }

        return { success : true, payload : toApiObject(response.payload, epsResponse.payload) };
    }
    
    return response;
}

async function createApi(api){   
    if (!api){
        return { success : false, error : "Invalid api supplied" };
    }

    let apiModel = {
        "name" : api.name,
        "basePath" : api.basePath,
    }

    let response = await data.insertOneAsync(apiCollection, apiModel);

    if (response.success) 
    { 
        // save endpoints
        var epsResponse = await epService.saveEndpoints(response.payload, api.endpoints);

        if (!epsResponse.success){
            return epsResponse;
        }
        return { success : true, payload : toApiObject(response.payload, epsResponse.payload) };
    }
    
    return response;
}

function toApiObject(api, eps){
    api.endpoints = eps;
    return api;  
}

module.exports.getApis = getApis;
module.exports.getApi = getApi;
module.exports.getApiByUniqueName = getApiByUniqueName;
module.exports.createApi = createApi;
module.exports.updateApi = updateApi;