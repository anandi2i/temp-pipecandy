/* This file is ignored in eslint
** make sure that your code indentation and quality
*/

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

function enableSideNavDropDown() {
  $(".side-nav-user-pic i").unbind("click").click(function(){
    $(this).toggleClass("active");
    $(".side-nav .side-nav-drop-down").slideToggle("slow");
  });
}

function enableNewTabs() {
  var newTab = $(".new-tabs");
  newTab.find(".tabs").click(function(){
    newTab.find(".position").removeClass("active");
    newTab.find(".tabs").removeClass("active");
    $(this).addClass("active").prev().addClass("active");
  });
}

function enableToolTip() {
  $(".tooltipped").tooltip();
}

function enabledropDownBtn(){
  $(".dropdown-button").dropdown({
    inDuration: 300,
    outDuration: 225,
    constrain_width: false,
    hover: false,
    gutter: 0,
    belowOrigin: true,
    alignment: "right"
  });
}
