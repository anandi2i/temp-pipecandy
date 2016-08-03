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
  var userAgent = new UserAgent().parse(navigator.userAgent);
  if ($(".auth-container").length) {
    let position = $(".auth-container").position();
    let getPosition = 50;
    if (position && position.top <= getPosition) {
      $(".auth-container").css("margin-top", "50px");
    }
  }
});

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
  const timeToShow = 4000;
  if(error) {
    $(".toast").remove();
    let warningContent = $("<div>", {})
      .append(
        $("<img>", {
          src: "/images/warning-icon.png",
          alt: "Warning"
        }))
      .append(
        $("<span>", {
          text: error
        }));
    Materialize.toast(warningContent, timeToShow, "", removeToast);
  }
}
window.displayError = displayError;

function displaySuccess(successInfo) {
  const timeToShow = 4000;
  if(successInfo) {
    $(".toast").remove();
    let successContent = $("<div>", {})
      .append(
        $("<img>", {
          src: "/images/success-icon.png"
        }))
      .append(
        $("<span>", {
          text: successInfo
        }));
    Materialize.toast(successContent, timeToShow, "", removeToast);
  }
}
window.displaySuccess = displaySuccess;

function enabledropDownBtn() {
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
window.enabledropDownBtn = enabledropDownBtn;

function enabledropDownBtnByID(id) {
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
window.enabledropDownBtnByID = enabledropDownBtnByID;

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
function initTinyMCE(id, toolBar, dropdownId, allTags, isToolbar, changeCb) {
  let getFocusId = id.split("#")[1];
  let toolbar = isToolbar;
  if(isToolbar) {
    toolbar = "bold italic underline | alignleft aligncenter alignright alignjustify | link image";
  }
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
    setup : (editor) => {
      const editorId = editor.getElement().id;
      editor.on("change", (e) => {
        changeCb(editor);
      }).on("focus", (e) => {
        const editorDom =  document.getElementById(editorId);
        if($(editorDom).find("a.tinymce-placeholder").length) {
          $(editorDom).find("a.tinymce-placeholder").closest("p").remove();
        }
      }).on("blur", (e) => {
        if(!editor.getContent()) {
          let content = "";
          if(editorId === "emailSubject") {
            content = "Subject";
          } else if (editorId === "optOutAddress") {
            content = null;
          } else {
            content = "content";
          }
          if(content) {
            editor.setContent(tinymcePlaceholder(content));
          }
        }
      });
    }
  });
}
window.initTinyMCE = initTinyMCE;

/**
 * Tinymce placeholder text for all editor
 * @param  {string} holder - editor type
 * @return {string}        - placeholder content
 */
function tinymcePlaceholder(holder) {
  let placeHolder;
  if(holder === "content"){
    placeHolder = "<a class='tinymce-placeholder'>Click here to edit</a>";
  } else {
    placeHolder = `<a class='tinymce-placeholder'>${holder}</a>`;
  }
  return placeHolder;
}
window.tinymcePlaceholder = tinymcePlaceholder;

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
