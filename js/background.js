//(C)2017 genBTC
//Extensity - background.js, Background Task Process:
//  Creates the ViewModel instance. Creates a secure binding.

//main:
jQuery(document).ready(function($) {
    vm = new ExtensityViewModel();
    console.log("Extensity: background.js Engine Ready");
    ko.bindingProvider.instance = new ko.secureBindingsProvider({});
    //perform an initial update.
    switchD();
    //Turns the extension Tag to "ON"
    chrome.browserAction.setBadgeText({ text: "ON" });
    //Get reference to ourself.
    //popupList = chrome.extension.getViews({"type": "popup"});
    //popupWindow = popupList[0];
    //event listeners:
    chrome.tabs.onActiveChanged.addListener(switchD);
});

//code explanation: I think the callback of chrome.tabs.query (which is async) needed to be in the same scope(as in this file) as the receiver (the body of the callback destination vm.domainLoop(url);), which is the original "vm" object and the "ko" binding as well. something about bindings
//Run the Loop when the Active Tab is Changed 
function switchD(tabID, props) {
    console.log("Extensity: Active tab changed while focused: " + tabId + " . Switching!");
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs[0]) return;
        url = tabs[0].url;
        console.log("Extensity: Updating. Found Tab URL: " + url);
        var result = vm.domainLoop(url); //Run Loop
        //Reload the Tabs when Domain is Switched:
        if (result && vm.opts.reloadPages())
            chrome.tabs.reload(tabs[0].id);
    });
}