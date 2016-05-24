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

var socket = io.connect('http://localhost:8080');
// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = ['room1'];
var roomsTest = [new Roomobject('room1')];
var users = [];
var EntityList;
var PlayerList;


function Roomobject(roomname) {
	this.roomName = roomname;
	this.users = [];
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

function switchRoom(oldindex, newindex, userindex) {
	var toMove = roomsTest[oldindex].users[userindex];
	roomsTest[oldindex].users.splice(0, 1);
	roomsTest[newindex].users.push(toMove);
}

function getIndex(roomname) {
	return roomsTest.map(function(a) { return a.roomName;}).indexOf(roomname);
}

function userIndex(username, roomindex) {
	return roomsTest[roomindex].users.map(function(a) {return a.name;}).indexOf(username);
}

function contentRooms(){
	for (var i=0; i<roomsTest.length; i++) {
		console.log("roomname: " + roomsTest[i].roomName);
		for (var ii=0; ii<roomsTest[i].users.length; ii++) {
			console.log("user: " + roomsTest[i].users[ii].name + " ID: " + roomsTest[i].users[ii].ID);
		}
	}
}


var addUser = function addUser(username) {
	this.ready = false;
	this.ID = guid();
	socket.ID = this.ID;
	this.name = username;
	console.log("User added - ", this.ID, this.name);
}

io.sockets.on('connection', function (socket) {

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'room1';
		socket.ready = false;
		// add the client's username to the global list
		usernames[username] = username;
		//addUserToRoom(username, 1);
		var user = new addUser(username);
		//roomsTest[0].users.push(username);
		roomsTest[0].users.push(user);
		// send client to room 1
		socket.join(roomsTest[0].roomName);
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		socket.emit('ID', socket.ID);
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'room1');
		io.sockets.in(socket.room).emit('updateUsers', roomsTest[0].users );

		//some testing stuff



		//end of testing stuff
	});

	socket.on('startGame', function (){
		console.log('startGame aangeroepen.')
		io.sockets.in(socket.room).emit('joinGame');
	});

//TODO doe iets aan updateuser gebeuren...
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('isReady', function(readyOrNot){
		if(!socket.ready){
			socket.ready = true;
			socket.emit('isReady', true);
		} else {
			socket.ready = false;
			socket.emit('isReady', false);
		}
	});

	socket.on('addroom', function (roomname) {
		var currentroom = socket.room;
		rooms.push(roomname);
		roomsTest.push(new Roomobject(roomname));
		socket.emit('updaterooms', rooms, currentroom);
		console.log("Current room of client: " + currentroom);
		console.log(rooms);
	});

	socket.on('switchRoom', function(newroom){
		console.log("before switch room:")
		contentRooms();

		console.log();

		var oldroom = socket.room;
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		//update roomobjects *** TODO create some methods, if time allows it
		var indexOldRoom = getIndex(oldroom);
		var indexNewRoom = getIndex(newroom);
		var usrIndex = userIndex(socket.username, indexOldRoom);
		//delete username from oldroom array + update userlist in old room
		//roomsTest[indexOldRoom].users.splice(socket.username, 1);
		switchRoom(indexOldRoom, indexNewRoom, usrIndex);
		//deleteUserFromRoom(socket.user, indexOldRoom);
		io.sockets.in(socket.room).emit('updateUsers', roomsTest[indexOldRoom].users);
		console.log(roomsTest[indexOldRoom].users + " List users old room");
		//add username to newroom array + update userlist in new room
		//roomsTest[indexNewRoom].users.push(socket.username);
		io.sockets.in(socket.room).emit('updateUsers', roomsTest[indexNewRoom].users);
		console.log(roomsTest[indexNewRoom].users + " List users new room");
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		console.log(socket.username + ' joined ' + newroom + " " + indexNewRoom + ' leaving ' + oldroom + " "  + indexOldRoom);
		socket.emit('updaterooms', rooms, newroom);


		console.log("after: ");
		contentRooms();


	});

	function addUserToRoom(user, indexRoom){
		roomsTest[indexRoom].users.push(username);
	}

	function deleteUserFromRoom(user, indexRoom){
		roomsTest[indexRoom].users.splice(user, 1);

	}

	function getIndexRoom(room) {
		index = -1;
		for(var i = 0, len = roomsTest.length; i < len; i++) {
			if (roomsTest[i].roomName === room) {
				index = i;
				return index;
			}
		}

	}

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		var indexRoom = rooms.indexOf(socket.room);
		var index = 0;
		try {
			index = roomsTest[indexRoom].users.indexOf(socket.username);
			roomsTest[indexRoom].users.splice(socket.username, 1);
		} catch(err) {
			console.log(err);
		}


		// update list of users in chat, client-side
		// TODO comment this line back
		//io.sockets.in(socket.room).emit('updateUsers', roomsTest[indexRoom].users );

		//io.sockets.emit('updateUsers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});


	socket.on('updateEntityList', function(entityList){
		EntityList = entityList;

		//entity list gets globally saved on the server.
	});

	socket.on('getEntityList', function(){
		if(arrayName.length > 0){
			socket.emit('LatestUpdatedEntityList', EntityList);
			//send back the current global variable of the entitylist.
		}else{
			//send error or send nothing at all?
		}

	});
	socket.on('getPlayerList', function(){
		socket.emit('LatestUpdatedPlayerList', PlayerList);
	});


	socket.on('updatePlayerList', function(playerList){
		if(playerList.length <= 4) {
			PlayerList = playerList;
			console.log("Playerlist updated. : " + PlayerList);
			socket.emit('updatedPlayerList', true);
			//playerlist gets globally saved.
		} else {
			console.log("Playerlist not updated. : " + PlayerList);
			socket.emit('updatedPlayerList', false);
		}


	});





});
