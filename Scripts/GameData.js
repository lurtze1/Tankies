//======commented voor connectie met server die nog niet werkt======
//var socket = io.connect('http://localhost:8080');
//======commented voor connectie met server die nog niet werkt======

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


var game = function game() {
    var This = game;
    This.response = new SAT.Response();
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "xor";
    canvas.width = 800;
    canvas.height = 800;
    document.getElementById("Game").appendChild(canvas);
    var LocalPlayer;
    var entities = [];
    var walls = [];
    var playerList = [];
    var bulletList = [];
    var bgReady = false;

    //for images first you create an object, then you have to define an onload and then define a source.
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

/*//======commented voor connectie met server die nog niet werkt======
    //functies voor updaten player & entity list

    function UpdateEntityList(entityList){
        socket.emit('updateEntityList', entityList);
    }

    function getEntityList(){
        socket.emit('getEntityList');
    }


    function getPlayerList(){
        socket.emit('getPlayerList');
    }

    function updatePlayerList(){
        socket.emit('updatePlayerList', playerList);
    }

    socket.on('LatestUpdatedEntityList', function(entityList){
       entities = entityList;
    });

    socket.on('LatestUpdatedPlayerList', function(PlayerList){
        playerList = PlayerList;
    });

    socket.on('updatedPlayerList', function(bool){
        if(!bool){
            //mogelijke iets doen als er false terugkomt, laat het voorlopig even leeg.
        }
    });
    //======commented voor connectie met server die nog niet werkt======*/

    var Tank = function (x, y, playerID, team) {
        this.lifes = 3;
        //Team of the player, can be null.
        this.team = team;
        //Player ID
        this.playerID = playerID;

        this.ishit = false;
        //General Gun Cooldown
        this.Cooldown = 60;

        //Time left for fire
        this.CurrentCooldown = 60;

        // Amount of pixels moved in a second.
        this.speed = 200;

        this.istank = true;
        //Indicates if a object is solid for collition.
        this.solid = true;

        //Indicates if this object cannot be moved
        this.heavy = false;

        this.width = 60;

        this.height = 30;

        //degrees in a turn in a second
        this.turnspeed = 180 * TO_RADIANS;

        //Polygon holds angle, position, size, offset.
        this.polygon = P(V(x, y), [V(0, 0), V(60, 0), V(75, 15), V(60, 30), V(0, 30)]);
        this.angle = this.polygon.angle;
        this.polygon.translate(-this.width / 2, -this.height / 2);

    };


    //paints all the polygons of an entity. Might be rewritten to images.
    //Currently paints a polygon in the provided context. It does this by defining the polygon on the context and then filling the context.
    //The decision on how to fill it is made by checking the instance of the Entity.
    function PaintEntity(context, Entity) {
        context.save();
        context.translate(Entity.polygon.pos.x, Entity.polygon.pos.y);
        var anticlockwise = true;
        // rotate around this point
        context.rotate(Entity.polygon.angle);
        context.beginPath();
        var entitypoint = Entity.polygon.points;
        var a = (Math.PI * 2) / 4;
        a = anticlockwise ? -a : a;
        context.moveTo(entitypoint[0].x, entitypoint[0].y);
        for (var i = 1; i < Entity.polygon.points.length; i++) {
            context.lineTo(entitypoint[i].x, entitypoint[i].y);
        }
        context.closePath();
        if (Entity instanceof Tank) {

            //for youri how to do image
            /*if(TankReady){
                var pattern = ctx.createPattern(TankImage,"repeat");
                context.fillStyle = pattern;
            }else{*/
                context.fillStyle = "#4CD64C";
            //}


        }
        if (Entity instanceof Bullet) {
            context.fillStyle = "#D64C4C";
        }
        if (Entity instanceof Wall) {
            context.fillStyle = "#4C4CD6";
        }
        context.fill();
        context.stroke();

        context.clip();

        context.restore();

    }


    //Constructor for a wall object.
    //Takes a topleft starting postion and a width and length.
    var Wall = function (x, y, length, width) {


        //Indicates if this object is solid for collition
        this.solid = true;

        //Indicates if this object cannot be moved
        this.heavy = true;

        this.width = width;

        this.height = length;

        this.iswall = true;
        //Polygon holds angle, postion, size, offset.
        this.polygon = P(V(x, y), [V(0, 0), V(length, 0), V(length, width), V(0, width)]);

    };


    //Creates a bullet.
    function Bullet(team, angle, pos) {
        this.width = 10;
        this.height = 10;
        this.solid = true;
        this.isbullet = true;
        //noinspection JSDuplicatedDeclaration
        this.angle = angle;
        this.polygon = new P(V(pos.x, pos.y), [V(0, 0), V(this.width, 0), V(this.width, this.height), V(0, this.height)]);
        this.team = team;
        this.speed = 60;
        this.polygon.angle = angle;
        this.todelete = false;
        this.polygon.translate(-this.width / 2, -this.height / 2);
        this.polygon._recalc();
    }


    //For the local player, checks if the player can fire and if he can fires the gun for the localplayer.
    var Fire = function () {
        if (LocalPlayer.CurrentCooldown >= 60) {
            var bullet;
            bullet = new Bullet(LocalPlayer.team, LocalPlayer.polygon.angle, LocalPlayer.polygon.pos);
            entities.push(bullet);
            bulletList.push(bullet);
            LocalPlayer.CurrentCooldown = 0;
            bullet = undefined;
        }
    };

    addEventListener("keydown", function (e) {
        keysDown[e.keyCode] = true;
    }, false);

    addEventListener("keyup", function (e) {
        delete keysDown[e.keyCode];
    }, false);


    //Generic Response to collision. Moves the objects out of each others way by a certain amount.
    var respondToCollision = function (self, other, response) {
        if (self.solid && other.solid) {
            if (self.heavy) {
                // Move the other object out of us
                other.polygon.pos.add(response.overlapV);
            } else if (other.heavy) {
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


    //adds a new player to the game and overrides the current LocalPlayer if it is set.
    var addPlayer = function (ID) {
        // entities = getEntityList();
        // playerList = getPlayerList();
        if (playerList[0] == undefined) {
            LocalPlayer = new Tank(100, 100, 1, 1);
            entities.push(LocalPlayer);
            playerList[0] = LocalPlayer;
        } else if (playerList[1] == undefined) {
            LocalPlayer = new Tank(650, 650, 2, 2);
            entities.push(LocalPlayer);
            playerList[1] = LocalPlayer;
        } else if (playerList[2] == undefined) {
            LocalPlayer = new Tank(50, 650, 3, 3);
            entities.push(LocalPlayer);
            playerList[2] = LocalPlayer;
        } else if (playerList[3] == undefined) {
            LocalPlayer = new Tank(650, 50, 4, 4);
            entities.push(LocalPlayer);
            playerList[3] = LocalPlayer;
        }
        //  UpdateEntityList(entities);
        // updatePlayerList(playerList);
    };


    //Resets the player to the middle of the screen, function is outdated.
    var reset = function () {
        LocalPlayer.pos.x =
            canvas.width / 2;
        LocalPlayer.pos.y = canvas.height / 2;
    };


    //Checks for collision a number of times equal to the loopCount.
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
                    var aData = a.polygon;
                    var bData = b.polygon;
                    if (a instanceof Tank && b instanceof Tank && a.playerID != b.playerID|| b.istank && a.istank && a.playerID != b.playerID) {
                        collided = SAT.testPolygonPolygon(aData, bData, This.response);
                    }
                    if (a instanceof Tank && b instanceof Wall || b.istank && a instanceof Wall) {
                        collided = SAT.testPolygonPolygon(aData, bData, This.response);
                    }
                    if (a instanceof Wall && b.isbullet || a.isbullet && b instanceof Wall) {
                        collided = SAT.testPolygonPolygon(aData, bData, This.response);
                        if (collided) {
                            b.todelete = true;
                        }
                    }
                    if (a.istank && b.isbullet && a.team != b.team || b.istank && a.isbullet && a.team != b.team) {
                        collided = SAT.testPolygonPolygon(aData, bData, This.response);
                        if (collided) {
                            b.todelete = true;
                            a.ishit = true;
                        }
                    }

                    if (collided) {
                        if (a instanceof Tank && !b.isbullet || b.istank && !a.isbullet) {
                            respondToCollision(a, b, This.response);
                        }
                    }
                    This.response.clear();
                }

            }
        }

        render();
    };

    //Updates the location etc of the player every tick. Takes the deltatime to modify movement etc.
    var updatePlayer = function (modifier) {
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
        if (32 in keysDown) {
            Fire();
        }
        LocalPlayer.polygon.angle = angle;
        LocalPlayer.polygon._recalc();
    };


    //updates the Bullets every tick. Checks if the bullet has to be deleted.
    //Takes the delta time as a modifier for movement.
    var updateBullets = function (modifier) {
        LocalPlayer.CurrentCooldown += LocalPlayer.Cooldown * modifier;
        for (var i = 0; i < entities.length; i++) {
            var a = entities[i];
            if (a instanceof Bullet && !a.todelete) {
                var angle = a.polygon.angle;
                var velocity_x = a.speed * Math.cos(angle);
                var velocity_y = -(a.speed) * Math.sin(angle);
                a.polygon.pos.x += velocity_x * modifier;
                a.polygon.pos.y -= velocity_y * modifier;
                entities[i] = a;
            }
            if (a.todelete) {
                entities.splice(i, 1);
            }
        }
    };

    var update = function () {
        for (var i = 0; i < entities.length; i++) {
            var a = entities[i];
            if (a.ishit) {
                a.ishit = false;
                a.lifes -= 1;
                if (a.lifes < 1) {
                    entities.splice(i, 1);
                }
            }
        }
    };
    var render = function () {
        if (bgReady) {
            ctx.drawImage(bgImage, 0, 0);
        }
        for (var ii = 0; ii < entities.length; ii++) {
            PaintEntity(ctx, entities[ii]);
        }
    };
    var addWalls = function () {
        var wall;
        wall = new Wall(0, 0, 800, 20);
        walls.push(wall);
        entities.push(wall);
        wall = new Wall(0, 780, 800, 20);
        walls.push(wall);
        entities.push(wall);
        wall = new Wall(780, 0, 20, 800);
        walls.push(wall);
        entities.push(wall);
        wall = new Wall(0, 20, 20, 780);
        walls.push(wall);
        entities.push(wall);

    };
    var Start = function () {
       // entities = getEntityList();
       // playerList = getPlayerList();
        now = Date.now();
        delta = now - then;
        if (LocalPlayer != undefined) {
            updatePlayer(delta / 1000);
        }
        updateBullets(delta / 1000);
        update();
        Collision(5);

        then = now;

      //  UpdateEntityList(entities);
       // updatePlayerList(playerList);
        
        requestAnimationFrame(Start);
    };



    return{
        Start: Start,
        addPlayer: addPlayer,
        addWalls: addWalls,
        render: render
    }

};
function GameStart() {
    var game1 = new game();
    game1.addWalls();
    game1.addPlayer();
    game1.addPlayer();
    game1.Start();
}

//emit game1 naar server.
