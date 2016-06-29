var express = require('express');
var app = express();
var serv = require('http').Server(app);
var SAT = require('./Libs/SAT.js');
var $ = require('./Libs/jquery');
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});
app.use('/', express.static(__dirname + '/'));

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
var maxplayers = 2;
var Games = [];
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	if (Games.length < 1 || Object.keys(Games[Games.length - 1].playerlist).length >= maxplayers) {
		var newgame = new Game();
		newgame.playerconnect(socket);
		socket.on('disconnect', function() {
			delete SOCKET_LIST[socket.id];
			newgame.playerdisconnect(socket);
		});
		Games.push(newgame);
	}
	else {
		for (var i = 0; i < Games.length; i++) {
			var possiblegame = Games[i];
			if (Object.keys(possiblegame.playerlist).length < maxplayers) {
				possiblegame.playerconnect(socket);
				socket.on('disconnect', function() {
					possiblegame.playerdisconnect(socket);
					if (Object.keys(possiblegame.playerlist).length <= 0) {
						var index = Games.indexOf(possiblegame);
						if (index > -1) {
							Games.splice(index, 1);
						}
					}
					delete SOCKET_LIST[socket.id];
				});
			}
			if (Object.keys(possiblegame.playerlist).length >= maxplayers) {
				possiblegame.dostartgame();
				var playerlistlobby = possiblegame.playerlist;
				for (var i in playerlistlobby) {
					var player = playerlistlobby[i];
					var sockets = SOCKET_LIST[player.playerID];
						sockets.emit("WaitingDone");
				};
			}
		}

	}
});
var Game = function() {
	var playerlist = {};
	var bulletlist = {};
	var walllist = {};
	var gameloop;
	var Entity = function() {
		var self = {
			width: undefined,
			height: undefined,
			speed: undefined,
			polygon: undefined,
			playerID: undefined,
			solid: undefined,
			heavy: undefined,
		};
		self.update = function() {
			self.updatePosition();
		};
		self.updatePosition = function() {
			self.polygon.pos.x += self.spdX;
			self.polygon.pos.y -= self.spdY;
			self.polygon._recalc();
		};
		self.getDistance = function(pt) {
			return Math.sqrt(Math.pow(self.polygon.pos.x - pt.polygon.pos.x, 2) + Math.pow(self.polygon.pos.y - pt.polygon.pos.y, 2));
		};
		return self;
	};

	var Player = function(x, y, playerID, angle) {
		var self = Entity();
		self.number = "" + Math.floor(10 * Math.random());
		self.playerID = playerID;
		self.ishit = false;
		self.Cooldown = 60;
		self.CurrentCooldown = 60;
		self.speed = 2;
		self.width = 20;
		self.height = 20;
		self.solid = true;
		self.istank = true;
		self.toRemove = false;
		self.reloadtime = 24;
		self.cooldown = 4;
		self.turnspeed = 5 * TO_RADIANS;
		self.polygon = P(V(x, y), [
			V(0, 0), V(self.width, 0), V(self.width + 10, self.height / 2), V(self.width, self.height),
			V(0, self.height)
		]);
		self.polygon.translate(-self.width / 2, -self.height / 2);
		if (angle) {
			self.polygon.angle = angle;
		}
		self.polygon._recalc();
		var super_update = self.update;
		self.update = function() {
			self.updateSpd();
			super_update();
			if (self.cooldown > 0) {
				self.cooldown--;
			}
			if (self.pressingAttack && self.cooldown === 0) {
				self.shootBullet();
				for (var i in playerlist) {
					var player = playerlist[i];
					var socket = SOCKET_LIST[player.playerID];
					socket.emit('Shoot');
				}
			}
			Collision(self, bulletlist);
			Collision(self, walllist);
			Collision(self, playerlist);
		};
		self.shootBullet = function() {
			self.cooldown = self.reloadtime;
			Bullet(self.playerID, self.polygon.angle, self.polygon.pos.x, self.polygon.pos.y, self.playerID);
		};

		self.updateSpd = function() {
			if (self.pressingRight) {
				self.polygon.angle += self.turnspeed;
			}
			else if (self.pressingLeft) {
				self.polygon.angle -= self.turnspeed;
			}
			else {
				self.polygon.angle += 0;
			}
			if (self.polygon.angle < 0) {
				self.polygon.angle += 360 * TO_RADIANS;
			}
			if (self.polygon.angle > 360) {
				self.polygon.angle -= 360 * TO_RADIANS;
			}

			if (self.pressingUp) {
				self.spdY = -(self.speed * Math.sin(self.polygon.angle));
				self.spdX = self.speed * Math.cos(self.polygon.angle);
			}
			else if (self.pressingDown) {
				self.spdY = (self.speed * Math.sin(self.polygon.angle));
				self.spdX = -(self.speed * Math.cos(self.polygon.angle));
			}
			else {
				self.spdY = 0;
				self.spdX = 0;
			}
			self.polygon._recalc();
		};
		playerlist[playerID] = self;
		return self;
	};
	Player.onConnect = function(socket) {
		var playerlistlength = Object.keys(playerlist).length;
		var player;
		if (playerlistlength === 0) {
			player = Player(100, 100, socket.id);
		}
		else if (playerlistlength === 1) {
			player = Player(300, 300, socket.id, 180 * TO_RADIANS);
		}
		else if (playerlistlength === 2) {
			player = Player(100, 300, socket.id, 180 * TO_RADIANS);
		}
		else if (playerlistlength === 3) {
			player = Player(300, 1+00, socket.id, 180 * TO_RADIANS);
		}
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
		});
	};
	Player.onDisconnect = function(socket) {
		delete playerlist[socket.id];
	};
	Player.update = function() {
		var pack = [];
		for (var i in playerlist) {
			var player = playerlist[i];
			if (player.toRemove) {
				var socket = SOCKET_LIST[player.playerID];
				socket.emit('Defeat', '/client/Lose.html');
				delete playerlist[i];
			}
			player.update();
			pack.push({
				polygon: player.polygon,
				number: player.number
			});
		}
		return pack;
	};

	var Wall = function(x, y, length, width) {
		var self = Entity();
		self.id = Math.random();
		self.solid = true;
		self.heavy = true;
		self.width = width;
		self.height = length;
		self.iswall = true;
		self.polygon = P(V(x, y), [V(0, 0), V(length, 0), V(length, width), V(0, width)]);
		self.polygon._recalc();
		walllist[self.id] = self;
		return self;

	};
	Wall.update = function() {
		var pack = [];
		for (var i in walllist) {
			var wall = walllist[i];

			pack.push({
				polygon: wall.polygon
			});

		}
		return pack;
	};
	Wall(0, 0, 480, 20);
	Wall(20, 480, 500, 20);
	Wall(480, 0, 20, 480);
	Wall(0, 20, 20, 500);

	function Bullet(parent, angle, x, y, playerID) {
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
		self.speed = 5;
		self.polygon.angle = angle;
		self.polygon.translate(-self.width / 2, -self.height / 2);
		self.polygon._recalc();
		var super_update = self.update;
		self.update = function() {
			self.updateSpd();
			Collision(self, walllist);
			if (self.timer++ > 100) {
				self.toRemove = true;
			}
			super_update();
		};
		self.updateSpd = function() {
			self.spdY = -(self.speed * Math.sin(self.polygon.angle));
			self.spdX = self.speed * Math.cos(self.polygon.angle);
			self.polygon._recalc();
		};

		bulletlist[self.id] = self;
		return self;
	}

	Bullet.update = function() {
		var pack = [];
		for (var i in bulletlist) {
			var bullet = bulletlist[i];
			bullet.update();
			if (bullet.toRemove) {
				delete bulletlist[i];
			}
			else {
				pack.push({
					polygon: bullet.polygon
				});
			}
		}
		return pack;
	};
	function Collision(me, entities) {
		for (var iii = 0; iii < 2; iii++) {
			var response = new SAT.Response();
			// Naively check for collision between all pairs of entities
			// E.g if there are 4 entities: (0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)
			for (var i in entities) {
				var b = entities[i];
				var collided;
				var aData = me.polygon;
				aData._recalc();
				var bData = b.polygon;
				bData._recalc();
				if (me.istank && b.istank && me.playerID != b.playerID) {
					collided = SAT.testPolygonPolygon(aData, bData, response);
				}
				if (me.istank && b.iswall) {
					collided = SAT.testPolygonPolygon(aData, bData, response);
				}
				if (me.isbullet && b.iswall) {
					collided = SAT.testPolygonPolygon(aData, bData, response);
					if (collided) {
						me.toRemove = true;
					}
				}
				if (me.isbullet && b.isbullet) {
					collided = SAT.testPolygonPolygon(aData, bData, response);
					if (collided) {
						me.toRemove = true;
						b.toRemove = true;
					}
				}
				if (me.istank && b.isbullet && me.playerID != b.playerID) {
					collided = SAT.testPolygonPolygon(aData, bData, response);
					if (collided) {
						me.toRemove = true;
						b.toRemove = true;
					}
				}
				if (collided) {
					if (me.istank && !b.isbullet) {
						respondToCollision(me, b, response);
					}
				}
			}
		}
	}

	function respondToCollision(self, other, response) {
		if (self.solid && other.solid) {
			if (self.heavy) {
				// Move the other object out of us
				other.polygon.pos.add(response.overlapV);
			}
			else if (other.heavy) {
				// Move us out of the other object
				self.polygon.pos.sub(response.overlapV);
			}
			else {
				// Move equally out of each other
				response.overlapV.scale(0.5);
				self.polygon.pos.sub(response.overlapV);
				other.polygon.pos.add(response.overlapV);
			}
		}
	}

	function endgame() {
		clearInterval(gameloop);
	}

	function tickgame() {
		gameloop = setInterval(function() {
			var pack = {
				player: Player.update(),
				bullet: Bullet.update(),
				wall: Wall.update()
			};
			for (var i in playerlist) {
				var player = playerlist[i];
				var socket = SOCKET_LIST[player.playerID];
				if (Object.keys(playerlist).length <= 1) {
					socket.emit('Victory', '/client/Win.html');
					endgame();
				}
				socket.emit('newPositions', pack);
			}
		}, 1000 / 50);
	}

	return {
		playerconnect: Player.onConnect,
		playerdisconnect: Player.onDisconnect,
		playerlist: playerlist,
		dostartgame: tickgame,
		doendgame: endgame
	}
};
