var mongoose = require('mongoose');
var Schema = mongoose.Schema;


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
// define the index
    Event.index( { "place.geo": "2dsphere",startDate:1 });

    mongoose.model('Event', Event, 'articles');
}