var storage = chrome.storage.local,
    passcodeScanEnabled = false,
    tabId,
    tabPort,
    openIngressWindow = function()
    {
        chrome.tabs.create({url: "http://ingress.com/intel"}, function(tab)
        {
            tabId = tab.id;
            
            // inject tab script and style
            chrome.tabs.insertCSS(tab.id, {file: "inject.css"});
            
            chrome.tabs.executeScript(tab.id, {file: "inject.js"}, function() 
            {
                tabPort = chrome.tabs.connect(tabId);
                
                // send saved passcodes to tab
                storage.get("passcodes", function(item) 
                {
                    tabPort.postMessage({passcodes: item.passcodes});
                });
            });
        });
    },
    rememberPasscode = function(passcode)
    {
        storage.get("passcodes", function(item) 
        {
            var passcodes = item.passcodes || {};
            
            passcodes[passcode] = true;
            storage.set({passcodes: passcodes});
        });
    };

// init toolbox icon
storage.get('passcodeScanEnabled', function(item)
{
    passcodeScanEnabled = item.passcodeScanEnabled;
    if(!item.passcodeScanEnabled)
        return;
    
    chrome.browserAction.setIcon({path: "img/ingress_logo_over.png"});
    
    // open new tab with ingress and inject code
    openIngressWindow();
    
});

// click on toolbox icon
chrome.browserAction.onClicked.addListener(function(tab)
{    
    if(passcodeScanEnabled)
    {
        storage.set({passcodeScanEnabled: false});
        passcodeScanEnabled = false;
        chrome.browserAction.setIcon({path: "img/ingress_logo.png"});
    }
    else
    {
        
        storage.set({passcodeScanEnabled: true});
        passcodeScanEnabled = true;
        chrome.browserAction.setIcon({path: "img/ingress_logo_over.png"});

        openIngressWindow();
    }
});

// listen to messages from tabs
chrome.extension.onConnect.addListener(function(port)
{
    port.onMessage.addListener(function(message)
    {
        if('passcode' in message)
        {
            rememberPasscode(message.passcode);
        }
    });
});



