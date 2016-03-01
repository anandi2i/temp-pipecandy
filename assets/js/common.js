$( document ).ready(function() {
  if($(".side-nav-btn").length) {
    $(".side-nav-btn").sideNav();
  }
  if($(".auth-container").length) {
    var position = $(".auth-container").position();
    var getPosition = 50;
    if(position && position.top <= getPosition){
      $(".auth-container").css("margin-top", "50px");
    }
  }
  $("#mainNav ul li a").click(function() {
    $("#mainNav ul li a").removeClass("active");
    $(this).addClass("active");
  });
  $(".tooltipped").on("however", function() {
    $(".tooltipped").tooltip();
  });
});
