var express = require('express')
    , app = express()
    , http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);


server.listen(8080);

//app.use('/static', express.static(__dirname));
// routing
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/Index.html');
});

app.use('/pub', express.static('public'));
app.use('/Scripts', express.static('Scripts'));
app.use('/Libs', express.static('Libs'));
app.use('/CSS', express.static('CSS'));
app.use('/node_modules', express.static('node_modules'));
app.use('/Images', express.static('Images'));
app.use('/pages', express.static('pages'));


//met deze code *zou* GameData.js geladen moeten worden, maar het werkt nog niet als gepland.
/*
 app.get('/Scripts/GameData.js', function(req, res, next) {
 console.log("Trying to load GameData.js");
 res.sendFile(__dirname + '/testmap/index.html');
 });

 app.get('/Scripts/mystyle.css', function(req, res, next){
 console.log("Trying to load stylesheet");
 res.sendFile(__dirname + '/testmap/mystyle.css');
 });
 */


// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = ['room1', 'room2', 'room3'];
var roomsTest = [new Roomobject('room1'), new Roomobject('room2'), new Roomobject('room3')];
var users = [];
var EntityList = [];
var PlayerList = [];

function Roomobject(roomname) {

    this.roomName = roomname;
    this.users = [];
    this.ready = false;

}

function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}

function dataToConsole() {
    for (var room in roomsTest) {
        var obj = roomsTest[room];
        var users;
        for (var user in roomsTest[room].users) {
            console.log(roomsTest[room].users[user]);

        }

        console.log(obj.roomName + " " + users);

    }
    console.log();
}

