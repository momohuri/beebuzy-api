var glob = require('glob');
var path = require('path');

var load = function (options, callback) {

    options = options || {};
    options.extension = options.extension || '.js';
    var controllers = {};

    var files = glob.sync('*' + options.extension, {cwd: __dirname});
    for(var i in files) {
        if (files[i] != path.basename(__filename)) {
            var key = path.basename(files[i], options.extension);
            key = key.charAt(0).toUpperCase() + key.slice(1);

            controllers[key] = require(__dirname + '/' + files[i]);
        }
    }

    return controllers;
};

module.exports = load();
module.exports.load = load;