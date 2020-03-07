/**
 * Compare the current website to those in the blocklist, blocking if necessary
 * 
 * Author: Noah Tigner, Lucas Hyatt
 * 
 * Args: blocklist, a list of objects of the form {site: , time: }
 * 
 * Returns:
 */
function compareURL(blocklist) {
    var loc = window.location.hostname;

    // window.alert("(comp) bl: " + blocklist);

    var blocklistLength = blocklist.length;
    for(let i = 0; i < blocklistLength; i++) {
        // window.alert(blocklist[i].site);
        if(loc.localeCompare(blocklist[i].site) === 0) {
            // block();
            console.log("Blocklisted.");
            startTime(time_left);
            break;
        }
        else{
            stopTime();
            console.log("Not blocklisted.");
        }
    }
}

/**
 * Redirects websites in the blocklist to "blocked.html"
 * 
 * Author: Noah Tigner
 * 
 * Args: 
 * 
 * Returns:
 */
function block() {
    window.stop();

    browser.storage.local.set({blockedSite: window.location});
    console.log("RELOCATION!!!");
    window.location = browser.extension.getURL("blocked.html");
}

var printStorageInfo = 0;

/** Function: addWebsite()
 *      Adds a website to the block list. The current block list being used should be set equal
 *      to the return of this function, and the blocklist should be passed as an argument.
 *
 *  Args:
 *      url: The website url to add to the block list
 *      curBlockList: The current block list being used.
 *      checkDuplicates: checks to make sure the url from theSite is not already
 *                       in the blocklist. If == 1, do not add the duplicate.
 *                       If == 0, add theSite even if it is a duplicate.
 *      shouldSave: If == 1, automatically save the blocklist to local storage,
 *                  do nothing otherwise.
 *
 *  Returns:
 *      Returns curBlockList with theSite added to it if checkDuplicates == 1.
 */

function addWebsite(url, curBlockList, checkDuplicates=0, shouldSave=0) {
    // check to make sure the website is not already in the block list
    if (checkDuplicates) {
        var listLen = curBlockList.length;
        for (let i = 0; i < listLen; i++) {
            if (url.localeCompare(curBlockList[i].site) === 0) {
                //window.alert("WARNING: " + theSite + ' is already on the block list!');
                return curBlockList;
            }
        }
    }

    var item = {site: url, time: 0};
    curBlockList.push(item);

    if (shouldSave) {
        saveWebsites(curBlockList);
    }
    return curBlockList;
}

/** Function: removeWebsite()
 *      Removes a website to the block list. The current block list being used should be set equal
 *      to the return of this function, and the blocklist should be passed as an argument. To
 *      delete all websites from the list, pass 'all' into theSite argument.
 *
 *  Args:
 *      url: The website url to add to the block list
 *      curBlockList: The current block list being used.
 *      shouldSave: If == 1, automatically save the blocklist to local storage,
 *                  do nothing otherwise.
 *
 *  Returns:
 *      Returns curBlockList with theSite removed.
 */

function removeWebsite(url, curBlockList, shouldSave=0) {
    // removes a website from the blocklist. If theSite == 'all',
    // then remove all the websites in the list.

    var listLen = curBlockList.length;

    if (url.localeCompare("all") === 0) {
        curBlockList.splice(0);
        return curBlockList;
    }

    for (let i = 0; i < listLen; i++) {
        if (url.localeCompare(curBlockList[i].site) === 0) {
            curBlockList.splice(i, 1);
            //window.alert("deleted " + deleted);

            if (shouldSave) {
                saveWebsites(curBlockList);
            }
            return curBlockList;
        }
    }

    return curBlockList;
}

function saveWebsites(blocklist) {
    // window.alert(JSON.stringify(blocklist));
    listAsString = JSON.stringify(blocklist);

    browser.storage.local.set({websiteList: listAsString});

    var saveString = "Saving the following websites to local storage:\n";
    for (let i = 0; i < blocklist.length; i++) {
        saveString = saveString.concat('\tname: ', blocklist[i].site, '\ttime: ', blocklist[i].time, '\n');
    }

    if (printStorageInfo) {  // change to 0 to not print this
        window.alert(saveString);
        console.log(saveString);
    }
}

/**
 * Access the websites held in storage.local['websiteList'] (the blocklist)
 * Parses and passes these URLs to compareURL
 * 
 * Author: Noah Tigner, Jimmy Lam
 * 
 * Args: 
 * 
 * Returns:
 */
