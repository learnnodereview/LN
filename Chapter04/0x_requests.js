
var http = require('http');


var albums = [ 
    "italy2012",
    "japan2010",
    "australia2010"
];


var s = http.createServer(
    function (req, res) {
        if (req.url == "/albums.json" && req.method.toLowerCase() == 'get') {
            process_get_albums(req, res);
        } else if (req.url.substr(0, 8) == '/albums/') {
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





function process_get_albums(req, res) {
    console.log("REQUEST: " + req.method + " " + req.url);
    res.writeHead(200, { "Content-Type" : "application/json" });
    var resp = { error: null,
                 data: { albums: albums } };
    res.end(JSON.stringify(resp) + "\n");
}

function process_get_album(req, res) {
    var album = req.url.substr(7); // get the album name
    console.log("Asked for album \"" + album + "\"");
    res.writeHead(200, { "Content-Type" : "application/json" });
    var resp = { error: null,
                 data: "OK" };
    res.end(JSON.stringify(resp) + "\n");
}