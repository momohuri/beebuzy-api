var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = require('../helpers/database').getMongooseCities();
var model;


module.exports = function () {
    if (model) return model;
    var Cities = new Schema(
        {
            areaCode: String,
            city: String,
            country: String,
            geo: {
                type: { type: String },
                coordinates: []
            }, latitude: Number, locId: Number, longitude: Number, metroCode: String, postalCode: String, region: String }
    );
    Cities.index({ "geo": "2dsphere" });

    return model = db.model('Cities', Cities, 'cities');
};