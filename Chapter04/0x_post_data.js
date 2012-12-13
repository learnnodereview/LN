
var http = require('http'),
    fs = require('fs'),
    url = require('url');


var s = http.createServer(
    function (req, res) {
        if (req.url == "/albums.json" && req.method.toLowerCase() == 'get') {
            process_get_albums(req, res);
        } else if (req.url.substr(0, 12) == '/albums.json') {
            process_get_album(req, res);
        } else if (req.url.substr(req.url.length - 12)  == '/rename.json') {
            process_rename_album(req, res);
        } else {
            res.writeHead(404, { "Content-Type" : "application/json" });
            var resp = invalid_request(req.url); 
            res.end(JSON.stringify(resp) + "\n");
        }
    }
);


s.listen(8080);



function generate_album_list(callback) {
    // we will just assume that any file  in our 'albums'
    // subfolder is an album folder.
    fs.readdir(
        "albums",
        function (err, files) {
            if (err) {
                callback(err);
                return;
            }

            var results = [];
            (function iterator(index) {
                if (index == files.length) {
                    callback(null, results);
                    return;
                }
                fs.stat(
                    "albums/" + files[index],
                    function (err, stats) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        if (stats.isDirectory())
                            results.push(files[index]);
                        iterator(index + 1);
                    }
                );
            }) (0);
        }
    );
}

function get_album_contents(album, page_num, page_size, callback) {

    if (!album) {
        callback({ error: "invalid_album", 
                   message: "There is no album \"" + album + "\"" });
        return;
    }

    // just assume that any file is a picture in our
    // album
    fs.readdir(
        "albums/" + album, 
        function (err, files) {
            if (err) {
                callback(err);
                return;
            }

            var results = [];
            (function iterator(index) {
                if (index == files.length) {
                    var start = page_num * page_size;
                    var send_back = results.splice(start, page_size);
                    callback(null, send_back);
                    return;
                }
                fs.stat(
                    "albums/" + album + "/" + files[index],
                    function (err, stats) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        if (stats.isFile())
                            results.push(files[index]);
                        iterator(index + 1);
                    }
                );
            }) (0);
        }
    );
}


function process_get_albums(req, res) {
    console.log(req.method + " /albums");
    generate_album_list(
        function (err, albums) {
            if (err) {
                console.log("Error getting albums: " + err);
                send_failure(res, err);
                return;
            }
            var resp = { error: null,
                         data: { albums: albums } };
            send_success(res, resp);
        }
    );
}

function process_get_album(req, res) {

    var album = req.url.substr(8); // get the album name
    if (album.indexOf('?') != -1)
        album = album.substr(0, album.indexOf('?'));

    console.log(req.method + " album named: \"" + album + "\"");

    // get the GET query params.
    var query = url.parse(req.url, true).query;
    var page_num = query.page ? query.page : 0;
    var page_size = query.page_size ? query.page_size : 1000;

    if (isNaN(parseInt(page_num))) page_num = 0;
    if (isNaN(parseInt(page_size))) page_size = 1000;

    get_album_contents(
        album,
        page_num,
        page_size,
        function (err, photos) {
            if (err) {
                send_failure(res, err);
                return;
            }

            var resp = { error: null,
                         data: { album_name: album,
                                 album_photos: photos } };
            send_success(resp);
        }
    );
}


function send_failure(res, err, code) {
    if (!code) code = 503;
    res.writeHead(code, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(err) + "\n");
}



function send_success(res, data) {
    res.writeHead(200, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(data) + "\n");
}




function process_rename_album(req, res) {
    if (req.method.toLowerCase() == 'post') {
        add_album_comment(req, res);
    } else {
        send_failure(res, { error: "unsupported_operation", 
                            message: "You can't do that" }, 403);
    }
}



function add_album_comment(req, res) {

    // get the album name
    var parts = req.url.split('/');
    if (parts.length != 3) {
        send_failure(res, invalid_request(req.url), 404);
        return;
    }

    var album_name = parts[1];

    // now let's the POST data for the request. this will have the JSON for
    // the new name for the album.
    var body = '';
    req.on(
        'data',
        function (data) {
            body += data;
        }
    );

    req.on(
        'end',
        function () {
            // did we get a valid body?
            if (body) {
                try {
                    var album_data = JSON.parse(body);
                    rename_album(res, album_name, album_data);
                } catch (e) {
                    // got a body, but not valid json
                    send_failure(res, bad_json(), 403);
                }
            } else {
                send_failure(res, bad_json(), 403);
                res.end();
            }
        }
    );
}


function rename_album (res, old_name, data) {
    if (!data.album_name) {
        send_failure(res, missing_data('album_name'), 403);
        return;
    }

    // rename the album folder.
    fs.rename(
        "albums/" + old_name,
        "albums/" + data.album_name,
        function (err, results) {
            if (err) {
                send_failure(res, err);
                return;
            }

            send_success(res, { error: null });
        }
    );
}



function missing_data (missing) {
    var msg = missing
        ? "Your request is missing: '" + missing + "'"
        : "Your request is missing some data.";
    return { error: "missing_data", message: msg };
}


function bad_json() {
    return { error: "invalid_json",
             message: "You sent invalid JSON with the request" };
}


function invalid_request (url) {
    return { error: "invalid_request", 
             message: "The requested resource '"
             + url + "' does not exist" };
}