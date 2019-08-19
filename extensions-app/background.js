console.log('background.js is already load!');

// 在安装或更新后首次运行时，刷新打开的浏览器页面
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        console.log('Uni Studio extension first installed');
    } else if (details.reason === "update") {
        const thisVersion = chrome.runtime.getManifest().version;
        console.log('Uni Studio extension updated from ' + details.previousVersion + ' to ' + thisVersion + '!');
    }

    chrome.tabs.query({}, function (tabsList) {
        for (const i in tabsList) {
            if (!(tabsList[i].url && tabsList[i].url.indexOf('chrome://') === 0)) {
                chrome.tabs.reload(tabsList[i].id, {});
            }
        }
    });
});

// 与注册表中注册的本地应用创建 Native Message 连接
const port = chrome.runtime.connectNative('ink.laoliang.chrome.rpa');

// 监听 content.js
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    // 向本地应用发送消息
    port.postMessage(msg);
});

// 监听端口响应
port.onMessage.addListener(function (msg) {
    // 将“响应”数据发送给 content.js
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {
            // console.log(response);
        });
    });
});

// 监听端口连接断开
port.onDisconnect.addListener(function (msg) {
    // 将“断开连接”的消息发送给 content.js
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {
            // console.log(response);
        });
    });
});
