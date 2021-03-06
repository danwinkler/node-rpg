if( typeof exports == 'undefined' ) {
    var exports = this['common'] = {};
}

exports.mapCoordsFromPlayerCoords = function( x, y ) {
	var ix = Math.floor( x/(exports.mapSize.x*exports.tileSize.x) );
	var iy = Math.floor( y/(exports.mapSize.y*exports.tileSize.y) );
	return { "x": ix, "y": iy };
}

exports.worldSpace = function( x, y ) {
	var mapX = (exports.mapSize.x*exports.tileSize.x);
	var mapY = (exports.mapSize.y*exports.tileSize.y);
	var rx = x % mapX;
	if( x < 0 ) rx = (mapX + rx); //Because modulus doesn't do what we want when n < 0
	var ry = y % mapY;
	if( y < 0 ) ry = (mapY + ry);
	return { "x": rx, "y": ry };
}

exports.mapSize = { x:20, y:20 };
exports.tileSize = { x:100, y:100 };