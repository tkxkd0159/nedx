window.onload = function () {
  chrome.storage.sync.get("apiKey", ({ apiKey }) => {
    chrome.storage.sync.get("lastPage", ({ lastPage }) => {
      if (!apiKey) {
        loginPage();
      } else {
        if (lastPage === 1) {
          main();
        } else if (lastPage === 2) {
          detected();
        } else if (lastPage === 3) {
          completePage();
        } else if (lastPage === 0) {
          loginPage();
        } else {
          main();
        }
      }
    });
  });
};

function loginPage() {
  chrome.storage.sync.set({ lastPage: 0 }, function () {});

  const content = `
			<div class="main_header">
					<div>악플대응 에이전트,</div>
					<img src="./images/ChromeNedXLogo.png" alt="NedX">
			</div>

      <div class="login_contents_container">
        <div class="login_contents">
            <input id="email" type="text" placeholder="example@example.com">
            <div class="margin"></div>
            <input id="password" type="password" placeholder="password">
        </div>
        <button id="login">로그인</button>
      </div>
      <div class="login_help">
        <img id="email-btn--save" src="./images/checkbox_before.png" alt="checkbox__before">
        <div>이메일 저장</div>
        <ul>
          <li>
            <a href="/javascript:void(0)">이메일 찾기</a>
          </li>
          <li>
            <a href="/javascript:void(0)">비밀번호 찾기</a>
          </li>
        </ul>
      </div>
			<div id="register">회원가입</div>
    `;

  document.body.innerHTML = content;
  new Promise((resolve) => {
    chrome.storage.sync.get("saveEmailState", ({ saveEmailState }) => {
      resolve(saveEmailState);
    });
  }).then((state) => {
    if (state) {
      document.getElementById("email-btn--save").setAttribute("src", "./images/checkbox_after.png");
      document.getElementById("email-btn--save").setAttribute("alt", "checkbox__after");
      chrome.storage.sync.get("saveEmail", ({ saveEmail }) => {
        document.getElementById("email").setAttribute("value", saveEmail);
      });
    }
  });

  document.getElementById("email-btn--save").addEventListener("click", () => {
    if (document.getElementById("email-btn--save").getAttribute("alt") === "checkbox__before") {
      document.getElementById("email-btn--save").setAttribute("src", "./images/checkbox_after.png");
      document.getElementById("email-btn--save").setAttribute("alt", "checkbox__after");
    } else {
      document.getElementById("email-btn--save").setAttribute("src", "./images/checkbox_before.png");
      document.getElementById("email-btn--save").setAttribute("alt", "checkbox__before");
    }
  });
  document.getElementById("register").addEventListener("click", () => window.open("http://nedx.me"));
  document.getElementById("login").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email === `` || password === ``) {
      alert("아이디 및 비밀번호를 입력해주세요.");
    } else {
      try {
        if (document.getElementById("email-btn--save").getAttribute("alt") === "checkbox__after") {
          chrome.storage.sync.set({ saveEmail: email }, function () {});
          chrome.storage.sync.set({ saveEmailState: true }, function () {});
        } else {
          chrome.storage.sync.set({ saveEmailState: false }, function () {});
        }
        chrome.runtime.sendMessage(
          {
            messageType: "USER_LOGIN",
            email: email,
            user_pw: password,
          },
          (data) => {
            if (!data.userToken) {
              alert("이메일과 비밀번호를 확인해주세요.");
            } else {
              chrome.storage.sync.set({ apiKey: data.userToken }, function () {});
              main();
            }
          }
        );
      } catch (e) {
        console.log(e);
      }
    }
  });
}

function main() {
  chrome.storage.sync.set({ lastPage: 1 }, function () {});
  userCheck();

  const content = `
    <div id="logout">로그 아웃</div>
      <div class="main_header">
      <div>악플대응 에이전트,</div>
      <img src="./images/ChromeNedXLogo.png" alt="NedX">
    </div>
    <button id="createButton">신고버튼</br>만들기</button>
    <div id="nextButton">다음</div>
    `;
  document.body.innerHTML = content;

  document.getElementById("logout").addEventListener("click", () => {
    loginPage();
  });

  document.getElementById("createButton").addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.storage.local.set({ pageUrl: tab.url }, () => {});
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: createReportButton,
    });

    alert("댓글을 확인해주세요.");
  });
  document.getElementById("nextButton").addEventListener("click", () => {
    chrome.storage.local.get("writerId", ({ writerId }) => {
      if (writerId === "") {
        alert("악플을 선택하고 다음으로 넘어갈 수 있습니다.");
      } else {
        detected();
      }
    });
  });
}

