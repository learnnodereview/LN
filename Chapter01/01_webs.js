var http = require("http");

function process_request(req, res) {
    var body = 'Thanks for calling!\n';
    res.writeHead(200, {
        'Content-Length': body.length,
        'Content-Type': 'text/plain'
    });
    res.end(body);
}

var s = http.createServer(process_request);
s.listen(8080);
