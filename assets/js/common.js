/* This file is ignored in eslint
** make sure that your code indentation and quality
*/

(function () {
"use strict";
let isOpenSideNav = false;
$(document).ready(function() {
  // Set tinymce plugin location
  tinymce.baseURL = "/tinymce";
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
    Materialize.toast(warningContent, timeToShow, "", removeToast());
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
    Materialize.toast(successContent, timeToShow, "", removeToast());
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
  if(isToolbar){
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
    plugins: [
      "advlist autolink lists link image charmap print preview anchor",
      "insertdatetime media table paste code",
      "link, mention"
    ],
    mentions: {
      source: allTags,
      delimiter: "#",
      items: 100,
      insert: function(item) {
        return constructSmartTags(item.classname, item.name, item.id);
      }
    },
    setup : function(editor) {
      editor.on("change", function(e) {
        changeCb(editor);
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

function initTimePicker(element) {
  let timepicker = element.pickatime({
    twelvehour: true,
    default: 'now',
    afterDone: function() {
      const time = timepicker.val();
      const index = 0;
      const till = -2;
      const howManyFromLast = -2;
      // To display time in 00:00 AM format
      timepicker.val(`${time.slice(index, till)} ${time.slice(howManyFromLast)}`);
      validateTime();
    }
  });
}
window.initTimePicker = initTimePicker;

/**
 * Validate the time is past
 *
 * @property {String} time - Schedule email time
 * @property {String} date - Schedule email date
 * @property {Object} date - Date now
 * @property {Number} hourNow - Hour now
 * @property {Number} minuteNow - Minute now
 * @property {Number} timeSliceStartFrom - Slice time from time property starts at
 * @property {Number} timeSliceLength - Slice time from time property total length
 * @property {Number} timeSlicePeriodFromLast - Slice period from time property from last
 * @property {Number} hoursToConvert - Hours to convert from 12 hours to 24 hours
 */
function validateTime() {
  const time = $('.timepicker').val();
  let date = $('.datepicker').val();
  const today = new Date();
  const hourNow = today.getHours();
  const minuteNow = today.getMinutes();
  const timeSliceStartFrom = 0;
  const timeSliceLength = 5;
  const timeSlicePeriodFromLast = -2;
  const hoursToConvert = 12;
  if(date && time) {
    date = new Date(date);
    if(date.getFullYear() === today.getFullYear() &&
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth()) {
        let timeString = time.slice(timeSliceStartFrom, timeSliceLength);
        let timeArray = timeString.split(':');
        if(time.slice(timeSlicePeriodFromLast) === 'PM') {
          timeArray[0] = parseInt(timeArray[0]) + hoursToConvert;
        }
        if(hourNow > parseInt(timeArray[0])) {
          displayError('You have entered a past time');
        } else if(hourNow == parseInt(timeArray[0])) {
          if(minuteNow > parseInt(timeArray[1])) {
            displayError('You have entered a past time');
          }
        }
      }
  }
}

function initDatePicker(element) {
  element.pickadate({
    selectMonths: true,
    selectYears: 15,
    min : true
  });
}
window.initDatePicker = initDatePicker;
})();
