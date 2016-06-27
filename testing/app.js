var express = require('express');
var app = express();
var serv = require('http').Server(app);
var SAT = require('./Libs/SAT.js');
var $ = require('./Libs/jquery');
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server started.");

var SOCKET_LIST = {};
//Bron http://creativejs.com/2011/12/to-radians/index.html
// One degree in radians
var TO_RADIANS = Math.PI / 180;

// One radian in degrees
var TO_DEGREES = 180 / Math.PI;

var V = function(x, y) {
	return new SAT.Vector(x, y);
};

// Contructor for Polygon, made shorter for simplicity
var P = function(pos, points) {
	return new SAT.Polygon(pos, points);
};

// Contructor for Circle, made shorter for simplicity
var C = function(pos, r) {
	return new SAT.Circle(pos, r);
};

var Entity = function() {
	var self = {
		width: undefined,
		height: undefined,
		speed: undefined,
		polygon: undefined,
		playerID: undefined,
		teamID: undefined,
		solid: undefined,
		heavy: undefined,
	}
	self.update = function() {
		self.updatePosition();
	}
	self.updatePosition = function() {
		self.polygon.pos.x += self.spdX;
		self.polygon.pos.y -= self.spdY;
		self.polygon._recalc();
	}
	self.getDistance = function(pt) {
		return Math.sqrt(Math.pow(self.polygon.pos.x - pt.polygon.pos.x, 2) + Math.pow(self.polygon.pos.y - pt.polygon.pos.y, 2));
	}
	return self;
}

var Player = function(x, y, playerID, team) {
	var self = Entity();
	self.number = "" + Math.floor(10 * Math.random());
	self.lifes = 3;
	self.team = team;
	self.playerID = playerID;
	self.ishit = false;
	self.Cooldown = 60;
	self.CurrentCooldown = 60;
	self.speed = 10;
	self.istank = true;
	self.turnspeed = 180 * TO_RADIANS;
	self.polygon = P(V(x, y), [V(0, 0), V(self.width, 0), V(self.width, self.height), V(0, self.height)]);
	self.polygon.translate(-self.width / 2, -self.height / 2);

	var super_update = self.update;
	self.update = function() {
		self.updateSpd();
		super_update();

		if (self.pressingAttack) {
			self.shootBullet(self.mouseAngle);
		}
	}
	self.shootBullet = function(angle) {
		var b = Bullet(self.playerID, angle, self.polygon.pos.x, self.polygon.pos.y, self.team, self.playerID);
	}

	self.updateSpd = function() {
		if (self.pressingRight) {
			self.polygon.angle += 10*TO_RADIANS;
		}
		else if (self.pressingLeft) {
			self.polygon.angle -= 10*TO_RADIANS;
		}
		else {
			self.polygon.angle += 0;
		}

		if (self.pressingUp) {
			self.spdY = self.speed * Math.sin(self.polygon.angle);
			self.spdX = self.speed * Math.cos(self.polygon.angle);
		}
		else if (self.pressingDown) {
			self.spdY = -(self.speed * Math.sin(self.polygon.angle));
			self.spdX = -(self.speed * Math.cos(self.polygon.angle));
		}
		else {
			self.spdY = 0;
			self.spdX = 0;
		}
		self.polygon._recalc();
	}
	Player.list[playerID] = self;
	return self;
}
Player.list = {};
Player.onConnect = function(socket) {
	var player = Player(100, 100, socket.id, Player.list.length + 1);
	socket.on('keyPress', function(data) {
		if (data.inputId === 'left') {
			player.pressingLeft = data.state;
		}
		else if (data.inputId === 'right') {
			player.pressingRight = data.state;
		}
		else if (data.inputId === 'up') {
			player.pressingUp = data.state;
		}
		else if (data.inputId === 'down') {
			player.pressingDown = data.state;
		}
		else if (data.inputId === 'attack') {
			player.pressingAttack = data.state;
		}
		else if (data.inputId === 'mouseAngle') {
			player.mouseAngle = data.state;
		}
	});
}
Player.onDisconnect = function(socket) {
	delete Player.list[socket.id];
}
Player.update = function() {
	var pack = [];
	for (var i in Player.list) {
		var player = Player.list[i];
		player.update();
		pack.push({
			x: player.polygon.pos.x,
			y: player.polygon.pos.y,
			number: player.number
		});
	}
	return pack;
}

var Wall = function(x, y, length, width) {
	var self = Entity();
	self.solid = true;
	self.heavy = true;
	self.width = width;
	self.height = length;
	self.iswall = true;
	self.polygon = P(V(x, y), [V(0, 0), V(length, 0), V(length, width), V(0, width)]);

};
Wall.list = {};

function Bullet(parent, angle, x, y, team, playerID) {
	var self = Entity();
	self.parent = parent;
	self.id = Math.random();
	self.playerID = playerID;
	self.width = 10;
	self.height = 10;
	self.solid = true;
	self.isbullet = true;
	self.angle = angle;
	self.polygon = new P(V(x, y), [V(0, 0), V(self.width, 0), V(self.width, self.height), V(0, self.height)]);
	self.team = team;
	self.speed = 60;
	self.polygon.angle = angle;
	self.polygon.translate(-self.width / 2, -self.height / 2);
	self.polygon._recalc();
	var super_update = self.update;
	self.update = function() {
		if (self.timer++ > 100) {
			self.toRemove = true;
		}
		super_update();

		for (var i in Player.list) {
			var p = Player.list[i];
			if (self.getDistance(p) < 32 && self.parent !== p.playerID) {
				//handle collision. ex: hp--;
				self.toRemove = true;
			}
		}
	}
	Bullet.list[self.id] = self;
	return self;
}
Bullet.list = {};

Bullet.update = function() {
	var pack = [];
	for (var i in Bullet.list) {
		var bullet = Bullet.list[i];
		bullet.update();
		if (bullet.toRemove) {
			delete Bullet.list[i];
		}
		else {
			pack.push({
				x: bullet.polygon.pos.x,
				y: bullet.polygon.pos.y,
			});
		}
	}
	return pack;
}

var DEBUG = true;

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	Player.onConnect(socket);

	socket.on('disconnect', function() {
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});

});

setInterval(function() {
	var pack = {
		player: Player.update(),
		bullet: Bullet.update(),
	}

	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions', pack);
	}
}, 1000 / 25);
