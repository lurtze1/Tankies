// Contructor for Vector, made shorter for simplicity
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

// Contructor for Box, made shorter for simplicity
var B = function (pos, w, h) {
    return new SAT.Box(pos, w, h);
};

var Tank = function (pos) {

    //Current position in pixels, based on a vector;
    this.pos = pos;

    //Team of the player, can be null.
    this.team = undefined;

    //Player ID
    this.player = undefined;

    //General Gun Cooldown
    this.Cooldown = 60;

    //Time left for fire
    this.CurrentCooldown = undefined;

    // Amount of pixels moved in a second.
    this.speed = 200;

    //Indicates if a object is solid for collition.
    this.solid = true;

    //Indicates if this object cannot be moved
    this.heavy = false;

    this.width = 40;

    this.height = 40;

    //Polygon holds angle, position, size, offset.
    this.polygon = P(V(pos), [V(20, 20), V(-20, 20), V(-20, -20), V(20, -20), V(20, 0)]);

};


Tank.prototype = {
    respondtoCollision: function (other, response) {
        if (this.solid && other.solid && !(this.heavy && other.heavy)) {
            if (this.heavy) {
                // Move the other object out of us
                other.pos.add(response.overlapV);
            } else if (other.heavy) {
                // Move us out of the other object
                this.pos.sub(response.overlapV);
            } else {
                // Move equally out of each other
                response.overlapV.scale(0.5);
                this.pos.sub(response.overlapV);
                other.pos.add(response.overlapV);
            }
        }
    }
};

var Wall = function (pos) {
    //Current position in pixels, based on a vector;
    this.pos = pos;

    //Indicates if this object is solid for collition
    this.solid = true;

    //Indicates if this object cannot be moved
    this.heavy = true;

    this.width = 20;

    this.height = 20;

    //Polygon holds angle, postion, size, offset.
    this.polygon = P(V(pos), [V(10, 10), V(-10, 10), V(-10, -10), V(10, -10), V(10, 0)]);
};

Wall.prototype = {
    respondtoCollision: function (other, response) {
        if (this.solid && other.solid && !(this.heavy && other.heavy)) {
            if (this.heavy) {
                // Move the other object out of us
                other.pos.add(response.overlapV);
            } else if (other.heavy) {
                // Move us out of the other object
                this.pos.sub(response.overlapV);
            } else {
                // Move equally out of each other
                response.overlapV.scale(0.5);
                this.pos.sub(response.overlapV);
                other.pos.add(response.overlapV);
            }
        }
    }
};

var game = function () {
    addEventListener("keydown", function (e) {
        keysDown[e.keyCode] = true;
    }, false);

    addEventListener("keyup", function (e) {
        delete keysDown[e.keyCode];
    }, false);


    var addPlayer = function () {
        if (playerList[0] == undefined) {
            LocalPlayer = new Tank(V(50, 50));
            entities += LocalPlayer;
        } else if (playerList[1] == undefined) {
            LocalPlayer = new Tank(V(950, 950));
            entities += LocalPlayer;
        } else if (playerList[2] == undefined) {
            LocalPlayer = new Tank(V(50, 950));
            entities += LocalPlayer;
        } else if (playerList[3] == undefined) {
            LocalPlayer = new Tank(V(950, 50));
            entities += LocalPlayer;
        }
    };

    var reset = function () {
        LocalPlayer.pos.x =
            canvas.width / 2;
        LocalPlayer.pos.y = canvas.height / 2;
    };


    var Collision = function (loopCount) {
        var response;
        for (var i = 0; i < loopCount; i++) {
            // Naively check for collision between all pairs of entities
            // E.g if there are 4 entities: (0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)
            for (var aCount = 0; aCount < entities.length; aCount++) {
                var a = entities[aCount];
                for (var bCount = aCount + 1; bCount < entities.length; bCount++) {
                    var b = entities[bCount];
                    if (response) {
                        response.clear();

                    }
                    var collided;
                    var aData = a.polygon;
                    var bData = b.polygon;
                    collided = SAT.testPolygonPolygon(aData, bData, response);
                }
                if (collided) {
                    a.respondToCollision(b, response);
                }
            }
        }
    };

    var update = function (modifier) {
        if (87 in keysDown) { // Player holding up
            LocalPlayer.pos.y -= LocalPlayer.speed * modifier;
        }
        if (83 in keysDown) { // Player holding down
            LocalPlayer.pos.y += LocalPlayer.speed * modifier;
        }
        if (65 in keysDown) { // Player holding left
            LocalPlayer.pos.x -= LocalPlayer.speed * modifier;
        }
        if (68 in keysDown) { // Player holding right
            LocalPlayer.pos.x += LocalPlayer.speed * modifier;
        }

    };

    var render = function () {
        if (bgReady) {
            ctx.drawImage(bgImage, 0, 0);
        }
        if (TankReady) {
            ctx.drawImage(TankImage, LocalPlayer.pos.x, LocalPlayer.pos.y, LocalPlayer.width, LocalPlayer.height)
        }
    };

    var Start = function () {
        var now = Date.now();
        var delta = now - then;
        update(delta / 1000);
        render();

        then = now;
        requestAnimationFrame(Start);
    };

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 1000;
    document.body.appendChild(canvas);
    var LocalPlayer;
    var entities = [];
    var playerList = [];
    addPlayer();
    var bgReady = false;
    var bgImage = new Image(500, 500);
    bgImage.onload = function () {
        bgReady = true;
    };
    bgImage.src = "Images/Background.jpg";


    var TankReady = false;
    var TankImage = new Image();
    TankImage.width = 60;
    TankImage.height = 30;
    TankImage.onload = function () {
        TankReady = true;
    };
    TankImage.src = "Images/Tank.png";


    var keysDown = {};

    var then = Date.now();
    Start();
};

game();