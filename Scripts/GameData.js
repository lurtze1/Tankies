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

//Bron http://creativejs.com/2011/12/to-radians/index.html
// One degree in radians
var TO_RADIANS = Math.PI / 180;

// One radian in degrees
var TO_DEGREES = 180 / Math.PI;


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

    //degrees in a turn in a second
    this.turnspeed = 180 * TO_RADIANS;

    //Polygon holds angle, position, size, offset.
    this.polygon = P(V(x, y), [V(0, 0), V(60, 0), V(60, 30), V(0, 30)]);
    this.angle = this.polygon.angle;
    this.polygon.translate(-this.width / 2, -this.height / 2);

};


function rotateAndPaintImage(context, image, Entity) {
    context.save();

// now move across and down half the
// width and height of the image (which is 128 x 128)
    context.translate(Entity.polygon.pos.x, Entity.polygon.pos.y);

// rotate around this point
    context.rotate(Entity.polygon.angle);
// then draw the image back and up
    var anticlockwise = true;
    context.beginPath();
    var entitypoint = Entity.polygon.points;
    var a = (Math.PI * 2) / 4;
    a = anticlockwise ? -a : a;
    context.moveTo(entitypoint[0].x, entitypoint[0].y);
    for (var i = 1; i < Entity.polygon.points.length; i++) {
        context.lineTo(entitypoint[i].x, entitypoint[i].y);
    }
    context.closePath();


    context.fillStyle = "rgba(227,11,93,0.75)";
    context.fill();
    context.stroke();

    context.clip();

    context.restore();

}

var Wall = function (x, y) {


    //Indicates if this object is solid for collition
    this.solid = true;

    //Indicates if this object cannot be moved
    this.heavy = true;

    this.width = 20;

    this.height = 20;


    //Polygon holds angle, postion, size, offset.
    this.polygon = P(V(x, y), [V(0, 0), V(20, 0), V(20, 20), V(0, 20)]);

};

var Bullet = function (team, vector) {
    var team = team;
    var vector = vector;
    var speed = 50;
    //placeholder
};

var game = function game() {
    var This = game;
    This.response = new SAT.Response();
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 800;
    document.body.appendChild(canvas);
    var LocalPlayer;
    var entities = [];
    var walls = [];
    var playerList = [];
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

    var WallImage = new Image();
    var WallReady;
    WallImage.onload = function () {
        WallReady = true;
    };
    WallImage.src = "Images/Wall.gif";
    var keysDown = {};
    var now;
    var delta;
    var then = Date.now();

    addEventListener("keydown", function (e) {
        keysDown[e.keyCode] = true;
    }, false);

    addEventListener("keyup", function (e) {
        delete keysDown[e.keyCode];
    }, false);

    var respondToCollision = function (self, other, response) {
        if (self.solid && other.solid) {
            if (self.heavy) {
                // Move the other object out of us
                other.polygon.pos.add(response.overlapV);
            }
            if (other.heavy) {
                // Move us out of the other object
                self.polygon.pos.sub(response.overlapV);
            } else {
                // Move equally out of each other
                response.overlapV.scale(0.5);
                self.polygon.pos.sub(response.overlapV);
                other.polygon.pos.add(response.overlapV);
            }
        }
    };

    var addPlayer = function () {
        if (playerList[0] == undefined) {
            LocalPlayer = new Tank(100, 100, 1);
            entities.push(LocalPlayer);
            playerList[0] = LocalPlayer;
        } else if (playerList[1] == undefined) {
            LocalPlayer = new Tank(650, 650, 2);
            entities.push(LocalPlayer);
            playerList[1] = LocalPlayer;
        } else if (playerList[2] == undefined) {
            LocalPlayer = new Tank(50, 95, 3);
            entities.push(LocalPlayer);
            playerList[2] = LocalPlayer;
        } else if (playerList[3] == undefined) {
            LocalPlayer = new Tank(650, 50, 4);
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
        update(delta / 1000);

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
                    var aData = a.polygon;
                    var bData = b.polygon;
                    if (a instanceof Tank && b instanceof Tank && a.playerID != b.playerID) {
                        collided = SAT.testPolygonPolygon(aData, bData, This.response);
                    } else if (a instanceof Tank && b instanceof Wall) {
                        collided = SAT.testPolygonPolygon(aData, bData, This.response);
                    } else if (a instanceof Tank && b instanceof Bullet && b.team != a.team) {

                    }

                    if (collided) {

                        respondToCollision(a, b, This.response);
                        This.response.clear();
                    }
                }
            }
        }

        render();
    };
    var update = function (modifier) {
        var speed = LocalPlayer.speed;
        var angle = LocalPlayer.polygon.angle;
        var velocity_x = speed * Math.cos(angle);
        var velocity_y = -speed * Math.sin(angle);
        if (65 in keysDown) { // Player holding left
            angle -= LocalPlayer.turnspeed * modifier;
        }
        if (68 in keysDown) { // Player holding right
            angle += LocalPlayer.turnspeed * modifier;
        }
        if (87 in keysDown) { // Player holding up
            LocalPlayer.polygon.pos.x += velocity_x * modifier;
            LocalPlayer.polygon.pos.y -= velocity_y * modifier;
        }
        if (83 in keysDown) { // Player holding down
            LocalPlayer.polygon.pos.x -= velocity_x * modifier;
            LocalPlayer.polygon.pos.y += velocity_y * modifier;
        }
        LocalPlayer.polygon.angle = angle;
        LocalPlayer.polygon._recalc();
    };

    var render = function () {
        if (bgReady) {
            ctx.drawImage(bgImage, 0, 0);
        }
        if (TankReady) {
            rotateAndPaintImage(ctx, TankImage, LocalPlayer);
        }
        if (WallReady) {
            for (var i = 0; i < walls.length; i++) {
                var data = walls[i];
                ctx.drawImage(WallImage, data.polygon.pos.x, data.polygon.pos.y);
            }
        }
    };
    var addWalls = function () {
        var x;
        var y;
        var wall;
        for (var iTop = 0; iTop < canvas.width / 20; iTop++) {
            x = (20 * iTop);
            y = 0;
            wall = new Wall(x, y);
            walls.push(wall);
            entities.push(wall);
        }
        for (var iBottom = 0; iBottom < canvas.width / 20; iBottom++) {
            x = (20 * iBottom);
            y = canvas.height - 20;
            wall = new Wall(x, y);
            walls.push(wall);
            entities.push(wall);
        }
        for (var iLeft = 0; iLeft < canvas.width / 20; iLeft++) {
            x = (0);
            y = (20 * iLeft);
            wall = new Wall(x, y);
            walls.push(wall);
            entities.push(wall);
        }
        for (var iRight = 0; iRight < canvas.width / 20; iRight++) {
            x = canvas.width - 20;
            y = (20 * iRight);
            wall = new Wall(x, y);
            walls.push(wall);
            entities.push(wall);
        }

        /* wall = new Wall(200,200);
         walls.push(wall);
         entities.push(wall);*/


    };
    var Start = function () {
        now = Date.now();
        delta = now - then;
        Collision(5);

        then = now;
        requestAnimationFrame(Start);
    };


    addPlayer();
    addWalls();

    Start();
};

game();