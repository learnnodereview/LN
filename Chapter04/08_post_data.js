
var http = require('http'),
    fs = require('fs'),
    url = require('url');


function load_album_list(callback) {
    // we will just assume that any directory in our 'albums'
    // subfolder is an album.
    fs.readdir(
        "albums",
        function (err, files) {
            if (err) {
                callback({ error: "file_error",
                           message: JSON.stringify(err) });
                return;
            }

            var only_dirs = [];

            (function iterator(index) {
                if (index == files.length) {
                    callback(null, only_dirs);
                    return;
                }

                fs.stat(
                    "albums/" + files[index],
                    function (err, stats) {
                        if (err) {
                            callback({ error: "file_error",
                                       message: JSON.stringify(err) });
                            return;
                        }
                        if (stats.isDirectory()) {
                            var obj = { name: files[index] };
                            only_dirs.push(obj);
                        }
                        iterator(index + 1)
                    }                    
                );
            })(0);
        }
    );
}

function load_album(album_name, page, page_size, callback) {
    // we will just assume that any directory in our 'albums'
    // subfolder is an album.
    fs.readdir(
        "albums/" + album_name,
        function (err, files) {
            if (err) {
                if (err.code == "ENOENT") {
                    callback(no_such_album());
                } else {
                    callback({ error: "file_error",
                               message: JSON.stringify(err) });
                }
                return;
            }

            var only_files = [];
            var path = "albums/" + album_name + "/";

            (function iterator(index) {
                if (index == files.length) {
                    var ps;
                    // slice fails gracefully if params are out of range
                    ps = only_files.splice(page * page_size, page_size);
                    var obj = { short_name: album_name,
                                photos: ps };
                    callback(null, obj);
                    return;
                }

                fs.stat(
                    path + files[index],
                    function (err, stats) {
                        if (err) {
                            callback({ error: "file_error",
                                       message: JSON.stringify(err) });
                            return;
                        }
                        if (stats.isFile()) {
                            var obj = { filename: files[index], desc: files[index] };
                            only_files.push(obj);
                        }
                        iterator(index + 1)
                    }                    
                );
            })(0);
        }
    );
}



function do_rename(old_name, new_name, callback) {

    // rename the album folder.
    fs.rename(
        "albums/" + old_name,
        "albums/" + data.album_name,
        callback);
}




function handle_incoming_request(req, res) {

    // parse the query params into an object and get the path
    // without them. (2nd param true = parse the params).
    req.parsed_url = url.parse(req.url, true);
    var core_url = req.parsed_url.pathname;

    // test this fixed url to see what they're asking for
    if (core_url == '/albums.json' && req.method.toLowerCase() == 'get') {
        handle_list_albums(req, res);
    } else if (core_url.substr(core_url.length - 12)  == '/rename.json'
               && req.method.toLowerCase() == 'post') {
        handle_rename_album(req, res);
    } else if (core_url.substr(0, 7) == '/albums'
               && core_url.substr(core_url.length - 5) == '.json'
               && req.method.toLowerCase() == 'get') {
        handle_get_album(req, res);
    } else {
        send_failure(res, 404, invalid_resource());
    }
}

function handle_list_albums(req, res) {
    load_album_list(function (err, albums) {
        if (err) {
            send_failure(res, 500, err);
            return;
        }

        send_success(res, { albums: albums });
    });
}

function handle_get_album(req, res) {

    // get the GET params
    var getp = req.parsed_url.query;
    var page_num = getp.page ? getp.page : 0;
    var page_size = getp.page_size ? getp.page_size : 1000;

    if (isNaN(parseInt(page_num))) page_num = 0;
    if (isNaN(parseInt(page_size))) page_size = 1000;

    // format of request is /albums/album_name.json
    var core_url = req.parsed_url.pathname;

    var album_name = core_url.substr(7, core_url.length - 12);
    load_album(
        album_name,
        page_num,
        page_size,
        function (err, album_contents) {
            if (err && err.error == "no_such_album") {
                send_failure(res, 404, err);
            }  else if (err) {
                send_failure(res, 500, err);
            } else {
                send_success(res, { album_data: album_contents });
            }
        }
    );
}


function handle_rename_album(req, res) {

    // 1. Get the album name from the URL
    var core_url = req.parsed_url.pathname;
    var parts = core_url.split('/');
    if (parts.length != 4) {
        send_failure(res, invalid_resource(core_url), 404);
        return;
    }

    var album_name = parts[2];

    // 2. get the POST data for the request. this will have the JSON
    // for the new name for the album.
    var json_body = '';
    req.on(
        'data',
        function (data) {
            json_body += data;
        }
    );

    // 3. when we have all the post data, make sure we have valid
    //    data and then try to do the rename.
    req.on(
        'end',
        function () {
            // did we get a valid body?
            if (json_body) {
                try {
                    var album_data = JSON.parse(json_body);
                    if (!album_data.album_name) {
                       send_failure(res, missing_data('album_name'), 403);
                       return;
                    }
                } catch (e) {
                    // got a body, but not valid json
                    send_failure(res, bad_json(), 403);
                    return;
                }

                // we have a proposed new album name!
                do_rename(
                    album_name,            // old
                    album_data.album_name, // new
                    function (err, results) {
                        if (err && err.code == "ENOENT") {
                            send_failure(res, no_such_album(), 403);
                            return;
                        } else if (err) {
                            send_failure(res, file_error(err), 500);
                            return;
                        }
                        send_success(res, null);
                    }
                );
            } else {
                send_failure(res, bad_json(), 403);
                res.end();
            }
        }
    );


}




function send_success(res, data) {
    res.writeHead(200, {"Content-Type": "application/json"});
    var output = { error: null, data: data };
    res.end(JSON.stringify(output) + "\n");

}


function send_failure(res, code, err) {
    res.writeHead(code, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(err) + "\n");
}


function file_error(err) {
    var msg = "There was a file error on the server: " + err.message;
    return { error: "server_file_error", message: msg };
}


function invalid_resource(url) {
    var msg = url
        ? "the requested resource (" + url + ") does not exist."
        : "the requested resource does not exist."
    return { error: "invalid_resource", message: msg };
}

function no_such_album() {
    return { error: "no_such_album",
             message: "The specified album does not exist" };
}


function missing_data (missing) {
    var msg = missing
        ? "Your request is missing: '" + missing + "'"
        : "Your request is missing some data.";
    return { error: "missing_data", message: msg };
}

function bad_json() {
    return { error: "invalid_json",
             message: "the provided data is not valid JSON" };
}

var s = http.createServer(handle_incoming_request);
s.listen(8080);

