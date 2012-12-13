
var http = require('http'), qs = require('querystring');

function handle_incoming_request(req, res) {
    var body = '';
    req.on(
        'data',
        function (data) {
            body += data;
        }
    );

    // 3. when we have all the post data, make sure we have valid
    //    data and then try to do the rename.
    req.on(
        'end',
        function () {
            if (req.method.toLowerCase() == 'post') {
                var POST_data = qs.parse(body);
                console.log(POST_data);
            }
            res.writeHead(200, { "Content-Type" : "application/json" });
            res.end(JSON.stringify( { error: null }) + "\n");
        }
    );

}


var s = http.createServer(handle_incoming_request);

s.listen(8080);

