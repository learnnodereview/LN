
var async = require("async");

async.parallel({

    numbers: function (callback) {
        setTimeout(function () {
            callback(null, [ 1, 2, 3 ]);
        });
    },
    strings: function (callback) {
        setTimeout(function () {
            callback(null, [ "a", "b", "c" ]);
        });
    }
},
function (err, results) {
    console.log(results);
});
