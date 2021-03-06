var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var common = require("./public/js/common.js");
var util = require('util');

server.listen(8080);

var gd = {
	map: {},
	players: {}
};

function genMap( x, y ) {
	map = [];
	for( var xx = 0; xx < common.mapSize.x; xx++ ) {
		map[xx] = [];
		for( var yy = 0; yy < common.mapSize.y; yy++ ) {
			map[xx][yy] = Math.random() > .95 ? 1 : 0;
		}	
	}
	return map;
}

function getMap( x, y ) {
	var map = gd.map[ x + "," + y ];
	if( !map ) {
		map = gd.map[ x + "," + y ] = genMap( x, y );
	}
	return map;
}

var playerSocket = {};
var socketPlayer = {};

app.use( express.static( __dirname + "/public" ) );

app.get("/", function (req, res) {
	res.sendfile(__dirname + "/client.html");
});

io.sockets.on("connection", function (socket) {
	socket.on("login", function (data) {
		var player;
		if( !(data.name in gd.players) ) {
			player = {};
			player.name = data.name;
			player.x = 0;
			player.y = 0;
			gd.players[data.name] = player;
		} else {
			player = gd.players[data.name];
		}
		playerSocket[player.name] = socket;
		socketPlayer[socket.id] = player;
		socket.emit( "loginSuccess", player );
		for( var playerName in gd.players ) {
			socket.emit( "playerUpdate", gd.players[playerName] );
		}
	});
	
	socket.on( "move", function(pd) {
		var player = socketPlayer[socket.id];
		console.log( socketPlayer );
		player.x = pd.x;
		player.y = pd.y;
		socket.broadcast.emit( "playerUpdate", player );
	});
	
	socket.on( "requestMap", function() {
		var player = socketPlayer[socket.id];
		var mapCoords = common.mapCoordsFromPlayerCoords( player.x, player.y );
		var maps = [];
		for( var x = -1; x <= 1; x++ ) {
			for( var y = -1; y <= 1; y++ ) {
				maps.push( { "x": mapCoords.x+x, "y": mapCoords.y+y, "map": getMap( mapCoords.x+x, mapCoords.y+y ) } );
			}
		}
		socket.emit( "mapUpdate", maps );
	});
	
	socket.on( "disconnect", function() {
		var player = socketPlayer[socket.id];
		if( player.name in playerSocket ) delete playerSocket[player.name];
		if( socket.id in socketPlayer ) delete socketPlayer[socket.id];
		if( player.name in gd.players ) delete gd.players[player.name];
		socket.broadcast.emit( "playerDisconnect", player.name );
	});
	
	socket.on( "chat", function( text ) {
		var player = socketPlayer[socket.id];
		io.sockets.emit( "chat", { "player": player.name, "text": text } );
	} );
});