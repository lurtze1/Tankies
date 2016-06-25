var http = require('http');
var server = http.createServer( handler );
server.listen(8080);
console.log("listening on port 8080");

function handler( request, response ) {
    response.writeHead(200 , { "Content-Type": "text/plain"});
    response.write("Hello World");
response.end();
console.log("response sent..");
};

var io = require('socket.io').listen(server);

io.sockets.on("connection", function(socket) {
    console.log("user connected");
    socket.on("message", function (data) {
        socket.broadcast.emit("message", data); //to all other connected clients
        //io.socket.emit("message", data); //to all connected clients
    });
});
