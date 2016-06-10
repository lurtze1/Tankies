//var socket = io.connect('http://localhost:8080');
var currentRoom = "";
var localGame;
var ID;
var ready = false;
var name = "";




// on connection to server, ask for user's name with an anonymous callback
function lobbyStart(){
  name = prompt("What's your name?");
    //socket.on('connect', function(){
        // call the server-side function 'adduser' and send one parameter (value of prompt)
        socket.emit('adduser', name);
        console.log('My username is: ' + name);
  //  localGame = new game();
  //  localGame.addWalls();


    //localGame.Start();
    //});

}

//functies om game the initialiseren...
socket.on('createGameObject', function(){
  localGame = new game();
  console.log('Game created.');
})
socket.on('createWalls', function(){
  localGame.addWalls();

});
socket.on('addPlayer', function(){
  localGame.addPlayer();
  socket.emit('playerAdded', true);
});
socket.on('startGame', function(){
  localGame.Loop();
});
function GameStartLocal() {


    localGame.Start();
}

function joinGame(){
    localGame.addPlayer(ID);
    document.getElementById('joinbutton').disabled = 'disabled';
}

function readyUp(){
//nog te implementeren
    if(ready){
        ready = false;
        socket.emit('ready', false);
        document.getElementById("readyButton").style.background='red';
    } else if (!ready) {
        socket.emit('ready', true);
        document.getElementById("readyButton").style.background='green';
        document.getElementById('joinbutton').disabled = false;
        ready = true;
    }
    console.log("readyUp called!");
}

/*socket.on('joinGame', function (){
    localGame.addPlayer(ID);

});*/



socket.on('ID', function(uniqueID){
    ID = uniqueID;
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
    $('#conversation').append('<p class="whiteletters"><b>'+username + ':</b> ' + data + '</p><br>');
});

/*socket.on('updateUsers', function(userList){
    $('#localusers').empty();
    userList.forEach(function(value){

        $('#localusers').append('<div><p class="whiteletters">' + value + '</p></div>');
    });
});*/

socket.on('updateUsers', function(userList){
  $('#localusers').empty();
  userList.forEach(function(value){
    $('#localusers').append('<div><p class="whiteletters">' + value.name + '</p></div>');
  });

});

// listener, whenever the server emits 'updaterooms', this updates the room the client is in
socket.on('updaterooms', function(rooms, current_room) {
    $('#rooms').empty();
    $.each(rooms, function(key, value) {
        if(value == current_room){
            $('#rooms').append('<div><p class="whiteletters">' + value + '</p></div>');
            currentRoom = value;
        }
        else {
           // $('#rooms').append('<div><a href="#" onclick="switchRoom(\''+value+'\')">' + value + '</a></div>');
            $('#rooms').append('<div><button onclick="switchRoom(\''+value+'\')">' + value + '</button></div>');

        }
    });
});

socket.on('playerThatNeedsToJoin', function(list){
  if(name == list[0].name){
  console.log('playerThatNeedsToJoin called!');
  localGame.addWalls();
  localGame.addPlayer(list[0].ID);
  console.log(list[0].ID + ' added.');
  list.splice(0, 1);
  socket.emit('returnArrayPlayersThatNeedToJoin', list);
  }
})


function switchRoom(room){
    socket.emit('switchRoom', room);
}

function clearchat(){

    $('#conversation').empty();

}
function addRoom(newRoom){
    var newRoom = $('#roomData').val();
    $('#roomData').val('');
    socket.emit('addroom', newRoom, currentRoom);

}

function sendMessage(){

        var message = $('#data').val();
        $('#data').val('');
        // tell server to execute 'sendchat' and send along one parameter
        socket.emit('sendchat', message);


}


// on load of page
$(function(){
    // when the client clicks SEND
    $('#datasend').click( function() {
        var message = $('#data').val();
        $('#data').val('');
        // tell server to execute 'sendchat' and send along one parameter
        socket.emit('sendchat', message);
    });



    // when the client hits ENTER on their keyboard
    $('#data').keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $('#datasend').focus().click();
        }
    });
});
