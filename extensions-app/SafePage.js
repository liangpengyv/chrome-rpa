/*
	Module that implements the algorithm that recursively finds all documents inside a window.

	Public functions:
		GetDocumentList(rootDoc) returns the list of documents starting from the root document and recursively in any subframe window.
*/

//If a website has a child frame which belongs to another domain, an exception can be thrown when trying to access
//"frame.contentDocument". Guard against this case.


(function () {
    var SafePage = {
        GetSafeContentDocument: GetSafeContentDocument,
        GetFrameList: GetFrameList,
        GetFrameListRecursive: GetFrameListRecursive,
        GetDocumentList: GetDocumentList,
        GetDocumentListRecursive: GetDocumentListRecursive
    }
    if (JQWEB) {
        JQWEB.SafePage = SafePage;
    }

    function GetSafeContentDocument(frame) {
        var out_doc = null;

        try {
            out_doc = frame.contentDocument;

        } catch (e) {
            out_doc = null;
        }

        return out_doc;
    }


    function GetDocumentListRecursive(doc, out_docList) {
        if (doc == null)
            return;

        var i = 0;

        out_docList.push(doc);

        var frames = doc.getElementsByTagName("iframe");
        for (i = 0; i < frames.length; ++i)
            GetDocumentListRecursive(GetSafeContentDocument(frames.item(i)), out_docList);

        frames = doc.getElementsByTagName("frame");
        for (i = 0; i < frames.length; ++i)
            GetDocumentListRecursive(GetSafeContentDocument(frames.item(i)), out_docList);
    }

    function GetDocumentList(rootDoc) {
        var docList = [];
        GetDocumentListRecursive(rootDoc, docList);
        return docList;
    }

    function GetFrameListRecursive(doc, out_frameList) {
        if (doc == null)
            return;

        var i = 0;

        var frames = doc.getElementsByTagName("iframe");
        for (i = 0; i < frames.length; ++i) {
            var frame = frames.item(i);
            out_frameList.push(frame);
            GetFrameListRecursive(GetSafeContentDocument(frame), out_frameList);
        }

        frames = doc.getElementsByTagName("frame");
        for (i = 0; i < frames.length; ++i) {
            var frame = frames.item(i);
            out_frameList.push(frame);
            GetFrameListRecursive(GetSafeContentDocument(frame), out_frameList);
        }
    }

    function GetFrameList(rootDoc) {
        var frameList = [];
        GetFrameListRecursive(rootDoc, frameList);
        return frameList;
    }

})();
