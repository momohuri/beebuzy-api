'use strict';

/* Filters */

angular.module('myApp.filters', []).
    filter('truncateHTML', function () {
        return function (text, length, end) {
            if (isNaN(length))
                length = 10;

            if (end === undefined)
                end = "...";
            if(text === undefined) return '';
            text = text.replace(/<\/?[^>]+(>|$)/g, "");
            if (text.length <= length || text.length - end.length <= length) {
                return text;
            }
            else {
                return String(text).substring(0, length - end.length) + end;
            }

        };
    });


