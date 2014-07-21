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
        },
        logInProvider: function (user, next) {
            var that = this;
            that.findOne({ userId: user.userId })
            .exec(function (err, doc) {
                if (err) return next({'error': err});
                if (doc === null) {
                    that.create(user, function (err, doc) {
                        next(null, doc);
                    });
                } else {
                    next(null, doc);
                }
            });
        }
    };

    return model = db.model('User', User);
};