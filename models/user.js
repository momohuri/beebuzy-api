var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Bcrypt = require('bcrypt');


module.exports = function () {
    var User = new Schema(
        {
            "name": String,
            "password": String,
            "email":String,
            "eventPinned": [
                { type: Schema.ObjectId, ref: 'Event' }
            ]
        }
    );

    User.statics = {
        validate: function (username, password, storedPassword, callback) {
            Bcrypt.compare(password, storedPassword, callback);
        },
        hashPassword: function (password, callback) {
            Bcrypt.hash(password, 10, callback);
        }
    };

    mongoose.model('User', User);
};