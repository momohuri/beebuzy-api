var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var db = require('../helpers/database').getMongoose();
var model;

module.exports = function () {
    if (model) return model;
    var User = new Schema(
        {
            "name": String,
            "password": String,
            "email": String,
            "userId": String,
            "eventPinned": [
                { type: Schema.ObjectId, ref: 'Event' }
            ]
        }
    );

    User.statics = {
        validate: function (password, storedPassword, callback) {
        },
        hashPassword: function (password, callback) {
        }
    };

    return model = db.model('User', User);
};