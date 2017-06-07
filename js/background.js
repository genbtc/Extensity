//(C)2017 genBTC

//Extensity Background Task Process.
//Creates the ViewModel instance. Creates a secure binding.

//Turns the extension Tag to "ON"
chrome.browserAction.setBadgeText({text: "ON"});

jQuery(document).ready(function($) {
  vm = new ExtensityViewModel();
  console.log("background.js: Engine Ready");
  ko.bindingProvider.instance = new ko.secureBindingsProvider({});
});

//I put this here because (why?) I think because the callback of chrome.tabs.query which is async needed to be in the same scope as the receiver (the body of the callback destination vm.domainLoop(url);), which is the original "vm" object and the "ko" binding as well.
function updateD() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    url = tabs[0].url;
    console.log("Extensity: Updating. Found Tab URL: " + url);
    vm.domainLoop(url);
  });
}