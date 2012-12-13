
exports.version = '0.1.0';


exports.send_success = function (res, data) {
    res.writeHead(200, {"Content-Type": "application/json"});
    var output = { error: null, data: data };
    res.end(JSON.stringify(output) + "\n");
};


exports.send_failure = function (res, code, err) {
    res.writeHead(code, { "Content-Type" : "application/json" });
    res.end(JSON.stringify(err) + "\n");
};


exports.invalid_resource = function () {
    return { error: "invalid_resource",
             message: "the requested resource does not exist." };
};


exports.no_such_album = function () {
    return { error: "no_such_album",
             message: "The specified album does not exist" };
};

