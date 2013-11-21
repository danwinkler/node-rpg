if( typeof exports == 'undefined' ) {
    var exports = this['common'] = {};
}

exports.mapCoordsFromPlayerCoords = function( x, y ) {
	var ix = Math.floor( x/(20*50) );
	var iy = Math.floor( y/(20*50) );
	return { "x": ix, "y": iy }
}