function getWebsites() {

    var storedNames = [];
    
    let prom = browser.storage.local.get("websiteList", data => {
        if(data.websiteList) {
            storedNames = data.websiteList;

            if(storedNames.length > 0) {
                var websitesRead = "The following websites were retrieved: \n";
                for (let i = 0; i < storedNames.length; i++) {
                    websitesRead = websitesRead.concat("\tname: ", storedNames[i].site, "\ttime: ", storedNames[i].time, '\n');
                }
        
                if (printStorageInfo) {  // change to 0 to not print this
                    window.alert(websitesRead);
                    console.log(websitesRead);
                }
                compareURL(storedNames)
            }
        }
    });
}

function testAddRemove() {
    blocklist = addWebsite('twitter.com', blocklist, 1);
    blocklist = addWebsite('twitter.com', blocklist, 1);
    blocklist = removeWebsite('slither.io', blocklist);
}

var blocklist = getWebsites();  // had to chain this to block() compareURL to work correctly (blame how js promises work)
// testAddRemove();
// saveWebsites(blocklist);
// compareURL(blocklist);

// add event listener for blocklist in storage.local... then update getWebsites?
// browser.storage.onChanged.addListener(changeData => {
//     // window.alert("BL[0] Changed: " + changeData.websiteList.newValue[0].site);    
//     getWebsites();
// });

/* ============================================================================= */
/* ================================scheduling=================================== */
/* ============================================================================= */

/*
NOTES:
    - Needs to reset at midnight
    - Needs to read from GUI
*/

window.onfocus = function() {
    console.log("FOCUSED");
    browser.storage.local.get(["time_left"], function(result){
        time_left = result["time_left"];
        console.log('Retrieved the variable time_left as:', time_left);
    });
    getWebsites();
};

window.onblur = function() {
    console.log("BLURRED");
    browser.storage.local.set({"time_left": time_left});
    stopTime();
};

// Global variables
var threshold; //Global threshold variable (amount available each day, in minutes)
var time_left;

browser.storage.local.get(["thresholdHours"], function(result1){
    browser.storage.local.get(["thresholdMinutes"], function(result2){
        var threshHours = HoursToMinutes(result1["thresholdHours"]);
        var threshMins = result2["thresholdMinutes"];
        if(threshMins != NaN && threshHours != NaN){
            threshold = parseInt(threshHours, 10) + parseInt(threshMins, 10);
            time_left = MinutesToMilliseconds(threshold);
            console.log("Threshold from GUI:", threshold);
            // Setting the threshold value.
            browser.storage.local.set({"threshold": threshold});
        }
        else{
            threshold = 60;
            time_left = MinutesToMilliseconds(threshold);
            console.log("Threshold set by default to:", threshold);
            // Setting the threshold value.
            browser.storage.local.set({"threshold": threshold});
        }
    });
});

browser.storage.local.get(["time_left"], function(result){
    var val = result["time_left"];
    if (typeof val === "undefined"){ // Hasn't been set before, establish as threshold.
        console.log("Current value of threshold is:", threshold);
        time_left = MinutesToMilliseconds(threshold); //Variable used in tracking time
        console.log('Set time_left as:', time_left);
    }
    else{
        time_left = val;
        console.log('Retrieved the variable time_left as:', val);
    }
});

var timeout; 
var interval; 

function MinutesToMilliseconds(time){
    /*
        Convert a given time in minutes to milliseconds (helper for setTimeout)
    */
    return time*(60000)
}

function HoursToMinutes(time){
    /*
        Convert a given time in hours to minutes (helper for setTimeout)
    */
    return time*(60)
}

function timeUp(){
    /*
        Called if user is on blocklisted site and runs out of time.
    */
    // console.log("Call to timeUp()!")
    stopTime();
    block();
}

function adjustTimeLeft(){ 
    /*
        Function which decrements the time left every second.
    */
    time_left -= 1000

    //Updating time_left in storage.
    browser.storage.local.set({"time_left": time_left});
    browser.storage.local.get(["time_left"], function(result){
        var curr_time = result["time_left"];
        console.log('Time_left adjusted to:', curr_time);
    });

    if(time_left < 0){
        timeUp()
    }
}

function startTime(time_before_blocking){
    /*
        Function which is called when a user visits a blocklisted site,
        begins to track time:
    */

    //Triggered when they visit a blockslisted site.
    // console.log("Call to start timing.")
    timeout = setTimeout(function(){timeUp}, time_before_blocking);
    interval = setInterval(adjustTimeLeft, 1000);   
}

function stopTime(){
    /*
        Function which is called when a user visits a non-blocklisted site
    */
    clearTimeout(timeout);
    clearInterval(interval);

    console.log("Call to stop timing.");

    //Write the new time to storage file.
    browser.storage.local.set({"time_left": time_left});

}

// startTime(time_left)
// stopTime()

/* ============================================================================= */
/* ============================================================================= */
/* ============================================================================= */



