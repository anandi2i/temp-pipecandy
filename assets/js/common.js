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
    var warningContent = $("<div>", {})
      .append(
        $("<img>", {
          src: "/images/warning-icon.png"
        }))
      .append(
        $("<span>", {
          text: error
        }));
    Materialize.toast(warningContent, timeToShow);
  }
}

function displaySuccess(successInfo) {
  const timeToShow = 4000;
  if(successInfo) {
    $(".toast").remove();
    var successContent = $("<div>", {})
      .append(
        $("<img>", {
          src: "/images/success-icon.png"
        }))
      .append(
        $("<span>", {
          text: successInfo
        }));
    Materialize.toast(successContent, timeToShow);
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

function getIssueTagsInEditor(emailContent) {
  var unCommonTags = /<span[^>]+?class="tag un-common".*?>&#{0,1}[a-z0-9]+;;*?([\s\S]*?)&#{0,1}[a-z0-9]+;*?<\/span>/g;
  var match = unCommonTags.exec(emailContent);
  var result = [];
  while (match !== null) {
    result.push(RegExp.$1);
    match = unCommonTags.exec(emailContent);
  }
  return result;
}

// re-construct tag name to smart-tags
function constructEmailTemplate(str){
  var html = $.parseHTML(str);
  var findCommonTags = $(html).find('span.common');
  $.each(findCommonTags, function(key, val){
    var getTag = $(val).data("tag");
    $(val)[0].dataset.tagName  = getTag;
    $(val).html(getTag);
  });
  var steDom = $('<div/>').html(html);
  return $(steDom).html();
}

function initTinyMCE(id, toolBar, dropdownId, cb){
  var getFocusId = id.split("#")[1];

  tinymce.init({
    selector: id,
    inline: true,
    height : 150,
    menubar: false,
    browser_spellcheck: true,
    contextmenu: false,
    auto_focus: getFocusId,
    fixed_toolbar_container: toolBar,
    plugins: [
      "advlist autolink lists link image charmap print preview anchor",
      "insertdatetime media table paste code"
    ],
    setup : function(editor) {
      editor.on("change", function(e){
          cb(editor);
      });
      $(dropdownId + " li").off("click").on("click", function(event) {
        var currentText = event.currentTarget.innerText.trim();
        var className;
        if($(event.currentTarget).find("a").hasClass("common")) {
          className = "common";
        } else {
          className = "un-common";
        }
        editor.insertContent( constructSmartTags(className, currentText) );
      });
    },
    toolbar: "bold italic underline | alignleft aligncenter alignright alignjustify | link image"
  });
}

function constructSmartTags(className, tagText){
  return "<span data-tag='"+tagText+"' data-tag-name='"+tagText+"' class='tag "+className+"' contenteditable='false'>&lt;" +
    tagText + "&gt;</span>";
}

function initTinyMCEPopUp(id, toolBar, cb){
  var getFocusId = id.split("#")[1];
  tinymce.init({
    selector: id,
    inline: true,
    height : 150,
    menubar: false,
    browser_spellcheck: true,
    contextmenu: false,
    auto_focus: getFocusId,
    fixed_toolbar_container: toolBar,
    init_instance_callback : function() {
      cb();
    },
    plugins: [
      "advlist autolink lists link image charmap print preview anchor",
      "insertdatetime media table contextmenu paste code"
    ],
    toolbar: "bold italic underline | alignleft aligncenter alignright alignjustify | link"
  });
}
