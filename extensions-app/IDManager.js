(function () {
    var IDManager = {
        g_IDCachce: {},
        g_crtIDValue: 0,
        g_isInitialized: false,
        getElementID: getElementID,
        generateID: generateID,
        getElementByID: getElementByID,
        getElementRootByID: getElementRootByID,
        reset: reset
    }

    if (JQWEB) {
        JQWEB.IDManager = IDManager;
    }

    function getElementID(dom, root) {
        if (dom.hasAttribute("customid")) {
            return dom.getAttribute('customid');
        } else {
            var crtid = IDManager.g_crtIDValue;
            dom.setAttribute('customid', crtid);
            IDManager.g_IDCachce[crtid] = {};
            IDManager.g_IDCachce[crtid].dom = dom;
            if (root)
                IDManager.g_IDCachce[crtid].root = root;
            else {
                IDManager.g_IDCachce[crtid].root = getElementRootByID(crtid);
            }
            IDManager.g_crtIDValue++;
            return getElementID(dom);
        }
    }

    function generateID(root) {
        if (IDManager.g_isInitialized == false) {
            var elems = root.getElementsByTagName("*");
            for (var i = 0; i < elems.length; i++) {
                getElementID(elems[i]);
            }
        }
    }

    function getElementByID(id) {
        if (id == -1) return null;
        return IDManager.g_IDCachce[id].dom;
    }

    function getElementRootByID(id) {
        if (IDManager.g_IDCachce[id].root) {
            return IDManager.g_IDCachce[id].root;
        } else {
            var framelist = [];
            JQWEB.SafePage.GetFrameListRecursive(document, framelist);
            for (var i = 0; i < framelist.length; i++) {
                try {
                    var crtFrame = framelist[i];
                    var crtDoc = crtFrame.contentDocument;
                    if (!crtDoc) continue;
                    if (crtDoc.querySelectorAll("[customid=\"" + id + "\"]").length > 0) {
                        IDManager.g_IDCachce[id].root = crtFrame;
                        return crtFrame;
                    }
                } catch (e) {
                    continue;
                }

            }
        }
    }

    function reset() {

        var keys = Object.keys(JQWEB.IDMananger.g_IDCachce);
        for (var i = 0; i < keys.length; i++) {
            JQWEB.IDMananger.g_IDCachce[keys[i]].removeAttribute("customid");
        }
        JQWEB.IDMananger.g_IDCachce = {};
        JQWEB.IDMananger.g_crtIDValue = 0;
        JQWEB.IDMananger.g_isInitialized = false;
    }
})();

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
