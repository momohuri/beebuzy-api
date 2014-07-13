'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
    'ngRoute',
    'myApp.filters',
    'myApp.services',
    'myApp.directives',
    'myApp.controllers',
    'ngResource',
    'google-maps',
    'ui.bootstrap',
    'pascalprecht.translate',
    'ngSanitize',
    'duScroll',
    'ui.calendar'
]).

    config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/', {templateUrl: 'html/partials/main.html', controller: 'mainCtrl', reloadOnSearch: false});
        $routeProvider.when('/dashboard', {templateUrl: 'html/partials/dashboard.html', controller: 'dashboard'});
        $routeProvider.when('/dashboardv2', {templateUrl: 'html/partials/dashboardv2.html', controller: 'dashboard'});
        $routeProvider.when('/mainv2', {templateUrl: 'html/partials/mainv2.html', controller: 'mainCtrl'});
        $routeProvider.otherwise({redirectTo: '/'});
    }])
    .config(['$translateProvider', function ($translateProvider) {
        $translateProvider.translations({

        });
    }]);

