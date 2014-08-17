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
            if (!docs) return reply([]);
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
    var UserMongoose = mongoose.model('User');
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
                                var session = {
                                    id: doc.get('id'),
                                    name: doc.get('name'),
                                    eventPinned: doc.get("eventPinned")
                                };
                                reply({'success': true, name: doc.get('name')});
                            });
                        }
                    });

                }
            );
        });
};

exports.login = function (request, reply) {
    var user = {
        email: request.payload.email,
        password: request.payload.password
    }
    User.login(user, function (err, doc) {
        if (err) return reply(err);
        request.auth.session.set(doc);
        return reply.redirect('/');
    });
};

exports.twitterAuth = function (request, reply) {
    var user = {
        name: request.auth.credentials.profile.displayName,
        userId: request.auth.credentials.provider + '_#_' + request.auth.credentials.profile.id
    };
    User.logInProvider(user, function (err, doc) {
        if (err) return reply(err);
        request.auth.session.set(doc);
        return reply.redirect('/');
    });
};

exports.getAuthStatus = function (request, reply) {
    if (request.auth.isAuthenticated) {
        return reply({success: true, name: request.auth.credentials.name});
    }
    return reply({err: 'must log in'});
};

exports.testLogin = function (request, reply) {
    if (request.auth.isAuthenticated) {
        return reply('<html><head><title>Login page</title></head><body><h3>Welcome '
            + request.auth.credentials.name
            + '</h3></body></html>');
    } else {
        return reply('<html><head><title>Login page</title></head><body><h3>You must login</h3></body></html>');
    }
};

exports.logout = function (request, reply) {
    if (request.auth.isAuthenticated) {
        request.auth.session.clear();
    }
    return reply.redirect('/');
};

/*exports.logout = function (request, reply) {
 request.auth.session.clear();
 request.session.clear();
 return reply({'success': true});
 };*/

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
    if(request.auth.isAuthenticated) {
        var Event = require('../models/event')();
        if (!request.auth.credentials.eventPinned) return reply([]);
        Event.find({_id: {$in: request.auth.credentials.eventPinned}}).exec(function (err, docs) {
            if (err) return reply({'error': err});
            if (docs.length > 0) {
                docs.forEach(function (doc) {
                    if (!doc.get('end')) doc._doc.end = new Date(new Date(doc.get('start')).getTime() + 2 * 60 * 1000);//if no end date we add 2 hours
                    doc._doc.category = Event.setCategory(doc);
                });
            } else {
                docs = [];
            }
            reply(docs);
        });
    } else {
        reply([]);
    }
};