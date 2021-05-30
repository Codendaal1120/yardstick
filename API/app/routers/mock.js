var express = require("express");
var log4js = require("log4js");

var logger = log4js.getLogger("Mock");
var router = express.Router();

var apService = require("../services/service.apis");
var epService = require("../services/service.endpoints");


/*********************************** Notes ***********************************
 * -->  Each api will be prefixed with /mock/
 * -->  user specifies uniqueName, which becomes the base URL (/mock/uniqueName)
 * -->  Endpoint matching is done on the base url + path variables
 * -->  Path and query variables are mandatory, meaning if you specify it, 
 *      the api call needs to have it set to match (might changen later?) * 
 ******************************************************************************/

async function createResponse(req, res){

    try{
        var shouldAnalyze = false;
        var url = req.baseUrl;
    
        if (url.startsWith("/mock/analyze/")){
            url = url.replace("analyze/", "");
            shouldAnalyze = true;
        }
    
        var endpoint = await getRequesEndPoint(url);
    
        if (!endpoint.success){
            //TODO:
            //res.status(404).send("No endpoint found matching " + url);
            res.status(endpoint.code).send({ "error" : endpoint.error });
            return;
        }
    
        var apiReq = extractApiRequest(endpoint.payload, req, url);
    
        if (shouldAnalyze){
            res.setHeader("Content-Type", "application/json");  
            res.send(JSON.stringify({
                "endpointMatchedOn" : url,
                "queryString" : req.url,
                "variables" : apiReq.variables
            }));
            return;
        }        
      
        // perform request logic
        var response = getResponse(endpoint, apiReq);
        if (response.payload){
            res.status(response.code).json(response.payload);
        }
        else{
            res.status(response.code).json(response.json);
        }
    }
    catch(e){
        if (e){
            res.status(500).send({ "error" : e.message});
        }
        else{
            res.status(500).send({ "error" : "Internal error" });
        }
        return;
    }  
}

async function getRequesEndPoint(url){

    var split = url.split('/');
    if (split.length < 3){
        return { success : false, code : 404, error : "Endpoint not found" };
    }

    var uniqueName = split[2];
    var api = await apService.getApiByUniqueName(uniqueName);

    if (api.success){

        if (!api.payload){
            return { success : false, code : 404, error : "Could not find an api that matches url '" + url + "'" };;
        }

        var endpoints = await epService.getByApiId(api.payload.id);
        if (endpoints.payload.length == 0){
            return { success : false, code : 404, error : "Api '" + uniqueName + "' has no endpoints defined" };;
        }

        for (let ep of endpoints.payload) {
            if ((match = url.match(ep.pathPattern)) !== null) {
                logger.debug("Found match endpoint match (" + ep.id + ") using " + ep.pathPattern);
                return { success : true, payload : ep };
            }
        }

        return { success : false, code : 404, error : "Could not find an endpoint that matches url '" + url + "'" };;
    }

    return { success : false, code : 500, error : api.error };
}

function getResponse(endpoint, apiReq){

    var failedConditions = [];

    for (let resp of endpoint.payload.responses) {

        if (!resp.condition){
            continue;
        }

        if (resp.condition.type == "boolTest"){
            if (resp.condition.value){
                return { code : 200, message : resp.message, payload : injectVariables(resp.payload, apiReq.variables) };  
            }
            
            failedConditions.push({ response : resp.description, expected : "true", actual : resp.condition.value });           
        }

        if (resp.condition.type == "variableTest"){
            var right = apiReq.variables.find(x => x.name === resp.condition.variable).value;
            if (logicCheck(resp.condition.operator, resp.condition.value, right)){
                return { code : 200, message : resp.message, payload : injectVariables(resp.payload, apiReq.variables) };  
            }
            
            failedConditions.push({ response : resp.description, expected : resp.condition.value, actual : right });
        }

        if (resp.condition.type == "bodyTest"){
            var right = apiReq.variables.find(x => x.name === resp.condition.variable).value;
            if (logicCheck(resp.condition.operator, resp.condition.value, right)){
                return { code : 200, message : resp.message, payload : injectVariables(resp.payload, apiReq.variables) };  
            }
            
            failedConditions.push({ response : resp.description, expected : resp.condition.value, actual : right });
        }
    }   

    return { code : 500, json : { 
        endpoint : endpoint.payload.id,
        conditions : failedConditions,
        message : "Found the endpoint, but could not determine response" } 
    };    
}

function injectVariables(payload, variables){
    var str = JSON.stringify(payload);

    for (let v of variables) {
        var rep = "%%" + v.name + "%%";
        str = str.replace(rep, v.value);
    } 

    return JSON.parse(str);
}

function logicCheck(operator, left, right){

    if (operator == "eq"){
        return left == right;
    }

    if (operator == "gt"){
        return left < right;
    }

    logger.error(`Unknown logic operator ${operator}`);   
    return false;
}

function extractApiRequest(endpoint, request, url){

    // Get query params
    var variables = extractVariables(endpoint, request, url);

    return {
        "endpoint" : endpoint,
        "variables" : variables
    }
}

function extractVariables(endpoint, request, url){

    var variables = [];
    var routeVariables = [];      

    if ((match = url.match(endpoint.pathPattern)) !== null) {
        routeVariables = match.groups;
    }  

    for (let v of endpoint.variables) {
        if (v.type == "query"){

            var pattern = v.name + "=([^&]*)";
            if ((match = request.url.match(pattern)) !== null) {
                logger.debug("Found query param match for " + v.name + " from (" + request.url + ")");
                variables.push( { "name" : v.name, "type" : v.type, "value" : match[1] },)
            }  
        }
        else if (v.type == "path"){
            
            if (routeVariables[v.name] != null){
                logger.debug("Found route variable match for " + v.name + " from (" + request.url + ")");
                variables.push( { "name" : v.name, "type" : v.type, "value" : routeVariables[v.name] },)
            }
        }     
        else if (v.type == "header"){            
            if (request.headers[v.name] != null){
                logger.debug("Found header variable match for " + v.name);
                variables.push( { "name" : v.name, "type" : v.type, "value" : request.headers[v.name] },)
            }         
        }
        else if (v.type == "body"){
            var body = request.body; 
            if (body){
                var split = v.name.split(".");
                var val = body[split[0]];

                if (split.length > 1){
                    
                    for (i = 1; i < split.length; i++) {
                        val = val[split[i]];
                    }
                }
                
                variables.push( { "name" : v.name, "type" : v.type, "value" : val },)
            }    
        }
    }

    return variables;
}

/*************** GET ***************/
router.get("", async function (req, res) {
    logger.debug("Checking --> " + req.protocol + "://" + req.hostname + ":" + req.connection.localPort + req.originalUrl);   
    return await createResponse(req, res);  
});

router.post("", async function (req, res) {
    logger.debug("Checking --> " + req.protocol + "://" + req.hostname + ":" + req.connection.localPort + req.originalUrl);   
    return await createResponse(req, res);  
});

module.exports = router;