
var async = require("async");

async.auto({

    numbers: function (callback) {
        setTimeout(function () {
            callback(null, [ 1, 2, 3 ]);
        });
    },
    strings: function (callback) {
        setTimeout(function () {
            callback(null, [ "a", "b", "c" ]);
        });
    },
    assemble: [ 'numbers', 'strings', function (callback, thus_far) {
        callback(null, {
            numbers: thus_far.numbers.join(",  "),
            strings: "'" + thus_far.strings.join("',  '") + "'"
        });
    }]
},
function (err, results) {
    if (err) 
        console.log(err);
    else
        console.log(results);
}

);

