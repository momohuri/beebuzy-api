'use strict';

/* Services */

var url = 'http://beebuzy-api.aws.af.cm';


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', ['ngResource']).
    factory('Events', ['$resource', function ($resource) {
        var events = {
            eventsFind: $resource(url + '/find', {}, {
                get: {method: 'GET'}
            }),

            pinEvent: $resource(url + '/pinEvent/:eventId', {eventId: '@eventId'})
        };
        return events;
    }])
    .factory('User', ['$resource', function ($resource) {

        var getAuth = $resource(url + '/getAuthStatus', {}, {
            get: {method: 'GET'}
        });
        var login = $resource(url + '/login', {}, {
            post: {method: 'POST', data: {email: '', password: ''}}
        });
        var signUp = $resource(url + '/signUp', {}, {
            post: {method: 'POST', data: {name: '', email: '', password: ''}}
        });
        var logout = $resource(url + '/signUp', {}, {
            get: {method: 'GET'}
        });


        var user = {
            isAuth: function (next) {
                if (sessionStorage.isAuth == "true")  return next({success: true, name: sessionStorage.name});
                getAuth.query({}, function (data) {
                }, function (res) {
                    if (res.status == 401) return  next(false);
                    else  return  next(data);
                });
            },
            login: function (user, next) {
                login.post({email: user.email, password: user.password}, function (data) {
                    if (data.error) return next(data);
                    else {
                        sessionStorage.isAuth = true;
                        sessionStorage.name = data.name;
                        return next({success: "Logged", name: data.name});
                    }
                })
            },
            signUp: function (user, next) {
                signUp.post({name: user.name, email: user.email, password: user.password}, function (data) {
                    if (data.error) return next(data);
                    else {
                        sessionStorage.isAuth = true;
                        sessionStorage.name = data.name;
                        return next({success: "Account created", name: data.name})
                    }
                })
            }
        };


        return user

    }]);
