(function () {
    var Utils = {
        MatchChars: MatchChars,
        StringWildcardMatch: StringWildcardMatch,
        DeleteForbiddenCharacters: DeleteForbiddenCharacters,
        TruncateStringUsingWildcard: TruncateStringUsingWildcard,
        ConcatObjects: ConcatObjects,
        IsObjectEmpty: IsObjectEmpty,
        TrimWhiteSpaces: TrimWhiteSpaces,
        IsWhiteSpaceCharacter: IsWhiteSpaceCharacter,
        UiRect: UiRect,
        RectToString: RectToString,
        UnformatSpecialJsCharacters: UnformatSpecialJsCharacters,
        ExecuteWithRetry: ExecuteWithRetry,
        Stopwatch: Stopwatch,
        MatchClassName: MatchClassName
    }
    if (JQWEB) {
        JQWEB.Utils = Utils;
    }

    var N_TRUE = 1;
    var N_FALSE = 0;


    // String matching with wildcards
    function MatchChars(c1, c2) {
        if (c1 && c2 && c1.toLowerCase && c2.toLowerCase) {
            c1 = c1.toLowerCase();
            c2 = c2.toLowerCase();
        }
        return (c1 === '?') || (c1 === c2);
    }

    function StringWildcardMatch(psText1, psText2) {
        ////TraceMessage("StringWildcardMatch: enter");

        var nStart1 = 0, nStart2 = 0, nStartMatch1 = -1;
        var bAsteriskMode = false;
        var nLen1, nLen2;
        var bSeek = true;

        if (psText1 == null || psText2 == null) {
            ////TraceMessage("StringWildcardMatch: invalid input, return false");
            return false;
        }

        nLen1 = psText1.length + 1;
        nLen2 = psText2.length + 1;

        while (bSeek && nStart1 < nLen1 && nStart2 < nLen2) {
            // Set the state of the parser
            if (psText1[nStart1] === '*') {
                // Avoid asterisk series
                while (psText1[++nStart1] === '*') ;

                //'nStartMatch1' is used when the comparison in asterisk mode fails
                //'nStart1' will reset to this position
                nStartMatch1 = nStart1;
                bAsteriskMode = true;
            }
            if (bAsteriskMode) {
                if (!MatchChars(psText1[nStart1], psText2[nStart2])) {
                    //The current characters do not match
                    if (nStart1 === nStartMatch1) {
                        //This means that the  asterisk match mode has just begun
                        //Advance one position in string 2 to see if the next character
                        //matches the string that follows.
                        //Remain on position with string 1
                        ++nStart2;
                    } else {
                        //The asterisk mode has already found some matching characters
                        //that follow the asterisk, but the current characters do not match
                        //Reset the position in string 1 to the position of the asterisk + 1
                        //and remain on position with string 2
                        nStart1 = nStartMatch1;
                    }
                } else {
                    //The characters match, so advance one position in each string
                    ++nStart1;
                    ++nStart2;
                }
            } else {
                //Default string comparison mode
                if (!MatchChars(psText1[nStart1], psText2[nStart2])) {
                    //The characters do not match, stop seeking
                    bSeek = false;
                }

                ++nStart1;
                ++nStart2;
            }
        }

        //Both seeking pointers must reach the ends of the strings
        var out_result = (nStart1 >= nLen1 && nStart2 >= nLen2);
        ////TraceMessage("StringWildcardMatch: return out_result="+out_result);
        return out_result;
    }

    function MatchClassName(class1, class2) {
        var class1Arr = class1.split(/\s+/);
        var class2Arr = class2.split(/\s+/);
        for (var i = 0; i < class1Arr.length; i++) {
            for (var j = 0; j < class2Arr.length; j++) {
                if (class2Arr[j] == class1Arr[i]) return true;
            }
        }
        return false;
    }

    function DeleteForbiddenCharacters(text) {
        if (text == null || text.length === 0) {
            return "";
        }

        var out_text = text.replace(/\r/g, " ");
        out_text = out_text.replace(/\n/g, " ");

        return out_text;
    }

    function TruncateStringUsingWildcard(text, maxLen) {
        if (text == null) {
            return "";
        }

        if (text.length <= maxLen) {
            return text;
        }

        var out_text = text.slice(0, maxLen);
        out_text += "*";

        return out_text;
    }

    function ConcatObjects(o1, o2) {
        var result = {};

        if (o1 != null) {
            result = o1;
        }

        if (o2 != null) {
            for (var prop in o2) {
                result[prop] = o2[prop];
            }
        }

        return result;
    }

    function IsObjectEmpty(obj) {
        if (obj == null) {
            return true;
        }

        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                return false;
            }
        }

        return true;
    }

    function TrimWhiteSpaces(text) {
        // Trim the standard white spaces.
        var out_text = text.trim();

        // Trim special white space characters.
        var whiteSpaceCodes = [0x200E, 0x2022];
        while (out_text.length !== 0 &&
        whiteSpaceCodes.indexOf(out_text.charCodeAt(0)) !== -1) {
            out_text = out_text.slice(1);
        }

        while (out_text.length !== 0 &&
        whiteSpaceCodes.indexOf(out_text.charCodeAt(out_text.length - 1)) !== -1) {
            out_text = out_text.slice(0, out_text.length - 1);
        }

        return out_text;
    }

    function IsWhiteSpaceCharacter(ch) {
        //Trim the standard white spaces.
        return ch === '\t' ||
            ch === '\r' ||
            ch === '\n' ||
            ch === ' ' ||
            ch === '\u200E' ||
            ch === '\u2022';
    }

    function UiRect(left, top, width, height) {
        return {
            left: left,
            top: top,
            right: left + width,
            bottom: top + height,
            getWidth: function () {
                return this.right - this.left;
            },
            getHeight: function () {
                return this.bottom - this.top;
            },

            Intersects: function (rc2) {
                return (this.right > rc2.left && this.left < rc2.right) &&
                    (this.bottom > rc2.top && this.top < rc2.bottom);
            },

            Contains: function (point) {
                return ((point.x >= this.left && point.x <= this.right) &&
                    (point.y >= this.top && point.y <= this.bottom));
            },

            Scale: function (factor) {
                return UiRect(this.left * factor, this.top * factor, this.getWidth() * factor, this.getHeight() * factor);
            },

            ScaleInv: function (factor) {
                return UiRect(this.left / factor, this.top / factor, this.getWidth() / factor, this.getHeight() / factor);
            },

            IsEqual: function (rc2) {
                return this.left === rc2.left && this.top === rc2.top &&
                    this.right === rc2.right && this.bottom === rc2.bottom;
            },

            Offset: function (dx, dy) {
                return UiRect(this.left + dx, this.top + dy, this.getWidth(), this.getHeight());
            },

            MathRound: function () {
                return UiRect(Math.round(this.left), Math.round(this.top), Math.round(this.getWidth()), Math.round(this.getHeight()));
            },

            toString: function () {
                return "(" + left + " " + top + " " + width + " " + height + ")";
            }
        };
    }

    function RectToString(rect) {
        return "[" + rect.left + " " + rect.top + " " + rect.right + " " + rect.bottom + "]";
    }

    function UnformatSpecialJsCharacters(code) {
        var out_unformattedCode = code;

        out_unformattedCode = out_unformattedCode.replace(/%CR%/g, "\r");
        out_unformattedCode = out_unformattedCode.replace(/%LF%/g, "\n");

        return out_unformattedCode
    }

    function ExecuteWithRetry(predicateFunc, coreFunc, debugTag) {
        var initTimeout = 30000; // 30 seconds
        var timeout = 100;
        var maxTries = initTimeout / timeout;

        var fnWrapper = function () {
            if (predicateFunc() === true) {
                coreFunc();
            } else {
                maxTries--;

                if (maxTries >= 0) {
                    //TraceMessage("ExecuteWithRetry: condition for " + debugTag + " is false; retrying later");
                    setTimeout(fnWrapper, timeout);
                } else {
                    console.error("ExecuteWithRetry: timed out while waiting to execute '" + debugTag + "'");
                }
            }
        };

        fnWrapper();
    }

    function Stopwatch() {
        var m_startTime;
        var m_msTimeout;
        var m_bTimeoutElapsed;

        return {
            Start: function (msTimeout) {
                m_msTimeout = msTimeout;
                m_bTimeoutElapsed = N_FALSE;
                m_startTime = new Date().getTime();
            },

            TimeoutElapsed: function () {
                if (m_bTimeoutElapsed === N_FALSE) {
                    var crtTime = new Date().getTime();
                    if (crtTime - m_startTime > m_msTimeout)
                        m_bTimeoutElapsed = N_TRUE;
                }

                return m_bTimeoutElapsed;
            }
        };
    }


})()
