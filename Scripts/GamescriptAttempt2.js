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
var response = new SAT.Response();

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
    bgReady = true;
};
bgImage.src = "images/background.png";

// Hero image
var heroReady = false;
var heroImage = new Image();
heroImage.onload = function () {
    heroReady = true;
};
heroImage.src = "images/hero.png";

// Monster image
var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function () {
    monsterReady = true;
};
monsterImage.src = "images/monster.png";

// Game objects
var hero = {
    speed: 256, // movement in pixels per second
};
var monster = {};
var monstersCaught = 0;

// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
    keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
    delete keysDown[e.keyCode];
}, false);

// Reset the game when the player catches a monster
var reset = function () {
    hero.x = canvas.width / 2;
    hero.y = canvas.height / 2;
    hero.polygon = P(V(hero.x, hero.y), [V(0, 0), V(20, 0), V(20, 20), V(0, 20)]);
    // Throw the monster somewhere on the screen randomly
    monster.x = 32 + (Math.random() * (canvas.width - 64));
    monster.y = 32 + (Math.random() * (canvas.height - 64));
    monster.polygon = P(V(monster.x, monster.y), [V(0, 0), V(20, 0), V(20, 20), V(0, 20)])
};

// Update game objects
var update = function (modifier) {
    if (38 in keysDown) { // Player holding up
        hero.polygon.pos.y -= hero.speed * modifier;

    }
    if (40 in keysDown) { // Player holding down
        hero.polygon.pos.y += hero.speed * modifier;
    }
    if (37 in keysDown) { // Player holding left
        hero.polygon.pos.x -= hero.speed * modifier;
    }
    if (39 in keysDown) { // Player holding right
        hero.polygon.pos.x += hero.speed * modifier;
    }
    // Are they touching?
    var collided = SAT.testPolygonPolygon(hero.polygon, monster.polygon, response);
    if (collided) {
        console.log(response);
        response.overlapV.scale(0.5);
        hero.polygon.pos.sub(response.overlapV);
        monster.polygon.pos.add(response.overlapV);
        response.clear();
    }
};

// Draw everything
var render = function () {
    if (bgReady) {
        ctx.drawImage(bgImage, 0, 0);
    }

    if (heroReady) {
        ctx.drawImage(heroImage, hero.polygon.pos.x, hero.polygon.pos.y);
    }

    if (monsterReady) {
        ctx.drawImage(monsterImage, monster.polygon.pos.x, monster.polygon.pos.y);
    }

    // Score
    ctx.fillStyle = "rgb(250, 250, 250)";
    ctx.font = "24px Helvetica";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Goblins caught: " + monstersCaught, 32, 32);
};

// The main game loop
var main = function () {
    var now = Date.now();
    var delta = now - then;

    update(delta / 1000);
    render();

    then = now;

    // Request to do this again ASAP
    requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();
reset();
main();