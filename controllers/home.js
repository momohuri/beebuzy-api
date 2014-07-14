var mongoose = require('mongoose'),
    categories = require('../resources/categories.json'),
    Hapi = require('hapi'),
    User = require('../models/user')();
   Joi = require('joi');


exports.find = function (request, reply) {

    var Event = require('../models/event')();
    var Cities = require('../models/cities')();

    var params = request.query;
    if (params.distance == undefined) params.distance = 15;
    if (params.page == undefined) params.page = 0;
    var numberPerPage = 30;
    var skip = params.page * numberPerPage;
    var query = {};

    Cities.aggregate()
        .near({spherical: true, near: [Number(params.longitude), Number(params.latitude)], distanceField: "geo", maxDistance: params.distance / 3959})
        .group({ _id: { city: "$city"} })
        .exec(function (err, docs) {
//        if (params.latitude != undefined && params.longitude) {
//            query['place.geo'] = { $nearSphere: [Number(params.longitude), Number(params.latitude)], $maxDistance: params.distance / 3959};
//        }

            var cities = [];
            docs.forEach(function (item) {
                if (cities.indexOf(item._id.city) === -1) cities.push(item._id.city);
            });
            query['place.city'] = { $in: cities};
            //todo do postal code
            if (params.categories != undefined) {
                if (typeof params.categories === "string") {
                    query.categories = {$in: categories[params.categories]};
                } else {
                    query.categories = {$in: []};
                    params.categories.forEach(function (category) {
                        query.categories.$in = query.categories.$in.concat(categories[category]);
                    });
                }
            }
            if (params.minPrice != undefined) {
                query['maxPrice'] = {$gte: Number(params.minPrice)}
            }
            if (params.maxPrice != undefined) {
                query['minPrice'] = {$lte: Number(params.maxPrice)}
            }
            if (params.startDate == undefined) {
                reply({error: "provide a start Date"})
            } else if (params.endDate == undefined) {
                var start = new Date(params.startDate.replace('"', '').replace('"', '')).setHours(0, 0, 0, 0);
                var end = new Date(params.startDate.replace('"', '').replace('"', '')).setHours(23, 59, 59, 999);
            } else {
                start = new Date(params.startDate.replace('"', '').replace('"', '')).setHours(0, 0, 0, 0);
                end = new Date(params.endDate.replace('"', '').replace('"', '')).setHours(23, 59, 59, 999);
            }
            query['start'] = {"$gt": new Date(start), "$lt": new Date(end)};

            Event.find(query).limit(numberPerPage).skip(skip).sort('start').exec(function (err, docs) {
                if (err)throw err;
                docs.forEach(function (doc) {
                    doc._doc.pinned = request.auth.isAuthenticated ? request.session.get('eventPinned').indexOf(doc.get('id')) !== -1 : false;
                    doc._doc.category = Event.setCategory(doc, params.categories);
                });
                reply(docs);
            });
        }
    );
};

exports.signUpValidate = {
    payload: {
        name: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required()
    }
};
exports.signUp = function (request, reply) {
    var User = mongoose.model('User');
    User.findOne({ name: request.payload.name })
        .exec(function (err, doc) {
            if (err) return reply({'error': err});
            if (doc !== null) return reply({'error': 'Name already used'});
            User.findOne({ name: request.payload.email })
                .exec(function (err, doc) {
                    if (err) return reply({'error': err});
                    if (doc !== null) return reply({'error': 'Email already used'});
                    User.hashPassword(request.payload.password, function (err, password) {
                        if (err) reply({'error': err});
                        else {
                            request.payload.password = password;
                            User.create(request.payload, function (err, doc) {
                                if (err) return reply({'error': err});
                                request.auth.session.set({id: doc.get('id'), name: doc.get('name')});
                                request.session.set('eventPinned', doc.get("eventPinned"));
                                reply({'success': true, name: doc.get('name')});
                            });
                        }
                    });

                }
            );
        });
};

logIn = function (user, next) {
    var User = require('../models/user')();
    User.findOne({ userId: user.userId })
        .exec(function (err, doc) {
            if (err) return reply({'error': err});
            if (doc === null) {
                User.create(user, function (err, doc) {
                    next(doc);
                });
            } else {
                next(doc);
            }
        });
};

exports.twitterAuth = function (request, reply) {
    var user = {
        name: request.auth.credentials.profile.displayName,
        userId: request.auth.credentials.provider + request.auth.credentials.profile.id
    };
    logIn(user, function (doc) {
      reply(doc);
    });
};

exports.logout = function (request, reply) {
    request.auth.session.clear();
    request.session.clear();
    return reply({'success': true});
};

exports.pinEvent = function (request, reply) {
    var User = require('../models/user')();
    //verify that is not already pinned
    if (request.session.get('eventPinned').indexOf(request.params.eventId) !== -1) return reply({'error': 'Already pinned'});
    request.session.get('eventPinned').push(request.params.eventId);
    request.session.set('eventPinned', request.session.get('eventPinned')); //little trick because it won't let me push directly
    User.update({_id: request.auth.credentials.id}, {$addToSet: {eventPinned: mongoose.Types.ObjectId(request.params.eventId) }}, function (err, model) {
        if (err) return reply({'error': err});
        reply({'success': true});
    });
};

exports.unPinEvent = function (request, reply) {
    var User = require('../models/user')();
    //verify that is not already pinned
    var a = request.session.get('eventPinned');
    a.splice(a.indexOf(request.params.enventId));
    request.session.set('eventPinned', a);
    User.update({_id: request.auth.credentials.id}, {$pull: {eventPinned: request.params.eventId }}, function (err, model) {
        if (err) return reply({'error': err});
        reply({'success': true});
    });

};

exports.getPinnedEvents = function (request, reply) {
    var Event = require('../models/event')();
    if (!request.session.get('eventPinned')) return reply([]);
    Event.find({_id: {$in: request.session.get('eventPinned')}}).exec(function (err, docs) {
        if (err) return reply({'error': err});

        docs.forEach(function (doc) {
            if (!doc.get('end')) doc._doc.end = new Date(new Date(doc.get('start')).getTime() + 2 * 60 * 1000);//if no end date we add 2 hours
            doc._doc.category = Event.setCategory(doc);
        });
        reply(docs);
    });
};


