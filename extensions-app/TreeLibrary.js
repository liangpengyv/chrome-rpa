(function () {
    var TreeLibrary = {
        getPath: getPath,
        getChildren: getChildren,
        getParent: getParent,
        getRoot: getRoot,
        getTreeProperties: getTreeProperties,
        getTreeText: getTreeText,
        getAllPath: getAllPath,
        getBestPath: getBestPath,
        getBestAttrMapAndIndexByID: getBestAttrMapAndIndexByID
    }


    if (JQWEB) {
        JQWEB.TreeLibrary = TreeLibrary;
    }

    //获取元素的最佳路径
    function getBestPath(customid, isDebug) {
        var path = JQWEB.TreeLibrary.getPath(customid);
        var result = [];
        var crtParent = 0;
        for (var i = 0; i < path.length; i++) {
            var crtAttrMap;
            if (i == 0) {
                var crtAttrMapStr = JQWEB.TreeLibrary.getBestAttrMapAndIndexByID(path[i]);
                crtAttrMap = JSON.parse(crtAttrMapStr);
                crtAttrMap.enable = true;
            } else {
                var dom = JQWEB.IDManager.getElementByID(path[i])
                var tagName = JQWEB.HTMLElementFunction.GetAttributeValue(dom, 'tag').toLowerCase()
                var crtAttrMapStr = JQWEB.TreeLibrary.getBestAttrMapAndIndexByID(path[i], crtParent);
                crtAttrMap = JSON.parse(crtAttrMapStr);
                console.log("customid:" + path[i] + "\tparentid:" + crtParent + "\tindex:" + crtAttrMap.index);
                crtAttrMap.enable = true;
                if (tagName == 'html') {//跳过iframe中的html节点，并设置后续节点父级为html节点
                    crtParent = (path[i]);
//					crtAttrMap.enable = false;
                    continue;
                } else if (crtAttrMap.index == 0 //跳过在父级节点中唯一的元素
                    && (tagName != "frame" && tagName != "iframe")
                    && (i < path.length - 1)) {
                    crtAttrMap.enable = false;
//					continue;
                }
            }
            if (isDebug) crtAttrMap.enable = true;
            crtParent = (path[i]);
//			delete crtAttrMap.index;
            crtAttrMap.runtimeId = path[i];
            result.push(crtAttrMap);
        }
        return JSON.stringify(result);
    }

    //获取元素全路径
    function getAllPath(customid) {
        var path = JQWEB.TreeLibrary.getPath(customid);
        var result = [];
        for (var i = 0; i < path.length; i++) {
            var crtAttrMap = JSON.parse(JQWEB.TreeLibrary.getBestAttrMapAndIndexByID(path[i]));
            result.push(crtAttrMap);
        }
        return JSON.stringify(result);
    }

    //获取元素最佳index下的属性
    function getBestAttrMapAndIndexByID(customid, parentid, frameDocument) {
        var dom = JQWEB.IDManager.getElementByID(customid)
        var tagName = JQWEB.HTMLElementFunction.GetAttributeValue(dom, 'tag')
        var result = JQWEB.HTMLElementFunction.GetSelectorAttributeList(frameDocument || document, customid, parentid, tagName, 1, true);

        return JSON.stringify({
            attributes: result.attributes,
            index: result.index
        });
    }

    //获取全路径id
    function getPath(id) {
        var path = [];
        if (!JQWEB.IDManager || !JQWEB.IDManager.getElementByID) {
            console.log("JQWEB.IDManager doesn't initialized");
            return path;
        }
        var dom = JQWEB.IDManager.getElementByID(id);
        var crtroot = JQWEB.IDManager.getElementRootByID(id);
        while (dom.parentElement) {
            path.push(JQWEB.IDManager.getElementID(dom, crtroot));
            dom = dom.parentElement;
            if (!dom.parentElement && crtroot) {
                var crtid = JQWEB.IDManager.getElementID(dom, crtroot);
                path.push(crtid);
                var crtdom = JQWEB.IDManager.getElementRootByID(crtid);
//				if(crtdom){
                dom = crtdom;
                var ctrframeid = JQWEB.IDManager.getElementID(dom);
                crtroot = JQWEB.IDManager.getElementRootByID(ctrframeid);
//				}else {
//					crtroot = null;
//				}
            }
        }
        path.push(JQWEB.IDManager.getElementID(dom));
        path.reverse();
        return path;
    }

    //获取下级元素列表
    function getChildren(id) {
        var dom = JQWEB.IDManager.getElementByID(id);

        var children = [];
        var crtChildren = JQWEB.GetElementChild(dom);
        if (!crtChildren) return children;
        for (var i = 0; i < crtChildren.length; i++) {
            children.push(JQWEB.IDManager.getElementID(crtChildren[i]));
        }
        return children;
    }

    //获取父级元素
    function getParent(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        return JQWEB.IDManager.getElementID(dom.parentElement);
    }

    //获取根元素
    function getRoot(id) {
        if (!id) {
            return JQWEB.IDManager.getElementID(JQWEB.GetElementChild(document)[0]);
        }
        var dom = JQWEB.IDManager.getElementByID(id);
        var crtroot = JQWEB.IDManager.getElementRootByID(id);
        while (dom.parentElement) {
            dom = dom.parentElement;
            if (!dom.parentElement && crtroot) {
                var crtid = JQWEB.IDManager.getElementID(dom, crtroot);
                var crtdom = JQWEB.IDManager.getElementRootByID(crtid);
                dom = crtdom;
                var ctrframeid = JQWEB.IDManager.getElementID(dom);
                crtroot = JQWEB.IDManager.getElementRootByID(ctrframeid);
            }
        }
        return JQWEB.IDManager.getElementByID(dom);
    }

    function getTreeProperties(id) {
        var crtelem = JQWEB.IDManager.getElementByID(id);
        var kvlist = JQWEB.HTMLElementFunction.GetAttrValueListForElement(crtelem);
        return JSON.stringify(kvlist);
    }

    function getTreeText(id) {
        var tagname = JQWEB.ElementLibrary.getAttributeValue(id, "tag");
        var tid = JQWEB.ElementLibrary.getAttributeValue(id, "id");
        return tagname + (tid ? tid : "");
    }

})();