function detected() {
  chrome.storage.sync.set({ lastPage: 2 }, function () {});
  userCheck();

  chrome.storage.local.get("writerId", ({ writerId }) => {
    chrome.storage.local.get("text", ({ text }) => {
      chrome.storage.local.get("pageUrl", ({ pageUrl }) => {
        chrome.storage.local.get("screenshot", ({ screenshot }) => {
          chrome.storage.local.get("writtenAt", ({ writtenAt }) => {
            function makeContent(writerId, text, writtenAt, pageUrl, screenshot) {
              return `
                <img id="btn_pre_img" src="./images/btn_pre.png">
                <div class="detected_title">
                  <h4>박제가 완료되었습니다.</h4>
                  <h3>대댓글로 경고할까요?</h3>
                  <p>경고문 보러가기</p>
                </div>
                <div class="detected_check">
                  <div class="check">
                    <div>*경고문을 게재하여 발생하는 불이익은 NedX에서 책임지지 않으며,</div>
                    <div>경고문은 오전 9시~오후 6시 중, 제보 3시간 이내에 처리합니다.</div>
                  </div>
                </div>
                <div class="detected_contents">
                  <h5>${writerId}</h5>
                  <h6>${writtenAt}</h6>
                  <div>${text}</div>
                  <p>사이트 주소: ${pageUrl}</p>
                </div>

                <div class="detected_button">
                  <button id="detected_nextButton">경고없이 진행</button>
                  <button id="detected_warningButton">경고하기</button>
                </div>
              `;
            }
            document.body.innerHTML = makeContent(writerId, text, writtenAt, pageUrl, screenshot);

            const btnPre = document.getElementById("btn_pre_img");
            btnPre.addEventListener("mouseover", () => {
              btnPre.setAttribute("src", "./images/btn_pre_over.png");
            });
            btnPre.addEventListener("mouseout", () => {
              btnPre.setAttribute("src", "./images/btn_pre.png");
            });
            btnPre.addEventListener("click", () => {
              main();
            });

            document.getElementById("detected_nextButton").addEventListener("click", () => {
              chrome.storage.local.set({ warning: false }, () => {});
              commentsReport();
              completePage();
            });
            document.getElementById("detected_warningButton").addEventListener("click", () => {
              chrome.storage.local.set({ warning: true }, () => {});
              commentsReport();
              completePage();
            });
          });
        });
      });
    });
  });
}

function completePage() {
  chrome.storage.sync.set({ lastPage: 3 }, function () {});
  userCheck();

  const content = `
      <div class="complete_title">
        <h3>처리가 완료되었습니다.</h3>
      </div>
      <div class="complete_contents">
        <div>증거자료가 차곡차곡 정리되고 있습니다.</div>
        <div>내 대시보드에서 확인해보세요!</div>
      </div>
      <div class="complete_button">
        <button>내 대시보드로 가기</button>
        <button id="complete_gotoMain">다음 악플 고르기</button>
      </div>
    `;
  document.body.innerHTML = content;

  document.getElementById("complete_gotoMain").addEventListener("click", () => {
    chrome.storage.local.set({ pageUrl: "" }, function () {});
    chrome.storage.local.set({ writerId: "" }, function () {});
    chrome.storage.local.set({ text: "" }, function () {});
    chrome.storage.local.set({ screenshot: "" }, function () {});
    chrome.storage.local.set({ writtenAt: "" }, function () {});
    chrome.storage.local.set({ warning: "" }, function () {});
    main();
  });
}

