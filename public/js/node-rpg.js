$(function() {
	var canvas = document.getElementById("game-canvas");
	var g = canvas.getContext("2d");
	
	g.canvas.width = 960;
	g.canvas.height = 600;
	
	sheetengine.scene.init( canvas, {w:g.canvas.width*3,h:g.canvas.height*3} );

	var socket = io.connect('http://triggerly.com:8080');
	
	//TEMP
	function makeid()
	{
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for( var i=0; i < 5; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}
	
	var username = makeid();
	
	var walkSpeed = 3;
	var runSpeed = 6;
	
	var players = {
	};
	
	var maps = {
	};
	
	var loadedSheets = {
	};
	
	function getMap( x, y ) {
		return maps[ x + "," + y ];
	}
	
	function setMap( x, y, map ) {
		maps[ x + "," + y ] = map;
	}
	
 	socket.emit( "login", { "name": username } );
	
	socket.on( "loginSuccess", function( player ) {
		players[player.name] = player;
		username = player.name;
		socket.emit( "requestMap" );
	});
	
	socket.on( "mapUpdate", function( mapInfo ) {
		setMap( mapInfo.x, mapInfo.y, mapInfo.map );
		var player = players[username];
		var mapCoords = common.mapCoordsFromPlayerCoords( player.x, player.y );
		var xOffset = (mapInfo.x - mapCoords.x) * 50*20;
		var yOffset = (mapInfo.y - mapCoords.y) * 50*20;
		var map = mapInfo.map;
		for( var x = 0; x < map.length; x++ ) {
			var row = map[x];
			for( var y = 0; y < row.length; y++ ) {
				var basesheet = new sheetengine.BaseSheet( {x:x*50 + xOffset,y:y*50 + yOffset,z:0}, {alphaD:90,betaD:0,gammaD:0}, {w:50,h:50} );
				basesheet.color = '#5D7E36';
			}
		}
		sheetengine.calc.calculateAllSheets();
	});
	
	socket.on( "playerUpdate", function( player ) {
		if( !(player.name in players) ) {
			players[player.name] = player;
		} else
		{
			players[player.name].x = player.x;
			players[player.name].y = player.y;
		}
	});
	
	function update() {
		var player = players[username];
		if( !player ) return;
		
		var mapCoords = common.mapCoordsFromPlayerCoords( player.x, player.y );
		var map = getMap( mapCoords.x, mapCoords.y );
		
		if( !map ) return;
		
		var moved = false;
		if( keydown.a ) {
			player.x -= keydown.shift ? runSpeed : walkSpeed;
			player.y += keydown.shift ? runSpeed : walkSpeed;
			moved = true;
		}
		
		if( keydown.d ) {
			player.x += keydown.shift ? runSpeed : walkSpeed;
			player.y -= keydown.shift ? runSpeed : walkSpeed;
			moved = true;
		}
		
		if( keydown['w'] ) {
			player.x -= keydown.shift ? runSpeed : walkSpeed;
			player.y -= keydown.shift ? runSpeed : walkSpeed;
			moved = true;
		}
		
		if( keydown['s'] ) {
			player.x += keydown.shift ? runSpeed : walkSpeed;
			player.y += keydown.shift ? runSpeed : walkSpeed;
			moved = true;
		}
		
		if( moved ) {
			socket.emit( "move", { "x": player.x, "y": player.y } );
		}
		
		for( var playerName in players ) {
			var op = players[playerName];
			if( !op.sobj ) {
				var sheet1 = new sheetengine.Sheet({x:0,y:-14,z:14}, {alphaD:45,betaD:0,gammaD:0}, {w:40,h:40});
				sheet1.context.fillStyle = '#F00';
				sheet1.context.fillRect(0,0,40,40);
				sheet1.context.clearRect(10,10,20,20);

				var sheet2 = new sheetengine.Sheet({x:0,y:14,z:14}, {alphaD:-45,betaD:0,gammaD:0}, {w:40,h:40});
				sheet2.context.fillStyle = '#FFF';
				sheet2.context.fillRect(0,0,40,40);
				sheet2.context.clearRect(10,10,20,20);

				op.sobj = new sheetengine.SheetObject(
				  {x:op.x,y:op.y,z:0}, 
				  {alphaD:0,betaD:0,gammaD:0}, 
				  [sheet1, sheet2], 
				  {w:80,h:80,relu:40,relv:50});
			}
			op.sobj.setPosition( { x: op.x, y: op.y, z: 0 } );
		}
		
		sheetengine.scene.setCenter( {x:player.x, y:player.y, z:0} );
		
		sheetengine.calc.calculateAllSheets();
		sheetengine.drawing.drawScene(true);
	}
	
	setInterval( update, 1000/30 );
});  