var addUser = function (username) {
    this.ready = false;
    this.ID = guid();
    this.name = username;

    console.log("User added - ", this.ID, this.name);
}
io.sockets.on('connection', function (socket) {

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function (username) {
        // store the username in the socket session for this client
        socket.username = username;
        // store the room name in the socket session for this client
        socket.room = 'room1';
        socket.ready = false;
        // add the client's username to the global list
        usernames[username] = username;
        //addUserToRoom(username, 1);
        var user = new addUser(username);
        socket.emit('ID', user.ID);
        //roomsTest[0].users.push(username);
        roomsTest[0].users.push(user);
        // send client to room 1
        socket.join(roomsTest[0].roomName);

        // echo to client they've connected
        socket.emit('updatechat', 'SERVER', 'you have connected to room1');
        // echo to room 1 that a person has connected to their room
        socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
        socket.emit('updaterooms', rooms, 'room1');
        io.sockets.in(socket.room).emit('updateUsers', roomsTest[0].users);

        //some testing stuff


        for (var room in roomsTest) {
            var obj = roomsTest[room];
            console.log(obj.roomName + obj.users);
        }

        //end of testing stuff
    });


//TODO doe iets aan updateuser gebeuren...
    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('ready', function () {
        if (!socket.ready) {
            socket.ready = true;
            //socket.emit('joinGame');
            //console.log('player joined game.');
            socket.emit('isReady', true);
        } else {
            socket.ready = false;
            socket.emit('isReady', false);
        }
        console.log('ready called, ' + socket.ready + " " + socket.username);

    });

    socket.on('addroom', function (roomname) {
        var currentroom = socket.room;
        rooms.push(roomname);
        roomsTest.push(new Roomobject(roomname));
        socket.emit('updaterooms', rooms, currentroom);
        console.log("Current room of client: " + currentroom);
        console.log(rooms);
    });

    socket.on('switchRoom', function (newroom) {
        console.log("before switch room:")
        /*for (var room in roomsTest)
         {
         var userlist;
         var obj = roomsTest[room];
         for (var user in obj.users){
         userlist += obj.users[user];
         }


         console.log(obj.roomName +  obj.users[0]);

         }*/
        dataToConsole();
        console.log();
        var oldroom = socket.room;
        socket.leave(socket.room);
        socket.join(newroom);
        socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroom);
        //update roomobjects *** TODO create some methods, if time allows it
        var indexOldRoom = rooms.indexOf(oldroom);//getIndexRoom(oldroom);
        var indexNewRoom = rooms.indexOf(newroom);//getIndexRoom(newroom);
        //delete username from oldroom array + update userlist in old room
        roomsTest[indexOldRoom].users.splice(socket.username, 1);
        //deleteUserFromRoom(socket.user, indexOldRoom);
        io.sockets.in(socket.room).emit('updateUsers', roomsTest[indexOldRoom].users);
        console.log(roomsTest[indexOldRoom].users + " List users old room");
        //add username to newroom array + update userlist in new room
        roomsTest[indexNewRoom].users.push(socket.username);
        io.sockets.in(socket.room).emit('updateUsers', roomsTest[indexNewRoom].users);
        console.log(roomsTest[indexNewRoom].users + " List users new room");
        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has left this room');
        // update socket session room title
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
        console.log(socket.username + ' joined ' + newroom + " " + indexNewRoom + ' leaving ' + oldroom + " " + indexOldRoom);
        socket.emit('updaterooms', rooms, newroom);


        console.log("after: ");
        for (var room in roomsTest) {
            var obj = roomsTest[room];

            console.log(obj.roomName + obj.users);

        }
        console.log();


    });

    function addUserToRoom(user, indexRoom) {
        roomsTest[indexRoom].users.push(username);
    }

    function deleteUserFromRoom(user, indexRoom) {
        roomsTest[indexRoom].users.splice(user, 1);

    }

    function getIndexRoom(room) {
        index = -1;
        for (var i = 0, len = roomsTest.length; i < len; i++) {
            if (roomsTest[i].roomName === room) {
                index = i;
                return index;
            }
        }

    }

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        // remove the username from global usernames list
        delete usernames[socket.username];
        var indexRoom = rooms.indexOf(socket.room);
        var index = 0;
        try {
            index = roomsTest[indexRoom].users.indexOf(socket.username);
            roomsTest[indexRoom].users.splice(socket.username, 1);
        } catch (err) {
            console.log(err);
        }


        // update list of users in chat, client-side
        if (roomsTest[indexRoom] === undefined) {
            console.log("undefined user.");

        } else {
            io.sockets.in(socket.room).emit('updateUsers', roomsTest[indexRoom].users);
        }
        //io.sockets.emit('updateUsers', usernames);
        // echo globally that this client has left
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });

    var ID = 0;
    var entities = [];

    function getIndexEntities(entity) {
        var index;
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].ID == entity.ID) {
                index = i;
                break;
            }
            index = -1;
        }
        return index;
    }

    socket.on('updateEntity', function (entity) {
        var index = getIndexEntities(entity);
        entities[index] = entity;
        io.sockets.in(socket.room).emit('updateEntity', entity);
    });
    socket.on('removeEntity', function (entity) {
        var index = getIndexEntities(entity);
        if (index > -1) {
            entities.splice(index, 1);
        }

        io.sockets.in(socket.room).emit('removeEntity', entity);
    });
    socket.on('addEntity', function (entity) {
        entity.ID = ID;
        entities.push(entity);
        io.sockets.in(socket.room).emit('addEntity', entity);
        ID++;
    });

    socket.on('updateEntityList', function (entities) {
        EntityList = entities;

        //entity list gets globally saved on the server.
        console.log('updateEntityList updated' + JSON.stringify(EntityList));

    });

    socket.on('getEntityList', function () {
        if (entities.length > 0) {
            socket.emit('LatestUpdatedEntityList', entities);
        }

        console.log('getEntityList called.');
    });

    socket.on('getPlayerList', function () {
        if (PlayerList.length > 0) {
            socket.emit('LatestUpdatedPlayerList', PlayerList);
            console.log(JSON.stringify(PlayerList));
        }
        //socket.emit('LatestUpdatedPlayerList', PlayerList);
        console.log('getPlayerList called.');
    });


    socket.on('updatePlayerList', function (playerList) {
        //	if(playerList.length <= 4) {
        PlayerList = playerList;
        console.log("Playerlist updated. : " + JSON.stringify(PlayerList));
        socket.emit('updatedPlayerList', true);
        //playerlist gets globally saved.
        //	} else {
        //		console.log("Playerlist not updated. : " + PlayerList);
        //		socket.emit('updatedPlayerList', false);
        //}


    });


});
