var express = require('express');
var app = express();
var serv = require('http').Server(app);
var SAT = require('./Libs/SAT.js');
var $ = require('./../testmap/jquery');
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.use('/', express.static(__dirname + '/'));

serv.listen(2000);
console.log("Server started.");

var SOCKET_LIST = {};

var TO_RADIANS = Math.PI / 180;

var TO_DEGREES = 180 / Math.PI;

var V = function (x, y) {
    return new SAT.Vector(x, y);
};

var P = function (pos, points) {
    return new SAT.Polygon(pos, points);
};

var maxplayers = 2;
var Games = [];
var io = require('socket.io')(serv, {});

io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    var joinedgame = false;
    //Checks if there are no current games or if the last game on the list is full
    for (var i = 0; i < Games.length; i++) {
        var possibleGame = Games[i];
        if (Object.keys(possibleGame.playerlist).length < maxplayers) {
            joinedgame = true;
            console.log(Object.keys(possibleGame.playerlist).length);
            possibleGame.playerconnect(socket);
            socket.on('disconnect', function () {
                possibleGame.playerdisconnect(socket);
                if (Object.keys(possibleGame.playerlist).length <= 0) {
                    var index = Games.indexOf(possibleGame);
                    if (index > -1) {
                        Games.splice(index, 1);
                    }
                }
                delete SOCKET_LIST[socket.id];
            });
        }
        //checks if a game needs to be started.
        if (Object.keys(possibleGame.playerlist).length >= maxplayers) {
            possibleGame.dostartgame();
            var playerListLobby = possibleGame.playerlist;
            for (var aPlayer in playerListLobby) {
                var player = playerListLobby[aPlayer];
                var sockets = SOCKET_LIST[player.playerID];
                sockets.emit("WaitingDone");
            }
        }

    }
    //checks if there isn't a game yet or if the last game in the list is full. Also checks if the player hasn't already joined a game.
    if (Games.length < 1 && !joinedgame || Object.keys(Games[Games.length - 1].playerlist).length >= maxplayers && !joinedgame) {
        console.log('newgame');
        var newGame = new Game();
        newGame.playerconnect(socket);
        socket.on('disconnect', function () {
            delete SOCKET_LIST[socket.id];
            newGame.playerdisconnect(socket);
            if (Object.keys(newGame.playerlist).length <= 0) {
                var index = Games.indexOf(newGame);
                if (index > -1) {
                    Games.splice(index, 1);
                }
            }
        });
        Games.push(newGame);
    }

});
var Game = function () {
    var playerList = {};
    var bulletList = {};
    var wallList = {};
    var gameLoop;
    var Entity = function () {
        var self = {
            width: undefined,
            height: undefined,
            speed: undefined,
            polygon: undefined,
            playerID: undefined,
            solid: undefined,
            heavy: undefined
        };
        self.update = function () {
            self.updatePosition();
        };
        self.updatePosition = function () {
            self.polygon.pos.x += self.spdX;
            self.polygon.pos.y -= self.spdY;
            self.polygon._recalc();
        };
        return self;
    };

    var Player = function (x, y, playerID, angle) {
        var self = Entity();
        self.number = "" + Math.floor(10 * Math.random());
        self.playerID = playerID;
        self.speed = 1;
        self.width = 20;
        self.height = 20;
        self.solid = true;
        self.istank = true;
        self.toRemove = false;
        self.reloadtime = 48;
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
        self.update = function () {
            self.updateSpd();
            super_update();
            if (self.cooldown > 0) {
                self.cooldown--;
            }
            if (self.pressingAttack && self.cooldown === 0) {
                self.shootBullet();
                for (var i in playerList) {
                    var player = playerList[i];
                    var socket = SOCKET_LIST[player.playerID];
                    socket.emit('Shoot');
                }
            }
            Collision(self, bulletList);
            Collision(self, wallList);
            Collision(self, playerList);
        };
        self.shootBullet = function () {
            self.cooldown = self.reloadtime;
            Bullet(self.playerID, self.polygon.angle, self.polygon.pos.x, self.polygon.pos.y, self.playerID);
        };

        self.updateSpd = function () {
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
        playerList[playerID] = self;
        return self;
    };
    Player.onConnect = function (socket) {
        var playerListLength = Object.keys(playerList).length;
        var player;
        if (playerListLength === 0) {
            player = Player(100, 100, socket.id);
        }
        else if (playerListLength === 1) {
            player = Player(400, 400, socket.id, 180 * TO_RADIANS);
        }
        socket.on('keyPress', function (data) {
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
    Player.onDisconnect = function (socket) {
        delete playerList[socket.id];
    };
    Player.update = function () {
        var pack = [];
        for (var i in playerList) {
            var player = playerList[i];
            if (player.toRemove) {
                var socket = SOCKET_LIST[player.playerID];
                socket.emit('Defeat', '/client/Lose.html');
                delete playerList[i];
            }
            player.update();
            pack.push({
                polygon: player.polygon,
                number: player.number
            });
        }
        return pack;
    };

    var Wall = function (x, y, length, width) {
        var self = Entity();
        self.id = Math.random();
        self.solid = true;
        self.heavy = true;
        self.width = width;
        self.height = length;
        self.iswall = true;
        self.polygon = P(V(x, y), [V(0, 0), V(length, 0), V(length, width), V(0, width)]);
        self.polygon._recalc();
        wallList[self.id] = self;
        return self;

    };
    Wall.update = function () {
        var pack = [];
        for (var i in wallList) {
            var wall = wallList[i];

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
        self.polygon = new P(V(x, y), [V(0, 0), V(self.width, 0), V(self.width, self.height), V(0, self.height)]);
        self.speed = 5;
        self.polygon.angle = angle;
        self.polygon.translate(-self.width / 2, -self.height / 2);
        self.polygon._recalc();
        var super_update = self.update;
        self.update = function () {
            self.updateSpd();
            Collision(self, wallList);
            if (self.timer++ > 100) {
                self.toRemove = true;
            }
            super_update();
        };
        self.updateSpd = function () {
            self.spdY = -(self.speed * Math.sin(self.polygon.angle));
            self.spdX = self.speed * Math.cos(self.polygon.angle);
            self.polygon._recalc();
        };

        bulletList[self.id] = self;
        return self;
    }

    Bullet.update = function () {
        var pack = [];
        for (var i in bulletList) {
            var bullet = bulletList[i];
            bullet.update();
            if (bullet.toRemove) {
                delete bulletList[i];
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
        clearInterval(gameLoop);
    }

    function tickgame() {
        gameLoop = setInterval(function () {
            var pack = {
                player: Player.update(),
                bullet: Bullet.update(),
                wall: Wall.update()
            };
            for (var i in playerList) {
                var player = playerList[i];
                var socket = SOCKET_LIST[player.playerID];
                if (Object.keys(playerList).length <= 1) {
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
        playerlist: playerList,
        dostartgame: tickgame,
        doendgame: endgame
    }
};
