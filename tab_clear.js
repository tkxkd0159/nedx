async function checkState(){
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let state = new Promise(function(resolve, reject) {
        chrome.storage.sync.get(['current_url', 'current_tabid'], function(res){
            resolve(res);
        })
    });
    state = await state;

    if (tab.url !== state.current_url) {
        chrome.storage.sync.set({current_url: tab.url}, function(){console.log('Current URL is : '+tab.url)});
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: removeNedElement,
          },
          (res) => {
              console.log("Remove all elements related to NedX")
          });
    }
    if (tab.id !== state.current_tabid) {
        chrome.storage.sync.set({current_tabid: tab.id}, function(){console.log('Current tab ID is : '+tab.id)});
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: removeNedElement,
          },
          (res) => {
              console.log("Remove all elements related to NedX")
          });
    }
}

function removeNedElement(){
    let group = document.querySelectorAll('.captureTitle,.report')
    if (group) {
        for (let elem of group) {
            elem.remove();
        }
    }
    return 0
}

(async function () {
    await checkState();
})();