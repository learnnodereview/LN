
var http = require('http'),
    fs = require('fs');


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

function get_album_contents(album, callback) {

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
                    callback(null, results);
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
            res.writeHead(200, { "Content-Type" : "application/json" });
            var resp = { error: null,
                         data: { albums: albums } };
            res.end(JSON.stringify(resp) + "\n");
        }
    );
}

function process_get_album(req, res) {

    var album = req.url.substr(8); // get the album name
    console.log(req.method + " album named: \"" + album + "\"");

    get_album_contents(
        album,
        
        function (err, photos) {
            if (err) {
                send_failure(res, err);
                return;
            }
            res.writeHead(200, { "Content-Type" : "application/json" });
            var resp = { error: null,
                         data: { album_name: album,
                                 album_photos: photos } };
            res.end(JSON.stringify(resp) + "\n");
        }
    );
}


function send_failure(res, err) {

    res.writeHead(500, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(err) + "\n");
}

