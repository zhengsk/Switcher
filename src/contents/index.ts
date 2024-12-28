
export const config = {
  matches: ["https://huaban.com/*"]
}

console.log("content script loaded")

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugger;
  if (message.type === "SWITCH_ACCOUNT") {
    const { account, loginConfig } = message;

    debugger;
    account.email = account.username; // huaban 的账号是邮箱

    // 处理登录逻辑
    console.log("收到切换账号请求", account);

    fetch(loginConfig.url, {
      method: loginConfig.method,
      headers: loginConfig.headers,
      body: JSON.stringify(account)
    }).then(response => response.json()).then(data => {
      console.log(data)
    }).catch(error => {
      console.error(error)
    })

    sendResponse({ success: true })
  }
}) 