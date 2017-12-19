//(c)2017 genBTC
//Extensity - index.js (script part of index.html, the browserAction toolbar Popup page)
backgroundWindow = chrome.extension.getBackgroundPage(); //get backgroundPage handle
backgroundWindow.vm.refreshEngine(); //refresh

//main:
jQuery(document).ready(function ($) {

  view = backgroundWindow.vm; //reference to the engine's ViewModel we create in background.
  console.log("Extensity: index.js: Referencing the background engine's ViewModel.");
  ko = backgroundWindow.ko; //reference to The binding we create in background(has to)
  console.log("Extensity: index.js: Binding to background engine's ViewModel.");
  ko.applyBindings(view, document.body);
  console.log("Extensity: Binding the ViewModel to View, ready.");

  // Workaround for Chrome bug https://bugs.chromium.org/p/chromium/issues/detail?id=307912
  window.setTimeout(function () { jQuery('#workaround-307912').show(); }, 0);

  backgroundWindow.switchD(); //execute
  
  //Take control of the mouse right click action, so we can use it to launch profiles.html when profile right clicked
  var mouseDownElements = [];
  $('.profileList').on('mousedown', '*', function (event) {
    if (event.which == 3) {
      mouseDownElements.push(this);
    }
  });
  $('.profileList').on('mouseup', '*', function (event) {
    if (event.which == 3 && mouseDownElements.indexOf(this) >= 0) {
      $(this).trigger('rightclick');
    }
  });
  $('.profileList').on('mouseup', function () {
    mouseDownElements.length = 0;
  });
  // disable contextmenu
  $('.profileList').on('contextmenu', function (event) {
    event.preventDefault();
  });
  //Bind to all .profileList that it can open profiles.html
  $('.profileList').on('rightclick', function (event) {
    chrome.tabs.create({ url: 'profiles.html' });
    close();
  });
});
/*
document.addEventListener('DOMContentLoaded', function () {
});
*/