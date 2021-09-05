유튜브 악플 신고 크롬 확장프로그램

```
Test ID : help@nedx.me 1234
DB address : https://nedx-admin.vercel.app/
```

# chrome.tabs
# chrome.storage
# chrome.scripting
Use the chrome.scripting API to execute script in different contexts.
```js
document.getElementById("createButton").addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.storage.local.set({ pageUrl: tab.url }, () => {});
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: createReportButton,
        });
    
    alert("댓글을 확인해주세요.");
});
```

# chrome.runtime
To retrieve the background page, return details about the manifest, and listen for and respond to events in the app or extension lifecycle.

## 1) onMessage
`onMessage.addListener(listener: function)`  
Fired when a message is sent from either an extension process (by runtime.sendMessage) or a content script (by tabs.sendMessage).
