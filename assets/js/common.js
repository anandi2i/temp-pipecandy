/* This file is ignored in eslint
** make sure that your code indentation and quality
*/

(function () {
"use strict";
let isOpenSideNav = false;
$(document).ready(function() {
  // Set tinymce plugin location
  tinymce.baseURL = "/tinymce";
  // Init UserAgent
  const userAgent = new UserAgent().parse(navigator.userAgent);
  if ($(".auth-container").length) {
    let position = $(".auth-container").position();
    let getPosition = 50;
    if (position && position.top <= getPosition) {
      $(".auth-container").css("margin-top", "50px");
    }
  }
});

function removeMaterialTooltip() {
  $(".material-tooltip").remove();
};
window.removeMaterialTooltip = removeMaterialTooltip;

function enableSideNavDropDown() {
  if ($(".side-nav-btn").length && !isOpenSideNav) {
    isOpenSideNav = true;
    $(".side-nav-btn").sideNav({
      closeOnClick: true
    });
  }
  $(".side-nav-user-pic i").unbind("click").click(function(){
    $(this).toggleClass("active");
    $(".side-nav .side-nav-drop-down").slideToggle("slow");
  });
}
window.enableSideNavDropDown = enableSideNavDropDown;

function enableToolTip() {
  $(".tooltipped").tooltip();
}
window.enableToolTip = enableToolTip;

function removeToast() {
  $("#toast-container").remove();
}
window.removeToast = removeToast;

function displayError(error) {
  if(error) {
    var guid = Math.random()*16|0;
    let warningContent = $("<div id='"+guid+"' class='top-notification'>", {})
      .append($("<div class='err-txt'>", {}).append(error)
      .append($("<i class='mdi mdi-close modal-close' onclick='closeNotification()'>", {})));
    hideNotification(".not-txt", guid, warningContent);
  }
}
window.displayError = displayError;

function displaySuccess(successInfo) {
  if(successInfo) {
    var guid = Math.random()*16|0;
    let successContent = $("<div id='"+guid+"' class='top-notification'>", {})
      .append($("<div class='success-txt'>", {}).append(successInfo)
      .append($("<i class='mdi mdi-close modal-close' onclick='closeNotification()'>", {})));
    hideNotification(".success-txt", guid, successContent);
  }
}
window.displaySuccess = displaySuccess;

function hideNotification(hoverContainer, id, content) {
  closeNotification();
  $("body").append(content);
  var $target = $("#"+id);
  var time = 5000;
  var timer = setTimeout(function() {
    $target.fadeOut('500', function(){ $target.remove(); });
  }, time);
  function handlerIn() {
    clearTimeout(timer);
  }
  function handlerOut() {
    timer = setTimeout(function() {
      $target.fadeOut('500', function(){ $target.remove(); });
    }, time);
  }
  $(hoverContainer).hover(handlerIn, handlerOut);
}
window.hideNotification = hideNotification;

function closeNotification() {
  $(".top-notification").remove();
}
window.closeNotification = closeNotification;

function enabledropDownBtn(element) {
  element = element || ".dropdown-button";
  $(element).dropdown({
    inDuration: 300,
    outDuration: 225,
    constrain_width: false,
    hover: false,
    gutter: 0,
    belowOrigin: true,
    alignment: "right"
  });
}
window.enabledropDownBtn = enabledropDownBtn;

function getIssueTagsInEditor(emailContent) {
  let unCommonTags = /<span[^>]+?class="tag un-common".*?>&#{0,1}[a-z0-9]+;;*?([\s\S]*?)&#{0,1}[a-z0-9]+;*?<\/span>/g;
  let match = unCommonTags.exec(emailContent);
  let result = [];
  while (match !== null) {
    result.push(RegExp.$1);
    match = unCommonTags.exec(emailContent);
  }
  return result;
}
window.getIssueTagsInEditor = getIssueTagsInEditor;

/**
 * Initiate a tinyMCE editor with properties and able to insert smart tags
 *
 * @param  {string} id - tinyMCE editor ID
 * @param  {HTML DIV} toolBar - tinyMCE toolbar position
 * @param  {string} dropdownId - smart tags dropdown Id
 * @param  {object} allTags - it contains all smart-tag objects by insert #mention
 * @param  {function} changeCb - callback function after insert tags in to the editor
 */
function initTinyMCE(id, toolBar, dropdownId, allTags, isToolbar, changeCb, content) {
  let getFocusId = id.split("#")[1];
  let toolbar = isToolbar;
  if(isToolbar) {
    toolbar = "bold italic underline | alignleft aligncenter alignright alignjustify | link | fontsizeselect fontselect";
  }
  tinymce.init({
    selector: id,
    font_formats: 'Sans Serif=arial,helvetica,sans-serif;Times New Roman=times new roman;Garamond=garamond,serif;Georgia=georgia,serif;Tahoma=tahoma,sans-serif;Trebuchet=trebuchet ms,sans-serif;Verdana=verdana,sans-serif;',
    fontsize_formats: "8pt 10pt 12pt 14pt",
    inline: true,
    height : 150,
    menubar: false,
    browser_spellcheck: true,
    contextmenu: false,
    auto_focus: getFocusId,
    fixed_toolbar_container: toolBar,
    toolbar: toolbar,
    entity_encoding: "raw",
    forced_root_block : 'div',
    plugins: [
      "advlist autolink lists link image charmap print preview anchor",
      "insertdatetime media table paste code",
      "link, mention"
    ],
    mentions: {
      source: allTags,
      delimiter: "#",
      items: 100,
      insert: (item) => {
        return constructSmartTags(item.classname, item.name, item.id);
      }
    },
    setup: (editor) => {
      const editorId = editor.getElement().id;
      editor.on("init", () => {
        editor.setContent(content || "");
        changeCb(editor);
      }).on("change", (e) => {
        changeCb(editor);
      }).on("focus", (e) => {
        const editorDom =  document.getElementById(editorId);
        if($(editorDom).find("a.tinymce-placeholder").length) {
          $(editorDom).find("a.tinymce-placeholder").closest("div").remove();
        }
      }).on("keyUp", (e) => {
        //Cursor focuses at end when the editor has only tag
        if(e.keyCode == 8) {
          const text = editor.selection.getRng(true).startContainer.data || '';
          if(text.length === 0) {
            editor.execCommand('mceInsertContent', false, '&#8203;');
          }
        }
      }).on("keyDown", (e) => {
        var evtobj = window.event? event : e;
        if (evtobj.keyCode == 90 && evtobj.ctrlKey) {
          changeCb(editor);
        }
      });
    }
  });
}
window.initTinyMCE = initTinyMCE;

function constructSmartTags(className, tagText, id) {
  return "<span data-tag='"+tagText+"' data-id='"+id+"' data-tag-name='"+tagText+"' class='tag "+className+"' contenteditable='false'>&lt;" +
    tagText + "&gt;</span>";
}
window.constructSmartTags = constructSmartTags;

function initTinyMCEPopUp(id, toolBar, isToolbar, cb) {
  let toolbar = isToolbar;
  if(isToolbar){
    toolbar = "bold italic underline | alignleft aligncenter alignright alignjustify | link";
  }
  let getFocusId = id.split("#")[1];
  tinymce.init({
    selector: id,
    inline: true,
    height : 150,
    menubar: false,
    browser_spellcheck: true,
    contextmenu: false,
    auto_focus: getFocusId,
    fixed_toolbar_container: toolBar,
    toolbar: toolbar,
    entity_encoding: "raw",
    forced_root_block : 'div',
    init_instance_callback : function() {
      cb();
    },
    plugins: [
      "advlist autolink lists link image charmap print preview anchor",
      "insertdatetime media table paste code"
    ]
  });
}
window.initTinyMCEPopUp = initTinyMCEPopUp;

/**
 * convert date to 12hr format
 * @param  {object} date - new Date
 * @return {string}      - 12hrs time
 */
function formatAMPM(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  let strTime = hours + ':' + minutes + ampm;
  return strTime;
}
window.formatAMPM = formatAMPM;

/**
 * init material time picker
 * @param  {boject} element - dom element to show time value.
 */
function initTimePicker(element) {
  const date = new Date();
  const index = 2;
  const defaultTime = formatAMPM(date);
  element.pickatime({
    twelvehour: true,
    default: "now",
    init: function(){
      element.val(defaultTime);
    }
  });
}
window.initTimePicker = initTimePicker;

/**
 * init material date picker
 * @param  {boject} element - dom element to show date value.
 */
function initDatePicker(element) {
  element.pickadate({
    selectMonths: true,
    selectYears: 15,
    min : true
  }).pickadate("picker").set("select", new Date());
}
window.initDatePicker = initDatePicker;
})();
