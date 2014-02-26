var Hapi = require('hapi'),
    mongoose = require('mongoose'),
    fs = require('fs'),
    conf = JSON.parse(fs.readFileSync('./conf/' + process.env.NODE_ENV + '.json', 'utf8')),
    Controllers = require('./controllers');


// Create a server with a host and port
var server = Hapi.createServer('localhost', 8001, {cors: true});


mongoose.connect(conf.mongoEvents, function (err) {
    if (err) throw err;
    console.log('connected to db : ' + mongoose.connections["0"].name);
    var options = {
        cookieOptions: {
            password: 'my-cookies-secret!@#$%',
            isSecure: false
        }
    };
    server.pack.require('yar', options, function (err) {
        if (err) throw err
    });
    server.pack.require(['hapi-auth-cookie'], function (err) {

        server.auth.strategy('session', 'cookie', {
            password: 'my-cookies-secret!@#$%',
            cookie: 'hello',
            isSecure: false
        });


        server.route([
            { method: 'GET', path: '/find', handler: Controllers.Home.find},
            { method: 'POST', path: '/signUp', config: {handler: Controllers.Home.signUp, validate: Controllers.Home.signUpValidate }},
            { method: 'POST', path: '/login', config: {handler: Controllers.Home.logIn, validate: Controllers.Home.logInValidate, auth: { mode: 'try' }} },
            { method: 'get', path: '/logout', config: {handler: Controllers.Home.logout, auth: true  }},
            {method:'get',path:'/getAuthStatus',config:{handler:function(req,res){ res(true)},auth:true}} ,

            {method: 'GET', path: '/html', config: {handler: Controllers.Home.loginHTML, auth: { mode: 'try' }} },
            {method: 'GET', path: '/eventHTML/{eventId}', config: {handler: Controllers.Home.eventHTML} },


            {method: 'GET', path: '/pinEvent/{eventId}', config: { handler: Controllers.Home.pinEvent, auth: true  }},
            {method: 'GET', path: '/getPinnedEvents', config: { handler: Controllers.Home.getPinnedEvents, auth: true  }}
        ]);


        server.start();
        console.log('listening to 8001');
    });


});




