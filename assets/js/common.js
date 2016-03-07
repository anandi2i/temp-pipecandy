$(document).ready(function() {
  if ($(".side-nav-btn").length) {
    $(".side-nav-btn").sideNav();
  }
  if ($(".auth-container").length) {
    var position = $(".auth-container").position();
    var getPosition = 50;
    if (position && position.top <= getPosition) {
      $(".auth-container").css("margin-top", "50px");
    }
  }
});

/* Function should end with InJSX if it is called from JSX
  To ignore no-unused-vars in eslint */

function enableToolTipInJSX() {
  $(".tooltipped").tooltip();
}

function enabledropDownBtnInJSX(){
  $(".dropdown-button").dropdown({
    inDuration: 300,
    outDuration: 225,
    hover: true,
    gutter: 0,
    belowOrigin: true,
    alignment: "right"
  });
}
