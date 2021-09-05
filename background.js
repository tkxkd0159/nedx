const hostUrl = `https://server.nedx.me`;

// Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ Key: "" });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.messageType === "USER_LOGIN") {
    const data = {
      email: request.email,
      user_pw: request.user_pw,
    };
    fetch(`${hostUrl}/v1/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => sendResponse(res));
  } else if (request.messageType === "COMMENTS_REPORT") {
    const commentData = {
      comment_url: request.comment_url,
      writer: request.writer,
      contents: request.contents,
      screenshot: request.screenshot,
      comment_date: request.comment_date,
      warning: request.warning,
      done: false,
    };
    fetch(`${hostUrl}/v1/commentReport`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        usertoken: request.apiKey,
      },
      body: JSON.stringify(commentData),
    })
      .then((res) => res.json())
      .then((res) => sendResponse(res));
  } else if (request.messageType === "TOKEN_TEST") {
    fetch(`${hostUrl}/v1/getTokenTest`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        usertoken: request.apiKey,
      },
    })
      .then((res) => res.json())
      .then((res) => sendResponse(res));
  } else if (request.messageType === "TAKE_SCREENSHOT") {
    chrome.tabs.captureVisibleTab({ quality: 40 }, function (dataUrl) {
      chrome.storage.local.set({ screenshot: dataUrl }, function () {
        // console.log(dataUrl);
        sendResponse(dataUrl);
      });
    });
  }
  return true; // 이 구문이 있어야 sendResponse 응답이 정상적으로 간다
});
