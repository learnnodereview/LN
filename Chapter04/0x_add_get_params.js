
var http = require('http'),
    fs = require('fs'),
    url = require('url');


var s = http.createServer(
    function (req, res) {
        if (req.url == "/albums" && req.method.toLowerCase() == 'get') {
            process_get_albums(req, res);
        } else if (req.url.substr(0, 7) == '/albums') {
            process_get_album(req, res);
        } else {
            res.writeHead(404, { "Content-Type" : "application/json" });
            var resp = { error: "invalid_request", 
                         message: "The request resource '"
                                  + req.url + "' does not exist"};
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


function send_failure(res, err) {
    res.writeHead(500, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(err) + "\n");
}



function send_success(res, data) {
    res.writeHead(200, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(data) + "\n");
}

