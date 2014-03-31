var mongoose = require('mongoose'),
    conf = require('../conf/' + process.env.NODE_ENV);

var mongooseEvents;
var mongooseCities;
module.exports.getMongoose = function () {
    return mongooseEvents != undefined ? mongooseEvents : mongooseEvents = mongoose.createConnection(conf.mongoEvents);
};


module.exports.getMongooseCities = function () {
    return mongooseCities != undefined ? mongooseCities : mongooseCities = mongoose.createConnection(conf.mongoCities);
};