var logger = require("../logger.js");
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;

// https://www.npmjs.com/package/mongodb

var createId = function(inputId) {    
    return new mongo.ObjectID(inputId);    
}

async function getOneAsync(collectionName, filter, project) {

    try {

        let collection = await getCollection(collectionName);

        if (!project){
            project = {};
        }  

        let res = await collection.findOne(filter, project);
        return { success : true, payload : setObjectId(res) };
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function getManyAsync(collectionName, filter, project) {

    try {

        let collection = await getCollection(collectionName);

        if (!project){
            project = {};
        }  

        let returnList = await getManyAsyncInternal(collection, filter, project);
       
        return { success : true, payload : returnList };
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function getManyAsyncInternal(collection, filter, project) {
    let returnList = [];
    let res = await collection.find(filter, project);
    while ((doc = await res.next())) {
        returnList.push(setObjectId(doc));
    }   
    return returnList;    
}

async function insertOneAsync(collectionName, document, project) {

    try {

        let collection = await getCollection(collectionName);

        if (!project){
            project = {};
        }  

        let res = await collection.insertOne(document);
        if (res.insertedCount == 1){
            return { success : true, payload : setObjectId(document) };
        }
        else{
            return { success : false, error : "Could not insert" };
        }
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function updateOneAsync(collectionName, document, project) {

    try {

        let collection = await getCollection(collectionName);

        if (!project){
            project = {};
        }  

        let id = createId(document.id) ?? genrateObjectId();
        let res = await collection.findOneAndUpdate(
            { _id: id }, 
            { $set: document }, 
            { upsert : false, returnOriginal: false, returnDocument	:'after'});

        if (res.lastErrorObject.updatedExisting  === false ){
            return { success : false, error : `Api with id '${document.id}' not found` };
        }

        if (res.ok == 1){
            return { success : true, payload : setObjectId(res.value) };
        }
        else{
            return { success : false, error : "Could not update" };
        }
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function upsertOneAsync(collectionName, document, project) {

    try {

        let collection = await getCollection(collectionName);

        if (!project){
            project = {};
        }  
        let id = createId(document.id) ?? genrateObjectId();
        let res = await collection.findOneAndUpdate(
            { _id: id }, 
            { $set: document }, 
            { upsert : true, returnOriginal: false, returnDocument	:'after'});

        if (res.ok == 1){
            return { success : true, payload : setObjectId(res.value) };
        }
        else{
            return { success : false, error : "Could not upsert" };
        }
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function replaceOneAsync(collectionName, document, project) {

    try {

        let collection = await getCollection(collectionName);

        if (!project){
            project = {};
        }  

        let res = await collection.replaceOne(document);
        if (res.insertedCount != 1){
            return { success : true, payload : document };
        }
        else{
            return { success : false, error : "Could not insert" };
        }
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function upsertManyAsync(collectionName, documents, project) {

    try {
        let collection = await getCollection(collectionName);

        if (!project){
            project = {};
        }  

        let res = await collection.bulkWrite(
            documents.map(d => { 
                return { updateOne:
                  {
                    filter: { _id: d.id ?? genrateObjectId() },
                    update: { $set: d },
                    upsert : true
                  }
                }
              }
            ),
            { ordered : false }
        );

        //logger.debug(res);
        //logger.debug('***************');

        if (res.modifiedCount + res.insertedCount + res.upsertedCount == documents.length){
            let savedEndpoints = await getManyAsyncInternal(collection, { _id : { $in : Object.values(res.upsertedIds).map(i => createId(i)) } }, project);
            return { success : true, payload : savedEndpoints };
        }
        else{
            logger.error(res);
            return { success : false, error : "Could not upsert all documents" };
        }
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function deleteOneAsync(collectionName, filter) {
    try{
        let collection = await getCollection(collectionName);
        await collection.deleteOne(filter);
        return { success : true };
    }
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function deleteManyAsync(collectionName, filter) {
    try{
        let collection = await getCollection(collectionName);
        await collection.deleteMany(filter);
        return { success : true };
    }
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function getCollection(collectionName) {

    const client = await MongoClient.connect(process.env.dbConnection, { useUnifiedTopology: true })
    .catch(err => { return { success : false, error : err.message } });

    if (!client) {
        throw new Error("Could not create db client");
    }

    const db = client.db(process.env.dbName);
    return db.collection(collectionName);
}

var insertOne = function(collectionName, document, project, successCallback, failureCallback) {    

    MongoClient.connect(process.env.dbConnection, { useUnifiedTopology: true }, function(err, client) {

        if (err){ 
            failureCallback(err);
            return; 
        }
      
        const db = client.db(process.env.dbName);
        const collection = db.collection(collectionName);

        collection.insertOne(document, null, function(err, result) {   
            if (err){
                failureCallback(err);
                return;
            }
            else{
                var id = result.insertedId.toString();

                if (!project){
                    project = {};
                }    

                collection.find( { _id : createId(id) } ).project(project).toArray(function(err, docs) {   
                    if (err){
                        failureCallback(err);
                        return;
                    }
                    else{
                        successCallback(docs[0]);
                        return;
                    }            
                });
              
                return;
            }            
        });
        
    });
}

var replaceOne = function(collectionName, document, project, successCallback, failureCallback) {    

    MongoClient.connect(process.env.dbConnection, { useUnifiedTopology: true }, function(err, client) {

        if (err){ 
            failureCallback(err);
            return; 
        }
      
        var filter = { _id : createId(document.id) };
        const db = client.db(process.env.dbName);
        const collection = db.collection(collectionName);

        collection.replaceOne(filter, document, null, function(err, result) {   
            if (err){
                failureCallback(err);
                return;
            }
            else{

                if (!project){
                    project = {};
                }   

                collection.find( filter ).project(project).toArray(function(err, docs) {   
                    if (err){
                        failureCallback(err);
                        return;
                    }
                    else{
                        successCallback(docs[0]);
                        return;
                    }            
                });
                return;
            }            
        });
        
    });
}

var deleteOne = function(collectionName, filter, successCallback, failureCallback) {    

    MongoClient.connect(process.env.dbConnection, { useUnifiedTopology: true }, function(err, client) {

        if (err){ 
            failureCallback(err);
            return; 
        }
      
        const db = client.db(process.env.dbName);
        const collection = db.collection(collectionName);

        collection.deleteOne(filter, function(err, result) {   
            if (err){
                failureCallback(err);
                return;
            }
            else if (result.deletedCount == 0){
                failureCallback("Unable to delete any documents");
                return;
            }
            else{
                successCallback(result[0]);
            }            
        });
    });
}

function setObjectId(obj){
    if (obj){
        delete obj.id;
        obj = {'id':obj._id.toString() , ...obj};
        delete obj._id;        
    }  
    return obj;  
}

/**
 * Generates a new unique id 
 * @see https://mongodb.github.io/node-mongodb-native/api-bson-generated/objectid.html
 */
function genrateObjectId(){
    var timestamp = Math.floor(new Date().getTime()/1000);
    var objectId = new mongo.ObjectId(timestamp);
    return objectId;
}

module.exports.createId = createId;
module.exports.getOneAsync = getOneAsync;
module.exports.getManyAsync = getManyAsync;
module.exports.insertOneAsync = insertOneAsync;
module.exports.replaceOneAsync = replaceOneAsync;
module.exports.upsertManyAsync = upsertManyAsync;
module.exports.deleteManyAsync = deleteManyAsync;
module.exports.deleteOneAsync = deleteOneAsync;
//module.exports.upsertOneAsync = upsertOneAsync;
module.exports.updateOneAsync = updateOneAsync;