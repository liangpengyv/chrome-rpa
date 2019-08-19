/**
 * @description WebElement operations library
 * @dependency:IDManager
 */

(function () {
    var ElementLibrary = {
        check: check,
        isChecked: isChecked,
        clearSelection: clearSelection,
        getAttributeValue: getAttributeValue,
        getPageData: getPageData,
        getRect: getRect,
        getText: getText,
        isPassword: isPassword,
        isElementVisible: isElementVisible,
        selectItems: selectItems,
        setAttributeValue: setAttributeValue,
        setFocus: setFocus,
        setText: setText,
        click: click,
        clearText: clearText,
        isTable: isTable,
        scrollIntoView: scrollIntoView,
        getTableData: getTableData,
        getCheckState: getCheckState,
        getTableColInfo: getTableColInfo,
        getTableRoot: getTableRoot,
        enable: enable
    }

    if (JQWEB) {
        JQWEB.ElementLibrary = ElementLibrary;
    }

    function enable(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        if (!dom) return "false";
        var disabled = dom.getAttribute('disabled');
        if (disabled || disabled == 'true' || disabled == 'disabled') return "false";

        return "true";
    }

    /**
     * change element chech state like checkbox or radio-input
     * @param {long} id
     * @param {0||1} state
     */
    function check(id, state) {
        console.log("id:" + id + "state:" + state);
        var dom = JQWEB.IDManager.getElementByID(id);
        if ("input".equalsIgnoreCase(dom.tagName)
            && "checkbox".equalsIgnoreCase(dom.getAttribute("type"))) {
            if (state == 2) {
                dom.indeterminate = true;
            } else {
                dom.checked = state == 1 ? true : false;
            }
        } else if ("input".equalsIgnoreCase(dom.tagName)
            && "radio".equalsIgnoreCase(dom.getAttribute("type"))) {
            dom.checked = state == 1 ? true : false;
        }
    }

    /**
     * only used by multiple select element : <select multiple="multiple"/>
     */
    function clearSelection(id) {
        //multiple select
        if (!id) {
            var doms = document.getElementsByTagName("option");
            for (var i = 0; i < doms.length; i++) {
                doms.selected = false;
                doms.removeAttribute("selected");
            }
        } else {
            var dom = JQWEB.IDManager.getElementByID(id);
            dom.checked = false;
        }
    }

    /**
     * get element attibute value by id and attribute name
     * @param {long} id
     * @param {string} attrName
     */
    function getAttributeValue(id, attrName) {

        var dom = JQWEB.IDManager.getElementByID(id);
        if ("tag".equalsIgnoreCase(attrName) || "tagname".equalsIgnoreCase(attrName))
            return dom.tagName;

        if ("cssselector".equalsIgnoreCase(attrName) || "css-selector".equalsIgnoreCase(attrName))
            return JQWEB.HTMLElementFunction.GetCssSelector(dom);

        if ("xpath".equalsIgnoreCase(attrName))
            return JQWEB.HTMLElementFunction.GetXPath(dom);

        return dom.getAttribute(attrName);
    }

    /**
     *   get Data with dom : table
     * @returns array like [
     *    [
     *        [1,2,3],
     *        [4,5,6],
     *        [7,8,9]
     *    ],
     *    [
     *        [a1,a2,a3],
     *        [a4,a5,a6],
     *        [a7,a8,a9]
     *    ]
     * ]
     */
    function getPageData(id, colums) {
        console.log(colums);
        var table = JQWEB.IDManager.getElementByID(id);
        var columnsJA = JSON.parse(colums) || [];
        var pageData = [];
        for (var i = 0; i < columnsJA.length; i++) {
            var crtuiapath = columnsJA[i];
            var crtpath = uiaPath2path(crtuiapath);

            var crtColData = getColData(table, crtpath);
            pageData.push(crtColData);
        }
        return JSON.stringify(pageData);
    }

    function getColData(tableEle, colPath) {
        var colData = [];
        var rows = getRowCollections(tableEle, colPath[0]);
        for (var i = 0; i < rows.length; i++) {
            if (isTableTitleRow(rows[i])) continue;
            var data = getRowColData(rows[i], colPath);
            colData.push(data);
        }
        return colData;
    }

    function getRowCollections(tableEle, rowPath) {
        var collections;
        var tagName = rowPath.attrMap.tag;
        collections = tableEle.getElementsByTagName(tagName);
        return JQWEB.HTMLElementFunction.FindElementCollectionUsingAttributes(collections, rowPath.attrMap, 9999);
    }

    function getRowColData(rowEle, colPath) {
        var crtParent = rowEle;
        var crtEle;
        var i = 1;
        while (crtParent) {

            var crtPathObj = colPath[i];
            var collections = crtParent.getElementsByTagName(crtPathObj.attrMap.tag);
            var crtEle = JQWEB.HTMLElementFunction.FindElementUsingAttributes(collections, crtPathObj.index == 0 ? 1 : crtPathObj.index, crtPathObj.attrMap);
            crtParent = crtEle;
            if (++i >= colPath.length) break;
        }
        if (crtParent && crtParent.textContent)
            return crtParent.textContent;
        else return "";

    }

    function uiaPath2path(uiapath) {

        var elems = uiapath.elements;
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

    function getTableRoot(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        var tb = GetParentByTag(dom, "table");
        return JQWEB.IDManager.getElementID(tb);
    }

    /*
     * [
     * 	{colname:'',rowsNode:[
     * 							path0-[]
     * 							path1-[]
     *                        ]
     *  }
     * ]
     *
     * */
    function getTableColInfo(id) {
        var data = [];

        var dom = JQWEB.IDManager.getElementByID(id);
        var tb = GetParentByTag(dom, "table");

        var rows = tb.rows;
        var colstitle = getTableColTitle(tb);
        colstitle.forEach(function (obj) {
            data.push({
                colTitle: obj, rowNodes: []
            });
        })
        /*
        var i=0;
        if(isTableTitleRow(rows[0])){
            i =1;
        }
        for(i;i<rows.length;i++){    //--循环所有的行
            var cells=rows[i].cells;
            for(var j=0;j<cells.length;j++){   //--循环所有的列
                var cell = cells[j];
                var cell_custom_id = JQWEB.IDManager.getElementID(cell);
                data[j].rowNodes.push(JQWEB.getPath(cell_custom_id));
            }
        }*/
        return JSON.stringify(data);
    }

    function isTableTitleRow(row) {
        var cells = row.cells;
        if (!cells) return false;
        for (var j = 0; j < cells.length; j++) {
            var cell = cells[j];
            if (cell.tagName != 'th' && cell.tagName != 'TH') {
                return false;
            }
        }
        return true;
    }

    function getTableColTitle(tb) {
        var colsTitle = [];
        var row1 = tb.rows[0];
        var cells = row1.cells;
        for (var j = 0; j < cells.length; j++) {
            var cell = cells[j];
            if (cell.tagName != 'th' && cell.tagName != 'TH') {
                colsTitle.push("Column-" + (j + 1));
            } else {
                colsTitle.push(cell.textContent || "");
            }
        }
        return colsTitle;
    }

    function getTableData(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        var tb;
        if (dom.tagName == "table" || dom.tagName == "TABLE") {
            tb = dom;
        } else {
            tb = GetParentByTag(dom, "table");
        }
        var data = [];
        var rows = tb.rows;
        for (var i = 0; i < rows.length; i++) {    //--循环所有的行
            var cells = rows[i].cells;
            //var rowdata = [];
            for (var j = 0; j < cells.length; j++) {   //--循环所有的列
                //rowdata.push(cells[j].innerHTML);

                if (!data[j]) {
                    data[j] = [];
                }
                data[j][i] = (cells[j].textContent);

            }
            //data.push(rowdata);
        }
        return JSON.stringify(data);
    }

    function getRect(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        if (!dom) console.log("dom is Null！" + id);
        var cssRectangle = JQWEB.HTMLElementFunction.GetElementClientCssRectangle(document, dom);
        var clientToCssScaleFactor = window.devicePixelRatio;
        var finalRectangle = JQWEB.PageRectUtil.CssToClientRect(cssRectangle, clientToCssScaleFactor);
        var out_left = Math.ceil(finalRectangle.left);
        var out_top = Math.ceil(finalRectangle.top);
        var out_right = Math.ceil(finalRectangle.right);
        var out_bottom = Math.ceil(finalRectangle.bottom);
        //drawRect(out_left,out_top,out_right,out_bottom);
        return JSON.stringify({
            left: out_left,
            top: out_top,
            width: out_right - out_left,
            height: out_bottom - out_top
        });
    }

    function drawRect(out_left, out_top, out_right, out_bottom) {

        var pointDivL = document.getElementById("pointdivLeft");
        var pointDivR = document.getElementById("pointdivRight");
        var pointDivT = document.getElementById("pointdivTop");
        var pointDivB = document.getElementById("pointdivBottom");

        if (!pointDivL) {
            pointDivL = document.createElement("div");
            pointDivL.id = 'pointdivLeft';
            pointDivL.style.border = '2px solid blue';
            pointDivL.style.width = "0px";
            pointDivL.style.height = (out_bottom - out_top) + "px";
            pointDivL.style.position = 'absolute';
            pointDivL.style.zIndex = 99999999999;
            pointDivL.style.left = (out_left - 4) + 'px';
            pointDivL.style.top = (out_top - 4) + 'px';
            document.getElementsByTagName("body")[0].appendChild(pointDivL);

            pointDivR = document.createElement("div");
            pointDivR.id = 'pointdivRight';
            pointDivR.style.border = '2px solid blue';
            pointDivR.style.width = "0px";
            pointDivR.style.height = (out_bottom - out_top) + "px";
            pointDivR.style.position = 'absolute';
            pointDivR.style.zIndex = 99999999999;
            pointDivR.style.left = (out_right + 4) + 'px';
            pointDivR.style.top = (out_top - 4) + 'px';
            document.getElementsByTagName("body")[0].appendChild(pointDivR);

            pointDivT = document.createElement("div");
            pointDivT.id = 'pointdivTop';
            pointDivT.style.border = '2px solid blue';
            pointDivT.style.width = (out_right - out_left) + "px";
            pointDivT.style.height = "0px";
            pointDivT.style.position = 'absolute';
            pointDivT.style.zIndex = 99999999999;
            pointDivT.style.left = (out_left - 4) + 'px';
            pointDivT.style.top = (out_top - 4) + 'px';
            document.getElementsByTagName("body")[0].appendChild(pointDivT);

            pointDivB = document.createElement("div");
            pointDivB.id = 'pointdivBottom';
            pointDivB.style.border = '2px solid blue';
            pointDivB.style.width = (out_right - out_left) + "px";
            pointDivB.style.height = "0px";
            pointDivB.style.position = 'absolute';
            pointDivB.style.zIndex = 99999999999;
            pointDivB.style.left = (out_right + 4) + 'px';
            pointDivB.style.top = (out_bottom + 4) + 'px';
            document.getElementsByTagName("body")[0].appendChild(pointDivB);
        }
        pointDivL.style.width = "0px";
        pointDivL.style.height = (out_bottom - out_top + 4) + "px";
        pointDivL.style.left = (out_left - 4) + 'px';
        pointDivL.style.top = (out_top - 4) + 'px';

        pointDivR.style.width = "0px";
        pointDivR.style.height = (out_bottom - out_top + 4) + "px";
        pointDivR.style.left = (out_right) + 'px';
        pointDivR.style.top = (out_top - 4) + 'px';

        pointDivT.style.width = (out_right - out_left - 4) + "px";
        pointDivT.style.height = "0px";
        pointDivT.style.left = (out_left) + 'px';
        pointDivT.style.top = (out_top - 4) + 'px';

        pointDivB.style.width = (out_right - out_left + 4) + "px";
        pointDivB.style.height = "0px";
        pointDivB.style.left = (out_left - 4) + 'px';
        pointDivB.style.top = (out_bottom) + 'px';

    }

    function getText(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        return JQWEB.HTMLElementFunction.GetTextContentFromElement(dom);
//		if(isLeaf(dom)){
//			return dom.textContent;
//		}else {
//			return "";
//		}
    }

    function isPassword(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        if ("input".equalsIgnoreCase(dom.tagName)
            && "password".equalsIgnoreCase(dom.type)) return "true";
        return "false";
    }

    function isTable(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        var tag = dom.tagName;

        if (GetParentByTag(dom, "table") || tag == "table" || tag == "TABLE") return "true";
        return "false";

    }

    function getCheckState(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        if ("input".equalsIgnoreCase(dom.tagName)) {
            if ("checkbox".equalsIgnoreCase(dom.getAttribute("type"))) {
                return dom.indeterminate ? 2 : (dom.checked ? 1 : 0);
            } else if ("radio".equalsIgnoreCase(dom.getAttribute("type"))) {
                return dom.checked ? 1 : 0;
            }
        }
    }

    function isChecked(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        if ("input".equalsIgnoreCase(dom.tagName)
            && (
                "checkbox".equalsIgnoreCase(dom.getAttribute("type")) ||
                "radio".equalsIgnoreCase(dom.getAttribute("type"))
            )
        ) {
            return dom.checked ? 1 : 0;
        }

    }

    /**
     * 判断元素是否可见
     * @param {Object} elm
     */
    function isElementVisible(id) {
        var el = JQWEB.IDManager.getElementByID(id);
        var rect = el.getBoundingClientRect(),
            vWidth = window.innerWidth || document.documentElement.clientWidth,
            vHeight = window.innerHeight || document.documentElement.clientHeight,
            efp = function (p, x, y) {
                var els = document.elementsFromPoint(x, y); // 获取某点的所有元素, 最顶层的元素在最前面
                for (var index = 0; index < els.length; index++) {
                    var style = getComputedStyle(els[index]);
                    // 如果此前的元素是半透明的，并且不是当前元素，则跳过当前元素
                    if (p != els[index] && (style.opacity < 1 || style.display == 'none' || ['collapse', 'hidden'].indexOf(el.style.visibility) == -1)) {
                        continue;
                    } else return els[index];
                }
                return els[0];
            };
        // Return false if it's not in the viewport
        if (rect.right < 0 || rect.bottom < 0
            || rect.left > vWidth || rect.top > vHeight)
            return false;

        return (el.contains(efp(el, rect.left, rect.top))
            || el.contains(efp(el, rect.right, rect.top))
            || el.contains(efp(el, rect.right, rect.bottom))
            || el.contains(efp(el, rect.left, rect.bottom)))
            || el.contains(efp(el, rect.left + (rect.right - rect.left) / 2, rect.top + (rect.bottom - rect.top) / 2));
    }

    function GetParentByTag(element, tagName) {
        var out_parentElem = element.parentElement;

        while (out_parentElem != null && out_parentElem.nodeType === out_parentElem.ELEMENT_NODE) {
            if (out_parentElem.tagName.toLowerCase() === tagName)
                break;
            out_parentElem = out_parentElem.parentElement;
        }

        return out_parentElem;
    }

    function selectItems(id, textContentArr) {
        //[1,2,3,4]
        //multiple select
        var select = JQWEB.IDManager.getElementByID(id);
        if (!select) return;
        var options = select.options || [];
        for (var i = 0; i < options.length; i++) {
            var option = options[i];
            if (textContentArr.indexOf(option.textContent) != -1) {
                option.selected = true;
                option.setAttribute("selected", "selected");
            }
        }
        ;
    }

    function setAttributeValue(id, attrName, attrValue) {
        var dom = JQWEB.IDManager.getElementByID(id);
        dom.setAttribute(attrName, attrValue);
    }

    function setFocus(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        if (dom.tagName
            && (dom.tagName.toLowerCase() == "input"
                && (!dom.getAttribute("type")
                    || dom.getAttribute("type").toLowerCase() == "text"
                    || dom.getAttribute("type").toLowerCase() == "password"
                )
                || dom.tagName.toLowerCase() == "textarea"
            )
        ) {
            document.activeElement.blur();
            dom.focus();
            dom.setSelectionRange(dom.value.length, dom.value.length);
        }
    }

    function setText(id, text) {
        var dom = JQWEB.IDManager.getElementByID(id);
        if (isLeaf(dom)) {
            if ("input".equalsIgnoreCase(dom.tagName)
                && (!dom.getAttribute("type") || "text".equalsIgnoreCase(dom.getAttribute("type")) || "password".equalsIgnoreCase(dom.getAttribute("type")))) {
                dom.value = text;
            } else dom.textContent = text;
        } else {
            dom.innerText(text);
        }
    }

    function click(id, type, btn) {
        var dom = JQWEB.IDManager.getElementByID(id);
//		/** 单击 */ 
//		SINGLE(0),
//		
//		/** 双击 */
//		DOUBLE(1),
//		
//		/** 按下 */
//		DOWN(2),
//		
//		/** 弹起 */
//		UP(3);
        //左右中 124
        var doc = dom.ownerDocument;
        var types = null;
        if (btn == 2 && type == 0) {//右键单击
            types = ["mousedown", "mouseup", "contextmenu"];
        } else if (type == 1) {//双击：只实现左键双击
            types = ["mousedown", "mouseup", "click", "mousedown", "mouseup", "click", "dblclick"];
        } else if (type == 0) {//左键单击
            //types = ["mousedown","mouseup","click"];
            dom.click();
            return;
        } else if (type == 2) {//左键按下
            types = ["mousedown"];
        } else if (type == 3) {//左键谈起
            types = ["mouseup"];
        }


        for (var i = 0; i < types.length; ++i) {
            var e = document.createEvent("Events");
            if (e == null)
                return false;
            e.initEvent("dblclick", true, true)
            dom.dispatchEvent(e)
        }

    }

    function clearText(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        if (dom.tagName
            && dom.tagName == "input"
            && dom.getAttribute("type") == "text") {
            dom.value = "";
        }
    }

    function scrollIntoView(id) {
        var dom = JQWEB.IDManager.getElementByID(id);
        dom.scrollIntoView();
    }

    /* ******************* */
    function isLeaf(node) {
        if (JQWEB.GetElementChild(node).length > 0) {
            return false;
        } else {
            return true;
        }
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
