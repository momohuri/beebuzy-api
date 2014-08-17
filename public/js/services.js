'use strict';

/* Services */

var url = '';


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', ['ngResource']).
    factory('Events', ['$resource', function ($resource) {
        var events = {
            eventsFind: $resource('/find', {}, {
                get: {method: 'GET'}
            }),

            pinEvent: $resource('/pinEvent/:eventId', {eventId: '@eventId'}),
            unPinEvent: $resource('/unPinEvent/:eventId', {eventId: '@eventId'})
        };
        return events;
    }])
    .factory('User', ['$resource', function ($resource) {

        var getAuth = $resource('/getAuthStatus', {}, {
            get: {method: 'GET'}
        });
        var login = $resource('/login', {}, {
            post: {method: 'POST', data: {email: '', password: ''}}
        });
        var signUp = $resource('/signUp', {}, {
            post: {method: 'POST', data: {name: '', email: '', password: ''}}
        });
        var logout = $resource('/logout', {}, {
            get: {method: 'GET'}
        });


        var user = {
            isAuth: function (next) {
                if (sessionStorage.isAuth == "true")  return next({success: true, name: sessionStorage.name});
                getAuth.get({}, function (data) {
                    next(data);
                }, function (res) {
                    if (res.status == 401) return  next(false);
                    else  next(res);
                });
            },
            login: function (user, next) {
                login.post({email: user.email, password: user.password}, function (data) {
                    if (data.error) return next(data);
                    else {
                        sessionStorage.isAuth = true;
                        sessionStorage.name = data.name;
                        return next({success: "Logged", name: data.name, isAuth: true});
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
            },
            logout: function (next) {
                logout.get({}, function (data) {
                    sessionStorage.clear();
                    next();
                })
            },
            getPinnedEvents: $resource('/getPinnedEvents')
        };
        return user

    }]);
