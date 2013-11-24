$(function() {
	var ENTER_KEY = 13;
	
	var canvas = document.getElementById("game-canvas");
	var g = canvas.getContext("2d");
	
	
	g.canvas.width = 800;
	g.canvas.height = 600;

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
	
	var currentMap = { x:0, y:0 };
	var currentCenter = { x: 0, y: 0 };
	
	var playerSheets = {
	};
	
	function getMap( x, y ) {
		return maps[ x + "," + y ];
	}
	
	function setMap( x, y, map ) {
		var key = x + "," + y;
		maps[key] = map;
	}
	
 	socket.emit( "login", { "name": username } );
	
	socket.on( "loginSuccess", function( player ) {
		players[player.name] = player;
		username = player.name;
		socket.emit( "requestMap" );
	});
	
	socket.on( "mapUpdate", function( maps ) {
		playerSheets = {};
		sheetengine.scene.init( canvas, {w:g.canvas.width*10,h:g.canvas.height*10} );
		var player = players[username];
		var mapCoords = common.mapCoordsFromPlayerCoords( player.x, player.y );
		for( var i = 0; i < maps.length; i++ ) {
			var mapInfo = maps[i];
			setMap( mapInfo.x, mapInfo.y, mapInfo.map );
			var xOffset = (mapInfo.x - mapCoords.x) * common.tileSize.x*common.mapSize.x;
			var yOffset = (mapInfo.y - mapCoords.y) * common.tileSize.y*common.mapSize.y;
			var map = mapInfo.map;
			map.basesheets = [];
			for( var x = 0; x < map.length; x++ ) {
				var row = map[x];
				for( var y = 0; y < row.length; y++ ) {
					var basesheet = new sheetengine.BaseSheet( {x:x*common.tileSize.x + xOffset,y:y*common.tileSize.y + yOffset,z:0}, {alphaD:90,betaD:0,gammaD:0}, {w:common.tileSize.x,h:common.tileSize.y} );
					switch( row[y] ) {
						case 0: {
							basesheet.color = '#5D7E36';
							break;
						}
						case 1: {
							basesheet.color = '#888888';
							break;
						}	
					}
					map.basesheets.push( basesheet );
				}
			}
		}
		sheetengine.calc.calculateAllSheets();
		
		currentCenter.x = mapCoords.x * common.tileSize.x * common.mapSize.x;
		currentCenter.y = mapCoords.y * common.tileSize.y * common.mapSize.y;
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
	
	socket.on( "playerDisconnect", function( playerName ) {
		try {
			var p = players[playerName];
			playerSheets[playerName].destroy();
			delete players[playerName];
		} catch( e )
		{
			console.log( "player didn't exist" );
		}
	});
	
	function update() {
		var player = players[username];
		if( !player ) return;
		
		var mapCoords = common.mapCoordsFromPlayerCoords( player.x, player.y );
		if( mapCoords.x != currentMap.x || mapCoords.y != currentMap.y ) {
			currentMap = mapCoords;
			socket.emit( "requestMap" );
		}
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
			var sobj = playerSheets[playerName];
			if( !sobj ) {
				var sheet1 = new sheetengine.Sheet({x:0,y:-14,z:14}, {alphaD:45,betaD:0,gammaD:0}, {w:40,h:40});
				sheet1.context.fillStyle = '#F00';
				sheet1.context.fillRect(0,0,40,40);
				sheet1.context.clearRect(10,10,20,20);

				var sheet2 = new sheetengine.Sheet({x:0,y:14,z:14}, {alphaD:-45,betaD:0,gammaD:0}, {w:40,h:40});
				sheet2.context.fillStyle = '#FFF';
				sheet2.context.fillRect(0,0,40,40);
				sheet2.context.clearRect(10,10,20,20);
				var ws = common.worldSpace( op.x, op.y );
				sobj = new sheetengine.SheetObject(
				  {x:ws.x,y:ws.y,z:0}, 
				  {alphaD:0,betaD:0,gammaD:0}, 
				  [sheet1, sheet2], 
				  {w:80,h:80,relu:40,relv:50});
				
				playerSheets[playerName] = sobj;
			}
			sobj.setPosition( { x: op.x - currentCenter.x, y: op.y - currentCenter.y, z: 0 } );
		}
	
		sheetengine.scene.setCenter( { x: player.x - currentCenter.x, y: player.y - currentCenter.y, z: 0 } );
		
		sheetengine.calc.calculateChangedSheets();
		sheetengine.drawing.drawScene(true);
	}
	
	setInterval( update, 1000/30 );
	
	//Chat related stuff
	socket.on( "chat", function( d ) {
		$( "#chat-view" ).append( '<div class="message"><span class="username">' + d.player + ': </span><span class="text">' + d.text + '</span></div>' );
	});
	
	$( "#game-canvas" ).bind( "keyup", function( e )  {
		var code = e.keyCode || e.which;
		if( code == ENTER_KEY ) {
			$( "#chat-box" ).focus();
		}
	});
	
	$( "#chat-box" ).bind( "keyup", function( e ) {
		var code = e.keyCode || e.which;
		if( code == ENTER_KEY ) {
			socket.emit( "chat", $(this).val() );
			$(this).val( "" );
			$("#game-canvas").focus();
		}
	} );
});  