backgroundWindow = chrome.extension.getBackgroundPage(); //get backgroundPage handle

//stage 1
jQuery(document).ready(function ($) {
  console.log("Extensity: index.js: jQuery document ready");
  
  view = backgroundWindow.vm; //reference to the ViewModel we create in background.
  console.log("Extensity: index.js: Referencing the background engine's ViewModel.");
  ko = backgroundWindow.ko; //reference to The binding we create in background(has to)
  console.log("Extensity: index.js: Binding to background engine's ViewModel.");

  //popupList = chrome.extension.getViews({"type": "popup"});
  //popupWindow = popupList[0];

  ko.applyBindings(view, document.body);
  console.log("Extensity: Binding the ViewModel to View, ready.");
  
 // Workaround for Chrome bug https://bugs.chromium.org/p/chromium/issues/detail?id=307912
  window.setTimeout(function () { jQuery('#workaround-307912').show(); }, 0);
  
  backgroundWindow.updateD(); //execute
});
/*
document.addEventListener('DOMContentLoaded', function () {
});
*/

//event listeners:
//chrome.browserAction.onClicked.addListener(backgroundWindow.updateD); //doesnt work somehow.

chrome.tabs.onActiveChanged.addListener(function(tabId, props) {
    console.log("Extensity: Active tab changed while focused: " + tabId + " . Switching!");
    backgroundWindow.updateD();
});