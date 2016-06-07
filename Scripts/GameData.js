//======commented voor connectie met server die nog niet werkt======
//var socket = io.connect('http://localhost:8080');
//======commented voor connectie met server die nog niet werkt======

// Contructor for Vector, made shorter for simplicity
//var wait=require('wait.for');

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
    var entities = [];
    var LocalEntities = [];
    var walls = [];
    var playerList = [];
    var bgReady = false;
    //player & ent list update booleans
    var entUpd = false;
    var plaUpd = false;
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
    var then = 0;

    /*//======commented voor connectie met server die nog niet werkt======
     //======commented voor connectie met server die nog niet werkt======*/

    //functies voor updaten player & entity list
    var removeEntity = function (entity) {
        socket.emit('removeEntity', entity);
    };

    var addEntity = function (entity) {
        socket.emit('addEntity', entity);
    };

    var updateEntity = function (entity) {
        socket.emit('updateEntity', entity);
    };

    function UpdateEntityList() {
        socket.emit('updateEntityList', entities);
    }

    function getEntityList() {
        socket.emit('getEntityList');
    }

    function getPlayerList() {
        socket.emit('getPlayerList');
    }

    function updatePlayerList() {
        socket.emit('updatePlayerList', playerList);
    }

    socket.on('addEntity', function (entity) {
        var angle = entity.polygon.angle;
        entity.polygon = P(V(entity.polygon.pos.x, entity.polygon.pos.y), entity.polygon.points);
        entity.polygon.angle = angle;
        entities.push(entity);
        LocalEntities.push(entity);
    });

    socket.on('updateEntity', function (entity) {
        var angle = entity.polygon.angle;
        entity.polygon = P(V(entity.polygon.pos.x, entity.polygon.pos.y), entity.polygon.points);
        entity.polygon.angle = angle;
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].ID == entity.ID) {
                entities[i] = entity;
                break;
            }
        }
    });

    socket.on('removeEntity', function (entity) {
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].ID == entity.ID) {
                entities.splice(i, 1);
            }
        }
    });

    socket.on('LatestUpdatedEntityList', function (EntityList) {
        entities = EntityList;
        entUpd = true;
    });

    socket.on('LatestUpdatedPlayerList', function (PlayerList) {
        playerList = PlayerList;
        plaUpd = true;
    });

    socket.on('updatedPlayerList', function (bool) {
        if (!bool) {
            //mogelijke iets doen als er false terugkomt, laat het voorlopig even leeg.
        }
    });


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

        this.width = 10;

        this.height = 10;

        //degrees in a turn in a second
        this.turnspeed = 180 * TO_RADIANS;

        //Polygon holds angle, position, size, offset.
        this.polygon = P(V(x, y), [V(0, 0), V(this.width, 0), V(this.width, this.height), V(0, this.height)]);
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
        if (Entity.istank == true) {

            //for youri how to do image
            /*if(TankReady){
             var pattern = ctx.createPattern(TankImage,"repeat");
             context.fillStyle = pattern;
             }else{*/
            context.fillStyle = "#4CD64C";
            //}


        }
        if (Entity.isbullet == true) {
            context.fillStyle = "#D64C4C";
        }
        if (Entity.iswall == true) {
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
    function Bullet(team, angle, pos, playerID) {
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


    //For the local player, checks if the player can fire and if he can fires the gun for the localplayer.
    var Fire = function () {
        var LocalPlayer;
        for (var i = 0; i < LocalEntities.length; i++) {
            if (LocalEntities[i].istank && LocalEntities[i].ID !== undefined) {
                LocalPlayer = LocalEntities[i];
            }
        }
        if (LocalPlayer.CurrentCooldown >= 60) {
            var bullet;
            bullet = new Bullet(LocalPlayer.team, LocalPlayer.polygon.angle, LocalPlayer.polygon.pos, LocalPlayer.playerID);
            addEntity(bullet);
            LocalPlayer.CurrentCooldown = 0;
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
        var LocalPlayer;
        var players = 0;
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].istank) {
                players++
            }
        }
        if (playerList === undefined) {
            playerList = [];
        }
        if (entities === undefined) {
            entities = [];
        }
        if (players == 0) {
            LocalPlayer = new Tank(100, 100, ID, 1);
            addEntity(LocalPlayer);
        } else if (players == 1) {
            LocalPlayer = new Tank(650, 650, ID, 2);
            addEntity(LocalPlayer);
        } else if (players == 2) {
            LocalPlayer = new Tank(50, 650, ID, 3);
            addEntity(LocalPlayer);
        } else if (players == 3) {
            LocalPlayer = new Tank(650, 50, ID, 4);
            addEntity(LocalPlayer);
        }
    };

    //Checks for collision a number of times equal to the loopCount.
    var Collision = function (loopCount) {
        for (var i = 0; i < loopCount; i++) {
            // Naively check for collision between all pairs of entities
            // E.g if there are 4 entities: (0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)
            var aCount = 0;
            for (aCount; aCount < LocalEntities.length; aCount++) {
                var a = LocalEntities[aCount];
                var bCount = 0;
                for (bCount; bCount < entities.length; bCount++) {
                    var b = entities[bCount];
                    var collided;
                    var aData = a.polygon;
                    var bData = b.polygon;
                    if (a.istank && b.istank && a.playerID != b.playerID) {
                        collided = SAT.testPolygonPolygon(aData, bData, This.response);
                    }
                    if (a.istank && b.iswall) {
                        collided = SAT.testPolygonPolygon(aData, bData, This.response);
                    }
                    if (a.isbullet && b.iswall) {
                        collided = SAT.testPolygonPolygon(aData, bData, This.response);
                        if (collided) {
                            removeEntity(a);
                        }
                    }
                    if (a.istank && b.isbullet && a.team != b.team) {
                        collided = SAT.testPolygonPolygon(aData, bData, This.response);
                        if (collided) {
                            a.lifes -= 1;
                            removeEntity(b);
                            if (a.lifes >= 0) {
                                removeEntity(a);
                            }
                        }
                    }

                    if (collided) {
                        if (a.istank && !b.isbullet) {
                            respondToCollision(a, b, This.response);
                        }
                    }
                    This.response.clear();
                }

            }
        }
    };

    //Updates the location etc of the player every tick. Takes the deltatime to modify movement etc.
    var updatePlayer = function (modifier) {
        var LocalPlayer;
        for (var i = 0; i < LocalEntities.length; i++) {
            if (LocalEntities[i].istank && LocalEntities[i].ID !== undefined) {
                LocalPlayer = LocalEntities[i];
            }
        }
        if (LocalPlayer != undefined) {
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
            LocalPlayer.CurrentCooldown += LocalPlayer.Cooldown * modifier;
            LocalPlayer.polygon.angle = angle;
            LocalPlayer.polygon._recalc();
            updateEntity(LocalPlayer);
        }
    };


    //updates the Bullets every tick. Checks if the bullet has to be deleted.
    //Takes the delta time as a modifier for movement.
    var updateBullets = function (modifier) {
        for (var i = 0; i < LocalEntities.length; i++) {
            var a = LocalEntities[i];
            if (a.isbullet) {
                var angle = a.polygon.angle;
                var velocity_x = a.speed * Math.cos(angle);
                var velocity_y = -(a.speed) * Math.sin(angle);
                a.polygon.pos.x += velocity_x * modifier;
                a.polygon.pos.y -= velocity_y * modifier;
                a.polygon._recalc();
                updateEntity(a)
            }
        }
    };

    var render = function () {
        /*if (bgReady) {
         ctx.drawImage(bgImage, 0, 0);
         }*/
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var ii = 0; ii < entities.length; ii++) {
            PaintEntity(ctx, entities[ii]);
        }
    };
    var addWalls = function () {
        var wall;
        wall = new Wall(0, 0, 800, 20);
        addEntity(wall);
        wall = new Wall(0, 780, 800, 20);
        addEntity(wall);
        wall = new Wall(780, 0, 20, 800);
        addEntity(wall);
        wall = new Wall(0, 20, 20, 780);
        addEntity(wall);

    };
    var Loop = function () {
        now = Date.now();
        //getEntityList();
        delta = now - then;
        updatePlayer(delta / 1000);
        updateBullets(delta / 1000);
        Collision(1);
        render();
        then = now;
        requestAnimationFrame(Loop);
    };

    return {
        Loop: Loop,
        addPlayer: addPlayer,
        addWalls: addWalls,
        render: render
    }

};

//emit game1 naar server.
