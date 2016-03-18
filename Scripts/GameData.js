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

    //Polygon holds angle, position, size, offset.
    this.polygon = P(V(pos), [V(20, 20), V(-20, 20), V(-20, -20), V(20, -20), V(20, 0)]);
};
var game = function () {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = 500;
    canvas.height = 500;
    document.body.appendChild(canvas);


    var bgReady = false;
    var bgImage = new Image();

    bgImage.onload = function () {
        bgReady = true;
    };
    bgImage.src = "Images/Background.jpg";


    var TankReady = false;
    var TankImage = new Image();
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

    var update = function (modifier) {
        console.log(tank.pos);
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

game();
game();
