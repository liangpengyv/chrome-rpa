/////////////////////////////////////////////////////////////////////////////////////////////
// This file contains functions that deal with HTML elements.
// It is recommended that the code in this file is compatible with all browsers.

(function () {
    var HTMLElementFunction = {
        AddHiddenSpansForInputValues: AddHiddenSpansForInputValues,
        ComputeIndexInParent: ComputeIndexInParent,
        FindElementUsingAttributes: FindElementUsingAttributes,
        FindElementCollectionUsingAttributes: FindElementCollectionUsingAttributes,
        GetIndexForAttributeList: GetIndexForAttributeList,
        GetTruncatedAttributeValue: GetTruncatedAttributeValue,
        GetSelectorAttributeList: GetSelectorAttributeList,
        DeleteForbiddenCharacters: DeleteForbiddenCharacters,
        GetAttrValueListForElement: GetAttrValueListForElement,
        GetAttributeValue: GetAttributeValue,
        GetHtmlCollectionForParentId: GetHtmlCollectionForParentId,
        GetCssSelector: getCssSelector,
        GetXPath: getXpath,
        GetElementClientCssRectangle: GetElementClientCssRectangle,
        GetTextContentFromElement: GetTextContentFromElement
    }

    if (JQWEB) {
        JQWEB.HTMLElementFunction = HTMLElementFunction
    }
    var N_TRUE = 1;
    var N_FALSE = 0;

    var CUSTOM_ID_ATTR_NAME = 'customid';
    var MAX_ATTR_LEN = 65535;

    // Flag definitions from "<SS_Dir>\Output\COM generated files\UIElement\UIElement_i.h"
    // They are used by "ClickHtmlElem".
    // Keep in sync!!!
    var UIE_CF_CLICK_MASK = 0x00000003;
    var UIE_CF_SINGLE = 0x00000000;
    var UIE_CF_DOUBLE = 0x00000001;
    var UIE_CF_HOVER = 0x00000002;
    var UIE_CF_BUTTON_MASK = 0x0000000C;
    var UIE_CF_LEFT = 0x00000000;
    var UIE_CF_RIGHT = 0x00000004;
    var UIE_CF_MIDDLE = 0x00000008;
    var UIE_CF_SCREEN_COORDS = 0x00000010;
    var UIE_CF_DOWN = 0x00001000;
    var UIE_CF_UP = 0x00002000;
    var UIE_CF_MOD_CTRL = 0x00004000;
    var UIE_CF_MOD_ALT = 0x00008000;
    var UIE_CF_MOD_SHIFT = 0x00010000;


    //Used by "ClickHtmlElement".
    var HTML_LEFT_BUTTON = 0;	// Left button is pressed.
    var HTML_MIDDLE_BUTTON = 1;	// Right button is pressed.
    var HTML_RIGHT_BUTTON = 2;	// Middle button is pressed.

    var HTML_CLICK_SINGLE = 0;	// Simulate Single Click
    var HTML_CLICK_DOUBLE = 1;	// Simulate Double Click
    var HTML_CLICK_HOVERONLY = 2;	// Simulate Mouse Hover only

    var CLICK_OFFSET_X = 2;
    var CLICK_OFFSET_Y = 2;

    var g_getCustomAttrMap = {
        "url": function (elem) {
            if (elem.ownerDocument)
                return elem.ownerDocument.URL;
            return "";
        },
        "htmlwindowname": function (elem) {
            if (window.name) {
                return window.name;
            } else {
                return "";
            }
        },
        "title": function (elem) {
            if (elem.ownerDocument)
                return elem.ownerDocument.title;
            return "";
        },
        "cookie": function (elem) {
            if (elem.ownerDocument)
                return elem.ownerDocument.cookie;
            return "";
        },
        "readystate": function (elem) {
            if (elem.ownerDocument)
                return elem.ownerDocument.readyState === "complete" ? "1" : "0";
            return "0";
        },
        "innertext": function (elem) {
            return DeleteForbiddenCharacters(elem.textContent);
        },
        "outertext": function (elem) {
            return DeleteForbiddenCharacters(elem.textContent);
        },
        "innerhtml": function (elem) {
            return elem.innerHTML;
        },
        "outerhtml": function (elem) {
            return elem.outerHTML;
        },
        "tag": function (elem) {
            return elem.tagName;
        },
        "parentcustomid": function (elem) {
            if (elem.parentElement)
                return JQWEB.IDManager.getElementID(elem.parentElement);
            return "";
        },
        "parentid": function (elem) {
            return GetParentAttributeValue(elem, "id");
        },
        "parentname": function (elem) {
            return GetParentAttributeValue(elem, "name");
        },
        "parentclass": function (elem) {
            return GetParentAttributeValue(elem, "class");
        },
        "tablerow": function (elem) {
            var r = GetTableRowAndCol(elem, {getRow: true}).row;
            return r < 0 ? "" : r;
        },
        "tablecol": function (elem) {
            var c = GetTableRowAndCol(elem, {getCol: true}).col;
            return c < 0 ? "" : c;
        },
        "rowname": function (elem) {
            return GetTableRowName(elem);
        },
        "colname": function (elem) {
            return GetTableColName(elem);
        },
        "columncount": function (elem) {
            return GetTableColCount(elem);
        },
        "rowcount": function (elem) {
            return GetTableRowCount(elem);
        },
        "checked": function (elem) {
            if (elem.type !== "checkbox" && elem.type !== "radio")
                return null;
            return elem.checked;
        },
        "role": function (elem) {
            //TODO: find the role using "instanceOf"
            return "element";
        },
        "aastate": function (elem) {
            //TODO: extend the possibilities
            if (elem.disabled === true)
                return "disabled";
            return "enabled";
        },
        "aaname": function (elem) {
            return getAccName(elem);
        },
        "css-selector": function (elem) {
            return getCssSelector(elem);
        },
        "xpath": function (elem) {
            return getXpath(elem);
        },
        "selecteditem": function (elem) {
            return GetSelectedItemTxt(elem);
        },
        "selecteditems": function (elem) {
            return GetSelectedItemsTxt(elem);
        },
        "isleaf": function (elem) {
            return (isLeafElement(elem) ? "1" : "0");
        }
    };


    function GetSelectedItemTxt(e) {
        var items = GetSelectedItems(e, 0);
        if (items && items.length > 0) {
            return items[0];
        }

        return "";
    }

    function GetSelectedItemsTxt(e) {
        var items = GetSelectedItems(e, 0);
        var txt = "";

        for (var i = 0; i < items.length; ++i) {
            if (txt) {
                txt = txt + ", ";
            }

            txt = txt + "\"";
            txt = txt + items[i];
            txt = txt + "\"";
        }

        txt = "{ " + txt;
        txt = txt + " }";

        return txt;
    }

    //This function must always return a string.
    //Boolean values are converted to "0" or "1", the other types are returned as their string representation.
    function GetAttributeValue(element, attrName) {
        var out_attrValue = "";

        var getCustomAttrFunc = g_getCustomAttrMap[attrName.toLowerCase()];
        var rawAttrVal;
        if (getCustomAttrFunc != null)
            rawAttrVal = getCustomAttrFunc(element);
        else
            rawAttrVal = element.getAttribute(attrName);

        //Make sure that we return a string
        if (typeof (rawAttrVal) === "boolean")
            out_attrValue = (rawAttrVal ? "1" : "0");
        else if (rawAttrVal != null && rawAttrVal.toString != null)
            out_attrValue = rawAttrVal.toString();

        return out_attrValue;
    }

    function GetParentAttributeValue(element, attrName) {
        var out_attrValue = "";
        var crtElem = element.parentElement;

        while (crtElem != null) {
            out_attrValue = GetAttributeValue(crtElem, attrName);
            if (out_attrValue.length !== 0)
                break;
            crtElem = crtElem.parentElement;
        }

        return out_attrValue;
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

    function GetFirstChildText(parentElem, tag, index) {
        var children = parentElem.getElementsByTagName(tag);
        if (children == null) {
            return "";
        }

        if (index > children.length - 1) {
            return "";
        }

        var text = children.item(index).textContent;
        return DeleteForbiddenCharacters(text);
    }

    function GetTableRowCount(e) {
        var tagName = e.tagName.toLowerCase();
        if (tagName !== "table") {
            return "";
        }

        var rows = e.getElementsByTagName("tr");
        if (rows !== null) {
            return rows.length.toString();
        }

        return "";
    }

    function GetTableColCount(e) {
        var tagName = e.tagName.toLowerCase();
        if (tagName !== "table") {
            return "";
        }

        var rows = e.getElementsByTagName("tr");
        if ((rows !== null) && (rows.length > 0)) {
            var tds = rows.item(0).getElementsByTagName("td");
            if ((tds !== null) && (tds.length > 0)) {
                return tds.length.toString();
            }

            var ths = rows.item(0).getElementsByTagName("th");
            if ((ths !== null) && (ths.length > 0)) {
                return ths.length.toString();
            }
        }

        return "";
    }

    function GetTableRowName(elem) {
        var parentRow = GetParentByTag(elem, "tr");
        if (!parentRow) {
            return "";
        }

        var text = GetFirstChildText(parentRow, "th", 0);
        if (text === "") {
            text = GetFirstChildText(parentRow, "td", 0);
        }

        return text;
    }

    function GetTableColName(elem) {
        var table = GetParentByTag(elem, "table");
        if (!table) {
            return "";
        }

        var colIndex = GetTableRowAndCol(elem, {getCol: true}).col;
        if (colIndex < 1) {
            return "";
        }

        var text = GetFirstChildText(table, "th", colIndex - 1);
        if (text === "") {
            text = GetFirstChildText(table, "td", colIndex - 1);
        }

        return text;
    }

    function GetTableRowAndCol(cellElem, inputFlags) {
        var out_rowAndCol = {row: -1, col: -1};
        var tagName = cellElem.tagName.toLowerCase();

        if (tagName !== "td" && tagName !== "th") {
            // Not a table cell or table header cell, find a td or th parent.
            var parentCell = GetParentByTag(cellElem, "td");
            if (parentCell === null) {
                parentCell = GetParentByTag(cellElem, "th");
                if (parentCell === null) {
                    // Cannot get TD/TH parent in GetTableRowAndCol.
                    return out_rowAndCol;
                }
            }

            cellElem = parentCell;
        }

        var rowParent = GetParentByTag(cellElem, "tr");
        if (rowParent == null)
            return out_rowAndCol;

        if (inputFlags.getCol === true)
            out_rowAndCol.col = ComputeIndexInParent(cellElem, rowParent);

        if (inputFlags.getRow === true) {
            var tableParent = GetParentByTag(rowParent, "table");
            if (tableParent == null)
                return out_rowAndCol;

            out_rowAndCol.row = ComputeIndexInParent(rowParent, tableParent);
        }

        return out_rowAndCol;
    }

    function ComputeIndexInParent(element, parent) {
        var out_index = -1;
        var i;

        var refCustomId = JQWEB.IDManager.getElementID(element);

        var children = parent.getElementsByTagName(element.tagName);
        if (children == null)
            return out_index;
        for (i = 0; i < children.length; ++i) {
            if (JQWEB.IDManager.getElementID(children.item(i)) === refCustomId) {
                out_index = i + 1;
                break;
            }
        }

        return out_index;
    }

    function ElementHasAttributeValues(element, attrMap) {
        if (element == null) {
            return false;
        }

        var out_match = true;
        for (var attrName in attrMap) {
            // Don't compare css-selector.
            if (attrName !== "css-selector") {
                var crtValue = GetAttributeValue(element, attrName);
                if (crtValue) crtValue = crtValue.trim();
                var trimValue = attrMap[attrName];
                if (trimValue) trimValue = trimValue.trim();

                var matchRes = JQWEB.Utils.StringWildcardMatch(trimValue, crtValue);
                //TraceMessage("ElementHasAttributeValues: matching attribute '"+attrName + "': current value '"+crtValue + "' against given '"+attrMap[attrName]+"' returned " + matchRes);
                if (matchRes === false) {
                    out_match = false;
                    break;
                }
            }
        }

        return out_match;
    }

    function FindElementUsingAttributes(htmlCollection, index, attrMap) {
        var out_element = null;
        var i;

        if (htmlCollection == null)
            return out_element;

        var crtIndex = 0;
        for (i = 0; i < htmlCollection.length; ++i) {
            var crtElem = htmlCollection[i];
            if (ElementHasAttributeValues(crtElem, attrMap) === true) {
                ++crtIndex;
                if (crtIndex === index) {
                    out_element = crtElem;
                    break;
                }
            }
        }

        return out_element;
    }

    function FindElementCollectionUsingAttributes(htmlCollection, attrMap, maxElems) {
        var out_elements = [];
        var i;

        if (htmlCollection == null)
            return out_elements;

        var crtIndex = 0;
        for (i = 0; i < htmlCollection.length; ++i) {
            var crtElem = htmlCollection[i];
            if (ElementHasAttributeValues(crtElem, attrMap) === true) {
                out_elements.push(crtElem);
                if (out_elements.length >= maxElems)
                    break;
            }
        }

        return out_elements;
    }

    //Returns -1 if there was an error or no element was found.
    //Returns 0 if the element was found and it's unique.
    //Returns >= 1 if the element was found and it's not unique.
    function GetIndexForAttributeList(htmlCollection, targetCustomId, attrMap) {
        TraceMessage("GetIndexForAttributeList: enter targetCustomId=" + targetCustomId);
        //console.log(htmlCollection);
        //console.log(attrMap);
        var out_index = 0;

        var i = 0;
        var found = false;
        var unique = true;

        for (i = 0; i < htmlCollection.length; ++i) {
            var crtElem = htmlCollection[i];
            var crtCustomId = JQWEB.IDManager.getElementID(crtElem);
            if (found === false && (crtCustomId === targetCustomId) || ((crtCustomId + "") === (targetCustomId + ""))) {
                // TraceMessage("GetIndexForAttributeList: element reached");

                found = true;
                ++out_index;
                if (out_index > 1) {
                    unique = false;
                    break;
                }
            } else if (ElementHasAttributeValues(crtElem, attrMap)) {
                // TraceMessage("GetIndexForAttributeList: attributes match");

                if (found) {
                    unique = false;
                    break;
                } else
                    ++out_index;
            }
        }

        if (found === false) {
            out_index = -1;
        } else if (unique === true && out_index === 1) {
            out_index = 0;
        }

        TraceMessage("GetIndexForAttributeList: return index=" + out_index);
        return out_index;
    }

    function GetTruncatedAttributeValue(targetElement, attrName) {
        var resValue = null;
        var attrVal = GetAttributeValue(targetElement, attrName);

        if (attrVal.length !== 0) {
            // Don't truncate css-selector.
            resValue = (attrName === "css-selector" ? attrVal : JQWEB.Utils.TruncateStringUsingWildcard(attrVal, MAX_ATTR_LEN));
        }

        return resValue;
    }

    function GetSelectorAttributeListResult(tagName, attrMap, index, retCode) {
        var out_result = {
            tagName: tagName,
            attrMap: attrMap,
            index: index,
            retCode: retCode
        };

        return out_result;
    }


    function isLeafElement(e) {
        if (!e) {
            return false;
        }

        return (e.children.length === 0);
    }


    function shouldAddAAName(e) {
        var t = e.tagName.toLowerCase();
        var acceptedTags = ["a", "label", "img", "input", "button", "textarea", "area", "select", "table", "th"];
        if (acceptedTags.indexOf(t) !== -1) {
            return true;
        }

        // Use aaname for divs if text length <= 32
        if (((t === "div") || (t === "span")) && (e.textContent.length <= 32)) {
            return true;
        }

        var acceptedParentTags = ["a", "label", "button", "select", "th"];

        while (true) {
            var p = e.parentElement;
            if (p === null) {
                break;
            }

            t = p.tagName.toLowerCase();
            if (acceptedParentTags.indexOf(t) !== -1) {
                return true;
            }

            e = p;
        }

        return false;
    }

    function GetSelectorAttributeList(rootDocument, targetCustomId, parentId, targetTagName, computeIndex, isUIAUse) {
        TraceMessage("GetSelectorAttributeList: enter targetCustomId=[" + targetCustomId + "] parentId=[" + parentId + "] targetTagName=[" + targetTagName + "]");
        if (targetCustomId == null) {
            TraceMessage("GetSelectorAttributeList: invalid input, return error");
            return GetSelectorAttributeListResult("", {}, -1, N_FALSE);
        }

        var htmlCollection = GetHtmlCollectionForParentId(rootDocument, parentId, targetTagName);
        if (htmlCollection == null) {
            TraceMessage("OnGetHtmlIdInfo: GetHtmlCollectionForParentId('" + parentId + "') failed");
            return GetSelectorAttributeListResult("", {}, -1, N_FALSE);
        }

        var targetElement = JQWEB.IDManager.getElementByID(targetCustomId);
        if (targetElement == null) {
            TraceMessage("GetSelectorAttributeList: targetCustomId=" + targetCustomId + " not found in the cache");
            return GetSelectorAttributeListResult("", {}, -1, N_FALSE);
        }

        var attrLists = ["tag", "id", "class", "name"];
        if (targetElement.tagName.toLowerCase() == "html") {
            //attrLists.push("title");
        }

        if (isLeafElement(targetElement)) {
            attrLists.push("isleaf");
        }

        attrLists.push("css-selector");
//		attrLists.push("xpath");
        attrLists.push("href");
        attrLists.push("src");

        attrLists = attrLists.concat(GetAttributeListForElement(targetElement));
        // I would not include class attribute because it is mainily used for visual things of the HTML objects
        // and this changes for selected "menu items" for instance.
        //["class", "parentclass"]

        var bestIndex = 1000000;
        if (computeIndex == 0)
            bestIndex = 0;
        var attrMap = {};
        var attrEnableMap = {};
        for (var phaseIdx = 0; phaseIdx < attrLists.length; ++phaseIdx) {
            var crntAttrName = attrLists[phaseIdx];
            var crntAttrValue = GetTruncatedAttributeValue(targetElement, crntAttrName);

            if (attrMap.hasOwnProperty(crntAttrName)) continue;

            if (crntAttrValue) {
                if ((crntAttrName === "css-selector" || crntAttrName === "xpath") && computeIndex > 0) {
                    if (bestIndex <= 1) {
                        // Do not add css-selector if best index is already 1
                        continue;
                    }

                    // For css-selector we need to recompute htmlCollection.
                    var cssSelector = crntAttrValue;
                    htmlCollection = GetHtmlCollectionForParentId(rootDocument, parentId, targetTagName, cssSelector);
                    if (htmlCollection === null) {
                        TraceMessage("OnGetHtmlIdInfo: GetHtmlCollectionForParentId('" + parentId + "') failed");
                        return GetSelectorAttributeListResult("", {}, -1, N_FALSE);
                    }
                }

                attrMap[crntAttrName] = crntAttrValue;
                attrEnableMap[crntAttrName] = {};
                attrEnableMap[crntAttrName].value = crntAttrValue;
                var attrBlackList = ["style", "width", "height", "left", "top"];
                if (attrBlackList.indexOf(crntAttrName) != -1) {
                    delete attrMap[crntAttrName];
                    attrEnableMap[crntAttrName.toLowerCase()].enable = false;
                }

                attrEnableMap[crntAttrName].enable = true;
                if (computeIndex > 0 && attrEnableMap[crntAttrName].enable) {
                    var crntIndex = GetIndexForAttributeList(htmlCollection, targetCustomId, attrMap);

                    if (crntIndex === -1) {
                        TraceMessage("GetSelectorAttributeList: index == -1, return error");
                        return GetSelectorAttributeListResult("", {}, -1, N_FALSE);
                    }

                    if (crntIndex < bestIndex) {
                        bestIndex = crntIndex;
                    } else {
                        // The current attribute does not decrease the index so don't add it to selector.
                        delete attrMap[crntAttrName];
                        attrEnableMap[crntAttrName].enable = false;
                    }

                }
            }
        }
        if (isUIAUse) {
            var aresult = {};
            aresult.attributes = [];
            aresult.index = bestIndex;
            var attrnames = Object.keys(attrEnableMap);
            for (var ai = 0; ai < attrnames.length; ai++) {
                var acrtattrname = attrnames[ai];
                var acrtattrvalue = attrEnableMap[acrtattrname].value;
                var acrtattrenable = attrEnableMap[acrtattrname].enable;
                aresult.attributes.push({name: acrtattrname, value: acrtattrvalue, enable: acrtattrenable});
            }
            aresult.attributes.push({name: "index", value: bestIndex, enable: bestIndex == 0 ? false : true});
            return aresult
        }
        return GetSelectorAttributeListResult(targetElement.tagName, attrMap, bestIndex, N_TRUE);
    }


    function GetAttrValueListForElement(element) {
        var result = {};

        if (element !== null) {
//			var attrNames = GetAttributeListForElement(element);
//			
//			var staticAttrNames =
//				[   "tag",  "class",
//				  "isleaf", "css-selector","xpath"
//				 ];
//			var allAttrNames = staticAttrNames.concat(attrNames);

            var allAttrNames = ["tag", "id", "class", "name"];
            if (element.tagName.toLowerCase() == "html") {
                allAttrNames.push("title");
            }

            if (isLeafElement(element)) {
                allAttrNames.push("isleaf");
            }

            allAttrNames.push("css-selector");
//			allAttrNames.push("xpath");
            allAttrNames.push("href");
            allAttrNames.push("src");
            allAttrNames = allAttrNames.concat(GetAttributeListForElement(element));
            for (var n = 0; n < allAttrNames.length; ++n) {
                if (result.hasOwnProperty(allAttrNames[n])) continue;
                if (allAttrNames[n] !== CUSTOM_ID_ATTR_NAME) {
                    var cnrtVal = GetAttributeValue(element, allAttrNames[n]);

                    if (cnrtVal !== null) {
                        result[allAttrNames[n]] = cnrtVal;
                    }
                }
            }
        }

        return result;
    }

    function DeleteForbiddenCharacters(text) {
        if (text == null || text.length === 0) {
            return "";
        }

        var out_text = text.replace(/\r/g, " ");
        out_text = out_text.replace(/\n/g, " ");

        return out_text;
    }

    function GetAttributeListForElement(element) {
        var out_attrList = [];

        if (element == null || element.attributes == null)
            return out_attrList;

        for (var i = 0; i < element.attributes.length; ++i) {
            var crtAttrName = element.attributes.item(i).nodeName;
            if (crtAttrName != null && crtAttrName.length > 0 &&
                crtAttrName.toLowerCase() !== "checked" &&
                crtAttrName !== CUSTOM_ID_ATTR_NAME) {
                out_attrList.push(crtAttrName);
            }
        }

        return out_attrList;
    }

    //"parentElem" can be an HTML element or document, they both export the "getElementsByTagName" method.
    function GetHtmlCollectionForParentElement(parentElem, tagName, cssSelector) {
        if (!tagName) {
            tagName = "*";
        }

        tagName = tagName.toLowerCase();

        var out_collection = [];
        var i;

        var isCssSelectorValid = ((cssSelector !== undefined) && (cssSelector !== null));
        if (isCssSelectorValid) {
            try {
                var elements = parentElem.querySelectorAll(cssSelector);
                for (i = 0; i < elements.length; ++i) {
                    if ((tagName === "*") || (tagName === elements.item(i).tagName.toLowerCase())) {
                        out_collection.push(elements.item(i));
                    }
                }
            } catch (e) {
                isCssSelectorValid = false;
                out_collection = [];
            }
        }

        if (!isCssSelectorValid) {
            var elements = parentElem.getElementsByTagName(tagName);
            for (i = 0; i < elements.length; ++i) {
                out_collection.push(elements.item(i));
            }
        }

        return out_collection;
    }

    function GetHtmlCollectionForParentId(rootDocument, parentId, tagName, cssSelector) {

        var i;
        var out_collection = [];

        if (parentId != null && parentId.length > 0) {
            var parentElem = JQWEB.IDManager.getElementByID(parentId);
            if (parentElem == null) {
                return null;
            }
            out_collection = GetHtmlCollectionForParentElement(parentElem, tagName, cssSelector);
        } else {
            var docs = JQWEB.SafePage.GetDocumentList(rootDocument);
            for (i = 0; i < docs.length; ++i)
                out_collection = out_collection.concat(GetHtmlCollectionForParentElement(docs[i], tagName, cssSelector));
            if (out_collection.length === 0)
                out_collection = null;
        }

        return out_collection;
    }

    function GetDirectChildrenCollectionForParentElement(parentElem, tagName) {
        var i;
        var out_collection = [];
        for (i = 0; i < parentElem.children.length; ++i) {
            var crtElem = parentElem.children.item(i);
            if (tagName == null || tagName.length === 0 ||
                crtElem.tagName.toLowerCase() === tagName
            )
                out_collection.push(crtElem);
        }
        return out_collection;
    }

    function GetDirectChildrenCollectionForParentId(rootDocument, parentId, tagName) {
        var i;
        var out_collection = [];

        if (parentId != null && parentId.length > 0) {
            var parentElem = JQWEB.IDManager.getElementByID(parentId);
            if (parentElem == null) {
                return null;
            }

            out_collection = GetDirectChildrenCollectionForParentElement(parentElem, tagName);
        } else {
            var docs = JQWEB.SafePage.GetDocumentList(rootDocument);
            for (i = 0; i < docs.length; ++i) {
                var docElem = docs[i].documentElement;
                if (docElem.tagName.toLowerCase() === tagName)
                    out_collection.push(docElem);
                out_collection = out_collection.concat(GetDirectChildrenCollectionForParentElement(docElem, tagName));
            }
            if (out_collection.length === 0)
                out_collection = null;
        }

        return out_collection;
    }

    function GetFrameParent(rootDoc, frameElement) {
        var out_frameParent = null;
        var customIdToSearch = JQWEB.IDManager.getElementID(frameElement);
        var frames = JQWEB.SafePage.GetFrameList(rootDoc);
        var frameIdx = 0;

        for (frameIdx = 0; frameIdx < frames.length && out_frameParent == null; ++frameIdx) {
            var crtFrame = frames[frameIdx];
            var crtDoc = JQWEB.SafePage.GetSafeContentDocument(crtFrame);
            if (crtDoc) {
                var children = crtDoc.getElementsByTagName(frameElement.tagName);

                var childIdx = 0;
                for (childIdx = 0; childIdx < children.length; ++childIdx) {
                    var crtElem = children.item(childIdx);
                    var crtCustomId = JQWEB.IDManager.getElementID(crtElem);
                    if (crtCustomId === customIdToSearch) {
                        out_frameParent = crtFrame;
                        break;
                    }
                }
            }
        }

        return out_frameParent;
    }

    function GetElementClientCssRectangle(rootDoc, element) {
        var htmlRc = element.getBoundingClientRect();
        var out_rc = JQWEB.Utils.UiRect(htmlRc.left, htmlRc.top, htmlRc.width, htmlRc.height);

        var parent = GetFrameParent(rootDoc, element);
        while (parent) {
            htmlRc = parent.getBoundingClientRect();
            // TraceMessage("GetElementClientCssRectangle: offsetting with (" + htmlRc.left, htmlRc.top + ")");
            out_rc = out_rc.Offset(htmlRc.left, htmlRc.top);
            parent = GetFrameParent(rootDoc, parent);
        }

        return out_rc;
    }

    //This function only applies to "select" elements
    function GetTextFromSelection(selectElement) {
        var out_text = "";

        if (selectElement.size <= 1 && selectElement.multiple === false) {
            if (selectElement.selectedIndex === -1)
                return out_text;
            out_text = selectElement.item(selectElement.selectedIndex).text;
        }

        return out_text;
    }

    //This function only applies to "select" elements
    function GetFullTextFromSelect(selectElement) {
        var out_text = "";

        var i;
        var options = selectElement.getElementsByTagName("option");
        for (i = 0; i < options.length; ++i) {
            var option = options.item(i);
            if (option.text && option.text.length > 0)
                out_text += option.text + "\n";
        }

        return out_text;
    }

    function GetTextContentFromElement(element) {
        var out_text = "";

        var tag = element.tagName.toLowerCase();
        if (tag === "select")
            out_text = GetTextFromSelection(element);
        else if (tag === "input")
            out_text = JQWEB.Utils.TrimWhiteSpaces(element.value);
        else
            out_text = JQWEB.Utils.TrimWhiteSpaces(element.textContent);

        return out_text;
    }

    function GetIntCssProperty(style, propName, unitSuffix, defaultValue) {
        var out_intValue = defaultValue;
        var propValue = style.getPropertyValue(propName);
        //TraceMessage("GetIntCssProperty: " + propName + "=["+propValue+"]");
        if (propValue != null && propValue.length > 0) {
            if (propValue.length > unitSuffix.length &&
                propValue.slice(propValue.length - unitSuffix.length) === unitSuffix
            ) {
                var numericPart = propValue.slice(0, propValue.length - unitSuffix.length);
                //TraceMessage("GetIntCssProperty: parsing [" + numericPart + "]");
                out_intValue = parseInt(numericPart);
            }
        }

        return out_intValue;
    }

    //Returns the total margin of a parent with the same client rectangle as the given element. This margin will be used as a margin
    //for the original element when the browser formats the text.
    function GetElementMarginFromParent(htmlWindow, element) {
        var out_marginSize = 0;

        if (element == null || element.parentNode == null)
            return out_marginSize;

        var elementRect = element.getBoundingClientRect();
        //TraceMessage("GetElementMarginFromParent: elementRect width=" + elementRect.width + " height = " + elementRect.height);
        for (var ancestor = element.parentNode;
             ancestor != null && ancestor.nodeType === ancestor.ELEMENT_NODE;
             ancestor = ancestor.parentNode) {
            var ancestorRect = ancestor.getBoundingClientRect();
            //TraceMessage("GetElementMarginFromParent: ancestorRect width=" + ancestorRect.width + " height = " + ancestorRect.height);
            if (ancestorRect.width > elementRect.width && ancestorRect.height > elementRect.height)
                break;

            if (ancestorRect.width === elementRect.width && ancestorRect.height === elementRect.height) {
                var style = htmlWindow.getComputedStyle(ancestor);
                var borderSize = GetIntCssProperty(style, "margin-left", "px", 0) +
                    GetIntCssProperty(style, "margin-right", "px", 0);
                //TraceMessage("GetElementMarginFromParent: borderSize=" + borderSize);

                if (borderSize > out_marginSize)
                    out_marginSize = borderSize;
            }
        }

        return out_marginSize;
    }

    function TextRectInfo(text, rect, lineWidth, endsWithWhitespace) {
        return {
            text: text,
            rect: rect,
            lineWidth: lineWidth, //The width of the line to which this text belongs to.
            endsWithWhitespace: endsWithWhitespace
        };
    }

    function CreateTextExtractorObject(htmlWindow, rootDocument, element, separators) {
        //These output parameters accumulate with each call to AccumulateRectInfoFromElement.
        var out_textRectInfos = [];


        ////////////////////////////////////
        // Private variables
        var LINE_OVERFLOW_TOLERANCE = 1;
        var m_spanElem = null;
        var m_elemRect = null;
        var m_elemCustomId = "", m_parentElemCustomId = "";
        var m_srcStyle = null;
        var m_borderLeft = 0, m_borderTop = 0, m_borderRight = 0;
        var m_initialOffsetForSpacing = {x: 0, y: 0};
        var m_crtOffsetForSpacing = {x: 0, y: 0};
        var m_maxLineRight = 0;
        var m_lineWidth = 0, m_lineHeight = 0;
        var m_totalTextHeight = 0;


        ////////////////////////////////////////
        // Private methods

        //Input: local 'm_spanElem', arg 'word'
        //Output: {width, height}
        //Calculates the dimensions of a word with no leading or trailing white spaces.
        function GetNonWhitespaceWordExtentsUsingSpan(word) {
            m_spanElem.textContent = word;
            var rc = m_spanElem.getBoundingClientRect();
            return {width: rc.width, height: rc.height};
        }

        var DUMMY_BORDER_CHAR = "x";
        var m_dummyBorderCharWidth = 0;
        //Input: local 'm_spanElem'
        //Output: local 'm_dummyBorderCharWidth'
        //Caches the width of the dummy border character "x" to be used with words starting or ending in white spaces.
        function GetDummyBorderCharWidth() {
            if (m_dummyBorderCharWidth !== 0)
                return m_dummyBorderCharWidth;
            //Use a dummy character for calculating the extents of words with heading or trailing white spaces.
            m_dummyBorderCharWidth = GetNonWhitespaceWordExtentsUsingSpan(DUMMY_BORDER_CHAR).width;
            return m_dummyBorderCharWidth;
        }

        //Input: local 'm_spanElem', arg 'word'
        //Output: {width, height}
        //Calculates the dimensions of a word with possible leading or trailing whitespaces.
        function GetWordExtentsUsingSpan(word) {
            if (word.length === 0)
                return {width: 0, height: 0};

            var extraHeading = "";
            var extraTrailing = "";
            var extraHeadingWidth = 0;
            var extraTrailingWidth = 0;
            if (IsWhiteSpaceCharacter(word.charAt(0))) {
                extraHeading = DUMMY_BORDER_CHAR;
                extraHeadingWidth = GetDummyBorderCharWidth();
            }
            if (IsWhiteSpaceCharacter(word.charAt(word.length - 1))) {
                extraTrailing = DUMMY_BORDER_CHAR;
                extraTrailingWidth = GetDummyBorderCharWidth();
            }

            var wordExt = GetNonWhitespaceWordExtentsUsingSpan(extraHeading + word + extraTrailing);

            return {width: wordExt.width - extraHeadingWidth - extraTrailingWidth, height: wordExt.height};
        }

        ////////////////////////////////////////////
        // The main object with the public methods
        return {
            BeginAccumulateTextRectInfo: function () {
                //Input validation
                if (element == null)
                    return false;

                var doc = element.ownerDocument;
                m_srcStyle = htmlWindow.getComputedStyle(element);
                m_spanElem = doc.createElement("span");
                var cssProps = [
                    //"font",
                    "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight",
                    "text-align", "text-align-last", "text-decoration", "text-indent", "text-justify", "text-overflow", "text-shadow",
                    "text-transform", "text-autospace", "text-kashida-space", "text-underline-position",
                    //"padding", "border",
                    "direction", "zoom"
                ];
                for (i = 0; i < cssProps.length; ++i) {
                    var propName = cssProps[i];
                    var propValue = m_srcStyle.getPropertyValue(propName);
                    if (propValue != null && propValue.length > 0) {
                        var propPriority = m_srcStyle.getPropertyPriority(propName);
                        m_spanElem.style.setProperty(propName, propValue, propPriority);
                        //TraceMessage("GetTextRectInfoFromElement: setting ["+propName+"]=["+propValue + "] priority "+propPriority);
                    }
                }
                m_spanElem.style.setProperty("resize", "both", "");
                m_spanElem.style.setProperty("display", "inline-block", "");
                //Add the SPAN element to the DOM.
                doc.body.appendChild(m_spanElem);

                //Some variables for parsing the text.
                m_borderLeft = //(element.clientLeft ? element.clientLeft : GetIntCssProperty(m_srcStyle, "border-left-width", "px", 0)) +
                    GetIntCssProperty(m_srcStyle, "padding-left", "px", 0);
                //GetIntCssProperty(m_srcStyle, "margin-left", "px", 0);
                m_borderTop = //(element.clientTop ? element.clientTop : GetIntCssProperty(m_srcStyle, "border-top-width", "px", 0)) +
                    GetIntCssProperty(m_srcStyle, "padding-top", "px", 0);
                //GetIntCssProperty(m_srcStyle, "margin-top", "px", 0);
                m_borderRight = //(element.clientRight ? element.clientRight : GetIntCssProperty(m_srcStyle, "border-right-width", "px", 0)) +
                    GetIntCssProperty(m_srcStyle, "padding-right", "px", 0);
                //GetIntCssProperty(m_srcStyle, "margin-right", "px", 0);
                m_elemRect = GetElementClientCssRectangle(rootDocument, element);
                m_elemCustomId = JQWEB.IDManager.getElementID(element);
                m_parentElemCustomId = JQWEB.IDManager.getElementID(element.parentNode);

                m_initialOffsetForSpacing.x = m_elemRect.left + m_borderLeft;
                m_initialOffsetForSpacing.y = m_elemRect.top + m_borderTop;
                m_maxLineRight = m_elemRect.right - m_borderRight;

                //Update the current offset for text spacing.
                m_crtOffsetForSpacing.x = m_initialOffsetForSpacing.x;
                m_crtOffsetForSpacing.y = m_initialOffsetForSpacing.y;

                //The line width is the width of the HTML element without its border.
                m_lineWidth = (m_elemRect.right - m_borderRight) - (m_elemRect.left + m_borderLeft);

                //Parse the line height from the CSS style of the source element.
                m_lineHeight = GetIntCssProperty(m_srcStyle, "line-height", "px", 0);

                //Initialize the total text height.
                m_totalTextHeight = m_lineHeight;

                TraceMessage("BeginAccumulateTextRectInfo: m_lineHeight=" + m_lineHeight);
                TraceMessage("BeginAccumulateTextRectInfo: m_maxLineRight=" + m_maxLineRight);
                TraceMessage("BeginAccumulateTextRectInfo: m_initialOffsetForSpacing=" + EnumObjectProps(m_initialOffsetForSpacing, true));
                TraceMessage("BeginAccumulateTextRectInfo: m_elemRect=" + m_elemRect.toString());
                TraceMessage("BeginAccumulateTextRectInfo: border LTR = (" + m_borderLeft + " " + m_borderTop + " " + m_borderRight + ")");

                return true;
            },

            EndAccumulateTextRectInfo: function () {
                //Apply the alignment correction as found in the CSS style of the source element.
                if (m_srcStyle != null) {
                    var i = 0;
                    var borderTopCorrection = 0;
                    var verticalAlign = m_srcStyle.getPropertyValue("vertical-align");
                    if (verticalAlign === "middle") {
                        //"middle" centers the text in the current element.
                        var centeredBorderTop = (m_elemRect.getHeight() - m_totalTextHeight) / 2;
                        TraceMessage("GetTextBorderTopCorrectionFromCss: totalTextHeight=" + m_totalTextHeight + " centeredBorderTop=" + centeredBorderTop);
                        borderTopCorrection = centeredBorderTop - m_borderTop;
                    } else if (verticalAlign === "baseline" || verticalAlign === "bottom") {
                        //"baseline" and "bottom" align the text with the bottom of the current element.
                        var bottomAlignedBorderTop = m_elemRect.getHeight() - m_totalTextHeight;
                        TraceMessage("GetTextBorderTopCorrectionFromCss: totalTextHeight=" + m_totalTextHeight + " bottomAlignedBorderTop=" + bottomAlignedBorderTop);
                        borderTopCorrection = bottomAlignedBorderTop - m_borderTop;
                    }

                    if (borderTopCorrection !== 0) {
                        for (i = 0; i < out_textRectInfos.length; ++i)
                            out_textRectInfos[i].rect = out_textRectInfos[i].rect.Offset(0, borderTopCorrection);
                    }
                }

                //The last word ends with space, we do not want automatic formatting with another element.
                if (out_textRectInfos.length !== 0)
                    out_textRectInfos[out_textRectInfos.length - 1].endsWithWhitespace = true;

                //Remove the auxiliary span element.
                if (m_spanElem != null) {
                    element.ownerDocument.body.removeChild(m_spanElem);
                    m_spanElem = null;
                }

                TraceMessage("EndAccumulateTextRectInfo: return");
                return out_textRectInfos;
            },

            AdvanceTextOffsets: function (advanceX) {
                var newOffsetX = m_crtOffsetForSpacing.x + advanceX;
                var lineOverflow = newOffsetX - m_maxLineRight;
                if (lineOverflow >= LINE_OVERFLOW_TOLERANCE) {
                    //Line overflow, move the offset to a new line.
                    m_crtOffsetForSpacing.x = m_initialOffsetForSpacing.x;
                    m_crtOffsetForSpacing.y += m_lineHeight;
                    //Update the total text height.
                    m_totalTextHeight += m_lineHeight;
                } else
                    m_crtOffsetForSpacing.x = newOffsetX;
            },

            AccumulateTextRectInfo: function (text) {
                ///////////////////////////
                // Input validation
                if (text == null || text.length === 0)
                    return false;
                if (m_spanElem == null)
                    return false;


                //////////////////////////////////
                // Private local variables
                var m_crtWordForSpacing = "", m_crtWord = "";


                //////////////////////////////////
                // Private local methods

                var CharType = {WORD: 0, SEPARATOR: 1, WHITESPACE: 2};
                //Input: local arg 'separators'
                //Output: CharType
                function GetCharType(ch) {
                    if (IsWhiteSpaceCharacter(ch))
                        return CharType.WHITESPACE;
                    if (separators.indexOf(ch) !== -1)
                        return CharType.SEPARATOR;
                    return CharType.WORD;
                }

                // Test if a Point belongs to a Rectangle's surface
                function RectContains(rect, point) {
                    return ((point.x >= rect.left && point.x < rect.right) &&
                        (point.y >= rect.top && point.y < rect.bottom));
                }

                //Input: local 'm_spanElem', local 'm_crtWordForSpacing', local 'm_elemRect'
                //Output: local 'm_crtOffsetForSpacing', local 'm_crtWordForSpacing', return 'wordExtents'
                //Checks the extents of the existing 'm_crtWordForSpacing' against the width of the HTML element.
                //If the width is exceeded, then a new line is simulated by advancing the Y offset.
                //The X offset for the current word is optionally updated.
                function CheckNewLineAndUpdateSpacingOffsets() {
                    //Get the word dimensions.
                    var out_wordExtForSpacing = GetWordExtentsUsingSpan(m_crtWordForSpacing);
                    //Check if theline height obtained from the CSS properties is correct.
                    if (m_lineHeight === 0 && out_wordExtForSpacing.height > m_lineHeight) {
                        m_lineHeight = out_wordExtForSpacing.height;
                        m_totalTextHeight = m_lineHeight;
                        TraceMessage("AccumulateTextRectInfo::CheckNewLineAndUpdateSpacingOffsets: m_lineHeight=" + m_lineHeight);
                    }
                    //Move the current offset such that it does not overlap with any other HTML element.
                    //Also, it must not overflow the width of the rectangle of the current HTML element.
                    var wordExt = GetWordExtentsUsingSpan(m_crtWord);
                    var checkOverlappingElements = true;

                    // Early detect that overlapping is not possible if the current word is smaller than the tolerance.
                    // Also, please note that the algorithm below, which moves the current offset to skip
                    // overlapping elements, will enter an infinite loop if it runs over an empty word.
                    // The current offset will not advance and will always hit the same overlapping element.
                    var INNER_TOLERANCE = 2;
                    if (wordExt.width < (2 * INNER_TOLERANCE) || wordExt.height < (2 * INNER_TOLERANCE)) {
                        checkOverlappingElements = false;
                    }

                    while (checkOverlappingElements === true) {
                        checkOverlappingElements = false;

                        //Check any overlapping HTML elements.
                        if (m_crtWord.length > 0)// && IsWhiteSpaceCharacter(m_crtWord.charAt(0)) === false)
                        {
                            var points = [
                                {
                                    x: m_crtOffsetForSpacing.x + wordExt.width / 2,
                                    y: m_crtOffsetForSpacing.y + wordExt.height / 2,
                                    name: "middle"
                                },
                                {
                                    x: m_crtOffsetForSpacing.x + INNER_TOLERANCE,
                                    y: m_crtOffsetForSpacing.y + INNER_TOLERANCE,
                                    name: "left-top"
                                },
                                {
                                    x: m_crtOffsetForSpacing.x + wordExt.width - INNER_TOLERANCE,
                                    y: m_crtOffsetForSpacing.y + INNER_TOLERANCE,
                                    name: "right-top"
                                },
                                {
                                    x: m_crtOffsetForSpacing.x + INNER_TOLERANCE,
                                    y: m_crtOffsetForSpacing.y + wordExt.height - INNER_TOLERANCE,
                                    name: "left-bottom"
                                },
                                {
                                    x: m_crtOffsetForSpacing.x + wordExt.width - INNER_TOLERANCE,
                                    y: m_crtOffsetForSpacing.y + wordExt.height - INNER_TOLERANCE,
                                    name: "right-bottom"
                                }
                            ];
                            for (var i = 0; i < points.length; ++i) {
                                var crtPoint = points[i];
                                if (crtPoint.x <= m_maxLineRight) {
                                    var elemAtPoint = element.ownerDocument.elementFromPoint(crtPoint.x, crtPoint.y);
                                    if (elemAtPoint != null) {
                                        var htmlRectAtPoint = elemAtPoint.getBoundingClientRect();
                                        var customIdAtPoint = JQWEB.IDManager.getElementID(elemAtPoint);
                                        if (htmlRectAtPoint != null &&
                                            htmlRectAtPoint.left > -5 && htmlRectAtPoint.top > -5 &&
                                            htmlRectAtPoint.width > 0 && htmlRectAtPoint.height > 0 &&
                                            // workaround for a Firefox bug: under certain scenarios,
                                            // document.elementFromPoint() returns an element which doesn't actually contain the point
                                            RectContains(htmlRectAtPoint, crtPoint) &&
                                            customIdAtPoint !== m_elemCustomId &&
                                            customIdAtPoint !== m_parentElemCustomId) {
                                            var spacingGapX = GetElementMarginFromParent(htmlWindow, elemAtPoint);
                                            TraceMessage("AccumulateTextRectInfo::CheckNewLineAndUpdateSpacingOffsets: crtWord=[" + m_crtWord +
                                                "]: there is an element with tag [" + elemAtPoint.tagName +
                                                "]");// text [" + TruncateStringUsingWildcard(elemAtPoint.textContent,20) +
                                            //"] at location "+EnumObjectProps(crtPoint,true));
                                            //Another element is at this location. Skip it.
                                            m_crtOffsetForSpacing.x = htmlRectAtPoint.right + spacingGapX;
                                            //We are overlapping, check again at the next cycle.
                                            checkOverlappingElements = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        //Check if the current rectangle overflows the width of the HTML rectangle of the current element.
                        var lineOverflow = (m_crtOffsetForSpacing.x + wordExt.width) - m_maxLineRight;
                        if (lineOverflow >= LINE_OVERFLOW_TOLERANCE) {
                            TraceMessage("AccumulateTextRectInfo::CheckNewLineAndUpdateSpacingOffsets: [" + m_crtWord +
                                "] overflows the right margin by " + lineOverflow + " pixels");
                            //Line overflow, move the offset to a new line.
                            m_crtOffsetForSpacing.x = m_initialOffsetForSpacing.x;
                            m_crtOffsetForSpacing.y += m_lineHeight;
                            TraceMessage("AccumulateTextRectInfo::CheckNewLineAndUpdateSpacingOffsets: m_crtOffsetForSpacing after correction " +
                                EnumObjectProps(m_crtOffsetForSpacing, true));
                            //Update the total text height.
                            m_totalTextHeight += m_lineHeight;
                            //We cannot append new lines indefinitely.
                            if (m_crtOffsetForSpacing.y >= m_elemRect.bottom) {
                                TraceMessage("AccumulateTextRectInfo::CheckNewLineAndUpdateSpacingOffsets: m_crtOffsetForSpacing.y=" + m_crtOffsetForSpacing.y +
                                    " overflows the bottom side " + m_elemRect.bottom + " of the element rectangle");
                                break;
                            }
                            //Check if the current word overlaps with another element.
                            checkOverlappingElements = true;
                        }
                    }

                    return out_wordExtForSpacing;
                }


                //////////////////////////////////
                // The main algorithm

                //Make sure we have some separators.
                if (separators == null || separators.length === 0)
                    separators = "`;:'\",.!?/\\|";

                var i = 0;

                //Some variables for parsing the text.
                var parserState = CharType.WORD;//GetCharType(text[0]);
                var crtXOffsetInWord = 0;

                for (i = 0; i < text.length; ++i) {
                    var ch = text.charAt(i);
                    var chType = GetCharType(ch);

                    if (parserState === CharType.WORD) {
                        //A word is forming.
                        if (chType === CharType.SEPARATOR || chType === CharType.WHITESPACE) {
                            if (m_crtWord.length > 0) {
                                //Separator encountered, add the accumulated word to the list.
                                //At this moment, "m_crtWord == m_crtWordForSpacing", so there is no need to calculate the extents
                                //of 'm_crtWord'.
                                var wordExt = CheckNewLineAndUpdateSpacingOffsets();
                                //Add the current word and its rectangle
                                var wordInfo = TextRectInfo(
                                    m_crtWord,
                                    UiRect(m_crtOffsetForSpacing.x, m_crtOffsetForSpacing.y, wordExt.width, wordExt.height),
                                    m_lineWidth,
                                    chType === CharType.WHITESPACE
                                );
                                out_textRectInfos.push(wordInfo);
                                TraceMessage("AccumulateTextRectInfo: adding word [" + wordInfo.text +
                                    "] rect " + wordInfo.rect.toString());
                                //Leave the current word for spacing calculation (m_crtOffsetForSpacing).
                                m_crtWordForSpacing += ch;
                                m_crtWord = ch.toString();
                                crtXOffsetInWord = wordExt.width;//For separators
                                parserState = chType;
                            } else {
                                //Empty word, reset the operational words and change the parser state.
                                m_crtWordForSpacing = m_crtWord = ch.toString();
                                crtXOffsetInWord = 0;
                                parserState = chType;
                            }
                        } else //if(chType === CharType.WORD)
                        {
                            //Not a separator or whitespace, accumulate the current word.
                            m_crtWordForSpacing += ch;
                            m_crtWord += ch;
                        }
                    } else if (parserState === CharType.SEPARATOR) {
                        //We are inside a separator portion.
                        if (chType === CharType.WORD || chType === CharType.WHITESPACE) {
                            var spacingExt = CheckNewLineAndUpdateSpacingOffsets();
                            //Add the current separator as a word.
                            var wordExt = GetWordExtentsUsingSpan(m_crtWord);
                            var wordInfo = TextRectInfo(
                                m_crtWord,
                                UiRect(m_crtOffsetForSpacing.x + crtXOffsetInWord, m_crtOffsetForSpacing.y, wordExt.width, wordExt.height),
                                m_lineWidth,
                                chType === CharType.WHITESPACE
                            );
                            out_textRectInfos.push(wordInfo);
                            //TraceMessage("AccumulateTextRectInfo: adding word ["+wordInfo.text +
                            //	"] rect ("+wordInfo.rect.left+" "+wordInfo.rect.top+" "+wordInfo.rect.getWidth()+" "+wordInfo.rect.getHeight()+")");
                            //A word is starting all over again.
                            m_crtWordForSpacing = m_crtWord = ch.toString();
                            m_crtOffsetForSpacing.x += spacingExt.width;
                            crtXOffsetInWord = 0;
                            parserState = chType;
                        } else //if(chType === CharType.SEPARATOR)
                        {
                            //Add the current separator as a word.
                            CheckNewLineAndUpdateSpacingOffsets();
                            var wordExt = GetWordExtentsUsingSpan(m_crtWord);
                            var wordInfo = TextRectInfo(
                                m_crtWord,
                                UiRect(m_crtOffsetForSpacing.x + crtXOffsetInWord, m_crtOffsetForSpacing.y, wordExt.width, wordExt.height),
                                m_lineWidth,
                                false
                            );
                            out_textRectInfos.push(wordInfo);
                            //TraceMessage("AccumulateTextRectInfo: adding word ["+wordInfo.text +
                            //	"] rect ("+wordInfo.rect.left+" "+wordInfo.rect.top+" "+wordInfo.rect.getWidth()+" "+wordInfo.rect.getHeight()+")");
                            //Accumulate the current word for spacing.
                            m_crtWordForSpacing += ch;
                            m_crtWord = ch.toString();
                            crtXOffsetInWord += wordExt.width;
                        }
                    } else if (parserState === CharType.WHITESPACE) {
                        if (chType === CharType.WORD || chType === CharType.SEPARATOR) {
                            //Advance the current word.
                            var spacingExt = CheckNewLineAndUpdateSpacingOffsets();
                            //A word is starting all over again.
                            m_crtWordForSpacing = m_crtWord = ch.toString();
                            m_crtOffsetForSpacing.x += spacingExt.width;
                            crtXOffsetInWord = 0;
                            parserState = chType;
                        } else //if(chType === CharType.WHITESPACE)
                        {
                            //Check if a new line has been reached.
                            CheckNewLineAndUpdateSpacingOffsets();
                            //Accumulate the whitespace.
                            m_crtWordForSpacing += ch;
                            m_crtWord = "";
                            crtXOffsetInWord = 0;
                        }
                    }
                }

                //TraceMessage("AccumulateTextRectInfo: last word ["+m_crtWord+"]");

                //Record the last word.
                var spacingExt = CheckNewLineAndUpdateSpacingOffsets();
                if (parserState !== CharType.WHITESPACE && m_crtWord.length > 0) {
                    var wordExt = GetWordExtentsUsingSpan(m_crtWord);
                    var wordInfo = TextRectInfo(
                        m_crtWord,
                        UiRect(m_crtOffsetForSpacing.x + crtXOffsetInWord, m_crtOffsetForSpacing.y, wordExt.width, wordExt.height),
                        m_lineWidth,
                        false
                    );
                    out_textRectInfos.push(wordInfo);
                    TraceMessage("AccumulateTextRectInfo: adding last word [" + wordInfo.text +
                        "] rect " + wordInfo.rect.toString());
                }
                //Update the spacing offsets.
                m_crtOffsetForSpacing.x += spacingExt.width;

                return true;
            }
        }
    }

    function FormattedTextInfoResult() {
        function TextLine(lineWidth) {
            return {
                textInfos: [],
                lineWidth: lineWidth,
                AddTextInfo: function (textInfo) {
                    this.textInfos.push(textInfo);
                },
                AddTextInfoArray: function (textInfoArray) {
                    this.textInfos = this.textInfos.concat(textInfoArray);
                },
                PushTextInfosAtTheStart: function (additionalTextInfos) {
                    var out_overflowingWordsAtTheEnd = [];

                    if (additionalTextInfos.length === 0 || this.textInfos.length === 0)
                        return out_overflowingWordsAtTheEnd;

                    TraceMessage("PushTextInfosAtTheStart: additionalTextInfos[0]=" + additionalTextInfos[0].text);
                    TraceMessage("PushTextInfosAtTheStart: this.textInfos[0]=" + this.textInfos[0].text);

                    //Calculate the total shift width.
                    var i = 0;
                    var totalWidth = additionalTextInfos[0].rect.getWidth();
                    for (i = 1; i < additionalTextInfos.length; ++i)
                        totalWidth += additionalTextInfos[i].rect.getWidth();
                    TraceMessage("PushTextInfosAtTheStart: totalWidth=" + totalWidth);
                    //Shift the current text rectangles.
                    var startTrimIdx = -1;
                    for (i = 0; i < this.textInfos.length; ++i) {
                        this.textInfos[i].rect = this.textInfos[i].rect.Offset(totalWidth, 0);
                        if (this.textInfos[i].rect.right - this.textInfos[0].rect.left > lineWidth) {
                            startTrimIdx = i;
                            break;
                        }
                    }
                    //Check overlapping rectangles.
                    /*for(i=0; i<this.textInfos.length-1; ++i)
                    {
                        var crtInfo = this.textInfos[i];
                        var nextInfo = this.textInfos[i+1];
                        if(crtInfo.rect.right > nextInfo.rect.left)
                        {
                            var correctedCrtInfo = TextRectInfo(
                                nextInfo.text,
                                UiRect(nextInfo.rect.left - totalWidth, nextInfo.rect.top, nextInfo.rect.getWidth(), nextInfo.rect.getHeight()),
                                lineWidth,
                                nextInfo.endsWithWhitespace
                            );

                            nextInfo.text = crtInfo.text;
                            nextInfo.rect = UiRect(correctedCrtInfo.rect.left + correctedCrtInfo.rect.getWidth(),
                                                   correctedCrtInfo.rect.top,
                                                   crtInfo.rect.getWidth(), crtInfo.rect.getHeight());
                            nextInfo.lineWidth = lineWidth;
                            nextInfo.endsWithWhitespace = crtInfo.endsWithWhitespace;

                            crtInfo = correctedCrtInfo;
                        }
                    }*/
                    //Remove the overflowing text infos at the end.
                    if (startTrimIdx !== -1)
                        out_overflowingWordsAtTheEnd = this.textInfos.splice(startTrimIdx, this.textInfos.length - startTrimIdx);
                    //Add the new text infos at the start.
                    this.textInfos = additionalTextInfos.concat(this.textInfos);

                    return out_overflowingWordsAtTheEnd;
                }
            };
        }

        return {
            lines: [],
            AddLine: function (lineWidth) {
                this.lines.push(TextLine(lineWidth));
            },
            AddTextInfo: function (textInfo) {
                if (this.lines.length === 0)
                    return;
                this.lines[this.lines.length - 1].AddTextInfo(textInfo);
            },
            AddTextInfoArray: function (textInfoArray) {
                if (this.lines.length === 0)
                    return;
                this.lines[this.lines.length - 1].AddTextInfoArray(textInfoArray);
            },
            ShiftTextInfosAndReformat: function (lineIdxToShift, numWordsToShift) {
                if (lineIdxToShift >= this.lines.length || numWordsToShift <= 0)
                    return;

                var line = this.lines[lineIdxToShift];
                if (numWordsToShift > line.textInfos.length)
                    return;

                var wordsToShift = line.textInfos.splice(line.textInfos.length - numWordsToShift, numWordsToShift);

                var i = 0, j = 0;
                for (i = lineIdxToShift + 1; i < this.lines.length; ++i) {
                    line = this.lines[i];
                    //Shift the rectangles of the current words.
                    if (line.textInfos.length !== 0) {
                        var shiftWidth = -(wordsToShift[0].rect.left - line.textInfos[0].rect.left);
                        var shiftHeight = -(wordsToShift[0].rect.top - line.textInfos[0].rect.top);
                        TraceMessage("ShiftTextInfosAndReformat: shiftWidth=" + shiftWidth + " shiftHeight=" + shiftHeight);
                        for (j = 0; j < wordsToShift.length; ++j)
                            wordsToShift[j].rect = wordsToShift[j].rect.Offset(shiftWidth, shiftHeight);
                    }
                    //Add them to the start of this line and get the remaining ones.
                    wordsToShift = line.PushTextInfosAtTheStart(wordsToShift);
                    if (wordsToShift.length === 0)
                        break;
                }
                if (wordsToShift.length !== 0) {
                    line = this.lines[this.lines.length - 1];
                    //Shift the rectangles of the current words.
                    if (line.textInfos.length !== 0) {
                        var shiftWidth = -(wordsToShift[0].left - line.textInfos[0].left);
                        var shiftHeight = -(wordsToShift[0].top - line.textInfos[0].top);
                        for (j = 0; j < wordsToShift.length; ++j)
                            wordsToShift[j].rect = wordsToShift[j].rect.Offset(shiftWidth, shiftHeight);
                    }
                    //Create a new line.
                    this.AddLine(line.lineWidth);
                    this.AddTextInfoArray(wordsToShift);
                }
            },
            GetFilteredText: function (filterRect) {
                var out_text = "";
                var out_textRectInfo = [];

                var lineIdx = 0;
                for (lineIdx = 0; lineIdx < this.lines.length; ++lineIdx) {
                    var crtLine = this.lines[lineIdx];
                    var textInfoIdx = 0;
                    for (textInfoIdx = 0; textInfoIdx < crtLine.textInfos.length; ++textInfoIdx) {
                        textInfo = crtLine.textInfos[textInfoIdx];
                        if (filterRect.Intersects(textInfo.rect)) {
                            out_textRectInfo.push(textInfo);

                            out_text += textInfo.text;
                            if (textInfo.endsWithWhitespace)
                                out_text += " ";
                        }
                    }
                    if (lineIdx !== this.lines.length - 1)
                        out_text += "\r\n";
                }

                return {text: out_text, textRectInfo: out_textRectInfo};
            }
        };
    }

    //Reformats the text given by the TextExtractor object.
    //If a line ends in a separator and there is no white space after, the word will be moved on the next line.
    function FormatTextRectInfoArray(textRectInfo, newLineTolerance, runStopwatch) {
        var out_formattedTextInfo = FormattedTextInfoResult();

        //Sort all the rectangles.
        textRectInfo.sort(
            function (e1, e2) {
                var rc1 = e1.rect;
                var rc2 = e2.rect;
                if (rc1.top >= rc2.bottom - newLineTolerance)
                    return 1;
                if (rc2.top >= rc1.bottom - newLineTolerance)
                    return -1;
                if (rc1.left >= rc2.right - newLineTolerance)
                    return 1;
                if (rc2.left >= rc1.right - newLineTolerance)
                    return -1;
                return 0;
            }
        );

        // check for timeout once for a certain number of expensive operations
        // to limit the performance impact of timeout checks
        var timeoutCheckCounter = 0;

        //Make all the words on the same line have the same line width.
        var i = 0, j = 0, startLineIdx = 0;
        while (startLineIdx < textRectInfo.length) {
            if (timeoutCheckCounter >= 300) {
                if (runStopwatch.TimeoutElapsed())
                    break;
                timeoutCheckCounter = 0;
            }

            var startLineInfo = textRectInfo[startLineIdx];
            //Compute the maximum line width for this line.
            var maxLineWidth = startLineInfo.lineWidth;
            var endLineIdx = startLineIdx + 1;
            while (endLineIdx < textRectInfo.length) {
                var endLineInfo = textRectInfo[endLineIdx];
                if (endLineInfo.rect.top >= startLineInfo.rect.bottom - newLineTolerance)
                    break;

                if (endLineInfo.lineWidth > maxLineWidth)
                    maxLineWidth = endLineInfo.lineWidth;

                ++endLineIdx;
            }
            //Add these lines as formatted text.
            out_formattedTextInfo.AddLine(maxLineWidth);
            for (i = startLineIdx; i < endLineIdx; ++i) {
                var srcTextInfo = textRectInfo[i];
                var destTextInfo = TextRectInfo(srcTextInfo.text, srcTextInfo.rect,
                    maxLineWidth,
                    srcTextInfo.endsWithWhitespace);

                timeoutCheckCounter += 1;
                out_formattedTextInfo.AddTextInfo(destTextInfo);
            }

            startLineIdx = endLineIdx;
        }

        //With each line, check the word at the end. If it does not end in a whitespace, move it to the next line.
        for (i = 0; i < out_formattedTextInfo.lines.length - 1; ++i) {
            if (timeoutCheckCounter >= 100) {
                if (runStopwatch.TimeoutElapsed())
                    break;
                timeoutCheckCounter = 0;
            }

            var crtLine = out_formattedTextInfo.lines[i];
            //var nextLine = out_formattedTextInfo.lines[i+1];

            if (crtLine.textInfos.length !== 0) {
                //Get the last text with whitespace from the current line.
                var lastTextWithSpaceIdx = crtLine.textInfos.length - 1;
                while (lastTextWithSpaceIdx >= 0) {
                    if (crtLine.textInfos[lastTextWithSpaceIdx].endsWithWhitespace === true)
                        break;
                    --lastTextWithSpaceIdx;
                }
                if (lastTextWithSpaceIdx >= 0 && lastTextWithSpaceIdx < crtLine.textInfos.length - 1) {
                    //Move all the linked text from the current line to the next line.
                    var numWordsToShift = crtLine.textInfos.length - lastTextWithSpaceIdx - 1;
                    TraceMessage("FormatTextRectInfoArray: starting to shift with word [" + crtLine.textInfos[lastTextWithSpaceIdx + 1].text + "]");
                    timeoutCheckCounter += 1;
                    out_formattedTextInfo.ShiftTextInfosAndReformat(i, numWordsToShift);
                }
            }
        }

        return out_formattedTextInfo;
    }

    //This function only applies to "select" elements
    function GetSelectedItems(selectElement, getAll) {
        // typeof(getAll) is "number"
        getAll = (getAll !== 0);

        var out_selectedItems = [];
        var options = selectElement.getElementsByTagName("option");
        //TraceMessage("GetFullTextFromSelect: options.length=" + options.length);

        for (var i = 0; i < options.length; ++i) {
            var option = options.item(i);
            if (option.text && option.text.length > 0) {
                if (getAll === true || (getAll === false && option.selected)) {
                    out_selectedItems.push(option.text);
                }
            }
        }

        return out_selectedItems;
    }

    //This function only applies to "select" elements
    function SelectMultipleItems(selectElement, itemsToSelect) {
        var i;
        var options = selectElement.getElementsByTagName("option");
        //TraceMessage("GetFullTextFromSelect: options.length=" + options.length);
        for (i = 0; i < options.length; ++i) {
            var option = options.item(i);
            if (option.text && option.text.length > 0)
                option.selected = (itemsToSelect.indexOf(option.text) !== -1);
        }
    }

    //This function only applies to "select" elements
    function GetSelectItemIndex(selectElement, itemText) {
        //TraceMessage("GetFullTextFromSelect: enter itemText=" + itemText);

        var out_itemIndex = -1;

        if (selectElement == null || itemText == null || itemText.length === 0) {
            //TraceMessage("GetFullTextFromSelect: invalid input, return -1");
            return out_itemIndex;
        }

        var i;
        var options = selectElement.getElementsByTagName("option");
        //TraceMessage("GetFullTextFromSelect: options.length=" + options.length);
        for (i = 0; i < options.length; ++i) {
            var option = options.item(i);
            //TraceMessage("GetFullTextFromSelect: options["+i+"]=" + option.text);
            if (JQWEB.Utils.StringWildcardMatch(itemText, option.text)) {
                out_itemIndex = i;
                break;
            }
        }

        //TraceMessage("GetFullTextFromSelect: return index="+out_itemIndex);
        return out_itemIndex;
    }

    function SelectSingleItem(selectElement, itemToSelect) {
        var itemIndex = GetSelectItemIndex(selectElement, itemToSelect);
        if (itemIndex === -1) {
            // Item not found.
            return false;
        }

        if (selectElement.selectedIndex !== itemIndex) {
            selectElement.selectedIndex = itemIndex;
        }

        return true;
    }

    function AddHiddenSpansForInputValues(htmlDoc) {
        var out_addedNodes = [];
        var i;

        var collection = htmlDoc.getElementsByTagName("input");
        for (i = 0; i < collection.length; ++i) {
            var elem = collection.item(i);
            var type = elem.type;
            var value = elem.value;
            if (type !== "hidden" && type !== "checkbox" && type !== "radio" && type !== "image" &&
                value != null) {
                var tempElem = htmlDoc.createElement("span");
                tempElem.innerText = value;
                if (tempElem.style)
                    tempElem.style.display = "none";
                if (elem.parentNode) {
                    var newNode = elem.parentNode.insertBefore(tempElem, elem);
                    if (newNode)
                        out_addedNodes.push(newNode);
                }
            }
        }

        collection = htmlDoc.getElementsByTagName("textarea");
        for (i = 0; i < collection.length; ++i) {
            var elem = collection.item(i);
            var type = elem.type;
            var value = elem.value;
            if (value != null) {
                var tempElem = htmlDoc.createElement("span");
                tempElem.innerText = value;
                if (tempElem.style)
                    tempElem.style.display = "none";
                if (elem.parentNode) {
                    var newNode = elem.parentNode.insertBefore(tempElem, elem);
                    if (newNode)
                        out_addedNodes.push(newNode);
                }
            }
        }

        return out_addedNodes;
    }

    //The string can contain characters as long as modifiers".
    //Example: "<ctrl>c</ctrl>xyz".
    //The modifiers are specified like this: "<ctrl>" - Ctrl on
//	                                       "</ctrl>" - Ctrl off
//	                                       "<alt>" - Alt on
//	                                       "</alt>" - Alt off
//	                                       "<shift>" - Shift on
//	                                       "</shift>" - Shift off
    function SendKeysToHtmlElement(targetElement, htmlWindow, text, setValue, append) {
        //Set the keyboard focus.
        RaiseUiEvent(targetElement, "focus", htmlWindow);
        //Send the specified characters as keyboard events.
        //Use a parser with 2 states: "character" and "modifier".
        var ParserState = {
            CHARACTER: 0,
            MODIFIER: 1
        };
        var crtState = ParserState.CHARACTER;
        var crtToken = "", textNoModifiers = "";
        var ctrlOn = false, altOn = false, shiftOn = false;
        var setModifiersMap = {
            "<ctrl>": function () {
                ctrlOn = true;
            },
            "</ctrl>": function () {
                ctrlOn = false;
            },
            "<alt>": function () {
                altOn = true;
            },
            "</alt>": function () {
                altOn = false;
            },
            "<shift>": function () {
                shiftOn = true;
            },
            "</shift>": function () {
                shiftOn = false;
            }
        }
        var i = 0;
        for (i = 0; i < text.length; ++i) {
            var crtChar = text.charAt(i);

            if (crtState === ParserState.CHARACTER) {
                if (crtChar === '<')
                    crtState = ParserState.MODIFIER;
                crtToken = crtChar;
            } else {
                //"Modifier" state.
                if (crtChar === '>')
                    crtState = ParserState.CHARACTER;
                crtToken += crtChar;
            }

            if (crtToken.length !== 0) {
                if (crtToken.length === 1) {
                    if (crtState === ParserState.CHARACTER) {
                        //Add this character to the text value to be assigned as the "value" attribute.
                        if (setValue === true && ctrlOn === false && altOn === false)
                            textNoModifiers += crtChar;

                        var crtCharCode = text.charCodeAt(i);
                        RaiseKeyEvent(targetElement, "keydown", htmlWindow, 0, crtCharCode, ctrlOn, altOn, shiftOn);
                        RaiseKeyEvent(targetElement, "keypress", htmlWindow, 0, crtCharCode, ctrlOn, altOn, shiftOn);
                        RaiseKeyEvent(targetElement, "keyup", htmlWindow, 0, crtCharCode, ctrlOn, altOn, shiftOn);
                    }
                } else {
                    var setModifiers = setModifiersMap[crtToken.toLowerCase()];
                    if (setModifiers)
                        setModifiers();
                }
            }
        }
        if (setValue === true || targetElement.value != null) {
            if (append)
                targetElement.value = targetElement.value + textNoModifiers;
            else
                targetElement.value = textNoModifiers;
            //Notify all listeners that the value has changed
            RaiseUiEvent(targetElement, "change", htmlWindow);
        }

        //Move the focus away now that the text has been written.
        //RaiseUiEvent(targetElement, "blur", htmlWindow);
    }

    function RaiseClickEvent(element, view, button, clickType,
                             screenX, screenY, clientX, clientY,
                             ctrlOn, altOn, shiftOn) {
        if (view == null || element == null)
            return false;

        var doc = element.ownerDocument;
        if (doc == null)
            return false;

        // right button click is a particular case which opens the context menu
        var types = null;
        if (button == 2 && clickType == HTML_CLICK_SINGLE) {
            types = ["mousedown", "mouseup", "contextmenu"];
        } else {
            types = (clickType == HTML_CLICK_DOUBLE ? ["mousedown", "mouseup", "click", "mousedown", "mouseup", "click", "dblclick"] :
                clickType == HTML_CLICK_HOVERONLY ? ["mouseover", "mouseenter", "mousemove"] :
                    ["mousedown", "mouseup", "click"]);		// default: HTML_CLICK_SINGLE
        }

        var canBubble = true;
        var cancelable = true;
        var detail = 1;//Number of clicks.
        var relatedTarget = element;

        for (var i = 0; i < types.length; ++i) {
            var event = doc.createEvent("MouseEvents");
            if (event == null)
                return false;
            event.uiPathSimulatedEvent = true;//This prevents the event monitor from processing this event.
            event.initMouseEvent(types[i], canBubble, cancelable, view, detail,
                screenX, screenY, clientX, clientY,
                ctrlOn, altOn, shiftOn, false,
                button, relatedTarget);

            element.dispatchEvent(event);
        }

        return true;
    }

    function RaiseKeyEvent(element, type, view, keyCode, charCode, ctrlOn, altOn, shiftOn) {
        if (view == null || element == null)
            return false;

        var doc = element.ownerDocument;
        if (doc == null)
            return false;

        var canBubble = true;
        var cancelable = false;

        var event = doc.createEvent("KeyboardEvent");
        if (event == null)
            return false;

        event.uiPathSimulatedEvent = true;//This prevents the event monitor from processing this event.
        InitKeyboardEvent(event, type, canBubble, cancelable, view,
            keyCode, charCode, ctrlOn, altOn, shiftOn);

        element.dispatchEvent(event);

        return true;
    }

    function RaiseUiEvent(element, type, view) {
        if (view == null || element == null)
            return false;

        var doc = element.ownerDocument;
        if (doc == null)
            return false;

        var canBubble = true;
        var cancelable = false;
        var detail = 1;

        var event = doc.createEvent("UIEvents");
        if (event == null)
            return false;

        event.uiPathSimulatedEvent = true;//This prevents the event monitor from processing this event.
        event.initUIEvent(type, canBubble, cancelable, view, detail);

        element.dispatchEvent(event);

        return true;
    }

    function getCssSelector(e) {
        var cssSel = "";

        while (true) {
            var t = e.tagName.toLowerCase();
            if (cssSel === "") {
                cssSel = t;
            } else {
                cssSel = t + ">" + cssSel;
            }

            if (t === "body") {
                break;
            }

            var p = e.parentElement;
            if (p === null) {
                break;
            }

            e = p;
        }

        return cssSel;
    }


    function getXpath(element) {
        //        if (element.id !== "") {//判断id属性，如果这个元素有id，则显 示//*[@id="xPath"]  形式内容
        //            return '//*[@id=\"' + element.id + '\"]';
        //        }
        //这里需要需要主要字符串转译问题，可参考js 动态生成html时字符串和变量转译（注意引号的作用）
        if (element.tagName && element.tagName.toLowerCase() == 'html') {//递归到body处，结束递归
            return '/html';
        }
        if (element == document.body) {//递归到body处，结束递归
            return '/html/' + element.tagName.toLowerCase();
        }
        var ix = 1,//在nodelist中的位置，且每次点击初始化
            siblings = element.parentNode.childNodes;//同级的子元素

        for (var i = 0, l = siblings.length; i < l; i++) {
            var sibling = siblings[i];
            //如果这个元素是siblings数组中的元素，则执行递归操作
            if (sibling == element) {
                return arguments.callee(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix) + ']';
                //如果不符合，判断是否是element元素，并且是否是相同元素，如果是相同的就开始累加
            } else if (sibling.nodeType == 1 && sibling.tagName == element.tagName) {
                ix++;
            }
        }
    }

})()

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
