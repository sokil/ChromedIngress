(function()
{                
    //init functions
    var chat        = document.getElementById('plext_container'),
        terminal    = document.createElement('div'),
        port        = chrome.extension.connect(),
        passcodes   = {},
        patterns    = [/\d[a-z]{2}\d[a-z]{4,}[a-z]\d[a-z]\d[a-z]/, /[a-z]{4,}\d{2}[a-z]/],
        showMessage = function(message, id)
        {            
            var msg = document.createElement('div');
            msg.innerHTML = '&gt; ' + message;
            
            if(id)
                msg.id = id;
            
            terminal.appendChild(msg);
        },
        redeemPasscode = function(passcode, callback)
        {
            var csrftoken = document.cookie.match(/csrftoken=(.+?);/)[1],
                xhr = new XMLHttpRequest();
               
            xhr.open('POST', 'http://www.ingress.com/rpc/dashboard.redeemReward');
            xhr.onreadystatechange = function()
            {
                if(xhr.readyState != 4)
                    return;
                
                if(xhr.status != 200)
                    return;
                
                var response = xhr.responseText
                    ? eval("(" + xhr.responseText + ")")
                    : {};
                    
                if(response.error)
                {
                    document.getElementById(passcode).style.cssText += "color: red;";
                }
                else
                {
                    document.getElementById(passcode).style.cssText += "color: green;";
                    
                    if (typeof callback == "function")
                        callback(response);
                }
            };
            xhr.setRequestHeader ('Content-Type', 'application/json; charset=UTF-8');
            xhr.setRequestHeader ('X-CSRFToken', csrftoken);
            xhr.send('{"passcode":"' + passcode + '", "method": "dashboard.redeemReward"}');
        },
        parseRedeemedItems = function(redeemResponse)
        {
            var readableNames = {"EMITTER_A": "Resonator","EMP_BURSTER": "XMP"},
                result = {
                    "AP": redeemResponse.result.apAward, 
                    "XM": redeemResponse.result.xmAward
                };

            redeemResponse.result.inventoryAward.forEach(function(item) 
            {
                if (item[2].resourceWithLevels) 
                {
                    ammo = item[2].empWeapon ? item[2].empWeapon.ammo : 1;
                    name = 'L' + item[2].resourceWithLevels.level + ' ' + readableNames[item[2].resourceWithLevels.resourceType];

                }
                else if (item[2].modResource) 
                {
                    ammo = 1;
                    name = item[2].modResource.rarity + " " + item[2].modResource.displayName;
                }

                result[name] = (name in result) ? (result[name] + ammo) : 1;
            });

            return result;
        },
        startCheckingPasscode = function()
        {
            // run passcode check timer
            setInterval(function()
            {
                var messages = chat.getElementsByClassName('plext'),
                    message;

                for(i = 0; i < messages.length; i++)
                {
                    message = messages[i];

                    // check all patterns
                    for(p = 0; p < patterns.length; p++)
                    {
                        match = message.innerText.match(patterns[p]);
                        if(!match)
                            continue;

                        passcode = match[0];
                        if(!(passcode in passcodes))
                        {
                            // remember passcode locally to prevent from future redeems
                            passcodes[passcode] = true;

                            // send passcode to background script
                            port.postMessage({passcode: passcode});

                            // show message in console and redeem it
                            showMessage(passcode, passcode);
                            redeemPasscode(passcode, function(response)
                            {
                                var gainedItems = parseRedeemedItems(response);
                                for(item in gainedItems)
                                {
                                    showMessage('<span style="color: yellow">' + item + ' (' + gainedItems[item] + ')<span>')
                                }
                            });
                        }

                        break;
                    }
                }

                // remove old messages
                if(messages.length > 50)
                {
                    for(i = 0; i < messages.length - 50; i++)
                    {
                        messages[i].parentNode.removeChild(messages[i]);
                    }
                }

            }, 1E4);
        },
        initTerminal = function()
        {
            setTimeout(function()
            {
                // wait while chat frame loaded
                var comm = document.getElementById("comm");
                if(!comm)
                {
                    initTerminal();
                    return;
                }
                
                // prepare DOM
                terminal.id = 'passcode-stat-terminal';
                document.body.appendChild(terminal);

                // remove checkbox of chat-to-map restriction
                document.getElementById("pl_checkbox").checked = false;

                // expand chat
                comm.className = "comm_expanded";

                // Jedi mode on
                // bypass isolated world
                // run human emulator to prevent of human epsence detection
                var script = document.createElement("SCRIPT");
                script.type="text/javascript";
                script.innerText = "setInterval(function() { Z.d().Ka = u(); }, 3E5 - 5E3)";
                document.body.appendChild(script);
                // Jedi mode off

                // show greetins message
                showMessage('Welcome...');

                startCheckingPasscode();
                
            }, 100);
        };
    
    // listen to messages from background
    chrome.extension.onConnect.addListener(function(port)
    {
        port.onMessage.addListener(function(message)
        {
            if('passcodes' in message)
            {
                passcodes = message.passcodes;
            }
        });
    });

    initTerminal();
    
})();




