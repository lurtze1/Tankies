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

    //Polygon holds angle, postion, size, offset.
    this.polygon = P(V(pos), [V(20, 20), V(-20, 20), V(-20, -20), V(20, -20), V(20, 0)]);
};

var game = function () {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 1000;
    document.body.appendChild(canvas);

    var entities = [];
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

    var tank = new Tank(V(canvas.width / 2, canvas.height / 2));
    var keysDown = {};

    addEventListener("keydown", function (e) {
        keysDown[e.keyCode] = true;
    }, false);

    addEventListener("keyup", function (e) {
        delete keysDown[e.keyCode];
    }, false);


    var reset = function () {
        tank.pos.x = canvas.width / 2;
        tank.pos.y = canvas.height / 2;
    };


    var Collision = function (loopCount) {
        var loopCount = loopCount;
        for (var i = 0; i < loopCount; i++) {
            // Naively check for collision between all pairs of entities
            // E.g if there are 4 entities: (0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)
            for (var aCount = 0; aCount < entities.length; aCount++) {
                var a = entities[aCount];
                for (var bCount = aCount + 1; bCount < entities.length; bCount++) {
                    var b = entities[bCount];
                    this.response.clear();
                    var collided;
                    var aData = a.data;
                    var bData = b.data;
                    collided = SAT.testPolygonPolygon(aData, bData, this.response);
                }
                if (collided) {
                    a.respondToCollision(b, this.response);
                }
            }
        }
    };

    var update = function (modifier) {
        if (87 in keysDown) { // Player holding up
            tank.pos.y -= tank.speed * modifier;
        }
        if (83 in keysDown) { // Player holding down
            tank.pos.y += tank.speed * modifier;
        }
        if (65 in keysDown) { // Player holding left
            tank.pos.x -= tank.speed * modifier;
        }
        if (68 in keysDown) { // Player holding right
            tank.pos.x += tank.speed * modifier;
        }


    };

    var render = function () {
        if (bgReady) {
            ctx.drawImage(bgImage, 0, 0);
        }
        if (TankReady) {
            ctx.drawImage(TankImage, tank.pos.x, tank.pos.y)
        }

        ctx.fillStyle = "rgb(250, 250, 250)";
        ctx.font = "24px Helvetica";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("henk", 40, 40);
    };

    var Start = function () {
        var now = Date.now();
        var delta = now - then;
        update(delta / 1000);
        render();

        then = now;
        requestAnimationFrame(Start);
    };


    var then = Date.now();

    reset();
    Start();
};