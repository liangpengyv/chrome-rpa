(function () {
    var PageRectUtil = {
        GetPageRenderOffsets: GetPageRenderOffsets,
        CssToScreenRect: CssToScreenRect,
        CssToClientRect: CssToClientRect,
        ScreenToCssPos: ScreenToCssPos,
        ScreenToCssRect: ScreenToCssRect,
        ClientToCssRect: ClientToCssRect,
        ClientToCssPos: ClientToCssPos
    }
    if (JQWEB) {
        JQWEB.PageRectUtil = PageRectUtil;
    }

    //This function gets the offsets between the Chrome window and the page rendering area, when nothing is displayed in the
    //lower part of the browser window.
    function GetPageRenderOffsets(refPageRenderOfsX, refPageRenderOfsY, pageZoomFactor) {
        if (refPageRenderOfsX > 0 || refPageRenderOfsY > 0)
            return {x: refPageRenderOfsX, y: refPageRenderOfsY};

        var innerWidthPixels = window.innerWidth * pageZoomFactor;
        var innerHeightPixels = window.innerHeight * pageZoomFactor;
        var resizeBorderSize = (window.outerWidth - innerWidthPixels) / 2;


        return {
            x: resizeBorderSize,
            y: window.outerHeight - innerHeightPixels - resizeBorderSize
        };
    }

    function CssToScreenRect(cssRect, renderParams, useClientCoordinates) {
        /* Expected values in
            renderParams
            {
                pageRenderOfsX  -> offset X of the html-render-page in the browser window
                pageRenderOfsY  -> offset Y of the html-render-page in the browser window
                pageZoomValue   -> the zoom level of current html page
                windowLeft      -> origin X of the browser window)
                windowTop       -> origin Y of the browser window
            }
            All the coordinates are in Screen-Space.
        */

        var clientToCssScaleFactor = window.devicePixelRatio;

        var finalRectangle = CssToClientRect(cssRect, clientToCssScaleFactor);

        var isFirefox = (window.mozInnerScreenX !== undefined);
        var pageRenderOfs = {x: 0, y: 0};
        if (isFirefox === false) {
            pageRenderOfs = GetPageRenderOffsets(renderParams.pageRenderOfsX, renderParams.pageRenderOfsY, renderParams.pageZoomValue);
        }
        finalRectangle = finalRectangle.Offset(pageRenderOfs.x, pageRenderOfs.y);

        if (useClientCoordinates === N_FALSE) {
            var windowLeft = isFirefox ? (window.mozInnerScreenX * clientToCssScaleFactor) : renderParams.windowLeft;
            var windowTop = isFirefox ? (window.mozInnerScreenY * clientToCssScaleFactor) : renderParams.windowTop;


            finalRectangle = finalRectangle.Offset(windowLeft, windowTop);
        }
        return finalRectangle;
    }

    //This method converts CSS coordinates to client coordinates
    //"cssRect" must be an UiRect object
    function CssToClientRect(cssRect, zoomFactor) {
        return cssRect.Scale(zoomFactor).MathRound();
    }

    function ScreenToCssPos(screenPos, renderParams) {
        /* Expected values in
            renderParams
            {
                pageRenderOfsX  -> offset X of the html-render-page in the browser window
                pageRenderOfsY  -> offset Y of the html-render-page in the browser window
                pageZoomValue   -> the zoom level of current html page
                windowLeft      -> origin X of the browser window)
                windowTop       -> origin Y of the browser window
            }
            All the coordinates are in Screen-Space.
        */
        var clientToCssScaleFactor = window.devicePixelRatio;

        var isFirefox = (window.mozInnerScreenX !== undefined);
        var windowLeft = isFirefox ? (window.mozInnerScreenX * clientToCssScaleFactor) : (renderParams.windowLeft);
        var windowTop = isFirefox ? (window.mozInnerScreenY * clientToCssScaleFactor) : (renderParams.windowTop);

        var pageRenderOfs = {x: 0, y: 0};
        if (isFirefox == false) {
            pageRenderOfs = GetPageRenderOffsets(renderParams.pageRenderOfsX, renderParams.pageRenderOfsY, renderParams.pageZoomValue);
        }

        // Transform the screen-coordinates to client-coordinates (think render page).
        var screenX = screenPos.x;
        var screenY = screenPos.y;
        var clientPos = {
            x: screenX - windowLeft - pageRenderOfs.x,
            y: screenY - windowTop - pageRenderOfs.y
        };
        // Transform the client-coordinates to CSS-coordinates.
        var cssPos = ClientToCssPos(clientPos, clientToCssScaleFactor);

        return cssPos;
    }

    function ScreenToCssRect(screenRect, renderParams) {
        /* Expected values in
            renderParams
            {
                pageRenderOfsX  -> offset X of the html-render-page in the browser window
                pageRenderOfsY  -> offset Y of the html-render-page in the browser window
                pageZoomValue   -> the zoom level of current html page
                windowLeft      -> origin X of the browser window)
                windowTop       -> origin Y of the browser window
            }
            All the coordinates are in Screen-Space.
        */
        var clientToCssScaleFactor = window.devicePixelRatio;

        var isFirefox = (window.mozInnerScreenX !== undefined);
        var windowLeft = isFirefox ? (window.mozInnerScreenX * clientToCssScaleFactor) : (renderParams.windowLeft);
        var windowTop = isFirefox ? (window.mozInnerScreenY * clientToCssScaleFactor) : (renderParams.windowTop);

        var pageRenderOfs = {x: 0, y: 0};
        if (isFirefox == false) {
            pageRenderOfs = GetPageRenderOffsets(renderParams.pageRenderOfsX, renderParams.pageRenderOfsY, renderParams.pageZoomValue);
        }

        // Transform the screen-coordinates to client-coordinates (think html render page).
        var clientOffsetX = windowLeft + pageRenderOfs.x;
        var clientOffsetY = windowTop + pageRenderOfs.y;
        var clientRect = screenRect.Offset(-clientOffsetX, -clientOffsetY);

        // Transform the client-coordinates to CSS-coordinates.
        var cssRect = ClientToCssRect(clientRect, clientToCssScaleFactor);


        return cssRect;
    }

    //This method converts client coordinates to CSS coordinates
    function ClientToCssRect(clientRect, zoomFactor) {
        return clientRect.ScaleInv(zoomFactor).MathRound();
    }

    //This method converts client coordinates to CSS coordinates
    function ClientToCssPos(clientPos, zoomFactor) {
        return {
            x: Math.round(clientPos.x / zoomFactor),
            y: Math.round(clientPos.y / zoomFactor)
        };
    }
})();
