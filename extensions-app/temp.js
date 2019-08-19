window.temp = {
    getBrowserInfo: getBrowserInfo
};

// 获取浏览器信息
function getBrowserInfo(arguments) {

    let explorer = window.navigator.userAgent;
    let browserType;
    // 获取浏览器类型
    if (explorer.toLowerCase().indexOf("msie") >= 0) {
        browserType = 'ie';
    } else if (explorer.toLowerCase().indexOf("firefox") >= 0) {
        browserType = 'Firefox';
    } else if (explorer.toLowerCase().indexOf("chrome") >= 0) {
        browserType = 'Chrome';
    } else if (explorer.toLowerCase().indexOf("opera") >= 0) {
        browserType = 'Opera';
    } else if (explorer.toLowerCase().indexOf("safari") >= 0) {
        browserType = 'Safari';
    }

    return JSON.stringify({
        title: document.title,
        application: browserType,
        url: document.URL
    });
}
