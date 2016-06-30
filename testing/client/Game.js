/**
 * Created by Youri van Dorp on 6/29/2016.
 */
var TO_RADIANS = Math.PI / 180;
var TO_DEGREES = 180 / Math.PI;
var ctx = document.getElementById("ctx").getContext("2d");

var socket = io();
var i;
socket.on('newPositions', function(data) {
    ctx.clearRect(0, 0, 500, 500);
    for (i = 0; i < data.player.length; i++) {
        ctx.save();
        ctx.translate(data.player[i].polygon.pos.x, data.player[i].polygon.pos.y);
        ctx.rotate(data.player[i].polygon.angle);
        ctx.beginPath();
        var entitypoint = data.player[i].polygon.points;
        ctx.moveTo(entitypoint[0].x, entitypoint[0].y);
        for (ii = 1; ii < entitypoint.length; ii++) {
            ctx.lineTo(entitypoint[ii].x, entitypoint[ii].y);
        }
        ctx.closePath();
        ctx.fillStyle = "lime";

        ctx.fill();
        ctx.stroke();

        ctx.clip();

        ctx.restore();
    }
    for (i = 0; i < data.wall.length; i++) {
        ctx.save();
        ctx.translate(data.wall[i].polygon.pos.x, data.wall[i].polygon.pos.y);
        // rotate around this point
        ctx.rotate(-data.wall[i].polygon.angle);
        ctx.beginPath();
        entitypoint = data.wall[i].polygon.points;
        ctx.moveTo(entitypoint[0].x, entitypoint[0].y);
        for (ii = 1; ii < entitypoint.length; ii++) {
            ctx.lineTo(entitypoint[ii].x, entitypoint[ii].y);
        }
        ctx.closePath();
        ctx.fillStyle = "lime";

        ctx.fill();
        ctx.stroke();

        ctx.clip();

        ctx.restore();
    }
    for (i = 0; i < data.bullet.length; i++) {
        ctx.save();
        ctx.translate(data.bullet[i].polygon.pos.x, data.bullet[i].polygon.pos.y);
        ctx.rotate(data.bullet[i].polygon.angle);
        ctx.beginPath();
        entitypoint = data.bullet[i].polygon.points;
        ctx.moveTo(entitypoint[0].x, entitypoint[0].y);
        for (var ii = 1; ii < entitypoint.length; ii++) {
            ctx.lineTo(entitypoint[ii].x, entitypoint[ii].y);
        }
        ctx.closePath();
        ctx.fillStyle = "#FF0000";

        ctx.fill();
        ctx.stroke();

        ctx.clip();

        ctx.restore();
    }
});

socket.on('Victory', function(destination) {
    window.location.href = destination;
});

socket.on('Defeat', function(destination) {
    window.location.href = destination;
});
socket.on('Shoot', function() {
    var shoot = new Audio('sounds/shoot.mp3');
    shoot.play();
});
socket.on('WaitingDone', function() {
    $( "#Waiting").remove();
    $( "#loader").remove();
    $( "#ctx").removeClass('hide');
    var backgroundmusic = new Audio('sounds/background.mp3');
    backgroundmusic.addEventListener('ended', function() {
        this.currentTime = 0;
        this.volume = 0.1;
        this.play();
    }, false);
    backgroundmusic.play();
});
document.onkeydown = function(event) {
    if (event.keyCode === 68)    //d
    {
        socket.emit('keyPress', {
            inputId: 'right',
            state: true
        });
    }
    else if (event.keyCode === 83)   //s
    {
        socket.emit('keyPress', {
            inputId: 'down',
            state: true
        });
    }
    else if (event.keyCode === 65) //a
    {
        socket.emit('keyPress', {
            inputId: 'left',
            state: true
        });
    }
    else if (event.keyCode === 87) // w
    {
        socket.emit('keyPress', {
            inputId: 'up',
            state: true
        });
    }
    else if (event.keyCode === 32) // w
    {
        socket.emit('keyPress', {
            inputId: 'attack',
            state: true
        });
    }

};
document.onkeyup = function(event) {
    if (event.keyCode === 68) {  //d
        socket.emit('keyPress', {
            inputId: 'right',
            state: false

        });
    }
    else if (event.keyCode === 83)   //s
    {
        socket.emit('keyPress', {
            inputId: 'down',
            state: false
        });
    }
    else if (event.keyCode === 65) //a
    {
        socket.emit('keyPress', {
            inputId: 'left',
            state: false
        });
    }
    else if (event.keyCode === 87) // w
    {
        socket.emit('keyPress', {
            inputId: 'up',
            state: false
        });
    }
    else if (event.keyCode === 32) // w
    {
        socket.emit('keyPress', {
            inputId: 'attack',
            state: false
        });
    }
};


