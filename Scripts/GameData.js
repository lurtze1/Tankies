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

var Tank = function (x, y, playerID) {
    //Team of the player, can be null.
    this.team = undefined;

    //Player ID
    this.playerID = undefined;

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

    this.width = 60;

    this.height = 30;

    //Polygon holds angle, position, size, offset.
    this.polygon = P(V(x, y), [V(20, 20), V(-20, 20), V(-20, -20), V(20, -20), V(20, 0)]);


    var respondToCollision = function (other, response) {

        if (this.solid && other.solid && !(this.heavy && other.heavy)) {
            if (this.heavy) {
                // Move the other object out of us
                other.polygon.pos.add(response.overlapV);
            } else if (other.heavy) {
                // Move us out of the other object
                this.polygon.pos.sub(response.overlapV);
            } else {
                // Move equally out of each other
                response.overlapV.scale(0.5);
                this.polygon.pos.sub(response.overlapV);
                other.polygon.pos.add(response.overlapV);
            }
        }
    }
};

var Wall = function (x, y) {


    //Indicates if this object is solid for collition
    this.solid = true;

    //Indicates if this object cannot be moved
    this.heavy = true;

    this.width = 20;

    this.height = 20;

    //Polygon holds angle, postion, size, offset.
    this.polygon = P(V(x, y), [V(10, 10), V(-10, 10), V(-10, -10), V(10, -10), V(10, 0)]);
};

var Bullet = function (team, vector) {
    var team = team;
    var vector = vector;
    var speed = 50;
    //placeholder
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
            LocalPlayer = new Tank(100, 100, 1);
            entities.push(LocalPlayer);
            playerList[0] = LocalPlayer;
        } else if (playerList[1] == undefined) {
            LocalPlayer = new Tank(950, 950, 2);
            entities.push(LocalPlayer);
            playerList[1] = LocalPlayer;
        } else if (playerList[2] == undefined) {
            LocalPlayer = new Tank(50, 95, 3);
            entities.push(LocalPlayer);
            playerList[2] = LocalPlayer;
        } else if (playerList[3] == undefined) {
            LocalPlayer = new Tank(950, 50, 4);
            entities.push(LocalPlayer);
            playerList[3] = LocalPlayer;
        }
    };

    var reset = function () {
        LocalPlayer.pos.x =
            canvas.width / 2;
        LocalPlayer.pos.y = canvas.height / 2;
    };


    var Collision = function (loopCount) {
        for (var i = 0; i < loopCount; i++) {
            // Naively check for collision between all pairs of entities
            // E.g if there are 4 entities: (0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)
            var aCount = 0;
            for (aCount; aCount < entities.length; aCount++) {
                var a = entities[aCount];
                var bCount = aCount + 1;
                for (bCount; bCount < entities.length; bCount++) {
                    var b = entities[bCount];
                    var collided;
                    if (a instanceof Tank && b instanceof Tank && a.playerID != b.playerID) {
                        collided = checkforCollition(a, b);
                    } else if (a instanceof Tank && b instanceof Wall) {
                        collided = checkforCollition(a, b);
                    } else if (a instanceof Tank && b instanceof Bullet && b.team != a.team) {

                    }

                    if (collided) {
                        a.respondToCollision(b, response);
                    }
                }
            }
        }
    };

    var checkforCollition = function (a, b) {
        var collided;
        var aData = a.polygon;
        var bData = b.polygon;
        collided = SAT.testPolygonPolygon(aData, bData, this.response);
        return collided;
    };
    var update = function (modifier) {
        if (87 in keysDown) { // Player holding up
            LocalPlayer.polygon.pos.y -= LocalPlayer.speed * modifier;
        }
        if (83 in keysDown) { // Player holding down
            LocalPlayer.polygon.pos.y += LocalPlayer.speed * modifier;
        }
        if (65 in keysDown) { // Player holding left
            LocalPlayer.polygon.pos.x -= LocalPlayer.speed * modifier;
        }
        if (68 in keysDown) { // Player holding right
            LocalPlayer.polygon.pos.x += LocalPlayer.speed * modifier;
        }

    };

    var render = function () {
        if (bgReady) {
            ctx.drawImage(bgImage, 0, 0);
        }
        if (TankReady) {
            ctx.drawImage(TankImage, LocalPlayer.polygon.pos.x, LocalPlayer.polygon.pos.y, LocalPlayer.width, LocalPlayer.height)
        }
    };
    var addWalls = function () {
        for (var i = 0; i < 10; i++) {
            var x = (20 * i) + 10;
            var y = 10;
            var wall = new Wall(x, y);
            walls.push(wall);
            entities.push(wall);
        }
    };
    var Start = function () {
        now = Date.now();
        delta = now - then;
        Collision(1);
        update(delta / 1000);
        render();
        then = now;
        requestAnimationFrame(Start);
    };

    this.response = new SAT.Response();
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = 1000;
    canvas.height = 1000;
    document.body.appendChild(canvas);
    var LocalPlayer;
    var entities = [];
    var walls = [];
    var playerList = [];
    addPlayer();
    addWalls();
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
    var now;
    var delta;
    var then = Date.now();
    Start();
};

game();