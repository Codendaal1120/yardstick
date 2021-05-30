var logger = require("../logger.js");
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;

// https://www.npmjs.com/package/mongodb

var createId = function(inputId) {    
    return new mongo.ObjectID(inputId);    
}

var getMany = function(collectionName, filter, project, successCallback, failureCallback) {    

    if (!filter){
        filter = {};
    }

    MongoClient.connect(process.env.dbConnection, { useUnifiedTopology: true }, function(err, client) {
      
        if (err){ failureCallback(err); }

        const db = client.db(process.env.dbName);
        const collection = db.collection(collectionName);

        if (!project){
            project = {};
        }       

        collection.find(filter).project(project).toArray(function(err, docs) {   
            if (err){
                failureCallback(err);
            }
            else{
                successCallback(docs);
            }            
        });
    });
}

async function getOneAsync(collectionName, filter, project) {

    const client = await MongoClient.connect(process.env.dbConnection, { useUnifiedTopology: true })
        .catch(err => { return { success : false, error : err.message } });

    if (!client) {
        return { success : false, error : "Could not create db client" };
    }

    try {

        const db = client.db(process.env.dbName);
        let collection = db.collection(collectionName);

        if (!project){
            project = {};
        }  

        let res = await collection.findOne(filter, project);
        return { success : true, payload : res };
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function getManyAsync(collectionName, filter, project) {

    const client = await MongoClient.connect(process.env.dbConnection, { useUnifiedTopology: true })
        .catch(err => { return { success : false, error : err.message } });

    if (!client) {
        return { success : false, error : "Could not create db client" };
    }

    try {

        const db = client.db(process.env.dbName);
        let collection = db.collection(collectionName);

        if (!project){
            project = {};
        }  

        let res = await collection.find(filter, project);
        return { success : true, payload : res };
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function insertOneAsync(collectionName, document, project) {

    const client = await MongoClient.connect(process.env.dbConnection, { useUnifiedTopology: true })
        .catch(err => { return { success : false, error : err.message } });

    if (!client) {
        return { success : false, error : "Could not create db client" };
    }

    try {

        const db = client.db(process.env.dbName);
        let collection = db.collection(collectionName);

        if (!project){
            project = {};
        }  

        let res = await collection.insertOne(document);
        if (res.insertedCount == 1){
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

async function replaceOneAsync(collectionName, document, project) {

    const client = await MongoClient.connect(process.env.dbConnection, { useUnifiedTopology: true })
        .catch(err => { return { success : false, error : err.message } });

    if (!client) {
        return { success : false, error : "Could not create db client" };
    }

    try {

        const db = client.db(process.env.dbName);
        let collection = db.collection(collectionName);

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

var insertMany = function(collectionName, successCallback, failureCallback) {    

    MongoClient.connect(process.env.dbConnection, function(err, client) {
      
        const db = client.db(process.env.dbName);
        const collection = db.collection(collectionName);

        collection.insertMany([{ a: 1 }, { a: 2 }, { a: 3 }], function(err, result) {
           
            console.log('Inserted 3 documents into the collection');
            callback(result);
            return;
          });
        
    });
}

module.exports.createId = createId;

module.exports.getMany = getMany;
module.exports.getOneAsync = getOneAsync;
module.exports.getManyAsync = getManyAsync;
module.exports.insertOne = insertOne;
module.exports.insertOneAsync = insertOneAsync;
module.exports.replaceOneAsync = replaceOneAsync;
module.exports.replaceOne = replaceOne;
module.exports.deleteOne = deleteOne;