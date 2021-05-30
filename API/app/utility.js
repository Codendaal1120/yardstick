module.exports.toClientObject = toClientObject;

// Modify the mongo document into the correct payload
function toClientObject(obj){
    if (obj){
        obj.id = obj._id.toString();
        delete obj._id;        
    }  
    return obj;  
}
