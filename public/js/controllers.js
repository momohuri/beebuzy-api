'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
    controller('mainCtrl', ['$scope', '$modal', '$location', '$window', 'Events', 'User', function ($scope, $modal, $location, $window, Events, User) {

        // ----- functions
        $scope.goToEvent = function (index) {
            $.scrollTo($("#" + index).offset().top - 100, 'slow');
        };

        var refreshMarkers = function () {
            $scope.events.forEach(function (event) {
                $scope.markers.push({_id: event._id, geo: {longitude: event.place.geo.coordinates[0], latitude: event.place.geo.coordinates[1]}, icon: "img/" + event.category + "-map.png"});
            });
        };

        $scope.showMore = function () {
            Events.eventsFind.query({page: ++page, latitude: $scope.details1.geometry.location.d, longitude: $scope.details1.geometry.location.e, startDate: new Date($scope.startDate).toString(), endDate: new Date($scope.endDate).toString(), categories: $scope.categories}, function (data) {
                $scope.events = $scope.events.concat(data);
                refreshMarkers();
            })
        };

        $scope.search = function () {
            $scope.markers = [];
            Events.eventsFind.query({latitude: $scope.details1.geometry.location.d, longitude: $scope.details1.geometry.location.e, startDate: new Date($scope.startDate).toString(), endDate: new Date($scope.endDate).toString(), categories: $scope.categories}, function (data) {
                $scope.events = data;
                refreshMarkers();
            });
        };

        $scope.openModal = function (modal, data) {
            var modalInstance = $modal.open({
                templateUrl: modal + '.html',
                controller: ModalInstanceCtrl,
                resolve: {
                    eventModal: function () {
                        return data;
                    }
                }
            });
        };
        var ModalInstanceCtrl = function ($scope, $modalInstance, eventModal) {
            $scope.eventModal = eventModal;

            $scope.signUp = function (user) {
                User.signUp(user, function (result) {
                    if (result.error) {
                        $scope.error = result.error;
                    } else {
                        $modalInstance.dismiss();
                        $location.path( "/dashboard" );
                    }
                });
            };

            $scope.login = function(user){
                User.login(user, function (result) {
                    if (result.error) {
                        $scope.error = result.error;
                    } else {
                        $modalInstance.dismiss();
                        $location.path( "/dashboard" );
                    }
                });
            }

            $scope.ok = function () {
                $modalInstance.close();
            };
            $scope.cancel = function () {
                $modalInstance.dismiss();
            };
        };

        $scope.toggleSelectionCategories = function (category) {
            var idx = $scope.categories.indexOf(category);
            if (idx > -1) {
                $scope.categories.splice(idx, 1);
            }
            else {
                $scope.categories.push(category);
            }
        };

        var moveMap = function () {
            $scope.map.center = {
                latitude: $scope.details1.geometry.location.d,
                longitude: $scope.details1.geometry.location.e
            }

        };


        $scope.pinEvent = function (eventId) {
            if ($scope.isAuth) {
                Events.pinEvent.get({eventId: eventId}, function (data) {
                    console.log(data);
                })
            } else {
                $scope.openModal('needToLog');
                console.log('need to sign in/login')
            }
        };
        // -----/functions

        //      ----- default values  -----
        $location.search().startDate ? $scope.startDate = $location.search().startDate : $scope.startDate = new Date();
        var firstDay = new Date();
        $location.search().endDate ? $scope.endDate = $location.search().endDate : $scope.endDate = new Date(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000);
        var page = 0;
        $scope.result1 = 'San Francisco, CA, United States';
        $scope.options1 = null;
        $scope.details1 = {geometry: {location: {d: 37.774929500000000000, e: -122.419415500000010000}}};
        $scope.map = {
            center: {
                latitude: $scope.details1.geometry.location.d,
                longitude: $scope.details1.geometry.location.e
            },

            options: {
                disableDefaultUI: true,
                streetViewControl: false,
                panControl: false
            },
            zoom: 11
        };
        $scope.categories = [];
        $scope.markers = [];
        //       ------ /default values    ----

        //-----base actions




        $(window).resize(function () {
            var h = $(window).height(),
                offsetTop = 110; // Calculate the top offset
            $('.angular-google-map-container').css('height', (h - offsetTop));
        }).resize();

        if ($location.search().categories) {
            if (typeof $location.search().categories === 'string') {
                $scope.categories.push($location.search().categories)
            } else {
                $scope.categories = $location.search().categories;
            }
        }
        if ($location.search().latitude && $location.search().longitude) {
            $scope.details1.geometry.location = {d: $location.search().latitude, e: $location.search().longitude};
            moveMap();
            $scope.search();
        } else {
            moveMap();
            $scope.search();
        }
        if (navigator.geolocation && !($location.search().latitude && $location.search().longitude)) { //will search twice some time, but at least the user will wait
            navigator.geolocation.getCurrentPosition(showPosition);
        }
        function showPosition(position) {
            $scope.details1.geometry.location.d = position.coords.latitude;
            $scope.details1.geometry.location.e = position.coords.longitude;
            $scope.search();
        }

        function SearchInLocationDiv(controlDiv) {
            controlDiv.style.padding = '5px';
            var controlUI = document.createElement('div');
            controlUI.style.backgroundColor = 'white';
            controlUI.style.borderStyle = 'solid';
            controlUI.style.borderWidth = '2px';
            controlUI.style.cursor = 'pointer';
            controlUI.style.textAlign = 'center';
            controlUI.title = 'Click to search';
            controlDiv.appendChild(controlUI);

            var controlText = document.createElement('div');
            controlText.style.fontFamily = 'Arial,sans-serif';
            controlText.style.fontSize = '12px';
            controlText.style.paddingLeft = '4px';
            controlText.style.paddingRight = '4px';
            controlText.innerHTML = '<b>Search in this location</b>';
            controlUI.appendChild(controlText);

            google.maps.event.addDomListener(controlUI, 'click', function () {
                $scope.details1.geometry.location = {d: $window._m.center.d + '', e: $window._m.center.e + ''};
                $scope.search();
            });

        }

        var homeControlDiv = document.createElement('div');
        var homeControl = new SearchInLocationDiv(homeControlDiv);
        homeControlDiv.index = 1;
        //-----/base actions

        // ---- watch
        $scope.$watch(function () {
            return $window._m;
        }, function (n, o) {
            $window._m.controls[google.maps.ControlPosition.TOP_RIGHT].push(homeControlDiv);
        });

        $scope.$watch('categories', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.search();
                $location.search('categories', $scope.categories);
            }
        }, true);
        $scope.$watch('startDate', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $location.search('startDate', $scope.startDate);
            }
        }, true);
        $scope.$watch('endDate', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $location.search('endDate', $scope.endDate);
            }
        }, true);
        $scope.$watch('details1.geometry.location', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $location.search('latitude', $scope.details1.geometry.location.d);
                $location.search('longitude', $scope.details1.geometry.location.e);
                moveMap();
                $scope.search();
            }
        });
        // ----/watch
    }])
    .controller('auth', ['$scope', 'User', function ($scope, User) {
        User.isAuth(function (data) {
            if (data.success) {
                $scope.isAuth = true;
                $scope.name = data.name;
            } else {
                $scope.isAuth = false;
            }
        });

    }]);