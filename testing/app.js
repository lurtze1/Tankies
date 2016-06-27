var express = require('express');
var app = express();
var serv = require('http').Server(app);
var SAT = require('./Libs/SAT.js');
var $ = require('./Libs/jquery');
app.get('/', function (req, res) {
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

var V = function (x, y) {
    return new SAT.Vector(x, y);
};

// Contructor for Polygon, made shorter for simplicity
var P = function (pos, points) {
    return new SAT.Polygon(pos, points);
};

// Contructor for Circle, made shorter for simplicity
var C = function (pos, r) {
    return new SAT.Circle(pos, r);
};

var Entity = function () {
    var self = {
        x: 250,
        y: 250,
        width: undefined,
        height: undefined,
        speed: undefined,
        polygon: undefined,
        playerID: undefined,
        teamID: undefined,
        solid: undefined,
        heavy: undefined,
        angle: undefined
    }
    self.update = function () {
        self.updatePosition();
    }
    self.updatePosition = function () {
        self.x += self.spdX;
        self.y += self.spdY;
    }
    self.getDistance = function (pt) {
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
    }
    return self;
}

var Player = function (x, y, playerID, team) {
    var self = Entity();
    self.number = "" + Math.floor(10 * Math.random());
    self.lifes = 3;
    self.team = team;
    self.playerID = playerID;
    self.ishit = false;
    self.Cooldown = 60;
    self.CurrentCooldown = 60;
    self.speed = 200;
    self.istank = true;
    self.turnspeed = 180 * TO_RADIANS;
    self.polygon = P(V(x, y), [V(0, 0), V(this.width, 0), V(this.width, this.height), V(0, this.height)]);
    self.angle = self.polygon.angle;
    self.polygon.translate(-self.width / 2, -self.height / 2);

    var super_update = self.update;
    self.update = function () {
        self.updateSpd();
        super_update();

        if (self.pressingAttack) {
            self.shootBullet(self.mouseAngle);
        }
    }
    self.shootBullet = function (angle) {
        var b = Bullet(self.id, angle);
        b.x = self.x;
        b.y = self.y;
    }


    self.updateSpd = function () {
        if (self.pressingRight)
            self.spdX = self.speed;
        else if (self.pressingLeft)
            self.spdX = -self.speed;
        else
            self.spdX = 0;

        if (self.pressingUp)
            self.spdY = -self.speed;
        else if (self.pressingDown)
            self.spdY = self.speed;
        else
            self.spdY = 0;
    }
    Player.list[playerID] = self;
    return self;
}
Player.list = {};
Player.onConnect = function (socket) {
    var player = Player(socket.id);
    socket.on('keyPress', function (data) {
        if (data.inputId === 'left')
            player.pressingLeft = data.state;
        else if (data.inputId === 'right')
            player.pressingRight = data.state;
        else if (data.inputId === 'up')
            player.pressingUp = data.state;
        else if (data.inputId === 'down')
            player.pressingDown = data.state;
        else if (data.inputId === 'attack')
            player.pressingAttack = data.state;
        else if (data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });
}
Player.onDisconnect = function (socket) {
    delete Player.list[socket.id];
}
Player.update = function () {
    var pack = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        player.update();
        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
        });
    }
    return pack;
}

var Wall = function (x, y, length, width) {
    var self = Entity();
    self.solid = true;
    self.heavy = true;
    self.width = width;
    self.height = length;
    self.iswall = true;
    self.polygon = P(V(x, y), [V(0, 0), V(length, 0), V(length, width), V(0, width)]);

};
Wall.list = {};

var Bullet = function (parent, angle) {
    var self = Entity();
    self.id = Math.random();
    self.spdX = Math.cos(angle / 180 * Math.PI) * 10;
    self.spdY = Math.sin(angle / 180 * Math.PI) * 10;
    self.parent = parent;
    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function () {
        if (self.timer++ > 100)
            self.toRemove = true;
        super_update();

        for (var i in Player.list) {
            var p = Player.list[i];
            if (self.getDistance(p) < 32 && self.parent !== p.id) {
                //handle collision. ex: hp--;
                self.toRemove = true;
            }
        }
    }
    Bullet.list[self.id] = self;
    return self;
}

function Bullet(parent, angle, team, playerID) {
    var self = Entity();
    this.playerID = playerID;
    this.width = 10;
    this.height = 10;
    this.solid = true;
    this.isbullet = true;
    this.angle = angle;
    this.polygon = new P(V(pos.x, pos.y), [V(0, 0), V(this.width, 0), V(this.width, this.height), V(0, this.height)]);
    this.team = team;
    this.speed = 60;
    this.polygon.angle = angle;
    this.polygon.translate(-this.width / 2, -this.height / 2);
    this.polygon._recalc();
}
Bullet.list = {};

Bullet.update = function () {
    var pack = [];
    for (var i in Bullet.list) {
        var bullet = Bullet.list[i];
        bullet.update();
        if (bullet.toRemove)
            delete Bullet.list[i];
        else
            pack.push({
                x: bullet.x,
                y: bullet.y,
            });
    }
    return pack;
}

var DEBUG = true;

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    Player.onConnect(socket);

    socket.on('disconnect', function () {
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

});

setInterval(function () {
    var pack = {
        player: Player.update(),
        bullet: Bullet.update(),
    }

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack);
    }
}, 1000 / 25);
