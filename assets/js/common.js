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

function enableToolTip() {
  $(".tooltipped").tooltip();
}

function displayError(error) {
  const timeToShow = 4000;
  if(error) {
    $(".toast").remove();
    Materialize.toast("<img src='/images/warning-icon.png' />"+ error,timeToShow);
  }
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

function enabledropDownBtnByID(id){
  $(id).dropdown({
    inDuration: 300,
    outDuration: 225,
    constrain_width: true,
    hover: false,
    gutter: 0,
    belowOrigin: true,
    alignment: "right"
  });
}

function initTinyMCE(id, toolBar, dropdownId){
  var getFocusId = id.split("#")[1];
  tinymce.init({
    selector: id,
    inline: true,
    height : 150,
    menubar:false,
    browser_spellcheck: true,
    contextmenu: false,
    auto_focus: getFocusId,
    fixed_toolbar_container: toolBar,
    plugins: [
      "advlist autolink lists link image charmap print preview anchor",
      "insertdatetime media table contextmenu paste code"
    ],
    setup : function(editor) {
      $(dropdownId + " li").off("click").on("click", function(event) {
        editor.insertContent("&nbsp;&lt;" +
          event.currentTarget.innerText.trim() +
          "&gt;&nbsp;"
        );
      });
    },
    toolbar: "bold italic underline | alignleft aligncenter alignright alignjustify | link image"
  });
}
