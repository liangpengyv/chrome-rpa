/**
 * @description:
 * @dependency:TreeLibrary,IDManager
 */

(function () {
    var FindLibrary = {
        exists: exists,
        findAllByAttrMap: findAllByAttrMap,
        findAllByPath: findAllByPath,
        findByPath: findByPath,
        findElement: findElement,
        getHTMLByPoint: getHTMLByPoint,
        getRectByPoint: getRectByPoint,
        getPathElementsIdList: getPathElementsIdList
    };

    if (JQWEB) {
        JQWEB.FindLibrary = FindLibrary;
    }

    /**
     *
     * @param {jsonarr} path
     */
    function exists(path) {
        var id = findByPath(path);
        if (!id) {
            console.log("Element not found with path :" + path);
            return "false";
        }
        return "true";
    }

    function findAllByAttrMap(attrMapStr) {
        var attrMap = JSON.parse(attrMapStr);
        var tagName = attrMap.tag;
        var cssSelector = attrMap['css-selector'];
        var collections = JQWEB.HTMLElementFunction.GetHtmlCollectionForParentId(document, '', tagName, cssSelector);
        var result = JQWEB.HTMLElementFunction.FindElementCollectionUsingAttributes(collections, attrMap, 9999);
        return JSON.stringify(result);
    }

    function findAllByPath(path) {

        var pathObj = uiaPath2path(path);
        var docRoot = document;
        var crtParentID;
        for (var i = 1; i < pathObj.length; i++) {
            var crtObj = pathObj[i];
            var collection = JQWEB.HTMLElementFunction.GetHtmlCollectionForParentId(docRoot, crtParentID, crtObj.attrMap.tag, crtObj.attrMap['css-selector'])
            var ele;
            if (i == (pathObj.length - 1)) {
                var result = [];
                var list = JQWEB.HTMLElementFunction.FindElementCollectionUsingAttributes(collection, crtObj.attrMap, 9999);
                for (var j = 0; j < list.length; j++) {
                    result.push(JQWEB.IDManager.getElementID(list[j]));
                    console.log(list[j]);
                }
                return JSON.stringify(result);
            } else {
                ele = JQWEB.HTMLElementFunction.FindElementUsingAttributes(collection, crtObj.index == 0 ? 1 : crtObj.index, crtObj.attrMap);
            }
            console.log(ele);
            if (ele) {
                if (ele.tagName.toLowerCase() != 'iframe')
                    crtParentID = JQWEB.IDManager.getElementID(ele);
                else {
                    docRoot = ele.contentDocument;
                    crtParentID = '';
                }
            } else return null;
        }
        return crtParentID;
    }

    function uiaPath2path(path) {

        // var uiapath = JSON.parse(path);
        // var elems = uiapath.elements;
        var elems = path.elements;
        var pathobj = [];
        for (var i = 0; i < elems.length; i++) {
            var crtelem = elems[i];
            if (crtelem.enable == false || crtelem.enable == "false") continue;

            var crtattributes = crtelem.attributes;
            var crtpathele = {};
            crtpathele.attrMap = {};
            crtpathele.index = 0;
            for (var j = 0; j < crtattributes.length; j++) {
                var crtattr = crtattributes[j];
                if (crtattr.enable != true && crtattr.enable != 'true') continue;
                if (crtattr.name == "index") {
                    crtpathele.index = parseInt(crtattr.value);
                    continue;
                }
                crtpathele.attrMap[crtattr.name] = crtattr.value;
            }
            pathobj.push(crtpathele);
        }
        return pathobj;
    }

    function findByPath(path, parentid) {
        var pathObj = uiaPath2path(path);
        var docRoot = document;
        var crtParentID;
        if (!parentid && parentid != "")
            crtParentID = parentid;
        for (var i = 1; i < pathObj.length; i++) {
            var crtObj = pathObj[i];
            var collection = JQWEB.HTMLElementFunction.GetHtmlCollectionForParentId(docRoot, crtParentID, crtObj.attrMap.tag, crtObj.attrMap['css-selector'])
            var ele = JQWEB.HTMLElementFunction.FindElementUsingAttributes(collection, crtObj.index == 0 ? 1 : crtObj.index, crtObj.attrMap);
            console.log(ele);
            if (ele) {
                if (ele.tagName.toLowerCase() != 'iframe') {
                    crtParentID = JQWEB.IDManager.getElementID(ele);
                } else {
                    docRoot = ele.contentDocument;
                    crtParentID = '';
                }
            } else {
                return "null";
            }
        }
        return crtParentID;
    }

    function findElement(index, attrMapStr) {
        var attrMap = JSON.parse(attrMapStr);
        var tagName = attrMap.tag;
        var cssSelector = attrMap['css-selector'];
        //get collections which all elements has given tagName and cssSelector;
        var collections = JQWEB.HTMLElementFunction.GetHtmlCollectionForParentId(document, '', tagName, cssSelector);
        //find the element with attrmap and index in collections
        var result = JQWEB.HTMLElementFunction.FindElementUsingAttributes(collections, index + 1, attrMap);
        return JSON.stringify(result);
    }

    function getHTMLByPoint(point) {
        var rootDocument = document;

        // 考虑浏览器边缘出现坐标点为负数
        if (point.x < 0) point.x = 0;
        if (point.y < 0) point.y = 0;

        try {
            var cssPos = {x: point.x, y: point.y};

            //Iterate all the documents in all the frames to get the element from the specified CSS position.
            var foundElem = null, lastFrame = null;
            var totalFrameOfs = {x: 0, y: 0};
            var doc = rootDocument;
            while (doc) {
                var xOfsInDoc = cssPos.x - totalFrameOfs.x;
                var yOfsInDoc = cssPos.y - totalFrameOfs.y;

                foundElem = doc.elementFromPoint(xOfsInDoc, yOfsInDoc);

                if (foundElem == null) {
                    foundElem = lastFrame;
                    break;
                }

                var tagName = foundElem.tagName.toLowerCase();
                JQWEB.IDManager.getElementID(foundElem, lastFrame);
                if (tagName !== "frame" && tagName !== "iframe")
                    break;
                lastFrame = foundElem;
                var crtFrameRc = lastFrame.getBoundingClientRect();
                totalFrameOfs.x += crtFrameRc.left;
                totalFrameOfs.y += crtFrameRc.top;

                doc = JQWEB.SafePage.GetSafeContentDocument(lastFrame);
            }
            //If the frame has a smaller rectangle, take the frame
            if (foundElem && lastFrame) {
                var elemRect = foundElem.getBoundingClientRect();
                var frameRect = lastFrame.getBoundingClientRect();
                //Take the element at point only if it resides inside the frame.
                if (frameRect.width < elemRect.width || frameRect.height < elemRect.height)
                    foundElem = lastFrame;
            }

            if (foundElem == null) {
                return -1 + "";
            }

            /////////////////////////////////////////////////////////////////////
            // DEBUG
            /*var tag = foundElem.tagName;
            var attr = GetAttributeValue(foundElem, "name"); */

            //Calculate the custom ID of this element.
            out_customId = JQWEB.IDManager.getElementID(foundElem);
//			var pointDiv = document.getElementById("pointdiv");
//			if (!pointDiv) {
//				pointDiv = document.createElement("div");
//				pointDiv.id = 'pointdiv';
//				pointDiv.style.border = '4px solid red';
//				pointDiv.style.width = '1px';
//				pointDiv.style.height = '1px';
//				pointDiv.style.position = 'absolute';
//				pointDiv.style.zIndex = 99999999999;
//				pointDiv.style.left = jp.x;
//				pointDiv.style.right = jp.y;
//				document.getElementsByTagName("body")[0].appendChild(pointDiv);
//			}
//			pointDiv.style.left = (jp.x - 4) + "px";
//			pointDiv.style.top = (jp.y - 4) + "px";

        } catch (e) {
            console.error("GetHtmlFromPoint exception: " + e);
            return -1 + "";
        }

        return out_customId;
    }

    function getRectByPoint(point) {
        var id = JQWEB.FindLibrary.getHTMLByPoint(point);
        return JQWEB.ElementLibrary.getRect(id);
    }

    function getPathElementsIdList(id) {
        return JSON.stringify(JQWEB.TreeLibrary.getPath(id));
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
