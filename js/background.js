//(C)2017 genBTC
//Extensity - background.js, Background Task Process:
//  Creates the ViewModel instance. Creates a secure binding.

//main:
jQuery(document).ready(function ($) {
//  self.profiles = new ProfileCollectionModel();
//  self.exts = new ExtensionCollectionModel();
//  self.opts = new OptionsCollection();
//  self.dismissals = new DismissalsCollection();
//  self.switch = new SwitchViewModel(self.exts);
//  self.search = new SearchViewModel();  
  vm = new ExtensityViewModel();
  console.log("Extensity: background.js Engine Ready");
  ko.bindingProvider.instance = new ko.secureBindingsProvider({});
  //perform an initial update.
  switchD();
 //Turns the extension Tag to "ON"
  chrome.browserAction.setBadgeText({text: "ON"});

  //popupList = chrome.extension.getViews({"type": "popup"});
  //popupWindow = popupList[0];

  //event listeners:
  //chrome.browserAction.onClicked.addListener(updateD); (actual refresh/update needed)
  chrome.tabs.onActiveChanged.addListener(function(tabId, props) {
      console.log("Extensity: Active tab changed while focused: " + tabId + " . Switching!");
      switchD();
  });
});


function switchD() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0]) return;
    url = tabs[0].url;
    console.log("Extensity: Updating. Found Tab URL: " + url);
    var result = vm.domainLoop(url);
    if (result && vm.opts.reloadPages())
      chrome.tabs.reload(tabs[0].id);
  });
}
//code explanation: I think the callback of chrome.tabs.query (which is async) needed to be in the same scope(as in this file) as the receiver (the body of the callback destination vm.domainLoop(url);), which is the original "vm" object and the "ko" binding as well. something about bindings

function refreshD() {
  vm.refreshEngine();  
}