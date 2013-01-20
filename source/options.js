/**
 * Lib
 */
var storage = chrome.storage.local,
    options,
    setOption = function(name, value)
    {
        options[name] = value;
        storage.set({"options": options});
    }

/**
 * Elements
 */
var chkEnableSoundNotification = document.getElementById('chkEnableSoundNotification');

/**
 * Translate
 */
document.getElementById('lblEnableSoundNotification').innerHTML = chrome.i18n.getMessage('enable_sound_notification');

/**
 * Restore options
 */
document.addEventListener('DOMContentLoaded', function()
{
    chrome.storage.local.get("options", function(item) 
    {
        options = item.options || {};
        
        // init elements
        chkEnableSoundNotification.checked = (options.enable_sound_notification == "on");
        
    });
    
});

/**
 * Save options
 */

chkEnableSoundNotification.addEventListener('click', function() 
{
    setOption("enable_sound_notification", chkEnableSoundNotification.checked ? "on" : "off");
});