window.JQWEB = {
    /* compatibility*/
    GetElementChild: GetElementChild,

    /* 获取浏览器信息 */
    getBrowserInfo: getBrowserInfo,

    /* WEBTreeWalker */
    getChildren: function (id) {
        return JSON.stringify(JQWEB.TreeLibrary.getChildren(id));
    },
    getParent: function (id) {
        return JQWEB.TreeLibrary.getParent(id);
    },
    getProperties: function (id) {
        return JQWEB.TreeLibrary.getTreeProperties(id);
    },
    getRoot: function () {
        return JQWEB.TreeLibrary.getRoot();
    },
    getText_tree: function (id) {
        return JQWEB.TreeLibrary.getTreeText(id);
    },


    /* WebFindLibrary*/

    //path:
    exists: function (path) {
        return JQWEB.FindLibrary.exists(path);
    },
    findAll: function (path) {
        return JQWEB.FindLibrary.findAllByPath(path);
    },
    findFirst: function (path) {
        return JQWEB.FindLibrary.findByPath(path);
    },
    getPathElementsIdList: function (id) {
        return JQWEB.FindLibrary.getPathElementsIdList(id);
    },
    //point:x,y
    get: function (point) {
        //get id by point
        return JQWEB.FindLibrary.getHTMLByPoint(point);
    },
    getRect_find: function (point) {
        return JQWEB.FindLibrary.getRectByPoint(point);
    },
    getTableRoot: function (id) {
        return JQWEB.ElementLibrary.getTableRoot(id);
    },
    /* WebElement */
    //rect: x,y,w,h
    getRect: function (id) {
        return JQWEB.ElementLibrary.getRect(id);
    },
    getPath: function (id) {
        return JQWEB.TreeLibrary.getBestPath(id, true);
    },
    setFocus: function (id) {
        return JQWEB.ElementLibrary.setFocus(id);
    },
    isChecked: function (id) {
        return JQWEB.ElementLibrary.isChecked(id);
    },
    setChecked: function (id, checked) {
        return JQWEB.ElementLibrary.check(id, checked == "true" ? 1 : 0);
    },
    getCheckState: function (id) {
        return JQWEB.ElementLibrary.getCheckState(id);
    },
    getText: function (id) {
        return JQWEB.ElementLibrary.getText(id);
    },
    setText: function (id, text) {
        return JQWEB.ElementLibrary.setText(id, text);
    },
    isPassword: function (id) {
        return JQWEB.ElementLibrary.isPassword(id);
    },
    isElementVisible: function (id) {
        return JQWEB.ElementLibrary.isElementVisible(id);
    },
    clearSelection: function (id) {
        return JQWEB.ElementLibrary.clearSelection(id);
    },
    selectItems: function (id, items) {
        return JQWEB.ElementLibrary.selectItems(id, items);
    },
    clearText: function (id) {
        return JQWEB.ElementLibrary.setText(id, "");
    },
    typeText: function (id, text) {
        return JQWEB.ElementLibrary.setText(id, text);
    },
    getAttributeValue: function (id, attrname) {
        return JQWEB.ElementLibrary.getAttributeValue(id, attrname);
    },
    setWebAttributeValue: function (id, attrname, attrvalue) {
        return JQWEB.ElementLibrary.setAttributeValue(id, attrname, attrvalue);
    },
    isTable: function (id) {
        return JQWEB.ElementLibrary.isTable(id);
    },
    //getPageData(Path[] columns)
    getPageData: function (id, columns) {
        return JQWEB.ElementLibrary.getPageData(id, columns);
    },
    click: function (id, type, btn) {
        return JQWEB.ElementLibrary.click(id, type, btn);
    },
    scrollIntoView: function (id) {
        return JQWEB.ElementLibrary.scrollIntoView(id);
    },
    getTableColInfo: function (id) {
        return JQWEB.ElementLibrary.getTableColInfo(id);
    },
    getTableData: function (id) {
        return JQWEB.ElementLibrary.getTableData(id);
    },
    enable: function (id) {
        return JQWEB.ElementLibrary.enable(id);
    }
}

String.prototype.equalsIgnoreCase = function (anotherString) {
    if (this === anotherString) {  //如果两者相同   否则判端两个的大小写是否为null
        return true;
    }
    //因为 typeof(null) = object  typeof(undefined) = undefined  实际上也是判端了这两个不为空
    if (typeof (anotherString) === 'string') { //this!=null&&this!=undefined &&anotherString!=null&& anotherString!=undefined
        return this.toLowerCase() == anotherString.toLowerCase(); //
    }
    return false;
}

function GetElementChild(element) {
    if (!element) return [];
    if (element.tagName && ("iframe".equalsIgnoreCase(element.tagName) || "frame".equalsIgnoreCase(element.tagName))) {
        return element.contentDocument.children;
    }
    if (!element.children) {
        var elementList = element.childNodes;
        var elementItem, elementArr = [];
        for (var i = 0; i < elementList.length; i++) {
            elementItem = elementList[i];
            if (elementItem.nodeType == 1) {//说明该节点为元素节点
                elementArr.push(elementItem);
            }
        }
        return elementArr;
    } else {
        return element.children;
    }
}

// 获取浏览器信息
function getBrowserInfo() {

    // 获取浏览器类型
    let explorer = window.navigator.userAgent;
    let browserType;
    if (explorer.toLowerCase().indexOf("msie") >= 0) {
        browserType = 'iexplore.exe';
    } else if (explorer.toLowerCase().indexOf("firefox") >= 0) {
        browserType = 'firefox.exe';
    } else if (explorer.toLowerCase().indexOf("chrome") >= 0) {
        browserType = 'chrome.exe';
    }

    return JSON.stringify({
        title: document.title,
        application: browserType,
        url: document.URL
    });
}
