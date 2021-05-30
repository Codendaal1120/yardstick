var data = require("../data/data.js");
var util = require("../utility");
var logger = require("../logger.js");

const apiCollection = "apis";

const apiProjectBasic = {
    "_id" : 1, 
    "displayName" : 1,
    "uniqueName" : 1
}

var getApis = function(callack) {
    data.getMany(apiCollection, {}, apiProjectBasic, function(docs){
        var returnList = [];
        for(const doc of docs) {
            returnList.push(toApiObject(doc));
        }
        callack({ success : true, payload : returnList });
        return;
    },
    function (error){
        logger.error("Could not get apis : " + error);
        callack({ success : false, error : error, });
        return;
    });
}

async function getApi(id){
    let response = await data.getOneAsync(apiCollection, { "_id" : data.createId(id) });

    if (response.success) 
    { 
        return { success : true, payload : toApiObject(response.payload) };
    }
    
    return response;
}

async function getApiByUniqueName(uniqueName){
    let response = await data.getOneAsync(apiCollection, { "uniqueName" : uniqueName });

    if (response.success) 
    { 
        return { success : true, payload : toApiObject(response.payload) };
    }
    
    return response;
}

var saveApi = function(api, callack) {

    if (!api){
        callack({ success : false, error : "Invalid api supplied" });
        return;
    }

    data.insertOne(apiCollection, api, function(docs){
        callack({ success : true, payload : docs, });
        return;
    },
    function (error){
        logger.error("Could not get apis : " + error);
        callack({ success : true, error : error, });
        return;
    });
}

function toApiObject(api){
    api = util.toClientObject(api);
    if (api && api.endpoints == null){
        //api.endpoints = [];       
    }  
    return api;  
}


module.exports.getApis = getApis;
module.exports.getApi = getApi;
module.exports.getApiByUniqueName = getApiByUniqueName;

module.exports.saveApi = saveApi;