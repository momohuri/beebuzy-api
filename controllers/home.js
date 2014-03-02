var mongoose = require('mongoose'),
    fs = require('fs'),
    categories = JSON.parse(fs.readFileSync('./resources/categories.json', 'utf8')),
    Hapi = require('hapi');
require('../models/event')();
require('../models/user')();


exports.find = function (request, reply) {
    var Event = mongoose.model('Event');
    var params = request.query;
    if (params.distance == undefined) params.distance = 15;
    if (params.page == undefined) params.page = 0;
    var numberPerPage = 30;
    var skip = params.page * numberPerPage;

    var query = {};

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
    query['startDate'] = {"$gt": new Date(start), "$lt": new Date(end)};


    if (params.latitude != undefined && params.longitude) {
        query['place.geo'] = { $nearSphere: [Number(params.longitude), Number(params.latitude)], $maxDistance: params.distance / 3959};
        //   = { $near:  {coordinates: , type: 'Point'}, maxDistance: params.distance };
    }

    Event.find(query).limit(numberPerPage).skip(skip).sort('startDate').exec(function (err, docs) {
        if (err)throw err;
        docs.forEach(function (doc) {
            doc._doc.pinned = request.auth.isAuthenticated ? request.session.eventPinned.indexOf(doc.get('id')) !== -1 : false;
            doc._doc.category = setCategory(doc);
        });
        reply(docs);
    });

    function setCategory(doc) {
        if (typeof params.categories === 'object') {  //if we have a category we just take from it
            for (var y = 0; y < params.categories.length; y++) {
                for (var i = 0; i < doc.categories.length; i++) {
                    if (categories[params.categories[y]].indexOf(doc.categories[i]) !== -1) {
                        return params.categories[y];
                    }
                }
            }
        } else if (typeof params.categories === 'string') {
            for (var i = 0; i < doc.categories.length; i++) {
                if (categories[params.categories].indexOf(doc.categories[i]) !== -1) {
                    return params.categories;
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
};


exports.signUpValidate = {
    payload: {
        name: Hapi.types.String().required(),
        email: Hapi.types.String().required(),
        password: Hapi.types.String().required()
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

exports.logInValidate = {
    payload: {
        password: Hapi.types.String().required(),
        email: Hapi.types.String().required()
    }
};
exports.logIn = function (request, reply) {
    var User = mongoose.model('User');
    User.findOne({ email: request.payload.name })
        .exec(function (err, doc) {
            if (err) return reply({'error': err});
            if (doc === null) return reply({'error': 'Name not found'});
            User.validate(request.payload.email, request.payload.password, doc.get('password'), function (err, isValid) {
                if (err) return reply({'error': err});
                if (!isValid) return reply({'error': 'Password not valid'});
                request.auth.session.set({id: doc.get('id'), name: doc.get('name')});
                request.session.set('eventPinned', doc.get("eventPinned"));
                reply({success: true, name: doc.get('name')});
            });
        });
};

exports.logout = function (request, reply) {
    request.auth.session.clear();
    request.session.clear();
    return reply({'success': true});
};

exports.isAuth = function (request, reply) {
    reply({success: true, name: request.auth.session.get('name')});
};

exports.pinEvent = function (request, reply) {
    var User = mongoose.model('User');
    //verify that is not already pinned
    if (request.session.get('eventPinned').indexOf(request.params.eventId) !== -1) return reply({'error': 'Already pinned'});
    request.session.get('eventPinned').push(request.params.eventId);
    request.session.set('eventPinned', request.session.get('eventPinned')); //little trick because it won't let me push directly
    User.update({_id: request.auth.credentials.id}, {$addToSet: {eventPinned: mongoose.Types.ObjectId(request.params.eventId) }}, function (err, model) {
        if (err) return reply({'error': err});
        reply({'success': true});
    });

};

exports.getPinnedEvents = function (request, reply) {
    var Event = mongoose.model('Event');
    if (!request.session.get('eventPinned')) return reply([]);
    Event.find({_id: {$in: request.session.get('eventPinned')}}).exec(function (err, docs) {
        if (err) return reply({'error': err});
        reply(docs);
    });
};

exports.loginHTML = function (request, reply) {
    return reply('<html><head><title>Login page</title></head><body>'
        + '<form method="post" action="/login">'
        + 'Username: <input type="text" name="name"><br>'
        + 'Password: <input type="password" name="password"><br/>'
        + '<input type="submit" value="Login"></form></body></html>');
};

exports.eventHTML = function (request, reply) {
    var Event = mongoose.model('Event');
    Event.findOne({_id: request.params.eventId}).exec(function (err, doc) {
        if (doc === null) return reply("No event found");
        reply('<h1>' + doc.get('title') + '</h1> \
    </div>                               \
        <div class="modal-body">            \
            <p class="price">' + doc.get('price.min') + '-' + doc.get('price.max') + '</span>   \
            </p>                                                                                                      \
            <p class="date">' + doc.get('startDate') + '</p>                                                            \
            <p class="street">' + doc.get('place.street') + ' - ' + doc.get('place.city') + '  ' + doc.get('place.region') + ' -      \
                ' + doc.get('place.name') + '</p>                                                                          \
            <p class="description">' + doc.get('description') + '</p>                                               \
        </div>                                                                                                                 \
    </div>');
    });


}