var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var fs = require('fs');
var categories = JSON.parse(fs.readFileSync('./resources/categories.json', 'utf8'));


module.exports = function () {
    var Event = new Schema(

        { "title": String,
            "categories": {type: [ ], index: true},
            "url": String,
            _id: Schema.Types.ObjectId,
            "place": { "city": String, "country": String, "region": String, "street": String, "postal": String, "name": String,
                geo: {
                    type: { type: String },
                    coordinates: []
                }},
            "startDate": {type: Date},
            "description": String,
            "price": { "max": Number, "min": Number, "currency": String },
            "eventId": String,
            "language": String,
            "website": String
        }
    );

    Event.statics = {

        setCategory: function (doc, paramsCategories) {
            if (typeof paramsCategories === 'object') {  //if we have a category we just take from it
                for (var y = 0; y < paramsCategories.length; y++) {
                    for (var i = 0; i < doc.categories.length; i++) {
                        if (categories[paramsCategories[y]].indexOf(doc.categories[i]) !== -1) {
                            return paramsCategories[y];
                        }
                    }
                }
            } else if (typeof paramsCategories === 'string') {
                for (var i = 0; i < doc.categories.length; i++) {
                    if (categories[paramsCategories].indexOf(doc.categories[i]) !== -1) {
                        return paramsCategories;
                    }
                }
            } else {
                for (var key in categories) {
                    for (var i = 0; i < doc.categories.length; i++) {
                        if (categories[key].indexOf(doc.categories[i]) !== -1) {
                            return key;
                        }
                    }
                }
            }
        }
    }
// define the index
    Event.index({ "place.geo": "2dsphere", startDate: 1 });

    mongoose.model('Event', Event, 'articles');
}