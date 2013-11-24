$(function() {
  window.keydown = {};
  
  function keyName(event) {
    return jQuery.hotkeys.specialKeys[event.which] ||
      String.fromCharCode(event.which).toLowerCase();
  }
  
  $("#game-canvas").bind("keydown", function(event) {
    keydown[keyName(event)] = true;
  });
  
  $("#game-canvas").bind("keyup", function(event) {
    keydown[keyName(event)] = false;
  });
});
