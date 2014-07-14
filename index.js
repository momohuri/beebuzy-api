var Hapi = require('hapi'),
    http = require('http'),
    url = require('url'),
    Controllers = require('./controllers');


// Create a server with a host and port
//var server = Hapi.createServer('localhost', 8000, {cors: {credentials: true}});

function main() {

    var server = new Hapi.Server(8000);

    server.pack.register(require('bell'), function (err) {
        server.auth.strategy('twitter', 'bell', {
            provider: 'twitter',
            password: 'cookie_encryption_password',
            clientId: 'ao4tmlwNNhBmKfxaUZqk4QN8w',
            clientSecret: 'Ymr3coFBZ6D8pWrerJUmBRjwELaYCX2DnHbj5SgSINNThqDL68',
            isSecure: false     // Terrible idea but required if not using HTTPS
        });

        server.route([
            {   method: ['GET'], path: '/twitterAuth',
                config: {
                    auth: { strategy: 'twitter', mode: 'try'},
                    handler: Controllers.Home.twitterAuth
                }
            },
            { method: 'GET', path: '/find', config: {handler: Controllers.Home.find}},
            { method: 'POST', path: '/signUp', config: {handler: Controllers.Home.signUp, validate: Controllers.Home.signUpValidate}},
            { method: 'GET', path: '/logout', config: {handler: Controllers.Home.logout  }},

            { method: 'GET', path: '/pinEvent/{eventId}', config: { handler: Controllers.Home.pinEvent }},
            { method: 'GET', path: '/unPinEvent/{eventId}', config: { handler: Controllers.Home.unPinEvent  }},
            {method: 'GET', path: '/getPinnedEvents', config: { handler: Controllers.Home.getPinnedEvents }},

            {method: 'GET', path: '/{path*}', handler: {directory: { path: './public', listing: false, index: true}}
            }
        ]);


        server.start();
        console.log('listening to 8000');
    });
}

main();