/*global require, console, exports:true, global:true */
var fs = require("fs"),
    express = require("express"),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),

    router = express.Router(),

    async = require("async"),
    underscore = require("underscore"),
    mime = require("mime"),

    ritoAPI = require("./ritoAPI");

global.APP_DIR = __dirname;
process.stdin.setEncoding('utf8');

process.stdin.on('readable', function () {
    var chunk = process.stdin.read();
    if (chunk !== null) {
        var lowercaseChunk = chunk.toLowerCase().trim();
        if (lowercaseChunk === "r" || lowercaseChunk === "reset") {
            process.stdout.write('Recieved Reset command!');
            process.exit(0);
        }
    }
});
app.use(express.static(__dirname + "/public"));

app.set('port', 8021);

app.get('/js/libs/underscore.js', function (req, res) {
    var dir = __dirname + "/node_modules/underscore/underscore.js";
    res.type(mime.lookup(dir));
    fs.readFile(dir, {
        'encoding': "utf8"
    }, function (err, data) {
        if (!err) {
            res.status(200).send(data);
        } else {
            res.status(500).send(err);
            throw err;
        }
    });
});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function (msg) {
        console.log('a user disconnected')
    })
});

ritoAPI.setup(app, io, function () {
    http.listen(app.get('port'), function () {
        console.info('Server started on ' + app.get('port') + '.');
    });
});