
var fs = require('fs');
var async = require('async');


function load_file_contents(path, callback) {
    fs.open(path, 'r', function (err, f) {
        if (err) {
            callback(err);
            return;
        } else if (!f) {
            callback({ error: "invalid_handle",
                       message: "bad file handle from fs.open"});
            return;
        }
        fs.fstat(f, function (err, stats) {
            if (err) {
                callback(err);
                return;
            }
            if (stats.isFile()) {
                var b = new Buffer(10000);
                fs.read(f, b, 0, 10000, null, function (err, br, buf) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    fs.close(f, function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(null, b.toString('utf8', 0, br));
                    });
                });
            } else {
                calback({ error: "not_file",
                          message: "Can't load directory" });
                return;
            }
        });
    });
}



function load_file_contents2(path, callback) {

    async.waterfall([
        function (callback) {
            // the data passed to this function, the file handle
            // is passed as a parameter to the next function in 
            // the waterfall!!
            fs.open(path, 'r', callback);
        },
        function (f, callback) {
            fs.fstat(f, function (err, stats) {
                if (err) 
                    callback(err);
                else
                    callback(null, f, stats);
            });
        },
        function (f, stats, callback) {
            if (stats.isFile()) {
                var b = new Buffer(10000);
                fs.read(f, b, 0, 10000, null, function (err, br, buf) {
                    if (err)
                        callback(err);
                    else
                        callback(null, f, b.toString('utf8', 0, br));
                });
            } else {
                calback({ error: "not_file",
                          message: "Can't load directory" });
            }
        },
        function (f, contents, callback) {
            fs.close(f, function (err) {
                if (err)
                    callback(err);
                else
                    callback(null, contents);
            });
        }
    ]
      // this is called after all have executed in success
      // case, or as soon as there is an error.
    , function (err, file_contents) {
        callback(err, file_contents);
    });
}




load_file_contents(
    "/Users/marcw/test.txt", 
    function (err, contents) {
        if (err)
            console.log(err);
        else
            console.log(contents);
    }
);

load_file_contents2(
    "/Users/marcw/test.txt", 
    function (err, contents) {
        if (err)
            console.log(err);
        else
            console.log(contents);
    }
);