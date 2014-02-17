var Hapi = require('hapi'),
    mongoose = require('mongoose'),
    fs = require('fs'),
    conf = JSON.parse(fs.readFileSync('./conf/' + process.env.NODE_ENV + '.json', 'utf8')),
    Controllers = require('./controllers');


// Create a server with a host and port
var server = Hapi.createServer('localhost', 8001);


mongoose.connect(conf.mongoEvents, function (err) {
    if (err) throw err;
    console.log('connected to db : ' + mongoose.name);

    server.start();
    console.log('listening to 8001');
});


server.route([
    { method: 'GET', path: '/find', handler: Controllers.Home.find},
    { method: 'GET', path: '/categories', handler: Controllers.Home.categories },
    { method: 'GET', path: '/cities', handler: Controllers.Home.cities }
]);


