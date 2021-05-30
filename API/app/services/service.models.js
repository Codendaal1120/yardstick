var data = require("../data/data.js");
var logger = require("../logger.js");

const models_collection = "models";

var getApiModels = function(apiId, callack) {
    data.getMany(models_collection, { "apiId" : apiId }, function(docs){
        var returnList = [];
        for(const doc of docs) {
            returnList.push(toApiModel(doc));
        }
        callack({ success : true, payload : returnList });
        return;
    },
    function (error){
        logger.error("Could not get api models : " + error);
        callack({ success : false, error : error, });
        return;
    });
}

var deleteApiModel = function(apiId, modelId, callack) {
    data.deleteOne(models_collection, { "_id" : data.createId(modelId) , "apiId" : apiId }, function(doc){
        callack({ success : true, payload : toApiModel(doc), });
        return;
    },
    function (error){
        logger.error("Could not delete model : " + error);
        callack({ success : false, error : error, });
        return;
    });
}

var saveApiModel = function(apiId, model, callack) {

    if (!model){
        callack({ success : false, error : "Invalid model supplied" });
        return;
    }

    model.apiId = apiId;

    if (model.id != null){
        data.replaceOne(models_collection, model, function(doc){
            callack({ success : true, payload : toApiModel(doc), });
            return;
        },
        function (error){
            logger.error("Could not save model : " + error);
            callack({ success : true, error : error, });
            return;
        });
    }
    else{
        data.insertOne(models_collection, model, function(doc){
            callack({ success : true, payload : toApiModel(doc), });
            return;
        },
        function (error){
            logger.error("Could not save model : " + error);
            callack({ success : true, error : error, });
            return;
        });
    }    
}

function toApiModel(input){
    if (input){
        var output = {
            "id" : input._id.toString(),
            "apiId" : input.apiId,
            "name" : input.name,
            "fields" : input.fields
        }
        return output;
    }
}

module.exports.getApiModels = getApiModels;
module.exports.saveApiModel = saveApiModel;
module.exports.deleteApiModel = deleteApiModel;