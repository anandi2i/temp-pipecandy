$( document ).ready(function() {
	if($('.auth-container').length) {
	    var position = $('.auth-container').position();
	    if(position && position.top <= 50){
	      $('.auth-container').css("margin-top", "50px");
	    }
    }
});
