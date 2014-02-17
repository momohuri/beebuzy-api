var mongoose = require('mongoose'),
    fs = require('fs'),
    categories = JSON.parse(fs.readFileSync('./resources/categories.json', 'utf8'));
require('../models/event')();

exports.cities = function () {
    debugger
};

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
        query['place.geo'] = { $near: {coordinates: [Number(params.longitude), Number(params.latitude)], type: 'Point'} };
    }

    Event.find(query).limit(numberPerPage).skip(skip).sort('startDate').exec(function (err, docs) {
        if (err)throw err;
        docs.forEach(function (doc) {
            doc.category = setCategory(doc);
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

exports.categories = function () {
    debugger
};