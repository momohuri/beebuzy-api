var Hapi = require('hapi'),
    http = require('http'),
    url = require('url'),
    Controllers = require('./controllers');


// Create a server with a host and port
//var server = Hapi.createServer('localhost', 8000, {cors: {credentials: true}});

function main() {

    var server = new Hapi.Server(8000);


    server.route([

        { method: 'GET', path: '/find', config: {handler: Controllers.Home.find}},
        { method: 'POST', path: '/signUp', config: {handler: Controllers.Home.signUp, validate: Controllers.Home.signUpValidate}},
        { method: 'POST', path: '/login', config: {handler: Controllers.Home.logIn, validate: Controllers.Home.logInValidate} },
        { method: 'GET', path: '/logout', config: {handler: Controllers.Home.logout  }},
        { method: 'GET', path: '/getAuthStatus', config: {handler: Controllers.Home.isAuth}} ,

        { method: 'GET', path: '/html', config: {handler: Controllers.Home.loginHTML} },
        { method: 'GET', path: '/htmlsignup', config: {handler: Controllers.Home.signupHTML} },
        { method: 'GET', path: '/eventHTML/{eventId}', config: {handler: Controllers.Home.eventHTML} },

        { method: 'GET', path: '/pinEvent/{eventId}', config: { handler: Controllers.Home.pinEvent }},
        { method: 'GET', path: '/unPinEvent/{eventId}', config: { handler: Controllers.Home.unPinEvent  }},
        {method: 'GET', path: '/getPinnedEvents', config: { handler: Controllers.Home.getPinnedEvents }},

        {method: 'GET', path: '/{path*}', handler: {directory: { path: './public', listing: false, index: true}}
        }
    ]);


    server.start();
    console.log('listening to 8000');
}

main();