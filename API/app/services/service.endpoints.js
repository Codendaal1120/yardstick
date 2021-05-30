var data = require("../data/data.js");
var logger = require("../logger.js");

const collection = "endpoints";

var getAll = function(apiId, callack) {
    data.getMany(collection, { "apiId" : apiId }, {}, function(docs){
        var returnList = [];
        for(const doc of docs) {
            returnList.push(toApiObject(doc));
        }
        callack({ success : true, payload : returnList });
        return;
    },
    function (error){
        logger.error("Could not get api endpoints : " + error);
        callack({ success : false, error : error, });
        return;
    });
}

async function getByApiId(apiId){
    let response = await data.getManyAsync(collection, { "apiId" : apiId });

    if (response.success) 
    {
        var returnList = [];
        while ((document = await response.payload.next())) {
            returnList.push(toApiObject(document));
        }               
        return { success : true, payload : returnList };
    }
    
    return response;
}

var deleteOne = function(apiId, endpointId, callack) {
    data.deleteOne(collection, { "_id" : data.createId(endpointId) , "apiId" : apiId }, function(doc){
        callack({ success : true, payload : toApiObject(doc), });
        return;
    },
    function (error){
        logger.error("Could not delete endpoint : " + error);
        callack({ success : false, error : error, });
        return;
    });
}

async function saveOne (api, endpoint) {

    if (!api){
        return { success : false, error : "Invalid api supplied" };
    }

    let hasQueryVar = false;
    let hasPathVar = false;

    if (!endpoint){
        return { success : false, error : "Invalid endpoint supplied" };
    }

    endpoint.apiId = api.id;

    var pattern = generatePatterns(api, endpoint);
    endpoint.variablePattern = pattern.variable;
    endpoint.pathPattern = pattern.path;

    var res = null;

    if (endpoint.id != null){
        res = await data.replaceOneAsync(collection, endpoint);
    }
    else{
        res = await data.insertOneAsync(collection, endpoint);
    }    

    if (!res){
        return { success : false, error : 'Could not save endpoint' };
    }

    if (!res.success){
        return { success : false, error : res.error };
    }
    
    return { success : true, payload : toApiObject(res.payload) };
}

function generatePatterns(api, endpoint){

    // variable pattern :([^\/]+) <--> use on /myapp/user/:username/profile/:profileId
    // \/myapp\/user\/([^\/]+)\/profile\/([^\/]+)$ --> match url /myapp/user/xxx/profiley/yyy

    var hasQueryVar = false;
    var hasPathVar = false;

    var pattern = {
        path : "INVALID",
        variable : "INVALID"
    };

    if (!api){
        return pattern;
    }

    if (!endpoint){
        return pattern;
    } 

    pattern = {
        path : "",
        variable : ""
    };

    // Generate pattern
    for(const v of endpoint.variables) {
        if (v.type == "query"){
            hasQueryVar = true;
            pattern.variable += "(?<" + v.name + ">.+)"
        }
        else if (v.type == "path"){
            hasPathVar = true;
            pattern.path += `(?<${v.name}>[^\/]+)`
        }
    }

    if (pattern.path){
        pattern.path = "\/mock\/" + api.uniqueName + "\/" + pattern.path + "$";
    }
    else{
        pattern.path = "\/mock\/" + api.uniqueName;
    }

    if (hasQueryVar || hasPathVar){
        pattern.variable = pattern.path + "\/" + pattern.variable + "(?!.)";
    }

    return pattern;
}

function toApiObject(input){
    if (input){
        var output = {
            "id" : input._id.toString(),
            "apiId" : input.apiId,
            "pathPattern" : input.pathPattern,
            "variablePattern" : input.variablePattern,
            "variables" : toApiVariables(input.variables),
            "responses" : toApiResponses(input.responses)          
        }
        return output;
    }
}

function toApiVariables(inputCollection){
    var returnList = [];
    if (inputCollection){
        for(const input of inputCollection) {
            returnList.push({
                "name" : input.name,            
                "type" : input.type
            });
        }
    }
    return returnList;    
}

function toApiResponses(inputCollection){
    var returnList = [];
    if (inputCollection){
        for(let input of inputCollection) {
            returnList.push({
                "description" : input.description,   
                "payload" : input.payload,           
                "message" : input.message,     
                "code" : input.code,     
                "order" : input.order,
                "condition" : input.condition,
            });
        }
    }
    return returnList;    
}

module.exports.generatePatterns = generatePatterns;

module.exports.getAll = getAll;
module.exports.getByApiId = getByApiId;

module.exports.saveOne = saveOne;
module.exports.deleteOne = deleteOne;