function createReportButton() {
  const rows = document.querySelectorAll("#toolbar");
  if (rows.length === 0) {
    return;
  }

  rows.forEach((row, index) => {
    let gen_more = false;
    let elem = row.nextElementSibling.nextElementSibling
    if (elem !== null) {
      class_list = elem.className.split(" ")
      gen_more = true
      if (class_list.includes('report') || class_list.includes('captureTitle')) {
        gen_more = false
      }
    }
      if (elem === null || gen_more) {
        row.insertAdjacentHTML(
          "afterend",
          `
          <style>
          .report {
            width: 90px;
            height: 40px;
            cursor: pointer;
            background-color: #FF5733;
            border: none;
            border-radius: 10px;
            color: #FFF;
            font-size: 16px;
            font-weight: 700;
            transition: font-size 0.2s;
          }
          .report:hover {
            font-size: 17px;
            color: #000;
          }
          </style>
          <button id="report-${index}" class="report" data-id="${index}">신고하기</button>`
        );

        document.getElementById(`report-${index}`).addEventListener("click", () => {
          rows.forEach((_, index) => {
            try {
              document.getElementById(`report-${index}`).remove();
            }
            catch {
            }
          });

          const component = row.parentElement.parentElement;
          const writerId = component.querySelector("#author-text").text.trim();
          let writtenAt = component.querySelector("a.yt-formatted-string.yt-simple-endpoint").text.trim();
          let text = "";
          // 댓글 더보기 없는 경우
          text += component.querySelector("#content-text").textContent.trim();
          // 댓글 여러줄 (더보기 있는 경우)
          if (text === "") {
            component
              .querySelector("#content-text")
              .querySelectorAll("span")
              .forEach((it) => {
                if (it.textContent.trim() !== "") {
                  text += `${it.textContent.trim()}\n`;
                }
              });
          }

          const diff = writtenAt.replace(/[^0-9]/g, "");
          const date = new Date();
          if (writtenAt.includes("초") || writtenAt.includes("second")) {
            writtenAt = new Date(date.setSeconds(date.getSeconds() - diff)).toISOString().split("T")[0];
          } else if (writtenAt.includes("분") || writtenAt.includes("minute")) {
            writtenAt = new Date(date.setMinutes(date.getMinutes() - diff)).toISOString().split("T")[0];
          } else if (writtenAt.includes("시간") || writtenAt.includes("hour")) {
            writtenAt = new Date(date.setHours(date.getHours() - diff)).toISOString().split("T")[0];
          } else if (writtenAt.includes("일") || writtenAt.includes("day")) {
            writtenAt = new Date(date.setDate(date.getDate() - diff)).toISOString().split("T")[0];
          } else if (writtenAt.includes("주") || writtenAt.includes("week")) {
            writtenAt = new Date(date.setDate(date.getDate() - diff * 7)).toISOString().split("T")[0];
          } else if (writtenAt.includes("월") || writtenAt.includes("month")) {
            writtenAt = new Date(date.setMonth(date.getMonth() - diff)).toISOString().split("T")[0];
          } else if (writtenAt.includes("년") || writtenAt.includes("year")) {
            writtenAt = new Date(date.setFullYear(date.getFullYear() - diff)).toISOString().split("T")[0];
          }

          chrome.storage.local.set({ writerId: writerId }, () => {});
          chrome.storage.local.set({ text: text }, () => {});
          chrome.storage.local.set({ writtenAt: writtenAt }, () => {});

          row.insertAdjacentHTML(
            "afterend",
            `
            <style>
            .captureTitle {
              width: 100%;
              height: 40px;
              margin: 4px 0;
              background-color: #000;
              font-size: 16px;
              font-weight: 700;
              color: #FFF;
              display: flex;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            </style>
            <div class="captureTitle">위 내용을 악플 증거자료로 박제하였습니다. - NedX</div>`
          );

          chrome.runtime.sendMessage(
            {
              messageType: "TAKE_SCREENSHOT",
            },
            function () {
              // console.log(response);
              // document.body.innerHTML = `<img src="${response}"/>`
              alert("처리 되었습니다. 확장 프로그램을 다시 실행해주세요.");
            }
          );
        });
      }
    }

  );
}

function commentsReport() {
  chrome.storage.sync.get("apiKey", ({ apiKey }) => {
    chrome.storage.local.get("pageUrl", ({ pageUrl }) => {
      chrome.storage.local.get("writerId", ({ writerId }) => {
        chrome.storage.local.get("text", ({ text }) => {
          chrome.storage.local.get("screenshot", ({ screenshot }) => {
            chrome.storage.local.get("writtenAt", ({ writtenAt }) => {
              chrome.storage.local.get("warning", ({ warning }) => {
                // console.log(apiKey, pageUrl, writerId, text, screenshot, writtenAt, warning);
                try {
                  chrome.runtime.sendMessage(
                    {
                      messageType: "COMMENTS_REPORT",
                      apiKey: apiKey,
                      comment_url: pageUrl,
                      writer: writerId,
                      contents: text,
                      screenshot: screenshot,
                      comment_date: writtenAt,
                      warning: warning,
                    },
                    function (response) {
                      console.log(response);
                    }
                  );
                } catch (e) {
                  console.log(e);
                  alert("오류가 발생했습니다. 다시시도 해주세요.");
                  detected();
                }
              });
            });
          });
        });
      });
    });
  });
}

function userCheck() {
  new Promise((resolve) => {
    chrome.storage.sync.get("apiKey", ({ apiKey }) => resolve(apiKey));
  }).then((apiKey) => {
    chrome.runtime.sendMessage(
      {
        messageType: "TOKEN_TEST",
        apiKey: apiKey,
      },
      function (response) {
        if (!response.tokenAvailable) {
          alert("로그인을 다시 해주세요.");
          loginPage();
        }
      }
    );
  });
}
