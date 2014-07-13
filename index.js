var Hapi = require('hapi'),
    http = require('http'),
    url = require('url'),
    Controllers = require('./controllers');


// Create a server with a host and port
var server = Hapi.createServer('localhost', 8000, {cors: {credentials: true}});


var options = {
    cookieOptions: {
        password: 'my-cookies-secret!@#$%',
        isSecure: false,
        isHttpOnly: false
    }
};
server.pack.require('yar', options, function (err) {
    if (err) throw err
});
server.pack.require(['hapi-auth-cookie'], function (err) {

    server.auth.strategy('session', 'cookie', {
        password: 'my-cookies-secret!@#$%',
        cookie: 'hello',
        isSecure: false,
        isHttpOnly: false
    });

    server.route([

        { method: 'GET', path: '/find', config: {handler: Controllers.Home.find, auth: { mode: 'try' }}},
        { method: 'POST', path: '/signUp', config: {handler: Controllers.Home.signUp, validate: Controllers.Home.signUpValidate}},
        { method: 'POST', path: '/login', config: {handler: Controllers.Home.logIn, validate: Controllers.Home.logInValidate, auth: { mode: 'try' }} },
        { method: 'GET', path: '/logout', config: {handler: Controllers.Home.logout, auth: true  }},
        { method: 'GET', path: '/getAuthStatus', config: {handler: Controllers.Home.isAuth, auth: true}} ,

        { method: 'GET', path: '/html', config: {handler: Controllers.Home.loginHTML, auth: { mode: 'try' }} },
        { method: 'GET', path: '/htmlsignup', config: {handler: Controllers.Home.signupHTML, auth: { mode: 'try' }} },
        { method: 'GET', path: '/eventHTML/{eventId}', config: {handler: Controllers.Home.eventHTML} },

        { method: 'GET', path: '/pinEvent/{eventId}', config: { handler: Controllers.Home.pinEvent, auth: true  }},
        { method: 'GET', path: '/unPinEvent/{eventId}', config: { handler: Controllers.Home.unPinEvent, auth: true  }},
        {method: 'GET', path: '/getPinnedEvents', config: { handler: Controllers.Home.getPinnedEvents, auth: true  }},

        {method: 'GET', path: '/{path*}', handler: {directory: { path: './public', listing: false, index: true}}
        }
    ]);


    server.start();
    console.log('listening to 8000');
});

function SEO(request, reply) {
    var token = 'crdaR26adq';

    function getSnapshotServer() {
        if (token) {
            return 'http://cdn.getseojs.com/snapshots/' + token + '/v3';
        } else if (process.env.SEOJS_URL) {
            return process.env.SEOJS_URL + '/v3';
        } else {
            return null;
        }
    }

    function getSnapshotUrl(req) {
        var snapshotServer = getSnapshotServer();
        var url = 'http://beebuzy.com' + req.url.href.replace('_escape_fragment_', '#');
        return snapshotServer + '/' + url;
    }

    function getSnapshot(snapshotUrl, headers, outResponse) {
        var options = url.parse(snapshotUrl);
        options['headers'] = headers;
        http.get(options, function (inResponse) {
            var page;
            inResponse.on('data', function (data) {
                page += data;
            });
            inResponse.on('end', function () {
                outResponse(page)
            });
        }).on('error', function (e) {
        });
    }

    function getHeaders(req) {
        var headers = {};
        var keys = ['user-agent', 'if-none-match', 'if-modified-since', 'cache-control'];
        for (var i in keys) {
            var key = keys[i];
            if (req.headers[key]) {
                headers[key] = req.headers[key];
            }
        }
        return headers;
    }

    getSnapshot(getSnapshotUrl(request), getHeaders(request), reply);

}


