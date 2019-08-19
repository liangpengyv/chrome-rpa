// 监听 background.js
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log(msg);
    execute(msg);
    sendResponse()
});

// 执行 Native 程序发来的任务
function execute(msg) {

    // 解析任务命令及参数
    let commands = msg.commands;
    let arguments = decodeURIComponent(msg.arguments.toString().replace(/\+/g, '%20'));

    const response = {};
    // 调用指定任务对应的函数
    response.message = eval(commands + '(' + arguments + ');');
    // 向 Native 程序发送响应
    chrome.runtime.sendMessage(response);
}
