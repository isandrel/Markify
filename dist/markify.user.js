// ==UserScript==
// @name         Markify
// @namespace    https://github.com/isandrel/Markify
// @version      0.0.5
// @author       isandrel
// @description  Convert web pages to Obsidian-formatted Markdown with YAML frontmatter
// @license      AGPL-3.0-or-later
// @icon         https://cdn.jsdelivr.net/npm/@tabler/icons@latest/icons/download.svg
// @homepageURL  https://github.com/isandrel/Markify
// @supportURL   https://github.com/isandrel/Markify/issues
// @downloadURL  https://github.com/isandrel/Markify/raw/main/dist/markify.user.js
// @updateURL    https://github.com/isandrel/Markify/raw/main/dist/markify.user.js
// @match        https://instant.1point3acres.com/thread/*
// @match        https://linux.do/*
// @match        https://www.1point3acres.com/bbs/thread-*
// @match        https://www.1point3acres.com/home/*
// @match        https://www.uscardforum.com/*
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/system.min.js
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/extras/named-register.min.js
// @require      data:application/javascript,%3B(typeof%20System!%3D'undefined')%26%26(System%3Dnew%20System.constructor())%3B
// @connect      api.1point3acres.com
// @connect      self
// @grant        GM.deleteValue
// @grant        GM.getValue
// @grant        GM.listValues
// @grant        GM.notification
// @grant        GM.openInTab
// @grant        GM.registerMenuCommand
// @grant        GM.setClipboard
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// ==/UserScript==


System.register("./__entry.js", ['./__monkey.entry-oE3Twt20.js'], (function (exports, module) {
	'use strict';
	return {
		setters: [null],
		execute: (function () {



		})
	};
}));

System.register("./__monkey.entry-oE3Twt20.js", [], (function (exports, module) {
  'use strict';
  return {
    execute: (function () {

      exports({
        A: getConfig,
        B: getProfileAdapters,
        D: hasSiteApi,
        E: interpolate,
        F: listAdapters,
        H: matchesPattern,
        I: parseForumPosts,
        J: replacePlaceholders,
        K: routeLogsToStderr,
        M: sanitizeFilename,
        N: setConfig,
        a: applyFilenameTemplate,
        d: applyCommentTemplate,
        e: applyDocumentTemplate,
        h: classifyRegistryRoute,
        i: classifyRoute,
        k: convert,
        l: createProfileAdapter,
        n: extractIdFromUrl,
        o: extractMainContent,
        p: fetchForumApiContent,
        q: fetchDiscourseRawContent,
        r: fetchThreadState,
        s: fetchViaJinaReader,
        t: findProfileAdapter,
        u: findSiteAdapter,
        v: formatDate,
        w: formatMessage,
        x: generateFrontmatter,
        y: getAdapterConfig,
        z: getBuiltInAdapters
      });

      const scriptRel = (function detectScriptRel() {
        const relList = typeof document !== "undefined" && document.createElement("link").relList;
        return relList && relList.supports && relList.supports("modulepreload") ? "modulepreload" : "preload";
      })();
      const assetsURL = function(dep) {
        return "/" + dep;
      };
      const seen = {};
      const __vitePreload = function preload(baseModule, deps, importerUrl) {
        let promise = Promise.resolve();
        if (deps && deps.length > 0) {
          let allSettled = function(promises$2) {
            return Promise.all(promises$2.map((p2) => Promise.resolve(p2).then((value$1) => ({
              status: "fulfilled",
              value: value$1
            }), (reason) => ({
              status: "rejected",
              reason
            }))));
          };
          document.getElementsByTagName("link");
          const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
          const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
          promise = allSettled(deps.map((dep) => {
            dep = assetsURL(dep);
            if (dep in seen) return;
            seen[dep] = true;
            const isCss = dep.endsWith(".css");
            const cssSelector = isCss ? '[rel="stylesheet"]' : "";
            if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
            const link = document.createElement("link");
            link.rel = isCss ? "stylesheet" : scriptRel;
            if (!isCss) link.as = "script";
            link.crossOrigin = "";
            link.href = dep;
            if (cspNonce) link.setAttribute("nonce", cspNonce);
            document.head.appendChild(link);
            if (isCss) return new Promise((res, rej) => {
              link.addEventListener("load", res);
              link.addEventListener("error", () => rej( new Error(`Unable to preload CSS for ${dep}`)));
            });
          }));
        }
        function handlePreloadError(err$2) {
          const e$1 = new Event("vite:preloadError", { cancelable: true });
          e$1.payload = err$2;
          window.dispatchEvent(e$1);
          if (!e$1.defaultPrevented) throw err$2;
        }
        return promise.then((res) => {
          for (const item of res || []) {
            if (item.status !== "rejected") continue;
            handlePreloadError(item.reason);
          }
          return baseModule().catch(handlePreloadError);
        });
      };
      function extend$1(destination) {
        for (var i2 = 1; i2 < arguments.length; i2++) {
          var source = arguments[i2];
          for (var key in source) {
            if (source.hasOwnProperty(key)) destination[key] = source[key];
          }
        }
        return destination;
      }
      function repeat(character, count) {
        return Array(count + 1).join(character);
      }
      function trimLeadingNewlines(string2) {
        return string2.replace(/^\n*/, "");
      }
      function trimTrailingNewlines(string2) {
        var indexEnd = string2.length;
        while (indexEnd > 0 && string2[indexEnd - 1] === "\n") indexEnd--;
        return string2.substring(0, indexEnd);
      }
      function trimNewlines(string2) {
        return trimTrailingNewlines(trimLeadingNewlines(string2));
      }
      var blockElements = [
        "ADDRESS",
        "ARTICLE",
        "ASIDE",
        "AUDIO",
        "BLOCKQUOTE",
        "BODY",
        "CANVAS",
        "CENTER",
        "DD",
        "DIR",
        "DIV",
        "DL",
        "DT",
        "FIELDSET",
        "FIGCAPTION",
        "FIGURE",
        "FOOTER",
        "FORM",
        "FRAMESET",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "HEADER",
        "HGROUP",
        "HR",
        "HTML",
        "ISINDEX",
        "LI",
        "MAIN",
        "MENU",
        "NAV",
        "NOFRAMES",
        "NOSCRIPT",
        "OL",
        "OUTPUT",
        "P",
        "PRE",
        "SECTION",
        "TABLE",
        "TBODY",
        "TD",
        "TFOOT",
        "TH",
        "THEAD",
        "TR",
        "UL"
      ];
      function isBlock(node2) {
        return is(node2, blockElements);
      }
      var voidElements = [
        "AREA",
        "BASE",
        "BR",
        "COL",
        "COMMAND",
        "EMBED",
        "HR",
        "IMG",
        "INPUT",
        "KEYGEN",
        "LINK",
        "META",
        "PARAM",
        "SOURCE",
        "TRACK",
        "WBR"
      ];
      function isVoid(node2) {
        return is(node2, voidElements);
      }
      function hasVoid(node2) {
        return has(node2, voidElements);
      }
      var meaningfulWhenBlankElements = [
        "A",
        "TABLE",
        "THEAD",
        "TBODY",
        "TFOOT",
        "TH",
        "TD",
        "IFRAME",
        "SCRIPT",
        "AUDIO",
        "VIDEO"
      ];
      function isMeaningfulWhenBlank(node2) {
        return is(node2, meaningfulWhenBlankElements);
      }
      function hasMeaningfulWhenBlank(node2) {
        return has(node2, meaningfulWhenBlankElements);
      }
      function is(node2, tagNames) {
        return tagNames.indexOf(node2.nodeName) >= 0;
      }
      function has(node2, tagNames) {
        return node2.getElementsByTagName && tagNames.some(function(tagName) {
          return node2.getElementsByTagName(tagName).length;
        });
      }
      var rules = {};
      rules.paragraph = {
        filter: "p",
        replacement: function(content) {
          return "\n\n" + content + "\n\n";
        }
      };
      rules.lineBreak = {
        filter: "br",
        replacement: function(content, node2, options) {
          return options.br + "\n";
        }
      };
      rules.heading = {
        filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
        replacement: function(content, node2, options) {
          var hLevel = Number(node2.nodeName.charAt(1));
          if (options.headingStyle === "setext" && hLevel < 3) {
            var underline = repeat(hLevel === 1 ? "=" : "-", content.length);
            return "\n\n" + content + "\n" + underline + "\n\n";
          } else {
            return "\n\n" + repeat("#", hLevel) + " " + content + "\n\n";
          }
        }
      };
      rules.blockquote = {
        filter: "blockquote",
        replacement: function(content) {
          content = trimNewlines(content).replace(/^/gm, "> ");
          return "\n\n" + content + "\n\n";
        }
      };
      rules.list = {
        filter: ["ul", "ol"],
        replacement: function(content, node2) {
          var parent = node2.parentNode;
          if (parent.nodeName === "LI" && parent.lastElementChild === node2) {
            return "\n" + content;
          } else {
            return "\n\n" + content + "\n\n";
          }
        }
      };
      rules.listItem = {
        filter: "li",
        replacement: function(content, node2, options) {
          var prefix = options.bulletListMarker + "   ";
          var parent = node2.parentNode;
          if (parent.nodeName === "OL") {
            var start = parent.getAttribute("start");
            var index = Array.prototype.indexOf.call(parent.children, node2);
            prefix = (start ? Number(start) + index : index + 1) + ".  ";
          }
          var isParagraph = /\n$/.test(content);
          content = trimNewlines(content) + (isParagraph ? "\n" : "");
          content = content.replace(/\n/gm, "\n" + " ".repeat(prefix.length));
          return prefix + content + (node2.nextSibling ? "\n" : "");
        }
      };
      rules.indentedCodeBlock = {
        filter: function(node2, options) {
          return options.codeBlockStyle === "indented" && node2.nodeName === "PRE" && node2.firstChild && node2.firstChild.nodeName === "CODE";
        },
        replacement: function(content, node2, options) {
          return "\n\n    " + node2.firstChild.textContent.replace(/\n/g, "\n    ") + "\n\n";
        }
      };
      rules.fencedCodeBlock = {
        filter: function(node2, options) {
          return options.codeBlockStyle === "fenced" && node2.nodeName === "PRE" && node2.firstChild && node2.firstChild.nodeName === "CODE";
        },
        replacement: function(content, node2, options) {
          var className = node2.firstChild.getAttribute("class") || "";
          var language = (className.match(/language-(\S+)/) || [null, ""])[1];
          var code = node2.firstChild.textContent;
          var fenceChar = options.fence.charAt(0);
          var fenceSize = 3;
          var fenceInCodeRegex = new RegExp("^" + fenceChar + "{3,}", "gm");
          var match2;
          while (match2 = fenceInCodeRegex.exec(code)) {
            if (match2[0].length >= fenceSize) {
              fenceSize = match2[0].length + 1;
            }
          }
          var fence = repeat(fenceChar, fenceSize);
          return "\n\n" + fence + language + "\n" + code.replace(/\n$/, "") + "\n" + fence + "\n\n";
        }
      };
      rules.horizontalRule = {
        filter: "hr",
        replacement: function(content, node2, options) {
          return "\n\n" + options.hr + "\n\n";
        }
      };
      rules.inlineLink = {
        filter: function(node2, options) {
          return options.linkStyle === "inlined" && node2.nodeName === "A" && node2.getAttribute("href");
        },
        replacement: function(content, node2) {
          var href = node2.getAttribute("href");
          if (href) href = href.replace(/([()])/g, "\\$1");
          var title = cleanAttribute(node2.getAttribute("title"));
          if (title) title = ' "' + title.replace(/"/g, '\\"') + '"';
          return "[" + content + "](" + href + title + ")";
        }
      };
      rules.referenceLink = {
        filter: function(node2, options) {
          return options.linkStyle === "referenced" && node2.nodeName === "A" && node2.getAttribute("href");
        },
        replacement: function(content, node2, options) {
          var href = node2.getAttribute("href");
          var title = cleanAttribute(node2.getAttribute("title"));
          if (title) title = ' "' + title + '"';
          var replacement;
          var reference;
          switch (options.linkReferenceStyle) {
            case "collapsed":
              replacement = "[" + content + "][]";
              reference = "[" + content + "]: " + href + title;
              break;
            case "shortcut":
              replacement = "[" + content + "]";
              reference = "[" + content + "]: " + href + title;
              break;
            default:
              var id = this.references.length + 1;
              replacement = "[" + content + "][" + id + "]";
              reference = "[" + id + "]: " + href + title;
          }
          this.references.push(reference);
          return replacement;
        },
        references: [],
        append: function(options) {
          var references = "";
          if (this.references.length) {
            references = "\n\n" + this.references.join("\n") + "\n\n";
            this.references = [];
          }
          return references;
        }
      };
      rules.emphasis = {
        filter: ["em", "i"],
        replacement: function(content, node2, options) {
          if (!content.trim()) return "";
          return options.emDelimiter + content + options.emDelimiter;
        }
      };
      rules.strong = {
        filter: ["strong", "b"],
        replacement: function(content, node2, options) {
          if (!content.trim()) return "";
          return options.strongDelimiter + content + options.strongDelimiter;
        }
      };
      rules.code = {
        filter: function(node2) {
          var hasSiblings = node2.previousSibling || node2.nextSibling;
          var isCodeBlock = node2.parentNode.nodeName === "PRE" && !hasSiblings;
          return node2.nodeName === "CODE" && !isCodeBlock;
        },
        replacement: function(content) {
          if (!content) return "";
          content = content.replace(/\r?\n|\r/g, " ");
          var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? " " : "";
          var delimiter = "`";
          var matches = content.match(/`+/gm) || [];
          while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + "`";
          return delimiter + extraSpace + content + extraSpace + delimiter;
        }
      };
      rules.image = {
        filter: "img",
        replacement: function(content, node2) {
          var alt = cleanAttribute(node2.getAttribute("alt"));
          var src = node2.getAttribute("src") || "";
          var title = cleanAttribute(node2.getAttribute("title"));
          var titlePart = title ? ' "' + title + '"' : "";
          return src ? "![" + alt + "](" + src + titlePart + ")" : "";
        }
      };
      function cleanAttribute(attribute) {
        return attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : "";
      }
      function Rules(options) {
        this.options = options;
        this._keep = [];
        this._remove = [];
        this.blankRule = {
          replacement: options.blankReplacement
        };
        this.keepReplacement = options.keepReplacement;
        this.defaultRule = {
          replacement: options.defaultReplacement
        };
        this.array = [];
        for (var key in options.rules) this.array.push(options.rules[key]);
      }
      Rules.prototype = {
        add: function(key, rule) {
          this.array.unshift(rule);
        },
        keep: function(filter) {
          this._keep.unshift({
            filter,
            replacement: this.keepReplacement
          });
        },
        remove: function(filter) {
          this._remove.unshift({
            filter,
            replacement: function() {
              return "";
            }
          });
        },
        forNode: function(node2) {
          if (node2.isBlank) return this.blankRule;
          var rule;
          if (rule = findRule(this.array, node2, this.options)) return rule;
          if (rule = findRule(this._keep, node2, this.options)) return rule;
          if (rule = findRule(this._remove, node2, this.options)) return rule;
          return this.defaultRule;
        },
        forEach: function(fn) {
          for (var i2 = 0; i2 < this.array.length; i2++) fn(this.array[i2], i2);
        }
      };
      function findRule(rules2, node2, options) {
        for (var i2 = 0; i2 < rules2.length; i2++) {
          var rule = rules2[i2];
          if (filterValue(rule, node2, options)) return rule;
        }
        return void 0;
      }
      function filterValue(rule, node2, options) {
        var filter = rule.filter;
        if (typeof filter === "string") {
          if (filter === node2.nodeName.toLowerCase()) return true;
        } else if (Array.isArray(filter)) {
          if (filter.indexOf(node2.nodeName.toLowerCase()) > -1) return true;
        } else if (typeof filter === "function") {
          if (filter.call(rule, node2, options)) return true;
        } else {
          throw new TypeError("`filter` needs to be a string, array, or function");
        }
      }
      function collapseWhitespace(options) {
        var element = options.element;
        var isBlock2 = options.isBlock;
        var isVoid2 = options.isVoid;
        var isPre = options.isPre || function(node3) {
          return node3.nodeName === "PRE";
        };
        if (!element.firstChild || isPre(element)) return;
        var prevText = null;
        var keepLeadingWs = false;
        var prev = null;
        var node2 = next(prev, element, isPre);
        while (node2 !== element) {
          if (node2.nodeType === 3 || node2.nodeType === 4) {
            var text2 = node2.data.replace(/[ \r\n\t]+/g, " ");
            if ((!prevText || / $/.test(prevText.data)) && !keepLeadingWs && text2[0] === " ") {
              text2 = text2.substr(1);
            }
            if (!text2) {
              node2 = remove(node2);
              continue;
            }
            node2.data = text2;
            prevText = node2;
          } else if (node2.nodeType === 1) {
            if (isBlock2(node2) || node2.nodeName === "BR") {
              if (prevText) {
                prevText.data = prevText.data.replace(/ $/, "");
              }
              prevText = null;
              keepLeadingWs = false;
            } else if (isVoid2(node2) || isPre(node2)) {
              prevText = null;
              keepLeadingWs = true;
            } else if (prevText) {
              keepLeadingWs = false;
            }
          } else {
            node2 = remove(node2);
            continue;
          }
          var nextNode = next(prev, node2, isPre);
          prev = node2;
          node2 = nextNode;
        }
        if (prevText) {
          prevText.data = prevText.data.replace(/ $/, "");
          if (!prevText.data) {
            remove(prevText);
          }
        }
      }
      function remove(node2) {
        var next2 = node2.nextSibling || node2.parentNode;
        node2.parentNode.removeChild(node2);
        return next2;
      }
      function next(prev, current, isPre) {
        if (prev && prev.parentNode === current || isPre(current)) {
          return current.nextSibling || current.parentNode;
        }
        return current.firstChild || current.nextSibling || current.parentNode;
      }
      var root = typeof window !== "undefined" ? window : {};
      function canParseHTMLNatively() {
        var Parser = root.DOMParser;
        var canParse = false;
        try {
          if (new Parser().parseFromString("", "text/html")) {
            canParse = true;
          }
        } catch (e2) {
        }
        return canParse;
      }
      function createHTMLParser() {
        var Parser = function() {
        };
        {
          if (shouldUseActiveX()) {
            Parser.prototype.parseFromString = function(string2) {
              var doc = new window.ActiveXObject("htmlfile");
              doc.designMode = "on";
              doc.open();
              doc.write(string2);
              doc.close();
              return doc;
            };
          } else {
            Parser.prototype.parseFromString = function(string2) {
              var doc = document.implementation.createHTMLDocument("");
              doc.open();
              doc.write(string2);
              doc.close();
              return doc;
            };
          }
        }
        return Parser;
      }
      function shouldUseActiveX() {
        var useActiveX = false;
        try {
          document.implementation.createHTMLDocument("").open();
        } catch (e2) {
          if (root.ActiveXObject) useActiveX = true;
        }
        return useActiveX;
      }
      var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();
      function RootNode(input, options) {
        var root2;
        if (typeof input === "string") {
          var doc = htmlParser().parseFromString(


'<x-turndown id="turndown-root">' + input + "</x-turndown>",
            "text/html"
          );
          root2 = doc.getElementById("turndown-root");
        } else {
          root2 = input.cloneNode(true);
        }
        collapseWhitespace({
          element: root2,
          isBlock,
          isVoid,
          isPre: options.preformattedCode ? isPreOrCode : null
        });
        return root2;
      }
      var _htmlParser;
      function htmlParser() {
        _htmlParser = _htmlParser || new HTMLParser();
        return _htmlParser;
      }
      function isPreOrCode(node2) {
        return node2.nodeName === "PRE" || node2.nodeName === "CODE";
      }
      function Node(node2, options) {
        node2.isBlock = isBlock(node2);
        node2.isCode = node2.nodeName === "CODE" || node2.parentNode.isCode;
        node2.isBlank = isBlank(node2);
        node2.flankingWhitespace = flankingWhitespace(node2, options);
        return node2;
      }
      function isBlank(node2) {
        return !isVoid(node2) && !isMeaningfulWhenBlank(node2) && /^\s*$/i.test(node2.textContent) && !hasVoid(node2) && !hasMeaningfulWhenBlank(node2);
      }
      function flankingWhitespace(node2, options) {
        if (node2.isBlock || options.preformattedCode && node2.isCode) {
          return { leading: "", trailing: "" };
        }
        var edges = edgeWhitespace(node2.textContent);
        if (edges.leadingAscii && isFlankedByWhitespace("left", node2, options)) {
          edges.leading = edges.leadingNonAscii;
        }
        if (edges.trailingAscii && isFlankedByWhitespace("right", node2, options)) {
          edges.trailing = edges.trailingNonAscii;
        }
        return { leading: edges.leading, trailing: edges.trailing };
      }
      function edgeWhitespace(string2) {
        var m = string2.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
        return {
          leading: m[1],
leadingAscii: m[2],
          leadingNonAscii: m[3],
          trailing: m[4],
trailingNonAscii: m[5],
          trailingAscii: m[6]
        };
      }
      function isFlankedByWhitespace(side, node2, options) {
        var sibling;
        var regExp;
        var isFlanked;
        if (side === "left") {
          sibling = node2.previousSibling;
          regExp = / $/;
        } else {
          sibling = node2.nextSibling;
          regExp = /^ /;
        }
        if (sibling) {
          if (sibling.nodeType === 3) {
            isFlanked = regExp.test(sibling.nodeValue);
          } else if (options.preformattedCode && sibling.nodeName === "CODE") {
            isFlanked = false;
          } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
            isFlanked = regExp.test(sibling.textContent);
          }
        }
        return isFlanked;
      }
      var reduce = Array.prototype.reduce;
      var escapes = [
        [/\\/g, "\\\\"],
        [/\*/g, "\\*"],
        [/^-/g, "\\-"],
        [/^\+ /g, "\\+ "],
        [/^(=+)/g, "\\$1"],
        [/^(#{1,6}) /g, "\\$1 "],
        [/`/g, "\\`"],
        [/^~~~/g, "\\~~~"],
        [/\[/g, "\\["],
        [/\]/g, "\\]"],
        [/^>/g, "\\>"],
        [/_/g, "\\_"],
        [/^(\d+)\. /g, "$1\\. "]
      ];
      function TurndownService(options) {
        if (!(this instanceof TurndownService)) return new TurndownService(options);
        var defaults = {
          rules,
          headingStyle: "setext",
          hr: "* * *",
          bulletListMarker: "*",
          codeBlockStyle: "indented",
          fence: "```",
          emDelimiter: "_",
          strongDelimiter: "**",
          linkStyle: "inlined",
          linkReferenceStyle: "full",
          br: "  ",
          preformattedCode: false,
          blankReplacement: function(content, node2) {
            return node2.isBlock ? "\n\n" : "";
          },
          keepReplacement: function(content, node2) {
            return node2.isBlock ? "\n\n" + node2.outerHTML + "\n\n" : node2.outerHTML;
          },
          defaultReplacement: function(content, node2) {
            return node2.isBlock ? "\n\n" + content + "\n\n" : content;
          }
        };
        this.options = extend$1({}, defaults, options);
        this.rules = new Rules(this.options);
      }
      TurndownService.prototype = {
turndown: function(input) {
          if (!canConvert(input)) {
            throw new TypeError(
              input + " is not a string, or an element/document/fragment node."
            );
          }
          if (input === "") return "";
          var output = process$1.call(this, new RootNode(input, this.options));
          return postProcess.call(this, output);
        },
use: function(plugin) {
          if (Array.isArray(plugin)) {
            for (var i2 = 0; i2 < plugin.length; i2++) this.use(plugin[i2]);
          } else if (typeof plugin === "function") {
            plugin(this);
          } else {
            throw new TypeError("plugin must be a Function or an Array of Functions");
          }
          return this;
        },
addRule: function(key, rule) {
          this.rules.add(key, rule);
          return this;
        },
keep: function(filter) {
          this.rules.keep(filter);
          return this;
        },
remove: function(filter) {
          this.rules.remove(filter);
          return this;
        },
escape: function(string2) {
          return escapes.reduce(function(accumulator, escape2) {
            return accumulator.replace(escape2[0], escape2[1]);
          }, string2);
        }
      };
      function process$1(parentNode) {
        var self = this;
        return reduce.call(parentNode.childNodes, function(output, node2) {
          node2 = new Node(node2, self.options);
          var replacement = "";
          if (node2.nodeType === 3) {
            replacement = node2.isCode ? node2.nodeValue : self.escape(node2.nodeValue);
          } else if (node2.nodeType === 1) {
            replacement = replacementForNode.call(self, node2);
          }
          return join(output, replacement);
        }, "");
      }
      function postProcess(output) {
        var self = this;
        this.rules.forEach(function(rule) {
          if (typeof rule.append === "function") {
            output = join(output, rule.append(self.options));
          }
        });
        return output.replace(/^[\t\r\n]+/, "").replace(/[\t\r\n\s]+$/, "");
      }
      function replacementForNode(node2) {
        var rule = this.rules.forNode(node2);
        var content = process$1.call(this, node2);
        var whitespace = node2.flankingWhitespace;
        if (whitespace.leading || whitespace.trailing) content = content.trim();
        return whitespace.leading + rule.replacement(content, node2, this.options) + whitespace.trailing;
      }
      function join(output, replacement) {
        var s1 = trimTrailingNewlines(output);
        var s2 = trimLeadingNewlines(replacement);
        var nls = Math.max(output.length - s1.length, replacement.length - s2.length);
        var separator = "\n\n".substring(0, nls);
        return s1 + separator + s2;
      }
      function canConvert(input) {
        return input != null && (typeof input === "string" || input.nodeType && (input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11));
      }
      function matchesPattern(url2, pattern2) {
        if (pattern2 instanceof RegExp) {
          return pattern2.test(url2);
        }
        const regexPattern = pattern2.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(url2);
      }
      function findSiteAdapter(url2, adapters) {
        for (const adapter of adapters) {
          if (adapter.matchesUrl) {
            if (adapter.matchesUrl(url2)) return adapter;
            continue;
          }
          for (const pattern2 of adapter.urlPatterns) {
            if (matchesPattern(url2, pattern2)) {
              return adapter;
            }
          }
        }
        return null;
      }
      const mediumAdapter = {
        name: "Medium",
        urlPatterns: [
          "https://medium.com/*",
          "https://*.medium.com/*"
        ],
        contentSelectors: [
          "article",
          '[data-testid="storyContent"]'
        ],
        removeSelectors: [
          "header",
          "footer",
          ".metabar",
          ".postMetaInline",
          '[data-testid="storyReadTime"]'
        ],
        extractMetadata: (doc) => {
          const authorMeta = doc.querySelector('meta[property="author"]');
          const tagsElements = doc.querySelectorAll('a[rel="tag"]');
          return {
            author: authorMeta?.getAttribute("content") ?? void 0,
            tags: Array.from(tagsElements).map((el) => el.textContent?.trim() || "")
          };
        }
      };
      const substackAdapter = {
        name: "Substack",
        urlPatterns: [
          "https://*.substack.com/p/*"
        ],
        contentSelectors: [
          ".post-content",
          ".body"
        ],
        removeSelectors: [
          ".subscription-widget-wrap",
          ".captioned-button-wrap",
          ".share-dialog"
        ],
        extractMetadata: (doc) => {
          const author = doc.querySelector(".author-name")?.textContent?.trim();
          const publishDate = doc.querySelector("time")?.getAttribute("datetime");
          return {
            author: author ?? void 0,
            date: publishDate ? new Date(publishDate).toISOString().split("T")[0] : void 0,
            tags: ["substack", "newsletter"]
          };
        }
      };
      const wikipediaAdapter = {
        name: "Wikipedia",
        urlPatterns: [
          "https://*.wikipedia.org/wiki/*"
        ],
        contentSelectors: [
          "#mw-content-text",
          ".mw-parser-output"
        ],
        removeSelectors: [
          ".mw-editsection",
          ".reference",
          ".navbox",
          ".infobox",
          "#toc",
          ".sidebar"
        ],
        extractMetadata: (doc) => {
          const title = doc.querySelector("#firstHeading")?.textContent?.trim();
          const categories = Array.from(doc.querySelectorAll("#mw-normal-catlinks a")).slice(1).map((a2) => a2.textContent?.trim() || "");
          return {
            title: title ?? void 0,
            tags: ["wikipedia", ...categories.slice(0, 5)]
};
        }
      };
      const githubAdapter = {
        name: "GitHub",
        urlPatterns: [
          "https://github.com/*/*"
        ],
        contentSelectors: [
          "article.markdown-body",
          ".repository-content",
          "#readme"
        ],
        removeSelectors: [
          ".js-discussion-sidebar",
          ".timeline-comment-actions"
        ],
        extractMetadata: (doc, url2) => {
          const repoName = doc.querySelector('h1[itemprop="name"] a')?.textContent?.trim();
          const parsedUrl = new URL(url2);
          const author = parsedUrl.pathname.split("/")[1];
          return {
            author,
            title: repoName ? `${author}/${repoName}` : void 0,
            tags: ["github", "repository"]
          };
        }
      };
      const redditAdapter = {
        name: "Reddit",
        urlPatterns: [
          "https://www.reddit.com/r/*/comments/*",
          "https://old.reddit.com/r/*/comments/*"
        ],
        contentSelectors: [
          '[data-test-id="post-content"]',
          ".usertext-body",
          'div[slot="text-body"]'
        ],
        removeSelectors: [
          ".share-menu",
          ".awardings-bar"
        ],
        extractMetadata: (doc, url2) => {
          const parsedUrl = new URL(url2);
          const subreddit = parsedUrl.pathname.split("/")[2];
          const author = doc.querySelector('[data-testid="post_author_link"]')?.textContent?.trim();
          return {
            author: author ?? void 0,
            tags: ["reddit", subreddit]
          };
        }
      };
      const devtoAdapter = {
        name: "Dev.to",
        urlPatterns: [
          "https://dev.to/*/*"
        ],
        contentSelectors: [
          "#article-body",
          ".crayons-article__body"
        ],
        removeSelectors: [
          ".crayons-article__actions",
          ".crayons-sponsor"
        ],
        extractMetadata: (doc) => {
          const author = doc.querySelector(".crayons-article__header__author a")?.textContent?.trim();
          const tags = Array.from(doc.querySelectorAll(".crayons-tag")).map(
            (el) => el.textContent?.trim().replace("#", "") || ""
          );
          return {
            author: author ?? void 0,
            tags: ["dev.to", ...tags]
          };
        }
      };
      function getEnumValues(entries) {
        const numericValues = Object.values(entries).filter((v2) => typeof v2 === "number");
        const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v2]) => v2);
        return values;
      }
      function joinValues(array2, separator = "|") {
        return array2.map((val) => stringifyPrimitive(val)).join(separator);
      }
      function jsonStringifyReplacer(_, value) {
        if (typeof value === "bigint")
          return value.toString();
        return value;
      }
      class Cached {
        constructor(getter) {
          this._getter = getter;
          this._value = void 0;
        }
        get value() {
          const getter = this._getter;
          if (getter !== void 0) {
            this._value = getter();
            this._getter = void 0;
          }
          return this._value;
        }
      }
      function cached(getter) {
        return new Cached(getter);
      }
      function nullish(input) {
        return input === null || input === void 0;
      }
      function cleanRegex(source) {
        const start = source.startsWith("^") ? 1 : 0;
        const end = source.endsWith("$") ? source.length - 1 : source.length;
        return source.slice(start, end);
      }
      function floatSafeRemainder(val, step) {
        const ratio = val / step;
        const roundedRatio = Math.round(ratio);
        const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
        if (Math.abs(ratio - roundedRatio) < tolerance)
          return 0;
        return ratio - roundedRatio;
      }
      function assignProp(target, prop, value) {
        Object.defineProperty(target, prop, {
          value,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
      function rawShape(def) {
        const desc = Object.getOwnPropertyDescriptor(def, "shape");
        return desc?.get ? desc.get.raw : desc?.value;
      }
      function sourceShape(schema) {
        return rawShape(schema._zod.def) ?? schema._zod.def.shape;
      }
      function deferProp(target, key, getter) {
        Object.defineProperty(target, key, {
          get() {
            const value = getter();
            assignProp(this, key, value);
            return value;
          },
          enumerable: true,
          configurable: true
        });
      }
      function putProp(target, key, value) {
        if (key in target)
          assignProp(target, key, value);
        else
          target[key] = value;
      }
      function mirrorShape(target, source, keys, wrap) {
        const raw = sourceShape(source);
        for (const key of keys) {
          const desc = Object.getOwnPropertyDescriptor(raw, key);
          if (!desc.enumerable)
            continue;
          if (desc.get) {
            deferProp(target, key, () => {
              const value = source._zod.def.shape[key];
              return wrap ? wrap(value, key) : value;
            });
          } else
            putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
        }
      }
      function mirrorProps(target, source) {
        for (const key of Reflect.ownKeys(source)) {
          const desc = Object.getOwnPropertyDescriptor(source, key);
          if (!desc.enumerable)
            continue;
          if (desc.get)
            deferProp(target, key, () => source[key]);
          else
            putProp(target, key, desc.value);
        }
      }
      function mergeDefs(...defs) {
        const mergedDescriptors = {};
        for (const def of defs) {
          const descriptors = Object.getOwnPropertyDescriptors(def);
          Object.assign(mergedDescriptors, descriptors);
        }
        return Object.defineProperties({}, mergedDescriptors);
      }
      function esc(str) {
        return JSON.stringify(str);
      }
      function slugify(input) {
        return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
      }
      const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
      };
      function isObject(data) {
        return typeof data === "object" && data !== null && !Array.isArray(data);
      }
      const allowsEval = cached(() => {
        if (globalConfig.jitless) {
          return false;
        }
        if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
          return false;
        }
        try {
          const F = Function;
          new F("");
          return true;
        } catch (_) {
          return false;
        }
      });
      function isPlainObject(o2) {
        if (isObject(o2) === false)
          return false;
        const ctor = o2.constructor;
        if (ctor === void 0)
          return true;
        if (typeof ctor !== "function")
          return true;
        const prot = ctor.prototype;
        if (isObject(prot) === false)
          return false;
        if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
          return false;
        }
        return true;
      }
      function shallowClone(o2) {
        if (isPlainObject(o2))
          return { ...o2 };
        if (Array.isArray(o2))
          return [...o2];
        if (o2 instanceof Map)
          return new Map(o2);
        if (o2 instanceof Set)
          return new Set(o2);
        return o2;
      }
      const propertyKeyTypes = new Set(["string", "number", "symbol"]);
      function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      function clone$1(inst, def, params) {
        const cl = new inst._zod.constr(def ?? inst._zod.def);
        if (!def || params?.parent)
          cl._zod.parent = inst;
        return cl;
      }
      function normalizeParams(_params) {
        const params = _params;
        if (!params)
          return {};
        if (typeof params === "string")
          return { error: () => params };
        if (params?.message !== void 0) {
          if (params?.error !== void 0)
            throw new Error("Cannot specify both `message` and `error` params");
          params.error = params.message;
        }
        delete params.message;
        if (typeof params.error === "string")
          return { ...params, error: () => params.error };
        return params;
      }
      function stringifyPrimitive(value) {
        if (typeof value === "bigint")
          return value.toString() + "n";
        if (typeof value === "string")
          return `"${value}"`;
        return `${value}`;
      }
      function optionalKeys(shape) {
        return Object.keys(shape).filter((k) => {
          return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
        });
      }
      const NUMBER_FORMAT_RANGES = (() => ({
        safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
        int32: [-2147483648, 2147483647],
        uint32: [0, 4294967295],
        float32: [-34028234663852886e22, 34028234663852886e22],
        float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
      }))();
      const BIGINT_FORMAT_RANGES = {
        int64: [ BigInt("-9223372036854775808"), BigInt("9223372036854775807")],
        uint64: [ BigInt(0), BigInt("18446744073709551615")]
      };
      function pick(schema, mask) {
        const currDef = schema._zod.def;
        const checks = currDef.checks;
        const hasChecks = checks && checks.length > 0;
        if (hasChecks) {
          throw new Error(".pick() cannot be used on object schemas containing refinements");
        }
        const newShape = {};
        mirrorShape(newShape, schema, maskedKeys(schema, mask));
        return clone$1(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
      }
      function maskedKeys(schema, mask) {
        const raw = sourceShape(schema);
        const keys = [];
        for (const key of Reflect.ownKeys(mask)) {
          if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) {
            throw new Error(`Unrecognized key: "${String(key)}"`);
          }
          if (mask[key])
            keys.push(key);
        }
        return keys;
      }
      function omit(schema, mask) {
        const currDef = schema._zod.def;
        const checks = currDef.checks;
        const hasChecks = checks && checks.length > 0;
        if (hasChecks) {
          throw new Error(".omit() cannot be used on object schemas containing refinements");
        }
        const omitted = new Set(maskedKeys(schema, mask));
        const newShape = {};
        mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
        return clone$1(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
      }
      function extend(schema, shape) {
        if (!isPlainObject(shape)) {
          throw new Error("Invalid input to extend: expected a plain object");
        }
        const checks = schema._zod.def.checks;
        const hasChecks = checks && checks.length > 0;
        if (hasChecks) {
          const existingShape = sourceShape(schema);
          for (const key of Reflect.ownKeys(shape)) {
            if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) {
              throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
            }
          }
        }
        return clone$1(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
      }
      function extended(schema, shape) {
        const newShape = {};
        mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
        mirrorProps(newShape, shape);
        return newShape;
      }
      function safeExtend(schema, shape) {
        if (!isPlainObject(shape)) {
          throw new Error("Invalid input to safeExtend: expected a plain object");
        }
        return clone$1(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
      }
      function merge(a2, b2) {
        if (!b2?._zod?.def) {
          throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
        }
        if (a2._zod.def.checks?.length) {
          throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
        }
        const newShape = {};
        mirrorShape(newShape, a2, Reflect.ownKeys(sourceShape(a2)));
        mirrorShape(newShape, b2, Reflect.ownKeys(sourceShape(b2)));
        const def = mergeDefs(a2._zod.def, {
          shape: newShape,
          get catchall() {
            return b2._zod.def.catchall;
          },
          checks: b2._zod.def.checks ?? []
        });
        return clone$1(a2, def);
      }
      function partial(Class, schema, mask, name = "partial") {
        const currDef = schema._zod.def;
        const checks = currDef.checks;
        const hasChecks = checks && checks.length > 0;
        if (hasChecks) {
          throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
        }
        const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
        const newShape = {};
        mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key) => selected && !selected.has(key) ? value : new Class({ type: "optional", innerType: value })));
        return clone$1(schema, mergeDefs(schema._zod.def, { shape: newShape, checks: [] }));
      }
      function required(Class, schema, mask) {
        const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
        const newShape = {};
        mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => (
selected && !selected.has(key) ? value : new Class({ type: "nonoptional", innerType: value })
        ));
        return clone$1(schema, mergeDefs(schema._zod.def, { shape: newShape }));
      }
      function aborted(x, startIndex = 0) {
        if (x.aborted === true)
          return true;
        for (let i2 = startIndex; i2 < x.issues.length; i2++) {
          if (x.issues[i2]?.continue !== true) {
            return true;
          }
        }
        return false;
      }
      function explicitlyAborted(x, startIndex = 0) {
        if (x.aborted === true)
          return true;
        for (let i2 = startIndex; i2 < x.issues.length; i2++) {
          if (x.issues[i2]?.continue === false) {
            return true;
          }
        }
        return false;
      }
      function prefixIssues(path2, issues) {
        return issues.map((iss) => {
          var _a2;
          (_a2 = iss).path ?? (_a2.path = []);
          iss.path.unshift(path2);
          return iss;
        });
      }
      function unwrapMessage(message) {
        return typeof message === "string" ? message : message?.message;
      }
      function attachSchema(issues, start, inst) {
        var _a2;
        for (let i2 = start; i2 < issues.length; i2++) {
          (_a2 = issues[i2]).schema ?? (_a2.schema = inst);
        }
      }
      function finalizeIssue(iss, ctx, config2) {
        var _a2;
        const traits = iss.inst?._zod?.traits;
        if (traits?.has("$ZodType")) {
          if (traits.has("$ZodCheck"))
            (_a2 = iss).schema ?? (_a2.schema = iss.inst);
          else
            iss.schema = iss.inst;
        }
        const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
        const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
        const full = {};
        for (const k of Object.keys(iss)) {
          if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
            continue;
          full[k] = iss[k];
        }
        full.path ?? (full.path = []);
        full.message = message;
        if (ctx?.reportInput) {
          full.input = iss.input;
        }
        return full;
      }
      const highSurrogate = /[\uD800-\uDBFF]/;
      function codePointLength(str) {
        const units = str.length;
        if (!highSurrogate.test(str))
          return units;
        let count = units;
        for (let i2 = 0; i2 < units - 1; i2++) {
          if ((str.charCodeAt(i2) & 64512) === 55296 && (str.charCodeAt(i2 + 1) & 64512) === 56320) {
            count--;
            i2++;
          }
        }
        return count;
      }
      function getLengthableOrigin(input) {
        if (Array.isArray(input))
          return "array";
        if (typeof input === "string")
          return "string";
        return "unknown";
      }
      function parsedType(data) {
        const t2 = typeof data;
        switch (t2) {
          case "number": {
            return Number.isNaN(data) ? "nan" : "number";
          }
          case "object": {
            if (data === null) {
              return "null";
            }
            if (Array.isArray(data)) {
              return "array";
            }
            const obj = data;
            if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
              return obj.constructor.name;
            }
          }
        }
        return t2;
      }
      function issue(...args) {
        const [iss, input, inst] = args;
        if (typeof iss === "string") {
          return {
            message: iss,
            code: "custom",
            input,
            inst
          };
        }
        return { ...iss };
      }
      function members(proto, table) {
        for (const key in table) {
          const desc = Object.getOwnPropertyDescriptor(table, key);
          if (desc.get)
            Object.defineProperty(proto, key, { ...desc, enumerable: false });
          else
            defineBound(proto, key, desc.value);
        }
        for (const sym of Object.getOwnPropertySymbols(table)) {
          defineBound(proto, sym, table[sym]);
        }
      }
      function own(inst, key, value, enumerable = true) {
        Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
        return value;
      }
      function hide(inst, key, value) {
        return own(inst, key, value, false);
      }
      function derived(computes, table) {
        for (const key in computes) {
          const compute = computes[key];
          Object.defineProperty(table, key, {
            configurable: true,
            enumerable: true,
            get() {
              return own(this, key, compute(this));
            },
            set(value) {
              own(this, key, value);
            }
          });
        }
        return table;
      }
      function defineBound(proto, key, fn) {
        Object.defineProperty(proto, key, {
          configurable: true,
          get() {
            return this == null ? fn : own(this, key, fn.bind(this));
          },
          set(value) {
            own(this, key, value);
          }
        });
      }
      function claim(inst, sentinel) {
        const proto = Object.getPrototypeOf(inst);
        return sentinel in proto ? void 0 : proto;
      }
      let installing;
      let broke = false;
      const breaker = {
        configurable: true,
        get() {
          broke = true;
          return void 0;
        }
      };
      function defineLazyInternal(inst, key, compute) {
        const proto = Object.getPrototypeOf(inst._zod);
        if (key in proto && installing !== inst._zod) {
          installing = void 0;
          return;
        }
        installing = inst._zod;
        Object.defineProperty(proto, key, {
          configurable: true,
          get() {
            Object.defineProperty(this, key, breaker);
            const outer = broke;
            broke = false;
            try {
              const value = compute(this);
              if (broke)
                delete this[key];
              else
                Object.defineProperty(this, key, { configurable: true, writable: true, value });
              broke = broke || outer;
              return value;
            } catch (err) {
              delete this[key];
              broke = broke || outer;
              throw err;
            }
          },
          set(value) {
            Object.defineProperty(this, key, { configurable: true, writable: true, value });
          }
        });
      }
      function installLazyProp(inst, key, make, enumerable) {
        const proto = claim(inst, key);
        if (!proto)
          return;
        Object.defineProperty(proto, key, {
          configurable: true,
          get() {
            const desc = { configurable: true, writable: true, enumerable, value: void 0 };
            Object.defineProperty(this, key, desc);
            desc.value = make(this);
            Object.defineProperty(this, key, desc);
            return desc.value;
          },
          set(value) {
            Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
          }
        });
      }
      const CONSTANT_CATCH = "~constantCatch";
      function constantCatch(value) {
        const fn = () => value;
        fn[CONSTANT_CATCH] = true;
        return fn;
      }
      var _a$1;
      const _zodDesc = { value: void 0, enumerable: false };
      let _E = "captureStackTrace" in Error ? Error : null;
      function newError(Definition) {
        const E = _E;
        if (E) {
          const saved = E.stackTraceLimit;
          if (typeof saved === "number") {
            try {
              E.stackTraceLimit = 0;
            } catch {
              _E = null;
              return new Definition();
            }
            try {
              return new Definition();
            } finally {
              E.stackTraceLimit = saved;
            }
          }
        }
        return new Definition();
      }
      function $constructor(name, initializer2, proto, params) {
        const zodProto = {};
        function Internals(def) {
          this.def = def;
          this.constr = _;
          this.traits = new Set();
        }
        Internals.prototype = zodProto;
        const protoMembers = proto;
        const initialized = protoMembers && new WeakSet();
        function init(inst, def) {
          if (!inst._zod) {
            _zodDesc.value = new Internals(def);
            try {
              Object.defineProperty(inst, "_zod", _zodDesc);
            } finally {
              _zodDesc.value = void 0;
            }
          }
          if (inst._zod.traits.has(name)) {
            return;
          }
          inst._zod.traits.add(name);
          initializer2(inst, def);
          if (initialized) {
            const own2 = Object.getPrototypeOf(inst);
            const ctorProto = inst._zod.constr.prototype;
            let up = own2;
            while (up && up !== ctorProto)
              up = Object.getPrototypeOf(up);
            const target = up ?? own2;
            if (!initialized.has(target)) {
              initialized.add(target);
              members(target, protoMembers);
            }
          }
          const proto2 = _.prototype;
          for (const k in proto2) {
            if (!Object.prototype.hasOwnProperty.call(proto2, k))
              continue;
            if (!(k in inst)) {
              inst[k] = proto2[k].bind(inst);
            }
          }
        }
        const Parent = params?.Parent ?? Object;
        class Definition extends Parent {
        }
        Object.defineProperty(Definition, "name", { value: name });
        function _(def) {
          const inst = params?.Parent ? newError(Definition) : this;
          init(inst, def);
          const deferred = inst._zod.deferred;
          if (deferred) {
            for (const fn of deferred) {
              fn();
            }
            inst._zod.deferred = void 0;
          }
          const pp = globalThis.__zod_globalConfig?.postProcessor;
          if (pp)
            pp(inst);
          return inst;
        }
        Object.defineProperty(_, "init", { value: init });
        Object.defineProperty(_, Symbol.hasInstance, {
          value: (inst) => {
            if (params?.Parent && inst instanceof params.Parent)
              return true;
            return inst?._zod?.traits?.has(name);
          }
        });
        Object.defineProperty(_, "name", { value: name });
        return _;
      }
      class $ZodAsyncError extends Error {
        constructor() {
          super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
        }
      }
      class $ZodEncodeError extends Error {
        constructor(name) {
          super(`Encountered unidirectional transform during encode: ${name}`);
          this.name = "ZodEncodeError";
        }
      }
      (_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
      const globalConfig = globalThis.__zod_globalConfig;
      function config$1(newConfig) {
        if (newConfig)
          Object.assign(globalConfig, newConfig);
        return globalConfig;
      }
      function _getMessage() {
        const internals = this._zod;
        internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
        return internals.message;
      }
      function _setMessage(value) {
        this._zod.message = value;
      }
      const _messageDesc = {
        get: _getMessage,
        set: _setMessage,
        enumerable: true,
        configurable: true
      };
      const _issuesDesc = { value: void 0, enumerable: false };
      const _installedToString = new WeakSet([Object.prototype, Error.prototype]);
      const initializer$1 = (inst, def) => {
        inst.name = "$ZodError";
        _issuesDesc.value = def;
        Object.defineProperty(inst, "issues", _issuesDesc);
        _issuesDesc.value = void 0;
        Object.defineProperty(inst, "message", _messageDesc);
        const proto = Object.getPrototypeOf(inst);
        if (!_installedToString.has(proto)) {
          _installedToString.add(proto);
          Object.defineProperty(proto, "toString", {
            configurable: true,
            enumerable: false,
            get() {
              const value = () => this.message;
              Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
              return value;
            },
            set(value) {
              Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
            }
          });
        }
      };
      const $ZodError = $constructor("$ZodError", initializer$1);
      function node(obj, key, make) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) {
          if (key === "__proto__") {
            Object.defineProperty(obj, key, { value: make(), writable: true, enumerable: true, configurable: true });
          } else {
            obj[key] = make();
          }
        }
        return obj[key];
      }
      function flattenError(error2, mapper = (issue2) => issue2.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of error2.issues) {
          if (sub.path.length > 0) {
            node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
          } else {
            formErrors.push(mapper(sub));
          }
        }
        return { formErrors, fieldErrors };
      }
      function formatError(error2, mapper = (issue2) => issue2.message) {
        const fieldErrors = { _errors: [] };
        const processError = (error3, path2 = []) => {
          for (const issue2 of error3.issues) {
            if (issue2.code === "invalid_union" && issue2.errors.length) {
              issue2.errors.map((issues) => processError({ issues }, [...path2, ...issue2.path]));
            } else if (issue2.code === "invalid_key") {
              processError({ issues: issue2.issues }, [...path2, ...issue2.path]);
            } else if (issue2.code === "invalid_element") {
              processError({ issues: issue2.issues }, [...path2, ...issue2.path]);
            } else {
              const fullpath = [...path2, ...issue2.path];
              if (fullpath.length === 0) {
                fieldErrors._errors.push(mapper(issue2));
              } else {
                let curr = fieldErrors;
                let i2 = 0;
                while (i2 < fullpath.length) {
                  const el = fullpath[i2];
                  const terminal = i2 === fullpath.length - 1;
                  if (el === "_errors") {
                    if (terminal)
                      curr._errors.push(mapper(issue2));
                    i2++;
                    continue;
                  }
                  if (!Object.prototype.hasOwnProperty.call(curr, el)) {
                    Object.defineProperty(curr, el, {
                      value: { _errors: [] },
                      enumerable: true,
                      writable: true,
                      configurable: true
                    });
                  }
                  const node2 = curr[el];
                  if (terminal) {
                    node2._errors.push(mapper(issue2));
                  }
                  curr = node2;
                  i2++;
                }
              }
            }
          }
        };
        processError(error2);
        return fieldErrors;
      }
      function finalizeParams(callee, params) {
        return { callee: params?.callee ?? callee, Err: params?.Err };
      }
      const _parse = (_Err) => {
        const fn = (schema, value, _ctx, _params) => {
          const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
          const result = schema._zod.run({ value, issues: [] }, ctx);
          if (result instanceof Promise) {
            throw new $ZodAsyncError();
          }
          if (result.issues.length) {
            const e2 = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config$1())));
            captureStackTrace(e2, _params?.callee ?? fn);
            throw e2;
          }
          return result.value;
        };
        return fn;
      };
      const _parseAsync = (_Err) => {
        const fn = async (schema, value, _ctx, params) => {
          const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
          let result = schema._zod.run({ value, issues: [] }, ctx);
          if (result instanceof Promise)
            result = await result;
          if (result.issues.length) {
            const e2 = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config$1())));
            captureStackTrace(e2, params?.callee ?? fn);
            throw e2;
          }
          return result.value;
        };
        return fn;
      };
      const _safeParse = (_Err) => (schema, value, _ctx) => {
        const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
        const result = schema._zod.run({ value, issues: [] }, ctx);
        if (result instanceof Promise) {
          throw new $ZodAsyncError();
        }
        return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
      };
      function failure(Err, issues, ctx) {
        let error2;
        return {
          success: false,
          get error() {
            if (!error2) {
              error2 = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config$1())));
              issues = void 0;
              ctx = void 0;
            }
            return error2;
          },
          set error(e2) {
            error2 = e2;
            issues = void 0;
            ctx = void 0;
          }
        };
      }
      const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
        const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
        let result = schema._zod.run({ value, issues: [] }, ctx);
        if (result instanceof Promise)
          result = await result;
        return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
      };
      const COMPILE_INVALID = Symbol.for("zod.compile.invalid");
      const COMPILE_FALLBACK = Symbol.for("zod.compile.fallback");
      const validate = ((schema, value, _ctx) => {
        const validator = schema._zod.bag.validator;
        if (validator !== void 0) {
          if (validator(value) !== COMPILE_INVALID)
            return true;
          if (validator.definite === true && _ctx === void 0)
            return false;
        }
        return validateFallback(schema, value, _ctx);
      });
      function validateFallback(schema, value, _ctx) {
        const ctx = _ctx ? { ..._ctx, async: false, abortEarly: true } : { async: false, abortEarly: true };
        const fallbackRun = schema._zod.bag.fallbackRun;
        let result;
        if (fallbackRun) {
          ctx[COMPILE_FALLBACK] = true;
          result = fallbackRun({ value, issues: [] }, ctx);
        } else {
          result = schema._zod.run({ value, issues: [] }, ctx);
        }
        if (result instanceof Promise) {
          throw new $ZodAsyncError();
        }
        return result.issues.length === 0;
      }
      const validateAsync$1 = async (schema, value, _ctx) => {
        const ctx = _ctx ? { ..._ctx, async: true, abortEarly: true } : { async: true, abortEarly: true };
        let result = schema._zod.run({ value, issues: [] }, ctx);
        if (result instanceof Promise)
          result = await result;
        return result.issues.length === 0;
      };
      const _encode = (_Err) => {
        const parse2 = _parse(_Err);
        const fn = (schema, value, _ctx, _params) => {
          const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
          return parse2(schema, value, ctx, finalizeParams(fn, _params));
        };
        return fn;
      };
      const _decode = (_Err) => {
        const parse2 = _parse(_Err);
        const fn = (schema, value, _ctx, _params) => {
          return parse2(schema, value, _ctx, finalizeParams(fn, _params));
        };
        return fn;
      };
      const _encodeAsync = (_Err) => {
        const parseAsync2 = _parseAsync(_Err);
        const fn = async (schema, value, _ctx, _params) => {
          const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
          return await parseAsync2(schema, value, ctx, finalizeParams(fn, _params));
        };
        return fn;
      };
      const _decodeAsync = (_Err) => {
        const parseAsync2 = _parseAsync(_Err);
        const fn = async (schema, value, _ctx, _params) => {
          return await parseAsync2(schema, value, _ctx, finalizeParams(fn, _params));
        };
        return fn;
      };
      const _safeEncode = (_Err) => (schema, value, _ctx) => {
        const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
        return _safeParse(_Err)(schema, value, ctx);
      };
      const _safeDecode = (_Err) => (schema, value, _ctx) => {
        return _safeParse(_Err)(schema, value, _ctx);
      };
      const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
        const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
        return _safeParseAsync(_Err)(schema, value, ctx);
      };
      const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
        return _safeParseAsync(_Err)(schema, value, _ctx);
      };
      const cuid = /^[cC][0-9a-z]{6,}$/;
      const cuid2 = /^[0-9a-z]+$/;
      const ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
      const xid = /^[0-9a-vA-V]{20}$/;
      const ksuid = /^[A-Za-z0-9]{27}$/;
      const nanoid = /^[a-zA-Z0-9_-]{21}$/;
      function nanoidOfLength(length) {
        return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
      }
      const duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
      const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
      const uuid = (version2) => {
        if (!version2)
          return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
        return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
      };
      const email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
      const _emoji$1 = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
      function emoji() {
        return new RegExp(_emoji$1, "u");
      }
      const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
      const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
      const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
      const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
      const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
      const base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
      const httpProtocol = /^https?$/;
      const e164 = /^\+[1-9]\d{6,14}$/;
      const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
      function anchor(source) {
        return new RegExp(`^${source}$`);
      }
      const date = anchor(dateSource);
      function timeSource(args) {
        const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
        const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
        return regex;
      }
      function time(args) {
        return new RegExp(`^${timeSource(args)}$`);
      }
      function datetime(args) {
        const opts = ["Z"];
        if (args.offset)
          opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
        const qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`;
        const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
        return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
      }
      const anyString = /^[\s\S]{0,}$/;
      const integer = /^-?\d+$/;
      const number$1 = /^-?\d+(?:\.\d+)?$/;
      const boolean$1 = /^(?:true|false)$/i;
      const lowercase = /^[^A-Z]*$/;
      const uppercase = /^[^a-z]*$/;
      const $ZodCheck = $constructor("$ZodCheck", (inst, def) => {
        var _a2;
        inst._zod ?? (inst._zod = {});
        inst._zod.def = def;
        (_a2 = inst._zod).onattach ?? (_a2.onattach = []);
      });
      const _whenHasLength = (payload) => {
        const val = payload.value;
        return !nullish(val) && val.length !== void 0;
      };
      const numericOriginMap = {
        number: "number",
        bigint: "bigint",
        object: "date"
      };
      const $ZodCheckLessThan = $constructor("$ZodCheckLessThan", (inst, def) => {
        $ZodCheck.init(inst, def);
        const origin2 = numericOriginMap[typeof def.value];
        inst._zod.check = (payload) => {
          if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
            return;
          }
          payload.issues.push({
            origin: numericOriginMap[typeof payload.value] ?? origin2,
            code: "too_big",
            maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
            input: payload.value,
            inclusive: def.inclusive,
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodCheckGreaterThan = $constructor("$ZodCheckGreaterThan", (inst, def) => {
        $ZodCheck.init(inst, def);
        const origin2 = numericOriginMap[typeof def.value];
        inst._zod.check = (payload) => {
          if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
            return;
          }
          payload.issues.push({
            origin: numericOriginMap[typeof payload.value] ?? origin2,
            code: "too_small",
            minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
            input: payload.value,
            inclusive: def.inclusive,
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodCheckMultipleOf = $constructor("$ZodCheckMultipleOf", (inst, def) => {
        $ZodCheck.init(inst, def);
        inst._zod.check = (payload) => {
          if (typeof payload.value !== typeof def.value)
            throw new Error("Cannot mix number and bigint in multiple_of check.");
          const isMultiple = typeof payload.value === "bigint" ? (
def.value !== BigInt(0) && payload.value % def.value === BigInt(0)
          ) : floatSafeRemainder(payload.value, def.value) === 0;
          if (isMultiple)
            return;
          payload.issues.push({
            origin: typeof payload.value,
            code: "not_multiple_of",
            divisor: def.value,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodCheckNumberFormat = $constructor("$ZodCheckNumberFormat", (inst, def) => {
        $ZodCheck.init(inst, def);
        def.format = def.format || "float64";
        const isInt = def.format?.includes("int");
        const origin2 = isInt ? "int" : "number";
        const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
        inst._zod.check = (payload) => {
          const input = payload.value;
          if (isInt) {
            if (!Number.isInteger(input)) {
              payload.issues.push({
                expected: origin2,
                format: def.format,
                code: "invalid_type",
                continue: false,
                input,
                inst
              });
              return;
            }
            if (!Number.isSafeInteger(input)) {
              if (input > 0) {
                payload.issues.push({
                  input,
                  code: "too_big",
                  maximum: Number.MAX_SAFE_INTEGER,
                  note: "Integers must be within the safe integer range.",
                  inst,
                  origin: origin2,
                  inclusive: true,
                  continue: !def.abort
                });
              } else {
                payload.issues.push({
                  input,
                  code: "too_small",
                  minimum: Number.MIN_SAFE_INTEGER,
                  note: "Integers must be within the safe integer range.",
                  inst,
                  origin: origin2,
                  inclusive: true,
                  continue: !def.abort
                });
              }
              return;
            }
          }
          if (input < minimum) {
            payload.issues.push({
              origin: "number",
              input,
              code: "too_small",
              minimum,
              inclusive: true,
              inst,
              continue: !def.abort
            });
          }
          if (input > maximum) {
            payload.issues.push({
              origin: "number",
              input,
              code: "too_big",
              maximum,
              inclusive: true,
              inst,
              continue: !def.abort
            });
          }
        };
      });
      const $ZodCheckMaxLength = $constructor("$ZodCheckMaxLength", (inst, def) => {
        var _a2;
        $ZodCheck.init(inst, def);
        (_a2 = inst._zod.def).when ?? (_a2.when = _whenHasLength);
        inst._zod.check = (payload) => {
          const input = payload.value;
          const units = input.length;
          const length = typeof input === "string" && units > def.maximum ? codePointLength(input) : units;
          if (length <= def.maximum)
            return;
          const origin2 = getLengthableOrigin(input);
          payload.issues.push({
            origin: origin2,
            code: "too_big",
            maximum: def.maximum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodCheckMinLength = $constructor("$ZodCheckMinLength", (inst, def) => {
        var _a2;
        $ZodCheck.init(inst, def);
        (_a2 = inst._zod.def).when ?? (_a2.when = _whenHasLength);
        inst._zod.check = (payload) => {
          const input = payload.value;
          const units = input.length;
          const length = typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units;
          if (length >= def.minimum)
            return;
          const origin2 = getLengthableOrigin(input);
          payload.issues.push({
            origin: origin2,
            code: "too_small",
            minimum: def.minimum,
            inclusive: true,
            input,
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodCheckLengthEquals = $constructor("$ZodCheckLengthEquals", (inst, def) => {
        var _a2;
        $ZodCheck.init(inst, def);
        (_a2 = inst._zod.def).when ?? (_a2.when = _whenHasLength);
        inst._zod.check = (payload) => {
          const input = payload.value;
          const units = input.length;
          const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
          if (length === def.length)
            return;
          const origin2 = getLengthableOrigin(input);
          const tooBig = length > def.length;
          payload.issues.push({
            origin: origin2,
            ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
            inclusive: true,
            exact: true,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodCheckStringFormat = $constructor("$ZodCheckStringFormat", (inst, def) => {
        var _a2, _b;
        $ZodCheck.init(inst, def);
        if (def.pattern)
          (_a2 = inst._zod).check ?? (_a2.check = (payload) => {
            def.pattern.lastIndex = 0;
            if (def.pattern.test(payload.value))
              return;
            payload.issues.push({
              origin: "string",
              code: "invalid_format",
              format: def.format,
              input: payload.value,
              ...def.pattern ? { pattern: def.pattern.toString() } : {},
              inst,
              continue: !def.abort
            });
          });
        else
          (_b = inst._zod).check ?? (_b.check = () => {
          });
      });
      const $ZodCheckRegex = $constructor("$ZodCheckRegex", (inst, def) => {
        $ZodCheckStringFormat.init(inst, def);
        inst._zod.check = (payload) => {
          def.pattern.lastIndex = 0;
          if (def.pattern.test(payload.value))
            return;
          payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "regex",
            input: payload.value,
            pattern: def.pattern.toString(),
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodCheckLowerCase = $constructor("$ZodCheckLowerCase", (inst, def) => {
        def.pattern ?? (def.pattern = lowercase);
        $ZodCheckStringFormat.init(inst, def);
      });
      const $ZodCheckUpperCase = $constructor("$ZodCheckUpperCase", (inst, def) => {
        def.pattern ?? (def.pattern = uppercase);
        $ZodCheckStringFormat.init(inst, def);
      });
      const $ZodCheckIncludes = $constructor("$ZodCheckIncludes", (inst, def) => {
        $ZodCheck.init(inst, def);
        const escapedRegex = escapeRegex(def.includes);
        const pattern2 = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
        def.pattern = pattern2;
        inst._zod.check = (payload) => {
          if (payload.value.includes(def.includes, def.position))
            return;
          payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "includes",
            includes: def.includes,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodCheckStartsWith = $constructor("$ZodCheckStartsWith", (inst, def) => {
        $ZodCheck.init(inst, def);
        const pattern2 = new RegExp(`^${escapeRegex(def.prefix)}.*`);
        def.pattern ?? (def.pattern = pattern2);
        inst._zod.check = (payload) => {
          if (payload.value.startsWith(def.prefix))
            return;
          payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "starts_with",
            prefix: def.prefix,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodCheckEndsWith = $constructor("$ZodCheckEndsWith", (inst, def) => {
        $ZodCheck.init(inst, def);
        const pattern2 = new RegExp(`.*${escapeRegex(def.suffix)}$`);
        def.pattern ?? (def.pattern = pattern2);
        inst._zod.check = (payload) => {
          if (payload.value.endsWith(def.suffix))
            return;
          payload.issues.push({
            origin: "string",
            code: "invalid_format",
            format: "ends_with",
            suffix: def.suffix,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodCheckOverwrite = $constructor("$ZodCheckOverwrite", (inst, def) => {
        $ZodCheck.init(inst, def);
        inst._zod.check = (payload) => {
          payload.value = def.tx(payload.value);
        };
      });
      class Doc {
        constructor(args = [], closed = {}) {
          this.content = [];
          this.indent = 0;
          this.args = args;
          this.closed = closed;
        }
indented(fn) {
          this.indent += 1;
          try {
            fn(this);
          } finally {
            this.indent -= 1;
          }
        }
        write(arg) {
          if (typeof arg === "function") {
            arg(this, { execution: "sync" });
            arg(this, { execution: "async" });
            return;
          }
          const content = arg;
          const lines = content.split("\n").filter((x) => x);
          const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
          const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
          for (const line of dedented) {
            this.content.push(line);
          }
        }
        compile() {
          const F = Function;
          const content = this?.content ?? [``];
          const factory = new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {
${content.join("\n")}
};`);
          return factory(...Object.values(this.closed));
        }
      }
      const version = {
        major: 4,
        minor: 6,
        patch: 2
      };
      const $ZodType = $constructor("$ZodType", (inst, def) => {
        var _a2;
        inst ?? (inst = {});
        inst._zod.def = def;
        inst._zod.bag = inst._zod.bag || {};
        inst._zod.version = version;
        const defChecks = inst._zod.def.checks;
        const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
        for (const ch of checks) {
          for (const fn of ch._zod.onattach) {
            fn(inst);
          }
        }
        if (checks.length === 0) {
          (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
          inst._zod.deferred?.push(() => {
            inst._zod.run = inst._zod.parse;
          });
        } else {
          const runChecks = (payload, checks2, ctx) => {
            if (payload.memo)
              return payload;
            let isAborted = aborted(payload);
            let asyncResult;
            for (const ch of checks2) {
              if (ch._zod.def.when) {
                if (explicitlyAborted(payload))
                  continue;
                const shouldRun = ch._zod.def.when(payload);
                if (!shouldRun)
                  continue;
              } else if (isAborted) {
                continue;
              }
              const currLen = payload.issues.length;
              const _ = ch._zod.check(payload);
              if (_ instanceof Promise && ctx?.async === false) {
                throw new $ZodAsyncError();
              }
              if (asyncResult || _ instanceof Promise) {
                asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
                  await _;
                  const nextLen = payload.issues.length;
                  if (nextLen === currLen)
                    return;
                  attachSchema(payload.issues, currLen, inst);
                  if (!isAborted)
                    isAborted = aborted(payload, currLen);
                });
              } else {
                const nextLen = payload.issues.length;
                if (nextLen === currLen)
                  continue;
                attachSchema(payload.issues, currLen, inst);
                if (!isAborted)
                  isAborted = aborted(payload, currLen);
              }
            }
            if (asyncResult) {
              return asyncResult.then(() => {
                return payload;
              });
            }
            return payload;
          };
          const handleCanaryResult = (canary, payload, ctx) => {
            if (aborted(canary)) {
              canary.aborted = true;
              return canary;
            }
            const checkResult = runChecks(payload, checks, ctx);
            if (checkResult instanceof Promise) {
              if (ctx.async === false)
                throw new $ZodAsyncError();
              return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
            }
            return inst._zod.parse(checkResult, ctx);
          };
          inst._zod.run = (payload, ctx) => {
            if (ctx.skipChecks) {
              return inst._zod.parse(payload, ctx);
            }
            if (ctx.direction === "backward") {
              const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
              if (canary instanceof Promise) {
                return canary.then((canary2) => {
                  return handleCanaryResult(canary2, payload, ctx);
                });
              }
              return handleCanaryResult(canary, payload, ctx);
            }
            const result = inst._zod.parse(payload, ctx);
            if (result instanceof Promise) {
              if (ctx.async === false)
                throw new $ZodAsyncError();
              return result.then((result2) => runChecks(result2, checks, ctx));
            }
            return runChecks(result, checks, ctx);
          };
        }
      }, {
get "~standard"() {
          return hide(this, "~standard", standardProps(this));
        },
        set "~standard"(value) {
          own(this, "~standard", value);
        }
      });
      const toStandardResult = (r2, ctx) => r2.issues.length ? { issues: r2.issues.map((iss) => finalizeIssue(iss, ctx, config$1())) } : { value: r2.value };
      async function validateAsync(inst, value) {
        const ctx = { async: true };
        return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
      }
      function standardProps(inst) {
        return {
          validate: (value) => {
            const ctx = { async: false };
            try {
              const r2 = inst._zod.run({ value, issues: [] }, ctx);
              if (!(r2 instanceof Promise))
                return toStandardResult(r2, ctx);
            } catch (_) {
            }
            return validateAsync(inst, value);
          },
          vendor: "zod",
          version: 1
        };
      }
      const $ZodString = $constructor("$ZodString", (inst, def) => {
        $ZodType.init(inst, def);
        inst._zod.pattern = def.pattern ?? anyString;
        inst._zod.parse = (payload, _) => {
          if (def.coerce)
            try {
              payload.value = String(payload.value);
            } catch (_2) {
            }
          if (typeof payload.value === "string")
            return payload;
          payload.issues.push({
            expected: "string",
            code: "invalid_type",
            input: payload.value,
            inst
          });
          return payload;
        };
      });
      const $ZodStringFormat = $constructor("$ZodStringFormat", (inst, def) => {
        $ZodCheckStringFormat.init(inst, def);
        $ZodString.init(inst, def);
      });
      const $ZodGUID = $constructor("$ZodGUID", (inst, def) => {
        def.pattern ?? (def.pattern = guid);
        $ZodStringFormat.init(inst, def);
      });
      const $ZodUUID = $constructor("$ZodUUID", (inst, def) => {
        if (def.version) {
          const versionMap = {
            v1: 1,
            v2: 2,
            v3: 3,
            v4: 4,
            v5: 5,
            v6: 6,
            v7: 7,
            v8: 8
          };
          const v2 = versionMap[def.version];
          if (v2 === void 0)
            throw new Error(`Invalid UUID version: "${def.version}"`);
          def.pattern ?? (def.pattern = uuid(v2));
        } else
          def.pattern ?? (def.pattern = uuid());
        $ZodStringFormat.init(inst, def);
      });
      const $ZodEmail = $constructor("$ZodEmail", (inst, def) => {
        def.pattern ?? (def.pattern = email);
        $ZodStringFormat.init(inst, def);
      });
      const URL_BAD_FORMAT = 1;
      const URL_UNPARSEABLE = 2;
      function parseURLObject(trimmed, def) {
        if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) {
          return URL_BAD_FORMAT;
        }
        try {
          return new URL(trimmed);
        } catch {
          return URL_UNPARSEABLE;
        }
      }
      const asciiTabOrNewline = /[\t\n\r]/g;
      function stripTabAndNewline(value) {
        return value.replace(asciiTabOrNewline, "");
      }
      function urlHostnameOk(url2, hostname) {
        hostname.lastIndex = 0;
        return hostname.test(url2.hostname);
      }
      function urlProtocolOk(url2, protocol) {
        protocol.lastIndex = 0;
        return protocol.test(url2.protocol.endsWith(":") ? url2.protocol.slice(0, -1) : url2.protocol);
      }
      const $ZodURL = $constructor("$ZodURL", (inst, def) => {
        $ZodStringFormat.init(inst, def);
        inst._zod.check = (payload) => {
          try {
            const trimmed = payload.value.trim();
            const url2 = parseURLObject(trimmed, def);
            if (url2 === URL_BAD_FORMAT) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid URL format",
                input: payload.value,
                inst,
                continue: !def.abort
              });
              return;
            }
            if (url2 === URL_UNPARSEABLE) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                input: payload.value,
                inst,
                continue: !def.abort
              });
              return;
            }
            if (def.hostname && !urlHostnameOk(url2, def.hostname)) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid hostname",
                pattern: def.hostname.source,
                input: payload.value,
                inst,
                continue: !def.abort
              });
            }
            if (def.protocol && !urlProtocolOk(url2, def.protocol)) {
              payload.issues.push({
                code: "invalid_format",
                format: "url",
                note: "Invalid protocol",
                pattern: def.protocol.source,
                input: payload.value,
                inst,
                continue: !def.abort
              });
            }
            payload.value = def.normalize ? url2.href : stripTabAndNewline(trimmed);
            return;
          } catch (_) {
            payload.issues.push({
              code: "invalid_format",
              format: "url",
              input: payload.value,
              inst,
              continue: !def.abort
            });
          }
        };
      });
      const $ZodEmoji = $constructor("$ZodEmoji", (inst, def) => {
        def.pattern ?? (def.pattern = emoji());
        $ZodStringFormat.init(inst, def);
      });
      const $ZodNanoID = $constructor("$ZodNanoID", (inst, def) => {
        if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1))
          throw new Error(`Invalid nanoid length: ${def.length}`);
        def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
        $ZodStringFormat.init(inst, def);
      });
      const $ZodCUID = $constructor("$ZodCUID", (inst, def) => {
        def.pattern ?? (def.pattern = cuid);
        $ZodStringFormat.init(inst, def);
      });
      const $ZodCUID2 = $constructor("$ZodCUID2", (inst, def) => {
        def.pattern ?? (def.pattern = cuid2);
        $ZodStringFormat.init(inst, def);
      });
      const $ZodULID = $constructor("$ZodULID", (inst, def) => {
        def.pattern ?? (def.pattern = ulid);
        $ZodStringFormat.init(inst, def);
      });
      const $ZodXID = $constructor("$ZodXID", (inst, def) => {
        def.pattern ?? (def.pattern = xid);
        $ZodStringFormat.init(inst, def);
      });
      const $ZodKSUID = $constructor("$ZodKSUID", (inst, def) => {
        def.pattern ?? (def.pattern = ksuid);
        $ZodStringFormat.init(inst, def);
      });
      const $ZodISODateTime = $constructor("$ZodISODateTime", (inst, def) => {
        def.pattern ?? (def.pattern = datetime(def));
        $ZodStringFormat.init(inst, def);
      });
      const $ZodISODate = $constructor("$ZodISODate", (inst, def) => {
        def.pattern ?? (def.pattern = date);
        $ZodStringFormat.init(inst, def);
      });
      const $ZodISOTime = $constructor("$ZodISOTime", (inst, def) => {
        def.pattern ?? (def.pattern = time(def));
        $ZodStringFormat.init(inst, def);
      });
      const $ZodISODuration = $constructor("$ZodISODuration", (inst, def) => {
        def.pattern ?? (def.pattern = duration);
        $ZodStringFormat.init(inst, def);
      });
      const $ZodIPv4 = $constructor("$ZodIPv4", (inst, def) => {
        def.pattern ?? (def.pattern = ipv4);
        $ZodStringFormat.init(inst, def);
      });
      const ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
      function isValidIPv6(value) {
        if (!ipv6Alphabet.test(value))
          return false;
        try {
          new URL(`http://[${value}]`);
          return true;
        } catch {
          return false;
        }
      }
      const $ZodIPv6 = $constructor("$ZodIPv6", (inst, def) => {
        def.pattern ?? (def.pattern = ipv6);
        $ZodStringFormat.init(inst, def);
        inst._zod.check = (payload) => {
          if (!isValidIPv6(payload.value)) {
            payload.issues.push({
              code: "invalid_format",
              format: "ipv6",
              input: payload.value,
              inst,
              continue: !def.abort
            });
          }
        };
      });
      const $ZodCIDRv4 = $constructor("$ZodCIDRv4", (inst, def) => {
        def.pattern ?? (def.pattern = cidrv4);
        $ZodStringFormat.init(inst, def);
      });
      function isValidCIDRv6(value) {
        const parts = value.split("/");
        if (parts.length !== 2)
          return false;
        const [address, prefix] = parts;
        if (!prefix)
          return false;
        const prefixNum = Number(prefix);
        if (`${prefixNum}` !== prefix)
          return false;
        if (prefixNum < 0 || prefixNum > 128)
          return false;
        return isValidIPv6(address);
      }
      const $ZodCIDRv6 = $constructor("$ZodCIDRv6", (inst, def) => {
        def.pattern ?? (def.pattern = cidrv6);
        $ZodStringFormat.init(inst, def);
        inst._zod.check = (payload) => {
          if (!isValidCIDRv6(payload.value)) {
            payload.issues.push({
              code: "invalid_format",
              format: "cidrv6",
              input: payload.value,
              inst,
              continue: !def.abort
            });
          }
        };
      });
      function isValidBase64(data) {
        if (data === "")
          return true;
        if (/\s/.test(data))
          return false;
        if (data.length % 4 !== 0)
          return false;
        try {
          atob(data);
          return true;
        } catch {
          return false;
        }
      }
      const base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
      const $ZodBase64 = $constructor("$ZodBase64", (inst, def) => {
        def.pattern ?? (def.pattern = base64Charset);
        $ZodStringFormat.init(inst, def);
        inst._zod.check = (payload) => {
          if (isValidBase64(payload.value))
            return;
          payload.issues.push({
            code: "invalid_format",
            format: "base64",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        };
      });
      const base64urlCharset = /^[A-Za-z0-9_-]*$/;
      function isValidBase64URL(data) {
        if (!base64urlCharset.test(data))
          return false;
        const base642 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
        const padded = base642.padEnd(Math.ceil(base642.length / 4) * 4, "=");
        return isValidBase64(padded);
      }
      const $ZodBase64URL = $constructor("$ZodBase64URL", (inst, def) => {
        def.pattern ?? (def.pattern = base64urlCharset);
        $ZodStringFormat.init(inst, def);
        inst._zod.check = (payload) => {
          if (isValidBase64URL(payload.value))
            return;
          payload.issues.push({
            code: "invalid_format",
            format: "base64url",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodE164 = $constructor("$ZodE164", (inst, def) => {
        def.pattern ?? (def.pattern = e164);
        $ZodStringFormat.init(inst, def);
      });
      function isValidJWT(token, algorithm = null) {
        try {
          const tokensParts = token.split(".");
          if (tokensParts.length !== 3)
            return false;
          const [header] = tokensParts;
          if (!header)
            return false;
          const parsedHeader = JSON.parse(atob(header));
          if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
            return false;
          if (!parsedHeader.alg)
            return false;
          if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
            return false;
          return true;
        } catch {
          return false;
        }
      }
      const $ZodJWT = $constructor("$ZodJWT", (inst, def) => {
        $ZodStringFormat.init(inst, def);
        inst._zod.check = (payload) => {
          if (isValidJWT(payload.value, def.alg))
            return;
          payload.issues.push({
            code: "invalid_format",
            format: "jwt",
            input: payload.value,
            inst,
            continue: !def.abort
          });
        };
      });
      const $ZodNumber = $constructor("$ZodNumber", (inst, def) => {
        $ZodType.init(inst, def);
        inst._zod.pattern = number$1;
        inst._zod.parse = (payload, _ctx) => {
          if (def.coerce)
            try {
              payload.value = Number(payload.value);
            } catch (_) {
            }
          const input = payload.value;
          if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
            return payload;
          }
          const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
          payload.issues.push({
            expected: "number",
            code: "invalid_type",
            input,
            inst,
            ...received ? { received } : {}
          });
          return payload;
        };
      });
      const $ZodNumberFormat = $constructor("$ZodNumberFormat", (inst, def) => {
        $ZodCheckNumberFormat.init(inst, def);
        $ZodNumber.init(inst, def);
      });
      const $ZodBoolean = $constructor("$ZodBoolean", (inst, def) => {
        $ZodType.init(inst, def);
        inst._zod.pattern = boolean$1;
        inst._zod.parse = (payload, _ctx) => {
          if (def.coerce)
            try {
              payload.value = Boolean(payload.value);
            } catch (_) {
            }
          const input = payload.value;
          if (typeof input === "boolean")
            return payload;
          payload.issues.push({
            expected: "boolean",
            code: "invalid_type",
            input,
            inst
          });
          return payload;
        };
      });
      const $ZodUnknown = $constructor("$ZodUnknown", (inst, def) => {
        $ZodType.init(inst, def);
        inst._zod.parse = (payload) => payload;
      });
      const $ZodNever = $constructor("$ZodNever", (inst, def) => {
        $ZodType.init(inst, def);
        inst._zod.parse = (payload, _ctx) => {
          payload.issues.push({
            expected: "never",
            code: "invalid_type",
            input: payload.value,
            inst
          });
          return payload;
        };
      });
      function handleArrayResult(result, final, index) {
        if (result.issues.length) {
          final.issues.push(...prefixIssues(index, result.issues));
        }
        final.value[index] = result.value;
      }
      const $ZodArray = $constructor("$ZodArray", (inst, def) => {
        $ZodType.init(inst, def);
        const memo2 = globalConfig.memoizer;
        memo2?.attach(inst);
        inst._zod.parse = (payload, ctx) => {
          const input = payload.value;
          if (!Array.isArray(input)) {
            payload.issues.push({
              expected: "array",
              code: "invalid_type",
              input,
              inst
            });
            return payload;
          }
          payload.value = memo2 ? memo2.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
          const proms = [];
          const abortEarly = ctx?.abortEarly;
          for (let i2 = 0; i2 < input.length; i2++) {
            const item = input[i2];
            const result = def.element._zod.run({
              value: item,
              issues: []
            }, ctx);
            if (result instanceof Promise) {
              proms.push(result.then((result2) => handleArrayResult(result2, payload, i2)));
            } else {
              handleArrayResult(result, payload, i2);
              if (abortEarly && result.issues.length !== 0 && aborted(result))
                break;
            }
          }
          if (proms.length) {
            return Promise.all(proms).then(() => payload);
          }
          return payload;
        };
      });
      function handlePropertyResult(result, final, key, input, optin, optout) {
        const isPresent = key in input;
        const isOptionalOut = optout === "optional";
        if (!isPresent && isOptionalOut && optin === "optional") {
          return;
        }
        if (result.issues.length) {
          if (optin !== void 0 && isOptionalOut && !isPresent) {
            return;
          }
          final.issues.push(...prefixIssues(key, result.issues));
        }
        if (!isPresent && optin === void 0) {
          if (!result.issues.length) {
            final.issues.push({
              code: "invalid_type",
              expected: "nonoptional",
              input: void 0,
              path: [key]
            });
          }
          return;
        }
        if (result.value === void 0) {
          if (isPresent || optin === "defaulted" && !isOptionalOut) {
            final.value[key] = void 0;
          }
        } else {
          final.value[key] = result.value;
        }
      }
      const NO_SYMBOL_KEYS = [];
      function normalizeDef(def) {
        const keys = Object.keys(def.shape);
        const ownSymbols = Object.getOwnPropertySymbols(def.shape);
        const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
        const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
        for (const k of allKeys) {
          if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
            throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
          }
        }
        const okeys = optionalKeys(def.shape);
        return {
          ...def,
          allKeys,
          symbolKeys,
keySet: new Set(keys),
          numKeys: keys.length,
          optionalKeys: new Set(okeys)
        };
      }
      function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
        const unrecognized = [];
        const keySet = def.keySet;
        const _catchall = def.catchall._zod;
        const t2 = _catchall.def.type;
        const optin = _catchall.optin;
        const optout = _catchall.optout;
        let seen2 = 0;
        for (const key in input) {
          if (abortEarly && payload.issues.length !== seen2) {
            if (aborted(payload, seen2))
              break;
            seen2 = payload.issues.length;
          }
          if (keySet.has(key))
            continue;
          if (key === "__proto__") {
            if (t2 === "never")
              unrecognized.push(key);
            continue;
          }
          if (t2 === "never") {
            unrecognized.push(key);
            continue;
          }
          const r2 = _catchall.run({ value: input[key], issues: [] }, ctx);
          if (r2 instanceof Promise) {
            proms.push(r2.then((r3) => handlePropertyResult(r3, payload, key, input, optin, optout)));
          } else {
            handlePropertyResult(r2, payload, key, input, optin, optout);
          }
        }
        if (unrecognized.length) {
          payload.issues.push({
            code: "unrecognized_keys",
            keys: unrecognized,
            input,
            inst,
continue: true
          });
        }
        if (!proms.length)
          return payload;
        return Promise.all(proms).then(() => {
          return payload;
        });
      }
      const $ZodObject = $constructor("$ZodObject", (inst, def) => {
        $ZodType.init(inst, def);
        const desc = Object.getOwnPropertyDescriptor(def, "shape");
        const sh = desc?.get ? desc.get.raw : def.shape ?? {};
        if (sh) {
          const get = () => {
            const newSh = { ...sh };
            Object.defineProperty(def, "shape", { value: newSh });
            get.raw = newSh;
            return newSh;
          };
          get.raw = sh;
          Object.defineProperty(def, "shape", { get });
        }
        const _normalized = cached(() => normalizeDef(def));
        defineLazyInternal(inst, "propValues", (zod) => {
          const shape = zod.def.shape;
          const propValues = {};
          for (const key in shape) {
            const field2 = shape[key]._zod;
            if (field2.values) {
              if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
                assignProp(propValues, key, new Set());
              }
              for (const v2 of field2.values)
                propValues[key].add(v2);
              if (field2.optin !== void 0)
                propValues[key].add(void 0);
            }
          }
          return propValues;
        });
        const isObject$1 = isObject;
        const catchall = def.catchall;
        let value;
        const memo2 = globalConfig.memoizer;
        memo2?.attach(inst);
        inst._zod.parse = (payload, ctx) => {
          value ?? (value = _normalized.value);
          const input = payload.value;
          if (!isObject$1(input)) {
            payload.issues.push({
              expected: "object",
              code: "invalid_type",
              input,
              inst
            });
            return payload;
          }
          payload.value = memo2 ? memo2.alloc(inst, payload, {}, ctx) : {};
          const proms = [];
          const shape = value.shape;
          const abortEarly = ctx?.abortEarly;
          let seen2 = payload.issues.length;
          for (const key of value.allKeys) {
            if (abortEarly && payload.issues.length !== seen2) {
              if (aborted(payload, seen2))
                break;
              seen2 = payload.issues.length;
            }
            if (key === "__proto__")
              continue;
            const el = shape[key];
            const optin = el._zod.optin;
            const optout = el._zod.optout;
            const r2 = el._zod.run({ value: input[key], issues: [] }, ctx);
            if (r2 instanceof Promise) {
              proms.push(r2.then((r3) => handlePropertyResult(r3, payload, key, input, optin, optout)));
            } else {
              handlePropertyResult(r2, payload, key, input, optin, optout);
            }
          }
          if (!catchall) {
            return proms.length ? Promise.all(proms).then(() => payload) : payload;
          }
          return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
        };
      });
      const $ZodObjectJIT = $constructor("$ZodObjectJIT", (inst, def) => {
        $ZodObject.init(inst, def);
        const superParse = inst._zod.parse;
        const _normalized = cached(() => normalizeDef(def));
        const memo2 = globalConfig.memoizer;
        const generateFastpass = (shape) => {
          const normalized = _normalized.value;
          const syms = normalized.symbolKeys;
          const doc = new Doc(["payload", "ctx"], { shape, inst, memo: memo2, syms });
          const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
          const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
          doc.write(`const input = payload.value;`);
          const ids = Object.create(null);
          let counter = 0;
          for (const key of normalized.allKeys) {
            ids[key] = `key_${counter++}`;
          }
          doc.write(memo2 ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
          for (const key of normalized.allKeys) {
            if (key === "__proto__")
              continue;
            const id = ids[key];
            const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
            const isPresent = `${k} in input`;
            const schema = shape[key];
            const optin = schema?._zod?.optin;
            const isOptionalIn = optin !== void 0;
            const isOptionalOut = schema?._zod?.optout === "optional";
            doc.write(`const ${id} = ${parseStr(k)};`);
            if (isOptionalIn && isOptionalOut) {
              const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
              doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
            } else if (!isOptionalIn) {
              doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
            } else {
              doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
              if (optin === "defaulted") {
                doc.write(`newResult[${k}] = ${id}.value;`);
              } else {
                doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
              }
            }
          }
          doc.write(`payload.value = newResult;`);
          doc.write(`return payload;`);
          return doc.compile();
        };
        let fastpass;
        const isObject$1 = isObject;
        const jit = !globalConfig.jitless;
        const allowsEval$1 = allowsEval;
        const fastEnabled = jit && allowsEval$1.value;
        const catchall = def.catchall;
        let value;
        inst._zod.parse = (payload, ctx) => {
          value ?? (value = _normalized.value);
          const input = payload.value;
          if (!isObject$1(input)) {
            payload.issues.push({
              expected: "object",
              code: "invalid_type",
              input,
              inst
            });
            return payload;
          }
          if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
            if (!fastpass)
              fastpass = generateFastpass(def.shape);
            payload = fastpass(payload, ctx);
            if (!catchall)
              return payload;
            return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
          }
          return superParse(payload, ctx);
        };
      });
      function handleUnionResults(results, final, inst, ctx) {
        for (const result of results) {
          if (result.issues.length === 0) {
            final.value = result.value;
            return final;
          }
        }
        const nonaborted = results.filter((r2) => !aborted(r2));
        if (nonaborted.length === 1) {
          final.value = nonaborted[0].value;
          return nonaborted[0];
        }
        final.issues.push({
          code: "invalid_union",
          input: final.value,
          inst,
          errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config$1())))
        });
        return final;
      }
      const $ZodUnion = $constructor("$ZodUnion", (inst, def) => {
        $ZodType.init(inst, def);
        defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o2) => o2._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o2) => o2._zod.optin !== void 0) ? "optional" : void 0);
        defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o2) => o2._zod.optout === "optional") ? "optional" : void 0);
        defineLazyInternal(inst, "values", (zod) => {
          if (zod.def.options.every((o2) => o2._zod.values)) {
            return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
          }
          return void 0;
        });
        defineLazyInternal(inst, "pattern", (zod) => {
          if (zod.def.options.every((o2) => o2._zod.pattern)) {
            const patterns = zod.def.options.map((o2) => o2._zod.pattern);
            return new RegExp(`^(${patterns.map((p2) => cleanRegex(p2.source)).join("|")})$`);
          }
          return void 0;
        });
        const first = def.options.length === 1 ? def.options[0]._zod.run : null;
        inst._zod.parse = (payload, ctx) => {
          if (first) {
            return first(payload, ctx);
          }
          let async = false;
          const results = [];
          for (const option of def.options) {
            const result = option._zod.run({
              value: payload.value,
              issues: []
            }, ctx);
            if (result instanceof Promise) {
              results.push(result);
              async = true;
            } else {
              if (result.issues.length === 0)
                return result;
              results.push(result);
            }
          }
          if (!async)
            return handleUnionResults(results, payload, inst, ctx);
          return Promise.all(results).then((results2) => {
            return handleUnionResults(results2, payload, inst, ctx);
          });
        };
      });
      const $ZodIntersection = $constructor("$ZodIntersection", (inst, def) => {
        $ZodType.init(inst, def);
        inst._zod.parse = (payload, ctx) => {
          const input = payload.value;
          const left = def.left._zod.run({ value: input, issues: [] }, ctx);
          const right = def.right._zod.run({ value: input, issues: [] }, ctx);
          const async = left instanceof Promise || right instanceof Promise;
          if (async) {
            return Promise.all([left, right]).then(([left2, right2]) => {
              return handleIntersectionResults(payload, left2, right2);
            });
          }
          return handleIntersectionResults(payload, left, right);
        };
      });
      function mergeValues(a2, b2) {
        if (a2 === b2) {
          return { valid: true, data: a2 };
        }
        if (a2 instanceof Date && b2 instanceof Date && +a2 === +b2) {
          return { valid: true, data: a2 };
        }
        if (isPlainObject(a2) && isPlainObject(b2)) {
          const bKeys = Object.keys(b2);
          const sharedKeys = Object.keys(a2).filter((key) => bKeys.indexOf(key) !== -1);
          const newObj = { ...a2, ...b2 };
          if (Object.prototype.hasOwnProperty.call(newObj, "__proto__"))
            delete newObj.__proto__;
          for (const key of sharedKeys) {
            if (key === "__proto__")
              continue;
            const sharedValue = mergeValues(a2[key], b2[key]);
            if (!sharedValue.valid) {
              return {
                valid: false,
                mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
              };
            }
            newObj[key] = sharedValue.data;
          }
          return { valid: true, data: newObj };
        }
        if (Array.isArray(a2) && Array.isArray(b2)) {
          if (a2.length !== b2.length) {
            return { valid: false, mergeErrorPath: [] };
          }
          const newArray = [];
          for (let index = 0; index < a2.length; index++) {
            const itemA = a2[index];
            const itemB = b2[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
              return {
                valid: false,
                mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
              };
            }
            newArray.push(sharedValue.data);
          }
          return { valid: true, data: newArray };
        }
        return { valid: false, mergeErrorPath: [] };
      }
      function handleIntersectionResults(result, left, right) {
        const unrecKeys = new Map();
        let unrecIssue;
        const keyIssues = new Map();
        const collect = (iss, side) => {
          let keys;
          if (iss.code === "unrecognized_keys" && !iss.path?.length) {
            unrecIssue ?? (unrecIssue = iss);
            keys = iss.keys;
          } else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
            const k = String(iss.path[0]);
            if (!keyIssues.has(k))
              keyIssues.set(k, iss);
            keys = [k];
          } else {
            return false;
          }
          for (const k of keys) {
            if (!unrecKeys.has(k))
              unrecKeys.set(k, {});
            unrecKeys.get(k)[side] = true;
          }
          return true;
        };
        for (const iss of left.issues) {
          if (!collect(iss, "l"))
            result.issues.push(iss);
        }
        for (const iss of right.issues) {
          if (!collect(iss, "r"))
            result.issues.push(iss);
        }
        const bothKeys = [...unrecKeys].filter(([, f2]) => f2.l && f2.r).map(([k]) => k);
        if (bothKeys.length) {
          const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
          if (aggregated.length)
            result.issues.push({ ...unrecIssue, keys: aggregated });
          for (const k of bothKeys) {
            if (!aggregated.includes(k) && keyIssues.has(k))
              result.issues.push(keyIssues.get(k));
          }
        }
        const merged = mergeValues(left.value, right.value);
        if (!merged.valid) {
          if (aborted(result))
            return result;
          throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
        }
        result.value = merged.data;
        return result;
      }
      const $ZodRecord = $constructor("$ZodRecord", (inst, def) => {
        $ZodType.init(inst, def);
        const memo2 = globalConfig.memoizer;
        memo2?.attach(inst);
        inst._zod.parse = (payload, ctx) => {
          const input = payload.value;
          if (!isPlainObject(input)) {
            payload.issues.push({
              expected: "record",
              code: "invalid_type",
              input,
              inst
            });
            return payload;
          }
          const proms = [];
          const values = def.keyType._zod.values;
          if (values && !def.partial) {
            payload.value = memo2 ? memo2.alloc(inst, payload, {}, ctx) : {};
            const recordKeys = new Set();
            for (const key of values) {
              if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
                recordKeys.add(typeof key === "number" ? key.toString() : key);
                if (key === "__proto__")
                  continue;
                const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
                if (keyResult instanceof Promise) {
                  throw new Error("Async schemas not supported in object keys currently");
                }
                if (keyResult.issues.length) {
                  payload.issues.push({
                    code: "invalid_key",
                    origin: "record",
                    issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config$1())),
                    input: key,
                    path: [key],
                    inst
                  });
                  continue;
                }
                const outKey = keyResult.value;
                if (outKey === "__proto__")
                  continue;
                const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
                if (result instanceof Promise) {
                  proms.push(result.then((result2) => {
                    if (result2.issues.length) {
                      payload.issues.push(...prefixIssues(key, result2.issues));
                    }
                    payload.value[outKey] = result2.value;
                  }));
                } else {
                  if (result.issues.length) {
                    payload.issues.push(...prefixIssues(key, result.issues));
                  }
                  payload.value[outKey] = result.value;
                }
              }
            }
            let unrecognized;
            for (const key in input) {
              if (!recordKeys.has(key)) {
                if (def.mode === "loose") {
                  if (key === "__proto__")
                    continue;
                  payload.value[key] = input[key];
                } else {
                  unrecognized = unrecognized ?? [];
                  unrecognized.push(key);
                }
              }
            }
            if (unrecognized && unrecognized.length > 0) {
              payload.issues.push({
                code: "unrecognized_keys",
                input,
                inst,
                keys: unrecognized,
                continue: true
              });
            }
          } else {
            payload.value = memo2 ? memo2.alloc(inst, payload, {}, ctx) : {};
            let unrecognized;
            for (const key of Reflect.ownKeys(input)) {
              if (key === "__proto__")
                continue;
              if (!Object.prototype.propertyIsEnumerable.call(input, key))
                continue;
              let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
              if (keyResult instanceof Promise) {
                throw new Error("Async schemas not supported in object keys currently");
              }
              const checkNumericKey = typeof key === "string" && number$1.test(key) && keyResult.issues.length;
              if (checkNumericKey) {
                const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
                if (retryResult instanceof Promise) {
                  throw new Error("Async schemas not supported in object keys currently");
                }
                if (retryResult.issues.length === 0) {
                  keyResult = retryResult;
                }
              }
              if (keyResult.issues.length) {
                if (def.mode === "loose") {
                  payload.value[key] = input[key];
                } else if (values) {
                  unrecognized = unrecognized ?? [];
                  unrecognized.push(key);
                } else {
                  payload.issues.push({
                    code: "invalid_key",
                    origin: "record",
                    issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config$1())),
                    input: key,
                    path: [key],
                    inst
                  });
                }
                continue;
              }
              const outKey = keyResult.value;
              if (outKey === "__proto__")
                continue;
              const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
              if (result instanceof Promise) {
                proms.push(result.then((result2) => {
                  if (result2.issues.length) {
                    payload.issues.push(...prefixIssues(key, result2.issues));
                  }
                  payload.value[outKey] = result2.value;
                }));
              } else {
                if (result.issues.length) {
                  payload.issues.push(...prefixIssues(key, result.issues));
                }
                payload.value[outKey] = result.value;
              }
            }
            if (unrecognized && unrecognized.length > 0) {
              payload.issues.push({
                code: "unrecognized_keys",
                input,
                inst,
                keys: unrecognized,
                continue: true
              });
            }
          }
          if (proms.length) {
            return Promise.all(proms).then(() => payload);
          }
          return payload;
        };
      });
      const $ZodEnum = $constructor("$ZodEnum", (inst, def) => {
        $ZodType.init(inst, def);
        const values = getEnumValues(def.entries);
        const valuesSet = new Set(values);
        inst._zod.values = valuesSet;
        defineLazyInternal(inst, "pattern", (zod) => {
          const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
          return new RegExp(patternValues.length ? `^(${patternValues.map((o2) => escapeRegex(o2.toString())).join("|")})$` : "^[^\\s\\S]$");
        });
        inst._zod.parse = (payload, _ctx) => {
          const input = payload.value;
          if (valuesSet.has(input)) {
            return payload;
          }
          payload.issues.push({
            code: "invalid_value",
            values,
            input,
            inst
          });
          return payload;
        };
      });
      const $ZodLiteral = $constructor("$ZodLiteral", (inst, def) => {
        $ZodType.init(inst, def);
        const values = new Set(def.values);
        inst._zod.values = values;
        defineLazyInternal(inst, "pattern", (zod) => {
          const vals = zod.def.values;
          return new RegExp(vals.length ? `^(${vals.map((o2) => typeof o2 === "string" ? escapeRegex(o2) : o2 ? escapeRegex(o2.toString()) : String(o2)).join("|")})$` : "^[^\\s\\S]$");
        });
        inst._zod.parse = (payload, _ctx) => {
          const input = payload.value;
          if (values.has(input)) {
            return payload;
          }
          payload.issues.push({
            code: "invalid_value",
            values: def.values,
            input,
            inst
          });
          return payload;
        };
      });
      const $ZodTransform = $constructor("$ZodTransform", (inst, def) => {
        $ZodType.init(inst, def);
        inst._zod.optin = "optional";
        globalConfig.memoizer?.guard(inst);
        inst._zod.parse = (payload, ctx) => {
          if (ctx.direction === "backward") {
            throw new $ZodEncodeError(inst.constructor.name);
          }
          const _out = def.transform(payload.value, payload);
          if (ctx.async) {
            const output = _out instanceof Promise ? _out : Promise.resolve(_out);
            return output.then((output2) => {
              payload.value = output2;
              return payload;
            });
          }
          if (_out instanceof Promise) {
            throw new $ZodAsyncError();
          }
          payload.value = _out;
          return payload;
        };
      });
      function handleOptionalResult(payload, result) {
        payload.value = result.issues.length ? void 0 : result.value;
        return payload;
      }
      const $ZodOptional = $constructor("$ZodOptional", (inst, def) => {
        $ZodType.init(inst, def);
        defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
        inst._zod.optout = "optional";
        defineLazyInternal(inst, "values", (zod) => {
          const values = zod.def.innerType._zod.values;
          return values ? new Set([...values, void 0]) : void 0;
        });
        defineLazyInternal(inst, "pattern", (zod) => {
          const pattern2 = zod.def.innerType._zod.pattern;
          return pattern2 ? new RegExp(`^(${cleanRegex(pattern2.source)})?$`) : void 0;
        });
        inst._zod.parse = (payload, ctx) => {
          if (payload.value === void 0) {
            if (def.innerType._zod.optin !== "defaulted")
              return payload;
            const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
            if (result instanceof Promise)
              return result.then((result2) => handleOptionalResult(payload, result2));
            return handleOptionalResult(payload, result);
          }
          return def.innerType._zod.run(payload, ctx);
        };
      });
      const $ZodExactOptional = $constructor("$ZodExactOptional", (inst, def) => {
        $ZodOptional.init(inst, def);
        defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
        defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
        inst._zod.parse = (payload, ctx) => {
          return def.innerType._zod.run(payload, ctx);
        };
      });
      const $ZodNullable = $constructor("$ZodNullable", (inst, def) => {
        $ZodType.init(inst, def);
        defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
        defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
        defineLazyInternal(inst, "pattern", (zod) => {
          const pattern2 = zod.def.innerType._zod.pattern;
          return pattern2 ? new RegExp(`^(${cleanRegex(pattern2.source)}|null)$`) : void 0;
        });
        defineLazyInternal(inst, "values", (zod) => {
          return zod.def.innerType._zod.values ? new Set([...zod.def.innerType._zod.values, null]) : void 0;
        });
        inst._zod.parse = (payload, ctx) => {
          if (payload.value === null)
            return payload;
          return def.innerType._zod.run(payload, ctx);
        };
      });
      const $ZodDefault = $constructor("$ZodDefault", (inst, def) => {
        $ZodType.init(inst, def);
        inst._zod.optin = "defaulted";
        defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
        inst._zod.parse = (payload, ctx) => {
          if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
          }
          if (payload.value === void 0) {
            payload.value = def.defaultValue;
            return payload;
          }
          const result = def.innerType._zod.run(payload, ctx);
          if (result instanceof Promise) {
            return result.then((result2) => handleDefaultResult(result2, def));
          }
          return handleDefaultResult(result, def);
        };
      });
      function handleDefaultResult(payload, def) {
        if (payload.value === void 0) {
          payload.value = def.defaultValue;
        }
        return payload;
      }
      const $ZodPrefault = $constructor("$ZodPrefault", (inst, def) => {
        $ZodType.init(inst, def);
        inst._zod.optin = "defaulted";
        defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
        inst._zod.parse = (payload, ctx) => {
          if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
          }
          if (payload.value === void 0) {
            payload.value = def.defaultValue;
          }
          return def.innerType._zod.run(payload, ctx);
        };
      });
      const $ZodNonOptional = $constructor("$ZodNonOptional", (inst, def) => {
        $ZodType.init(inst, def);
        defineLazyInternal(inst, "values", (zod) => {
          const v2 = zod.def.innerType._zod.values;
          return v2 ? new Set([...v2].filter((x) => x !== void 0)) : void 0;
        });
        inst._zod.parse = (payload, ctx) => {
          const result = def.innerType._zod.run(payload, ctx);
          if (result instanceof Promise) {
            return result.then((result2) => handleNonOptionalResult(result2, inst));
          }
          return handleNonOptionalResult(result, inst);
        };
      });
      function handleNonOptionalResult(payload, inst) {
        if (!payload.issues.length && payload.value === void 0) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: payload.value,
            inst
          });
        }
        return payload;
      }
      function handleCatchResult(payload, result, def, ctx) {
        if (!result.issues.length) {
          payload.value = result.value;
          if (result.memo)
            payload.memo = true;
          return payload;
        }
        payload.value = def.catchValue({
          ...result,
          value: payload.value,
          error: {
            issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config$1()))
          },
          input: payload.value
        });
        return payload;
      }
      const $ZodCatch = $constructor("$ZodCatch", (inst, def) => {
        $ZodType.init(inst, def);
        defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
        defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
        defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
        inst._zod.parse = (payload, ctx) => {
          if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
          }
          const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
          if (result instanceof Promise) {
            return result.then((result2) => handleCatchResult(payload, result2, def, ctx));
          }
          return handleCatchResult(payload, result, def, ctx);
        };
      });
      const $ZodPipe = $constructor("$ZodPipe", (inst, def) => {
        $ZodType.init(inst, def);
        defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
        defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
        defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
        defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
        inst._zod.parse = (payload, ctx) => {
          if (ctx.direction === "backward") {
            const right = def.out._zod.run(payload, ctx);
            if (right instanceof Promise) {
              return right.then((right2) => handlePipeResult(right2, def.in, ctx));
            }
            return handlePipeResult(right, def.in, ctx);
          }
          const left = def.in._zod.run(payload, ctx);
          if (left instanceof Promise) {
            return left.then((left2) => handlePipeResult(left2, def.out, ctx));
          }
          return handlePipeResult(left, def.out, ctx);
        };
      });
      function handlePipeResult(left, next2, ctx) {
        if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
          left.aborted = true;
          return left;
        }
        return next2._zod.run({ value: left.value, issues: left.issues }, ctx);
      }
      const $ZodReadonly = $constructor("$ZodReadonly", (inst, def) => {
        $ZodType.init(inst, def);
        defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
        defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
        defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
        defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
        inst._zod.parse = (payload, ctx) => {
          if (ctx.direction === "backward") {
            return def.innerType._zod.run(payload, ctx);
          }
          const result = def.innerType._zod.run(payload, ctx);
          if (result instanceof Promise) {
            return result.then(handleReadonlyResult);
          }
          return handleReadonlyResult(result);
        };
      });
      function handleReadonlyResult(payload) {
        if (!payload.memo)
          payload.value = Object.freeze(payload.value);
        return payload;
      }
      const $ZodCustom = $constructor("$ZodCustom", (inst, def) => {
        $ZodCheck.init(inst, def);
        $ZodType.init(inst, def);
        inst._zod.parse = (payload, _) => {
          return payload;
        };
        inst._zod.check = (payload) => {
          const input = payload.value;
          const r2 = def.fn(input);
          if (r2 instanceof Promise) {
            return r2.then((r3) => handleRefineResult(r3, payload, input, inst));
          }
          handleRefineResult(r2, payload, input, inst);
          return;
        };
      });
      function handleRefineResult(result, payload, input, inst) {
        if (!result) {
          const _iss = {
            code: "custom",
            input,
            inst,
path: [...inst._zod.def.path ?? []],
continue: !inst._zod.def.abort
};
          if (inst._zod.def.params)
            _iss.params = inst._zod.def.params;
          payload.issues.push(issue(_iss));
        }
      }
      class $ZodCyclicError extends Error {
        constructor() {
          super(`Cannot parse a reference cycle that closes through a transform`);
          this.name = "ZodCyclicError";
        }
      }
      const STATE = "~memo";
      const NO_ISSUES = [];
      function isRef(value) {
        return value !== null && (typeof value === "object" || typeof value === "function");
      }
      function cloneIssues(issues) {
        return issues.map((iss) => iss.path ? { ...iss, path: iss.path.slice() } : { ...iss });
      }
      const recursive = new WeakMap();
      const NONE = 0;
      const ASSUMED = 1;
      const PROVEN = 2;
      function isRecursive(inst, stack, resolve) {
        const cached2 = recursive.get(inst);
        if (cached2 !== void 0)
          return cached2 ? PROVEN : NONE;
        if (stack.has(inst))
          return PROVEN;
        stack.add(inst);
        let result = NONE;
        const check = (child) => {
          if (result !== PROVEN && child?._zod) {
            const answer = isRecursive(child, stack);
            if (answer > result)
              result = answer;
          }
        };
        const shape = (sh, spread) => {
          let answer = NONE;
          for (const key of Reflect.ownKeys(sh)) {
            const desc = Object.getOwnPropertyDescriptor(sh, key);
            if (spread && !desc.enumerable)
              continue;
            const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack) : NONE;
            if (child > answer)
              answer = child;
          }
          return answer;
        };
        const merge2 = (answer) => {
          if (answer > result)
            result = answer;
        };
        const def = inst._zod.def;
        const kind = def.type;
        switch (kind) {
          case "object": {
            const raw = rawShape(def);
            merge2(raw ? shape(raw, true) : ASSUMED);
            check(def.catchall);
            break;
          }
          case "properties":
            merge2(shape(def.shape, false));
            break;
          case "array":
            check(def.element);
            break;
          case "tuple":
            for (const el of def.items)
              check(el);
            check(def.rest);
            break;
          case "record":
          case "map":
            check(def.keyType);
            check(def.valueType);
            break;
          case "set":
            check(def.valueType);
            break;
          case "union":
            for (const el of def.options)
              check(el);
            break;
          case "intersection":
            check(def.left);
            check(def.right);
            break;
          case "optional":
          case "nullable":
          case "default":
          case "prefault":
          case "catch":
          case "readonly":
          case "nonoptional":
          case "promise":
          case "success":
            check(def.innerType);
            break;
          case "pipe":
            check(def.in);
            check(def.out);
            break;
          case "function":
            check(def.input);
            check(def.output);
            break;
case "lazy": {
            const inner = def._cachedInner ?? void 0;
            merge2(inner ? isRecursive(inner, stack) : ASSUMED);
            break;
          }
case "template_literal":
case "string":
          case "number":
          case "int":
          case "boolean":
          case "bigint":
          case "symbol":
          case "undefined":
          case "null":
          case "void":
          case "never":
          case "any":
          case "unknown":
          case "date":
          case "nan":
          case "enum":
          case "literal":
          case "file":
          case "transform":
          case "custom":
            break;
          default: {
            for (const key in def) {
              const desc = Object.getOwnPropertyDescriptor(def, key);
              if (!desc || desc.get)
                continue;
              const value = desc.value;
              if (!value || typeof value !== "object")
                continue;
              if (value._zod)
                check(value);
              else if (Array.isArray(value))
                for (const el of value)
                  check(el);
            }
          }
        }
        stack.delete(inst);
        return settle(inst, result);
      }
      function settle(inst, answer) {
        if (answer !== ASSUMED)
          recursive.set(inst, answer === PROVEN);
        return answer;
      }
      function bucketFor(state, inst) {
        let bucket = state.buckets.get(inst);
        if (!bucket) {
          bucket = new WeakMap();
          state.buckets.set(inst, bucket);
        }
        return bucket;
      }
      let handoff;
      const open = [];
      const memo = {
        alloc(_inst, payload, empty) {
          const bucket = handoff;
          if (!bucket)
            return empty;
          handoff = void 0;
          const entry = { value: empty, issues: null };
          bucket.set(payload.value, entry);
          open.push(entry);
          return empty;
        },
        guard(inst) {
          var _a2;
          (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
          inst._zod.deferred.push(() => {
            const base = inst._zod.parse;
            const wrapped = (payload, ctx) => {
              if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value))
                throw new $ZodCyclicError();
              return base(payload, ctx);
            };
            inst._zod.parse = wrapped;
            if (inst._zod.run === base)
              inst._zod.run = wrapped;
          });
        },
        attach(inst) {
          var _a2;
          let isRecursiveInst;
          let rechecked = false;
          let lastCtx;
          let lastBucket;
          (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
          inst._zod.deferred.push(() => {
            const base = inst._zod.parse;
            const wrapped = (payload, ctx) => {
              if (isRecursiveInst === void 0) {
                const walked = isRecursive(inst, new Set());
                if (walked === NONE) {
                  inst._zod.parse = base;
                  if (inst._zod.run === wrapped)
                    inst._zod.run = base;
                  return base(payload, ctx);
                }
                if (walked === PROVEN || rechecked)
                  isRecursiveInst = true;
                else
                  rechecked = true;
              }
              const input = payload.value;
              if (!isRef(input))
                return base(payload, ctx);
              let state = ctx[STATE];
              if (!state) {
                state = { buckets: new WeakMap(), backEdges: void 0 };
                ctx[STATE] = state;
              }
              let bucket;
              if (lastCtx === ctx) {
                bucket = lastBucket;
              } else {
                bucket = bucketFor(state, inst);
                lastCtx = ctx;
                lastBucket = bucket;
              }
              const hit = bucket.get(input);
              if (hit) {
                payload.value = hit.value;
                if (hit.issues) {
                  if (hit.issues.length)
                    payload.issues.push(...cloneIssues(hit.issues));
                } else {
                  payload.memo = true;
                  state.backEdges ?? (state.backEdges = new WeakSet());
                  state.backEdges.add(hit.value);
                }
                return payload;
              }
              handoff = bucket;
              const depth = open.length;
              const result = base(payload, ctx);
              handoff = void 0;
              const entry = open.length > depth ? open.pop() : void 0;
              if (result instanceof Promise) {
                return result.then((r2) => {
                  if (entry)
                    entry.issues = r2.issues.length ? cloneIssues(r2.issues) : NO_ISSUES;
                  return r2;
                });
              }
              if (entry)
                entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
              return result;
            };
            inst._zod.parse = wrapped;
            if (inst._zod.run === base)
              inst._zod.run = wrapped;
          });
        }
      };
      function memoizer() {
        return memo;
      }
      function isBackEdge(ctx, value) {
        const backEdges = ctx[STATE]?.backEdges;
        return backEdges !== void 0 && isRef(value) && backEdges.has(value);
      }
      const error = () => {
        const Sizable = {
          string: { unit: "characters", verb: "to have" },
          file: { unit: "bytes", verb: "to have" },
          array: { unit: "items", verb: "to have" },
          set: { unit: "items", verb: "to have" },
          map: { unit: "entries", verb: "to have" }
        };
        function getSizing(origin2) {
          return Sizable[origin2] ?? null;
        }
        const FormatDictionary = {
          regex: "input",
          email: "email address",
          url: "URL",
          emoji: "emoji",
          uuid: "UUID",
          uuidv4: "UUIDv4",
          uuidv6: "UUIDv6",
          nanoid: "nanoid",
          guid: "GUID",
          cuid: "cuid",
          cuid2: "cuid2",
          ulid: "ULID",
          xid: "XID",
          ksuid: "KSUID",
          datetime: "ISO datetime",
          date: "ISO date",
          time: "ISO time",
          duration: "ISO duration",
          ipv4: "IPv4 address",
          ipv6: "IPv6 address",
          mac: "MAC address",
          cidrv4: "IPv4 range",
          cidrv6: "IPv6 range",
          base64: "base64-encoded string",
          base64url: "base64url-encoded string",
          json_string: "JSON string",
          e164: "E.164 number",
          credit_card: "credit card number",
          iban: "IBAN",
          jwt: "JWT",
          template_literal: "input"
        };
        const TypeDictionary = {
nan: "NaN"
};
        function getTypeName(type, input) {
          if (type === "number" && typeof input === "number" && !Number.isFinite(input)) {
            return String(input);
          }
          return TypeDictionary[type] ?? type;
        }
        return (issue2) => {
          switch (issue2.code) {
            case "invalid_type": {
              const expected = getTypeName(issue2.expected);
              const receivedType = parsedType(issue2.input);
              const received = getTypeName(receivedType, issue2.input);
              return `Invalid input: expected ${expected}, received ${received}`;
            }
            case "invalid_value":
              if (issue2.values.length === 1)
                return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
              return `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
            case "too_big": {
              const adj = issue2.exact ? "exactly " : issue2.inclusive ? "<=" : "<";
              const sizing = getSizing(issue2.origin);
              if (sizing)
                return `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
              return `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
            }
            case "too_small": {
              const adj = issue2.exact ? "exactly " : issue2.inclusive ? ">=" : ">";
              const sizing = getSizing(issue2.origin);
              if (sizing) {
                return `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
              }
              return `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
            }
            case "invalid_format": {
              const _issue = issue2;
              if (_issue.format === "starts_with") {
                return `Invalid string: must start with "${_issue.prefix}"`;
              }
              if (_issue.format === "ends_with")
                return `Invalid string: must end with "${_issue.suffix}"`;
              if (_issue.format === "includes")
                return `Invalid string: must include "${_issue.includes}"`;
              if (_issue.format === "regex")
                return `Invalid string: must match pattern ${_issue.pattern}`;
              return `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
            }
            case "not_multiple_of":
              return `Invalid number: must be a multiple of ${issue2.divisor}`;
            case "unrecognized_keys":
              return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
            case "invalid_key":
              return `Invalid key in ${issue2.origin}`;
            case "invalid_union":
              if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
                const opts = issue2.options.map((o2) => `'${o2}'`).join(" | ");
                return `Invalid discriminator value. Expected ${opts}`;
              }
              if (issue2.inclusive === false) {
                return "Invalid input: more than one option matched";
              }
              return "Invalid input";
            case "invalid_element":
              return `Invalid value in ${issue2.origin}`;
            default:
              return `Invalid input`;
          }
        };
      };
      function en() {
        return {
          localeError: error()
        };
      }
      var _a;
      class $ZodRegistry {
        constructor() {
          this._map = new WeakMap();
          this._idmap = new Map();
        }
        add(schema, ..._meta) {
          const meta = _meta[0];
          this._map.set(schema, meta);
          if (meta && typeof meta === "object" && "id" in meta) {
            this._idmap.set(meta.id, schema);
          }
          return this;
        }
        clear() {
          this._map = new WeakMap();
          this._idmap = new Map();
          return this;
        }
        remove(schema) {
          const meta = this._map.get(schema);
          if (meta && typeof meta === "object" && "id" in meta) {
            this._idmap.delete(meta.id);
          }
          this._map.delete(schema);
          return this;
        }
        get(schema) {
          const p2 = schema._zod.parent;
          if (p2) {
            const pm = { ...this.get(p2) ?? {} };
            delete pm.id;
            const f2 = { ...pm, ...this._map.get(schema) };
            return Object.keys(f2).length ? f2 : void 0;
          }
          return this._map.get(schema);
        }
        has(schema) {
          return this._map.has(schema);
        }
      }
      function registry() {
        return new $ZodRegistry();
      }
      (_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
      const globalRegistry = globalThis.__zod_globalRegistry;
function _string(Class, params) {
        return new Class({
          type: "string",
          ...normalizeParams(params)
        });
      }
function _email(Class, params) {
        return new Class({
          type: "string",
          format: "email",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _guid(Class, params) {
        return new Class({
          type: "string",
          format: "guid",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _uuid(Class, params) {
        return new Class({
          type: "string",
          format: "uuid",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _uuidv4(Class, params) {
        return new Class({
          type: "string",
          format: "uuid",
          check: "string_format",
          abort: false,
          version: "v4",
          ...normalizeParams(params)
        });
      }
function _uuidv6(Class, params) {
        return new Class({
          type: "string",
          format: "uuid",
          check: "string_format",
          abort: false,
          version: "v6",
          ...normalizeParams(params)
        });
      }
function _uuidv7(Class, params) {
        return new Class({
          type: "string",
          format: "uuid",
          check: "string_format",
          abort: false,
          version: "v7",
          ...normalizeParams(params)
        });
      }
function _url(Class, params) {
        return new Class({
          type: "string",
          format: "url",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _emoji(Class, params) {
        return new Class({
          type: "string",
          format: "emoji",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _nanoid(Class, params) {
        return new Class({
          type: "string",
          format: "nanoid",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _cuid(Class, params) {
        return new Class({
          type: "string",
          format: "cuid",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _cuid2(Class, params) {
        return new Class({
          type: "string",
          format: "cuid2",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _ulid(Class, params) {
        return new Class({
          type: "string",
          format: "ulid",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _xid(Class, params) {
        return new Class({
          type: "string",
          format: "xid",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _ksuid(Class, params) {
        return new Class({
          type: "string",
          format: "ksuid",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _ipv4(Class, params) {
        return new Class({
          type: "string",
          format: "ipv4",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _ipv6(Class, params) {
        return new Class({
          type: "string",
          format: "ipv6",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _cidrv4(Class, params) {
        return new Class({
          type: "string",
          format: "cidrv4",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _cidrv6(Class, params) {
        return new Class({
          type: "string",
          format: "cidrv6",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _base64(Class, params) {
        return new Class({
          type: "string",
          format: "base64",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _base64url(Class, params) {
        return new Class({
          type: "string",
          format: "base64url",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _e164(Class, params) {
        return new Class({
          type: "string",
          format: "e164",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _jwt(Class, params) {
        return new Class({
          type: "string",
          format: "jwt",
          check: "string_format",
          abort: false,
          ...normalizeParams(params)
        });
      }
function _isoDateTime(Class, params) {
        return new Class({
          type: "string",
          format: "datetime",
          check: "string_format",
          offset: false,
          local: false,
          precision: null,
          ...normalizeParams(params)
        });
      }
function _isoDate(Class, params) {
        return new Class({
          type: "string",
          format: "date",
          check: "string_format",
          ...normalizeParams(params)
        });
      }
function _isoTime(Class, params) {
        return new Class({
          type: "string",
          format: "time",
          check: "string_format",
          precision: null,
          ...normalizeParams(params)
        });
      }
function _isoDuration(Class, params) {
        return new Class({
          type: "string",
          format: "duration",
          check: "string_format",
          ...normalizeParams(params)
        });
      }
function _number(Class, params) {
        return new Class({
          type: "number",
          checks: [],
          ...normalizeParams(params)
        });
      }
function _int(Class, params) {
        return new Class({
          type: "number",
          check: "number_format",
          abort: false,
          format: "safeint",
          ...normalizeParams(params)
        });
      }
function _boolean(Class, params) {
        return new Class({
          type: "boolean",
          ...normalizeParams(params)
        });
      }
function _unknown(Class) {
        return new Class({
          type: "unknown"
        });
      }
function _never(Class, params) {
        return new Class({
          type: "never",
          ...normalizeParams(params)
        });
      }
function _lt(value, params) {
        return new $ZodCheckLessThan({
          check: "less_than",
          ...normalizeParams(params),
          value,
          inclusive: false
        });
      }
function _lte(value, params) {
        return new $ZodCheckLessThan({
          check: "less_than",
          ...normalizeParams(params),
          value,
          inclusive: true
        });
      }
function _gt(value, params) {
        return new $ZodCheckGreaterThan({
          check: "greater_than",
          ...normalizeParams(params),
          value,
          inclusive: false
        });
      }
function _gte(value, params) {
        return new $ZodCheckGreaterThan({
          check: "greater_than",
          ...normalizeParams(params),
          value,
          inclusive: true
        });
      }
function _multipleOf(value, params) {
        return new $ZodCheckMultipleOf({
          check: "multiple_of",
          ...normalizeParams(params),
          value
        });
      }
function _maxLength(maximum, params) {
        const ch = new $ZodCheckMaxLength({
          check: "max_length",
          ...normalizeParams(params),
          maximum
        });
        return ch;
      }
function _minLength(minimum, params) {
        return new $ZodCheckMinLength({
          check: "min_length",
          ...normalizeParams(params),
          minimum
        });
      }
function _length(length, params) {
        return new $ZodCheckLengthEquals({
          check: "length_equals",
          ...normalizeParams(params),
          length
        });
      }
function _regex(pattern2, params) {
        return new $ZodCheckRegex({
          check: "string_format",
          format: "regex",
          ...normalizeParams(params),
          pattern: pattern2
        });
      }
function _lowercase(params) {
        return new $ZodCheckLowerCase({
          check: "string_format",
          format: "lowercase",
          ...normalizeParams(params)
        });
      }
function _uppercase(params) {
        return new $ZodCheckUpperCase({
          check: "string_format",
          format: "uppercase",
          ...normalizeParams(params)
        });
      }
function _includes(includes, params) {
        return new $ZodCheckIncludes({
          check: "string_format",
          format: "includes",
          ...normalizeParams(params),
          includes
        });
      }
function _startsWith(prefix, params) {
        return new $ZodCheckStartsWith({
          check: "string_format",
          format: "starts_with",
          ...normalizeParams(params),
          prefix
        });
      }
function _endsWith(suffix, params) {
        return new $ZodCheckEndsWith({
          check: "string_format",
          format: "ends_with",
          ...normalizeParams(params),
          suffix
        });
      }
function _overwrite(tx) {
        return new $ZodCheckOverwrite({
          check: "overwrite",
          tx
        });
      }
function _normalize(form) {
        return _overwrite((input) => input.normalize(form));
      }
function _trim() {
        return _overwrite((input) => input.trim());
      }
function _toLowerCase() {
        return _overwrite((input) => input.toLowerCase());
      }
function _toUpperCase() {
        return _overwrite((input) => input.toUpperCase());
      }
function _slugify() {
        return _overwrite((input) => slugify(input));
      }
function _array(Class, element, params) {
        return new Class({
          type: "array",
          element,


...normalizeParams(params)
        });
      }
function _refine(Class, fn, _params) {
        const schema = new Class({
          type: "custom",
          check: "custom",
          fn,
          ...normalizeParams(_params)
        });
        return schema;
      }
function _superRefine(fn, params) {
        const ch = _check((payload) => {
          payload.addIssue = (issue$1) => {
            if (typeof issue$1 === "string") {
              payload.issues.push(issue(issue$1, payload.value, ch._zod.def));
            } else {
              const _issue = issue$1;
              if (_issue.fatal)
                _issue.continue = false;
              _issue.code ?? (_issue.code = "custom");
              if (!("input" in _issue))
                _issue.input = payload.value;
              _issue.inst ?? (_issue.inst = ch);
              _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
              payload.issues.push(issue(_issue));
            }
          };
          return fn(payload.value, payload);
        }, params);
        return ch;
      }
function _check(fn, params) {
        const ch = new $ZodCheck({
          check: "custom",
          ...normalizeParams(params)
        });
        ch._zod.check = fn;
        return ch;
      }
      function assignProps(target, ...sources) {
        for (const source of sources) {
          for (const key of Reflect.ownKeys(source)) {
            if (Object.prototype.propertyIsEnumerable.call(source, key)) {
              assignProp(target, key, source[key]);
            }
          }
        }
        return target;
      }
      function initializeContext(params) {
        let target = params?.target ?? "draft-2020-12";
        if (target === "draft-4")
          target = "draft-04";
        if (target === "draft-7")
          target = "draft-07";
        return {
          processors: params.processors ?? {},
          metadataRegistry: params?.metadata ?? globalRegistry,
          target,
          unrepresentable: params?.unrepresentable ?? "throw",
          override: params?.override ?? (() => {
          }),
          io: params?.io ?? "output",
          counter: 0,
          seen: new Map(),
          sharedDefsExtractedFor: void 0,
          sharedEmitDoneFor: void 0,
          cycles: params?.cycles ?? "ref",
          reused: params?.reused ?? "inline",
          intersections: [],
          deferred: [],
          external: params?.external ?? void 0
        };
      }
      function handleUnrepresentable(schema, ctx, json, params, message) {
        const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({ zodSchema: schema, path: params.path, message }) : ctx.unrepresentable;
        if (result === "any")
          return false;
        if (result === void 0 || result === "throw")
          throw new Error(message);
        Object.assign(json, result);
        return true;
      }
      function processSchema(schema, ctx, _params = { path: [], schemaPath: [] }) {
        var _a2;
        const def = schema._zod.def;
        const seen2 = ctx.seen.get(schema);
        if (seen2) {
          seen2.count++;
          const isCycle = _params.schemaPath.includes(schema);
          if (isCycle) {
            seen2.cycle = _params.path;
          }
          return seen2.schema;
        }
        const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
        ctx.seen.set(schema, result);
        ctx.sharedDefsExtractedFor = void 0;
        ctx.sharedEmitDoneFor = void 0;
        const overrideSchema = schema._zod.toJSONSchema?.();
        if (overrideSchema) {
          result.schema = overrideSchema;
        } else {
          const params = {
            ..._params,
            schemaPath: [..._params.schemaPath, schema],
            path: _params.path
          };
          if (schema._zod.processJSONSchema) {
            schema._zod.processJSONSchema(ctx, result.schema, params);
          } else {
            const _json = result.schema;
            const processor = ctx.processors[def.type];
            if (!processor) {
              throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
            }
            processor(schema, ctx, _json, params);
          }
          const parent = schema._zod.parent;
          if (parent) {
            if (!result.ref)
              result.ref = parent;
            processSchema(parent, ctx, params);
            ctx.seen.get(parent).isParent = true;
          }
        }
        const meta = ctx.metadataRegistry.get(schema);
        if (meta)
          assignProps(result.schema, meta);
        if (ctx.io === "input" && isTransforming(schema)) {
          delete result.schema.examples;
          delete result.schema.default;
        }
        if (ctx.io === "input" && "_prefault" in result.schema)
          (_a2 = result.schema).default ?? (_a2.default = result.schema._prefault);
        delete result.schema._prefault;
        const _result = ctx.seen.get(schema);
        return _result.schema;
      }
      function encodeJSONPointerSegment(segment) {
        return segment.replace(/~/g, "~0").replace(/\//g, "~1");
      }
      function extractDefs(ctx, schema) {
        const root2 = ctx.seen.get(schema);
        if (!root2)
          throw new Error("Unprocessed schema. This is a bug in Zod.");
        if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external)
          return;
        const idToSchema = new Map();
        for (const entry of ctx.seen.entries()) {
          const id = ctx.metadataRegistry.get(entry[0])?.id;
          if (id) {
            const existing = idToSchema.get(id);
            if (existing && existing !== entry[0]) {
              throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
            }
            idToSchema.set(id, entry[0]);
          }
        }
        const makeURI = (entry) => {
          const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
          if (ctx.external) {
            const externalId = ctx.external.registry.get(entry[0])?.id;
            const uriGenerator = ctx.external.uri ?? ((id2) => id2);
            if (externalId) {
              return { ref: uriGenerator(externalId) };
            }
            const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
            entry[1].defId = id;
            return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}` };
          }
          const uriPrefix = `#`;
          const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
          if (entry[1] === root2 && !entry[1].schema.id) {
            return { ref: uriPrefix };
          }
          const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
          return { defId, ref: defUriPrefix + encodeJSONPointerSegment(defId) };
        };
        const extractToDef = (entry) => {
          if (entry[1].schema.$ref) {
            return;
          }
          const seen2 = entry[1];
          const { ref, defId } = makeURI(entry);
          seen2.def = { ...seen2.schema };
          if (defId)
            seen2.defId = defId;
          const schema2 = seen2.schema;
          for (const key in schema2) {
            delete schema2[key];
          }
          schema2.$ref = ref;
        };
        if (ctx.cycles === "throw") {
          for (const entry of ctx.seen.entries()) {
            const seen2 = entry[1];
            if (seen2.cycle) {
              throw new Error(`Cycle detected: #/${seen2.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
            }
          }
        }
        for (const entry of ctx.seen.entries()) {
          const seen2 = entry[1];
          if (schema === entry[0]) {
            extractToDef(entry);
            continue;
          }
          if (ctx.external) {
            const ext = ctx.external.registry.get(entry[0])?.id;
            if (schema !== entry[0] && ext) {
              extractToDef(entry);
              continue;
            }
          }
          const id = ctx.metadataRegistry.get(entry[0])?.id;
          if (id) {
            extractToDef(entry);
            continue;
          }
          if (seen2.cycle) {
            extractToDef(entry);
            continue;
          }
          if (seen2.count > 1) {
            if (ctx.reused === "ref") {
              extractToDef(entry);
            }
          }
        }
        if (ctx.external)
          ctx.sharedDefsExtractedFor = ctx.external;
      }
      function compactTypeUnion(schema) {
        const options = schema.anyOf;
        if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0)
          return;
        const types = [];
        for (const option of options) {
          if (!option || typeof option !== "object")
            return;
          compactTypeUnion(option);
          const keys = Object.keys(option);
          if (keys.length !== 1 || keys[0] !== "type")
            return;
          const type = option.type;
          for (const member of Array.isArray(type) ? type : [type]) {
            if (typeof member !== "string")
              return;
            if (!types.includes(member))
              types.push(member);
          }
        }
        delete schema.anyOf;
        schema.type = types.length === 1 ? types[0] : types;
      }
      const FOLDABLE_KEYS = new Set(["type", "properties", "required", "additionalProperties"]);
      const UNION_KEYS = ["oneOf", "anyOf"];
      function undeclaredConstraint(member) {
        const extra = member.additionalProperties;
        if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null)
          return null;
        return Object.keys(extra).length ? extra : null;
      }
      function foldObjects(members2) {
        const objects = [];
        for (const member of members2) {
          if (typeof member !== "object" || member.type !== "object")
            return null;
          for (const key in member) {
            if (!FOLDABLE_KEYS.has(key))
              return null;
          }
          objects.push(member);
        }
        const properties = {};
        const required2 = new Set();
        for (const object of objects) {
          for (const key in object.properties) {
            if (Object.prototype.hasOwnProperty.call(properties, key))
              continue;
            const parts = [];
            for (const other of objects) {
              const part = other.properties?.[key] ?? undeclaredConstraint(other);
              if (part === null || part === void 0)
                continue;
              if (!parts.some((seen2) => JSON.stringify(seen2) === JSON.stringify(part)))
                parts.push(part);
            }
            const merged = parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts };
            assignProp(properties, key, merged);
          }
          for (const key of object.required ?? [])
            required2.add(key);
        }
        const folded = { type: "object", properties };
        if (required2.size)
          folded.required = [...required2];
        if (objects.every((object) => object.additionalProperties === false)) {
          folded.additionalProperties = false;
        } else {
          const constraints = [];
          for (const object of objects) {
            const constraint = undeclaredConstraint(object);
            if (constraint && !constraints.some((seen2) => JSON.stringify(seen2) === JSON.stringify(constraint)))
              constraints.push(constraint);
          }
          if (constraints.length === 1)
            folded.additionalProperties = constraints[0];
          else if (constraints.length > 1)
            folded.additionalProperties = { allOf: constraints };
        }
        return folded;
      }
      function foldIntersection(json) {
        const allOf = json.allOf;
        if (!Array.isArray(allOf) || allOf.length < 2)
          return;
        for (const key of FOLDABLE_KEYS)
          if (key in json)
            return;
        const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
        let folded = null;
        if (!unions.length) {
          folded = foldObjects(allOf);
        } else {
          const union2 = unions[0];
          const keyword = UNION_KEYS.find((k) => Array.isArray(union2[k]));
          if (Object.keys(union2).length !== 1)
            return;
          const rest = allOf.filter((m) => m !== union2);
          const branches = union2[keyword].map((branch) => foldObjects([...rest, branch]));
          if (branches.some((b2) => !b2))
            return;
          folded = { [keyword]: branches };
        }
        if (!folded)
          return;
        delete json.allOf;
        assignProps(json, folded);
      }
      function finalize(ctx, schema) {
        const root2 = ctx.seen.get(schema);
        if (!root2)
          throw new Error("Unprocessed schema. This is a bug in Zod.");
        const flattenRef = (zodSchema) => {
          const seen2 = ctx.seen.get(zodSchema);
          if (seen2.ref === null)
            return;
          const schema2 = seen2.def ?? seen2.schema;
          const _cached = { ...schema2 };
          const ref = seen2.ref;
          seen2.ref = null;
          if (ref) {
            flattenRef(ref);
            const refSeen = ctx.seen.get(ref);
            const refSchema = refSeen.schema;
            if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
              schema2.allOf = schema2.allOf ?? [];
              schema2.allOf.push(refSchema);
            } else {
              assignProps(schema2, refSchema);
            }
            assignProps(schema2, _cached);
            const isParentRef = zodSchema._zod.parent === ref;
            if (isParentRef) {
              for (const key in schema2) {
                if (key === "$ref" || key === "allOf")
                  continue;
                if (!(key in _cached)) {
                  delete schema2[key];
                }
              }
            }
            if (refSchema.$ref && refSeen.def) {
              for (const key in schema2) {
                if (key === "$ref" || key === "allOf")
                  continue;
                if (key in refSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(refSeen.def[key])) {
                  delete schema2[key];
                }
              }
            }
          }
          const parent = zodSchema._zod.parent;
          if (parent && parent !== ref) {
            flattenRef(parent);
            const parentSeen = ctx.seen.get(parent);
            if (parentSeen?.schema.$ref) {
              schema2.$ref = parentSeen.schema.$ref;
              if (parentSeen.def) {
                for (const key in schema2) {
                  if (key === "$ref" || key === "allOf")
                    continue;
                  if (key in parentSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(parentSeen.def[key])) {
                    delete schema2[key];
                  }
                }
              }
            }
          }
          ctx.override({
            zodSchema,
            jsonSchema: schema2,
            path: seen2.path ?? []
          });
        };
        if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
          for (const entry of [...ctx.seen.entries()].reverse()) {
            flattenRef(entry[0]);
          }
          if (ctx.target !== "openapi-3.0") {
            for (const entry of ctx.seen.entries()) {
              compactTypeUnion(entry[1].def ?? entry[1].schema);
            }
          }
          for (const rewrite of ctx.deferred)
            rewrite();
          if (ctx.intersections.length) {
            const carriers = new Map();
            for (const seen2 of ctx.seen.values()) {
              for (const json of [seen2.schema, seen2.def]) {
                const allOf = json?.allOf;
                if (!Array.isArray(allOf))
                  continue;
                const existing = carriers.get(allOf);
                if (existing)
                  existing.push(json);
                else
                  carriers.set(allOf, [json]);
              }
            }
            for (const allOf of ctx.intersections) {
              for (const json of carriers.get(allOf) ?? [])
                foldIntersection(json);
            }
          }
        }
        const result = {};
        if (ctx.target === "draft-2020-12") {
          result.$schema = "https://json-schema.org/draft/2020-12/schema";
        } else if (ctx.target === "draft-07") {
          result.$schema = "http://json-schema.org/draft-07/schema#";
        } else if (ctx.target === "draft-04") {
          result.$schema = "http://json-schema.org/draft-04/schema#";
        } else if (ctx.target === "openapi-3.0") ;
        else ;
        if (ctx.external?.uri) {
          const id = ctx.external.registry.get(schema)?.id;
          if (!id)
            throw new Error("Schema is missing an `id` property");
          result.$id = ctx.external.uri(id);
        }
        assignProps(result, root2.defId ? root2.schema : root2.def ?? root2.schema);
        const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
        if (rootMetaId !== void 0 && result.id === rootMetaId)
          delete result.id;
        const defs = ctx.external?.defs ?? {};
        if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
          for (const entry of ctx.seen.entries()) {
            const seen2 = entry[1];
            if (seen2.def && seen2.defId) {
              if (seen2.def.id === seen2.defId)
                delete seen2.def.id;
              assignProp(defs, seen2.defId, seen2.def);
            }
          }
        }
        if (ctx.external)
          ctx.sharedEmitDoneFor = ctx.external;
        if (ctx.external) ;
        else {
          if (Object.keys(defs).length > 0) {
            if (ctx.target === "draft-2020-12") {
              result.$defs = defs;
            } else {
              result.definitions = defs;
            }
          }
        }
        try {
          const finalized = JSON.parse(JSON.stringify(result));
          Object.defineProperty(finalized, "~standard", {
            value: {
              ...schema["~standard"],
              jsonSchema: {
                input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
                output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
              }
            },
            enumerable: false,
            writable: false
          });
          return finalized;
        } catch (_err) {
          throw new Error("Error converting schema to JSON.");
        }
      }
      function isTransforming(_schema, _ctx) {
        const ctx = _ctx ?? { seen: new Set() };
        if (ctx.seen.has(_schema))
          return false;
        ctx.seen.add(_schema);
        const def = _schema._zod.def;
        if (def.type === "transform")
          return true;
        if (def.type === "array")
          return isTransforming(def.element, ctx);
        if (def.type === "set")
          return isTransforming(def.valueType, ctx);
        if (def.type === "lazy")
          return isTransforming(def.getter(), ctx);
        if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") {
          return isTransforming(def.innerType, ctx);
        }
        if (def.type === "intersection") {
          return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
        }
        if (def.type === "record" || def.type === "map") {
          return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
        }
        if (def.type === "pipe") {
          if (_schema._zod.traits.has("$ZodCodec"))
            return true;
          return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
        }
        if (def.type === "object") {
          for (const key in def.shape) {
            if (isTransforming(def.shape[key], ctx))
              return true;
          }
          return false;
        }
        if (def.type === "union") {
          for (const option of def.options) {
            if (isTransforming(option, ctx))
              return true;
          }
          return false;
        }
        if (def.type === "tuple") {
          for (const item of def.items) {
            if (isTransforming(item, ctx))
              return true;
          }
          if (def.rest && isTransforming(def.rest, ctx))
            return true;
          return false;
        }
        return false;
      }
      const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
        const ctx = initializeContext({ ...params, processors });
        processSchema(schema, ctx);
        extractDefs(ctx, schema);
        return finalize(ctx, schema);
      };
      const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
        const { libraryOptions, target } = params ?? {};
        const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
        processSchema(schema, ctx);
        extractDefs(ctx, schema);
        return finalize(ctx, schema);
      };
      const narrowMin = (agg, key, value) => {
        if (agg[key] === void 0 || value > agg[key])
          agg[key] = value;
      };
      const narrowMax = (agg, key, value) => {
        if (agg[key] === void 0 || value < agg[key])
          agg[key] = value;
      };
      const narrowBoth = (agg, value) => {
        narrowMin(agg, "minimum", value);
        narrowMax(agg, "maximum", value);
      };
      const addDivisor = (agg, value) => {
        agg.multipleOf ?? (agg.multipleOf = []);
        if (!agg.multipleOf.includes(value))
          agg.multipleOf.push(value);
      };
      const addPattern = (agg, pattern2) => {
        agg.patterns ?? (agg.patterns = new Set());
        agg.patterns.add(pattern2);
      };
      const intersectMime = (agg, mime) => {
        agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
      };
      const setFormat = (agg, format) => {
        agg.format = format;
        if (format.includes("int"))
          agg.isInt = true;
      };
      const minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
      const maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
      const formatContributor = (ranges) => (agg, def) => {
        setFormat(agg, def.format);
        const [minimum, maximum] = ranges[def.format];
        narrowMin(agg, "minimum", minimum);
        narrowMax(agg, "maximum", maximum);
      };
      const contributors = {
        greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
        less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
        multiple_of: (agg, def) => addDivisor(agg, def.value),
        number_format: formatContributor(NUMBER_FORMAT_RANGES),
        bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
        min_length: minContributor,
        max_length: maxContributor,
        length_equals: (agg, def) => narrowBoth(agg, def.length),
        min_size: minContributor,
        max_size: maxContributor,
        size_equals: (agg, def) => narrowBoth(agg, def.size),
        string_format: (agg, def) => {
          setFormat(agg, def.format);
          if (def.pattern)
            addPattern(agg, def.pattern);
          if (def.format === "base64" || def.format === "base64url")
            agg.contentEncoding = def.format;
          if (def.local || def.precision === -1)
            agg.laxFormat = true;
        },
        mime_type: (agg, def) => intersectMime(agg, def.mime)
      };
      function aggregateChecks(schema) {
        const agg = {};
        const def = schema._zod.def;
        const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
        for (const ch of list)
          contributors[ch._zod.def.check]?.(agg, ch._zod.def);
        const bag = schema._zod.bag;
        if (bag.minimum !== void 0)
          narrowMin(agg, "minimum", bag.minimum);
        if (bag.exclusiveMinimum !== void 0)
          narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
        if (bag.maximum !== void 0)
          narrowMax(agg, "maximum", bag.maximum);
        if (bag.exclusiveMaximum !== void 0)
          narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
        if (bag.multipleOf !== void 0)
          addDivisor(agg, bag.multipleOf);
        if (bag.format !== void 0) {
          agg.format ?? (agg.format = bag.format);
          if (bag.format.includes("int"))
            agg.isInt = true;
        }
        if (bag.mime)
          intersectMime(agg, bag.mime);
        for (const pattern2 of bag.patterns ?? [])
          addPattern(agg, pattern2);
        return agg;
      }
      const formatMap = {
        guid: "uuid",
        url: "uri",
        datetime: "date-time",
        json_string: "json-string",
        regex: ""
};
      const exactPatterns = new Map([
        [base64Charset, base64],
        [base64urlCharset, base64url]
      ]);
      const exactPattern = (p2) => exactPatterns.get(p2) ?? p2;
      const stringProcessor = (schema, ctx, _json, _params) => {
        const json = _json;
        json.type = "string";
        const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
        if (typeof minimum === "number")
          json.minLength = minimum;
        if (typeof maximum === "number")
          json.maxLength = maximum;
        if (format) {
          json.format = formatMap[format] ?? format;
          if (json.format === "")
            delete json.format;
          if (format === "time" || laxFormat) {
            delete json.format;
          }
        }
        if (contentEncoding)
          json.contentEncoding = contentEncoding;
        if (patterns && patterns.size > 0) {
          const patternList = [...patterns].map(exactPattern);
          if (patternList.length === 1)
            json.pattern = patternList[0].source;
          else if (patternList.length > 1) {
            json.allOf = [
              ...patternList.map((regex) => ({
                ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
                pattern: regex.source
              }))
            ];
          }
        }
      };
      const numberProcessor = (schema, ctx, _json, params) => {
        const json = _json;
        const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
        json.type = isInt ? "integer" : "number";
        const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
        const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
        const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
        if (exMin) {
          if (legacy) {
            json.minimum = exclusiveMinimum;
            json.exclusiveMinimum = true;
          } else {
            json.exclusiveMinimum = exclusiveMinimum;
          }
        } else if (typeof minimum === "number") {
          json.minimum = minimum;
        }
        if (exMax) {
          if (legacy) {
            json.maximum = exclusiveMaximum;
            json.exclusiveMaximum = true;
          } else {
            json.exclusiveMaximum = exclusiveMaximum;
          }
        } else if (typeof maximum === "number") {
          json.maximum = maximum;
        }
        if (multipleOf) {
          const divisors = new Set();
          for (const divisor of multipleOf) {
            if (Number.isFinite(divisor) && divisor !== 0)
              divisors.add(Math.abs(divisor));
            else
              handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
          }
          const [first, ...rest] = divisors;
          if (first !== void 0)
            json.multipleOf = first;
          if (rest.length)
            json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
        }
      };
      const booleanProcessor = (_schema, _ctx, json, _params) => {
        json.type = "boolean";
      };
      const neverProcessor = (_schema, _ctx, json, _params) => {
        json.not = {};
      };
      const unknownProcessor = (_schema, _ctx, _json, _params) => {
      };
      const enumProcessor = (schema, _ctx, json, _params) => {
        const def = schema._zod.def;
        const values = getEnumValues(def.entries);
        if (values.length === 0) {
          json.not = {};
          return;
        }
        if (values.every((v2) => typeof v2 === "number"))
          json.type = "number";
        if (values.every((v2) => typeof v2 === "string"))
          json.type = "string";
        json.enum = values;
      };
      const literalProcessor = (schema, ctx, json, params) => {
        const def = schema._zod.def;
        if (def.values.length === 0) {
          json.not = {};
          return;
        }
        const vals = [];
        for (const val of def.values) {
          if (val === void 0) {
            if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema"))
              return;
          } else if (typeof val === "bigint") {
            if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema"))
              return;
            vals.push(Number(val));
          } else {
            vals.push(val);
          }
        }
        if (vals.length === 0) ;
        else if (vals.length === 1) {
          const val = vals[0];
          json.type = val === null ? "null" : typeof val;
          if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
            json.enum = [val];
          } else {
            json.const = val;
          }
        } else {
          if (vals.every((v2) => typeof v2 === "number"))
            json.type = "number";
          if (vals.every((v2) => typeof v2 === "string"))
            json.type = "string";
          if (vals.every((v2) => typeof v2 === "boolean"))
            json.type = "boolean";
          if (vals.every((v2) => v2 === null))
            json.type = "null";
          json.enum = vals;
        }
      };
      const customProcessor = (schema, ctx, json, params) => {
        handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
      };
      const transformProcessor = (schema, ctx, json, params) => {
        handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
      };
      const arrayProcessor = (schema, ctx, _json, params) => {
        const json = _json;
        const def = schema._zod.def;
        const { minimum, maximum } = aggregateChecks(schema);
        if (typeof minimum === "number")
          json.minItems = minimum;
        if (typeof maximum === "number")
          json.maxItems = maximum;
        json.type = "array";
        json.items = processSchema(def.element, ctx, {
          ...params,
          path: [...params.path, "items"]
        });
      };
      function inputOptin(schema) {
        const def = schema._zod.def;
        if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) {
          return inputOptin(def.out);
        }
        if (def.type === "catch") {
          return inputOptin(def.innerType);
        }
        return schema._zod.optin;
      }
      const objectProcessor = (schema, ctx, _json, params) => {
        const json = _json;
        const def = schema._zod.def;
        const shape = def.shape;
        const symbolKeys = Object.getOwnPropertySymbols(shape);
        if (symbolKeys.length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) {
          return;
        }
        json.type = "object";
        json.properties = {};
        for (const key in shape) {
          assignProp(json.properties, key, processSchema(shape[key], ctx, {
            ...params,
            path: [...params.path, "properties", key]
          }));
        }
        const allKeys = new Set(Object.keys(shape));
        const requiredKeys = new Set([...allKeys].filter((key) => {
          const field2 = def.shape[key];
          if (ctx.io === "input") {
            return inputOptin(field2) === void 0;
          } else {
            return field2._zod.optout === void 0;
          }
        }));
        if (requiredKeys.size > 0) {
          json.required = Array.from(requiredKeys);
        }
        if (def.catchall?._zod.def.type === "never") {
          json.additionalProperties = false;
        } else if (!def.catchall) {
          if (ctx.io === "output")
            json.additionalProperties = false;
        } else if (def.catchall) {
          json.additionalProperties = processSchema(def.catchall, ctx, {
            ...params,
            path: [...params.path, "additionalProperties"]
          });
        }
      };
      const unionProcessor = (schema, ctx, json, params) => {
        const def = schema._zod.def;
        const isExclusive = def.inclusive === false;
        const options = def.options.map((x, i2) => processSchema(x, ctx, {
          ...params,
          path: [...params.path, isExclusive ? "oneOf" : "anyOf", i2]
        }));
        if (isExclusive) {
          json.oneOf = options;
        } else {
          json.anyOf = options;
        }
      };
      const intersectionProcessor = (schema, ctx, json, params) => {
        const def = schema._zod.def;
        const a2 = processSchema(def.left, ctx, {
          ...params,
          path: [...params.path, "allOf", 0]
        });
        const b2 = processSchema(def.right, ctx, {
          ...params,
          path: [...params.path, "allOf", 1]
        });
        const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
        const allOf = [
          ...isSimpleIntersection(a2) ? a2.allOf : [a2],
          ...isSimpleIntersection(b2) ? b2.allOf : [b2]
        ];
        json.allOf = allOf;
        ctx.intersections.push(allOf);
      };
      function stringifyKeyNames(bySchema, json, visited) {
        if (json.$ref) {
          if (visited.has(json))
            return json;
          visited.add(json);
          const def = bySchema.get(json)?.def;
          if (!def)
            return json;
          const inlined = stringifyKeyNames(bySchema, def, visited);
          return inlined === def ? json : inlined;
        }
        for (const keyword of ["anyOf", "oneOf"]) {
          const branches = json[keyword];
          if (!Array.isArray(branches))
            continue;
          const mapped = branches.map((branch) => stringifyKeyNames(bySchema, branch, visited));
          if (mapped.some((branch, i2) => branch !== branches[i2]))
            json = { ...json, [keyword]: mapped };
        }
        const types = Array.isArray(json.type) ? json.type : [json.type];
        const numericType = !types.includes("string") && types.some((t2) => t2 === "number" || t2 === "integer");
        const values = json.enum ?? (json.const !== void 0 ? [json.const] : void 0);
        if (!numericType && !values?.some((v2) => typeof v2 === "number"))
          return json;
        const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format, id, ...rest } = json;
        if (rest.enum)
          rest.enum = rest.enum.map((v2) => typeof v2 === "number" ? String(v2) : v2);
        else if (typeof rest.const === "number")
          rest.const = String(rest.const);
        if (!numericType)
          return rest;
        rest.type = "string";
        if (!values)
          rest.pattern = (types.includes("number") ? number$1 : integer).source;
        return rest;
      }
      const pendingRecords = new WeakMap();
      function rewriteKeyNames(ctx) {
        const bySchema = new Map();
        for (const entry of ctx.seen.values()) {
          if (entry.def && !bySchema.has(entry.schema))
            bySchema.set(entry.schema, entry);
        }
        const rewrites = new Map();
        for (const record2 of pendingRecords.get(ctx) ?? []) {
          const seen2 = ctx.seen.get(record2);
          const names = (seen2?.def ?? seen2?.schema)?.propertyNames;
          if (!names || names === true || rewrites.has(names))
            continue;
          const rewritten = stringifyKeyNames(bySchema, names, new Set());
          if (rewritten !== names)
            rewrites.set(names, rewritten);
        }
        if (!rewrites.size)
          return;
        for (const entry of ctx.seen.values()) {
          for (const carrier of [entry.schema, entry.def]) {
            const rewritten = carrier && rewrites.get(carrier.propertyNames);
            if (rewritten)
              carrier.propertyNames = rewritten;
          }
        }
      }
      const recordProcessor = (schema, ctx, _json, params) => {
        const json = _json;
        const def = schema._zod.def;
        json.type = "object";
        const keyType = def.keyType;
        const patterns = aggregateChecks(keyType).patterns;
        if (def.mode === "loose" && patterns && patterns.size > 0) {
          const valueSchema = processSchema(def.valueType, ctx, {
            ...params,
            path: [...params.path, "patternProperties", "*"]
          });
          json.patternProperties = {};
          for (const pattern2 of patterns) {
            assignProp(json.patternProperties, exactPattern(pattern2).source, valueSchema);
          }
        } else {
          if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
            json.propertyNames = processSchema(def.keyType, ctx, {
              ...params,
              path: [...params.path, "propertyNames"]
            });
            let pending = pendingRecords.get(ctx);
            if (!pending) {
              pending = [];
              pendingRecords.set(ctx, pending);
              ctx.deferred.push(() => rewriteKeyNames(ctx));
            }
            pending.push(schema);
          }
          json.additionalProperties = processSchema(def.valueType, ctx, {
            ...params,
            path: [...params.path, "additionalProperties"]
          });
        }
        const keyValues = keyType._zod.values;
        const omittableOnInput = ctx.io === "input" && inputOptin(def.valueType) !== void 0;
        if (keyValues && !def.partial && !omittableOnInput) {
          const validKeyValues = [...keyValues].filter((v2) => typeof v2 === "string" || typeof v2 === "number");
          if (validKeyValues.length > 0) {
            json.required = validKeyValues.map(String);
          }
        }
      };
      const nullableProcessor = (schema, ctx, json, params) => {
        const def = schema._zod.def;
        const inner = processSchema(def.innerType, ctx, params);
        const seen2 = ctx.seen.get(schema);
        if (ctx.target === "openapi-3.0") {
          seen2.ref = def.innerType;
          json.nullable = true;
        } else {
          json.anyOf = [inner, { type: "null" }];
        }
      };
      const nonoptionalProcessor = (schema, ctx, _json, params) => {
        const def = schema._zod.def;
        processSchema(def.innerType, ctx, params);
        const seen2 = ctx.seen.get(schema);
        seen2.ref = def.innerType;
      };
      const UNREPRESENTABLE_DEFAULT = Symbol();
      function serializeDefaultValue(value, schema, ctx, json, params) {
        let unrepresentable = false;
        const serialized = JSON.stringify(value, (_, val) => {
          if (typeof val !== "bigint")
            return val;
          unrepresentable = true;
          return null;
        });
        if (!unrepresentable)
          return JSON.parse(serialized);
        handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
        return UNREPRESENTABLE_DEFAULT;
      }
      const defaultProcessor = (schema, ctx, json, params) => {
        const def = schema._zod.def;
        processSchema(def.innerType, ctx, params);
        const seen2 = ctx.seen.get(schema);
        seen2.ref = def.innerType;
        const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
        if (value !== UNREPRESENTABLE_DEFAULT)
          json.default = value;
      };
      const prefaultProcessor = (schema, ctx, json, params) => {
        const def = schema._zod.def;
        processSchema(def.innerType, ctx, params);
        const seen2 = ctx.seen.get(schema);
        seen2.ref = def.innerType;
        if (ctx.io !== "input")
          return;
        const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
        if (value !== UNREPRESENTABLE_DEFAULT)
          json._prefault = value;
      };
      const catchProcessor = (schema, ctx, json, params) => {
        const def = schema._zod.def;
        processSchema(def.innerType, ctx, params);
        const seen2 = ctx.seen.get(schema);
        seen2.ref = def.innerType;
        let catchValue;
        try {
          catchValue = def.catchValue(void 0);
        } catch {
          handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
          return;
        }
        json.default = catchValue;
      };
      const pipeProcessor = (schema, ctx, _json, params) => {
        const def = schema._zod.def;
        const inIsTransform = def.in._zod.traits.has("$ZodTransform");
        const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
        processSchema(innerType, ctx, params);
        const seen2 = ctx.seen.get(schema);
        seen2.ref = innerType;
      };
      const readonlyProcessor = (schema, ctx, json, params) => {
        const def = schema._zod.def;
        processSchema(def.innerType, ctx, params);
        const seen2 = ctx.seen.get(schema);
        seen2.ref = def.innerType;
        json.readOnly = true;
      };
      const optionalProcessor = (schema, ctx, _json, params) => {
        const def = schema._zod.def;
        processSchema(def.innerType, ctx, params);
        const seen2 = ctx.seen.get(schema);
        seen2.ref = def.innerType;
      };
      const _installedErrorProtos = new WeakSet([Object.prototype, Error.prototype]);
      function _lazyMethod(proto, key, make) {
        Object.defineProperty(proto, key, {
          configurable: true,
          enumerable: false,
          get() {
            const value = make(this);
            Object.defineProperty(this, key, { value, configurable: true, writable: true });
            return value;
          },
          set(value) {
            Object.defineProperty(this, key, { value, configurable: true, writable: true });
          }
        });
      }
      const initializer = (inst, issues) => {
        $ZodError.init(inst, issues);
        inst.name = "ZodError";
        const proto = Object.getPrototypeOf(inst);
        if (_installedErrorProtos.has(proto))
          return;
        _installedErrorProtos.add(proto);
        _lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
        _lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
        _lazyMethod(proto, "addIssue", (self) => (issue2) => {
          self.issues.push(issue2);
          self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
        });
        _lazyMethod(proto, "addIssues", (self) => (issues2) => {
          self.issues.push(...issues2);
          self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
        });
        Object.defineProperty(proto, "isEmpty", {
          configurable: true,
          enumerable: false,
          get() {
            return this.issues.length === 0;
          }
        });
      };
      const ZodRealError = $constructor("ZodError", initializer, void 0, {
        Parent: Error
      });
      const parse$1 = _parse(ZodRealError);
      const parseAsync = _parseAsync(ZodRealError);
      const safeParse = _safeParse(ZodRealError);
      const safeParseAsync = _safeParseAsync(ZodRealError);
      const encode = _encode(ZodRealError);
      const decode = _decode(ZodRealError);
      const encodeAsync = _encodeAsync(ZodRealError);
      const decodeAsync = _decodeAsync(ZodRealError);
      const safeEncode = _safeEncode(ZodRealError);
      const safeDecode = _safeDecode(ZodRealError);
      const safeEncodeAsync = _safeEncodeAsync(ZodRealError);
      const safeDecodeAsync = _safeDecodeAsync(ZodRealError);
      function _ensureDefaultLocale() {
        if (!globalConfig.localeError)
          config$1(en());
      }
      function _ensureDefaultMemoizer() {
        if (!globalConfig.memoizer)
          config$1({ memoizer: memoizer() });
      }
      const ZodType = $constructor("ZodType", (inst, def) => {
        _ensureDefaultLocale();
        $ZodType.init(inst, def);
        inst.def = def;
        inst.type = def.type;
        return inst;
      }, {
        check(...chks) {
          const def = this.def;
          return this.clone(mergeDefs(def, {
            checks: [
              ...def.checks ?? [],
              ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
            ]
          }), { parent: true });
        },
        with(...chks) {
          return this.check(...chks);
        },
        clone(def, params) {
          return clone$1(this, def, params);
        },
        brand() {
          return this;
        },
        register(reg, meta) {
          reg.add(this, meta);
          return this;
        },
        refine(check, params) {
          return this.check(refine(check, params));
        },
        superRefine(refinement, params) {
          return this.check(superRefine(refinement, params));
        },
        overwrite(fn) {
          return this.check( _overwrite(fn));
        },
        optional() {
          return optional(this);
        },
        exactOptional() {
          return exactOptional(this);
        },
        nullable() {
          return nullable(this);
        },
        nullish() {
          return optional(nullable(this));
        },
        nonoptional(params) {
          return nonoptional(this, params);
        },
        array() {
          return array(this);
        },
        or(arg) {
          return union([this, arg]);
        },
        and(arg) {
          return intersection(this, arg);
        },
        transform(tx) {
          return pipe(this, transform(tx));
        },
        default(d2) {
          return _default(this, d2);
        },
        prefault(d2) {
          return prefault(this, d2);
        },
        catch(params) {
          return _catch(this, params);
        },
        pipe(target) {
          return pipe(this, target);
        },
        readonly() {
          return readonly(this);
        },
        describe(description) {
          const cl = this.clone();
          globalRegistry.add(cl, { description });
          return cl;
        },
        meta(...args) {
          if (args.length === 0)
            return globalRegistry.get(this);
          const cl = this.clone();
          globalRegistry.add(cl, args[0]);
          return cl;
        },
        isOptional() {
          return this.safeParse(void 0).success;
        },
        isNullable() {
          return this.safeParse(null).success;
        },
        apply(fn, ...args) {
          return args.length === 0 ? fn(this) : fn(this, ...args);
        },
get "~standard"() {
          return hide(this, "~standard", {
            ...standardProps(this),
            jsonSchema: {
              input: createStandardJSONSchemaMethod(this, "input"),
              output: createStandardJSONSchemaMethod(this, "output")
            }
          });
        },
        set "~standard"(value) {
          own(this, "~standard", value);
        },
        parse: function _parse2(data, params) {
          return parse$1(this, data, params, { callee: _parse2 });
        },
        parseAsync: async function _parseAsync2(data, params) {
          return await parseAsync(this, data, params, { callee: _parseAsync2 });
        },
        safeParse(data, params) {
          return safeParse(this, data, params);
        },
        async safeParseAsync(data, params) {
          return safeParseAsync(this, data, params);
        },
get spa() {
          return this?.safeParseAsync;
        },
        set spa(value) {
          own(this, "spa", value);
        },
        validate(data, params) {
          return validate(this, data, params);
        },
        validateAsync(data, params) {
          return validateAsync$1(this, data, params);
        },
        encode: function _encode2(data, params) {
          return encode(this, data, params, { callee: _encode2 });
        },
        decode: function _decode2(data, params) {
          return decode(this, data, params, { callee: _decode2 });
        },
        encodeAsync: async function _encodeAsync2(data, params) {
          return await encodeAsync(this, data, params, { callee: _encodeAsync2 });
        },
        decodeAsync: async function _decodeAsync2(data, params) {
          return await decodeAsync(this, data, params, { callee: _decodeAsync2 });
        },
        safeEncode(data, params) {
          return safeEncode(this, data, params);
        },
        safeDecode(data, params) {
          return safeDecode(this, data, params);
        },
        async safeEncodeAsync(data, params) {
          return safeEncodeAsync(this, data, params);
        },
        async safeDecodeAsync(data, params) {
          return safeDecodeAsync(this, data, params);
        },
        toJSONSchema(params) {
          return createToJSONSchemaMethod(this, {})(params);
        },
get description() {
          return globalRegistry.get(this)?.description;
        },
get _def() {
          return this._zod.def;
        }
      });
      const _ZodString = $constructor(
        "_ZodString",
        (inst, def) => {
          $ZodString.init(inst, def);
          ZodType.init(inst, def);
          inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json);
        },
derived({
          format: (inst) => aggregateChecks(inst).format ?? null,
          minLength: (inst) => aggregateChecks(inst).minimum ?? null,
          maxLength: (inst) => aggregateChecks(inst).maximum ?? null
        }, {
          regex(...args) {
            return this.check( _regex(...args));
          },
          includes(...args) {
            return this.check( _includes(...args));
          },
          startsWith(...args) {
            return this.check( _startsWith(...args));
          },
          endsWith(...args) {
            return this.check( _endsWith(...args));
          },
          min(...args) {
            return this.check( _minLength(...args));
          },
          max(...args) {
            return this.check( _maxLength(...args));
          },
          length(...args) {
            return this.check( _length(...args));
          },
          nonempty(...args) {
            return this.check( _minLength(1, ...args));
          },
          lowercase(params) {
            return this.check( _lowercase(params));
          },
          uppercase(params) {
            return this.check( _uppercase(params));
          },
          trim() {
            return this.check( _trim());
          },
          normalize(...args) {
            return this.check( _normalize(...args));
          },
          toLowerCase() {
            return this.check( _toLowerCase());
          },
          toUpperCase() {
            return this.check( _toUpperCase());
          },
          slugify() {
            return this.check( _slugify());
          }
        })
      );
      const ZodString = $constructor("ZodString", (inst, def) => {
        $ZodString.init(inst, def);
        _ZodString.init(inst, def);
      }, {
        email(params) {
          return this.check( _email(ZodEmail, params));
        },
        url(params) {
          return this.check( _url(ZodURL, params));
        },
        jwt(params) {
          return this.check( _jwt(ZodJWT, params));
        },
        emoji(params) {
          return this.check( _emoji(ZodEmoji, params));
        },
        guid(params) {
          return this.check( _guid(ZodGUID, params));
        },
        uuid(params) {
          return this.check( _uuid(ZodUUID, params));
        },
        uuidv4(params) {
          return this.check( _uuidv4(ZodUUID, params));
        },
        uuidv6(params) {
          return this.check( _uuidv6(ZodUUID, params));
        },
        uuidv7(params) {
          return this.check( _uuidv7(ZodUUID, params));
        },
        nanoid(params) {
          return this.check( _nanoid(ZodNanoID, params));
        },
        cuid(params) {
          return this.check( _cuid(ZodCUID, params));
        },
        cuid2(params) {
          return this.check( _cuid2(ZodCUID2, params));
        },
        ulid(params) {
          return this.check( _ulid(ZodULID, params));
        },
        base64(params) {
          return this.check( _base64(ZodBase64, params));
        },
        base64url(params) {
          return this.check( _base64url(ZodBase64URL, params));
        },
        xid(params) {
          return this.check( _xid(ZodXID, params));
        },
        ksuid(params) {
          return this.check( _ksuid(ZodKSUID, params));
        },
        ipv4(params) {
          return this.check( _ipv4(ZodIPv4, params));
        },
        ipv6(params) {
          return this.check( _ipv6(ZodIPv6, params));
        },
        cidrv4(params) {
          return this.check( _cidrv4(ZodCIDRv4, params));
        },
        cidrv6(params) {
          return this.check( _cidrv6(ZodCIDRv6, params));
        },
        e164(params) {
          return this.check( _e164(ZodE164, params));
        },
        datetime(params) {
          return this.check( _isoDateTime(ZodISODateTime, params));
        },
        date(params) {
          return this.check( _isoDate(ZodISODate, params));
        },
        time(params) {
          return this.check( _isoTime(ZodISOTime, params));
        },
        duration(params) {
          return this.check( _isoDuration(ZodISODuration, params));
        }
      });
      function string(params) {
        return _string(ZodString, params);
      }
      const ZodStringFormat = $constructor("ZodStringFormat", (inst, def) => {
        $ZodStringFormat.init(inst, def);
        _ZodString.init(inst, def);
      });
      const ZodISODateTime = $constructor("ZodISODateTime", (inst, def) => {
        $ZodISODateTime.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodISODate = $constructor("ZodISODate", (inst, def) => {
        $ZodISODate.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodISOTime = $constructor("ZodISOTime", (inst, def) => {
        $ZodISOTime.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodISODuration = $constructor("ZodISODuration", (inst, def) => {
        $ZodISODuration.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodEmail = $constructor("ZodEmail", (inst, def) => {
        $ZodEmail.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodGUID = $constructor("ZodGUID", (inst, def) => {
        $ZodGUID.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodUUID = $constructor("ZodUUID", (inst, def) => {
        $ZodUUID.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodURL = $constructor("ZodURL", (inst, def) => {
        $ZodURL.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      function url(params) {
        return _url(ZodURL, params);
      }
      const ZodEmoji = $constructor("ZodEmoji", (inst, def) => {
        $ZodEmoji.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodNanoID = $constructor("ZodNanoID", (inst, def) => {
        $ZodNanoID.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodCUID = $constructor("ZodCUID", (inst, def) => {
        $ZodCUID.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodCUID2 = $constructor("ZodCUID2", (inst, def) => {
        $ZodCUID2.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodULID = $constructor("ZodULID", (inst, def) => {
        $ZodULID.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodXID = $constructor("ZodXID", (inst, def) => {
        $ZodXID.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodKSUID = $constructor("ZodKSUID", (inst, def) => {
        $ZodKSUID.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodIPv4 = $constructor("ZodIPv4", (inst, def) => {
        $ZodIPv4.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodIPv6 = $constructor("ZodIPv6", (inst, def) => {
        $ZodIPv6.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodCIDRv4 = $constructor("ZodCIDRv4", (inst, def) => {
        $ZodCIDRv4.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodCIDRv6 = $constructor("ZodCIDRv6", (inst, def) => {
        $ZodCIDRv6.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodBase64 = $constructor("ZodBase64", (inst, def) => {
        $ZodBase64.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodBase64URL = $constructor("ZodBase64URL", (inst, def) => {
        $ZodBase64URL.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodE164 = $constructor("ZodE164", (inst, def) => {
        $ZodE164.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodJWT = $constructor("ZodJWT", (inst, def) => {
        $ZodJWT.init(inst, def);
        ZodStringFormat.init(inst, def);
      });
      const ZodNumber = $constructor(
        "ZodNumber",
        (inst, def) => {
          $ZodNumber.init(inst, def);
          ZodType.init(inst, def);
          inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
          inst.isFinite = true;
        },
derived({
          minValue: (inst) => {
            const { minimum, exclusiveMinimum } = aggregateChecks(inst);
            return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
          },
          maxValue: (inst) => {
            const { maximum, exclusiveMaximum } = aggregateChecks(inst);
            return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
          },
          isInt: (inst) => {
            const { isInt, multipleOf } = aggregateChecks(inst);
            return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
          },
          format: (inst) => aggregateChecks(inst).format ?? null
        }, {
          gt(value, params) {
            return this.check( _gt(value, params));
          },
          gte(value, params) {
            return this.check( _gte(value, params));
          },
          min(value, params) {
            return this.check( _gte(value, params));
          },
          lt(value, params) {
            return this.check( _lt(value, params));
          },
          lte(value, params) {
            return this.check( _lte(value, params));
          },
          max(value, params) {
            return this.check( _lte(value, params));
          },
          int(params) {
            return this.check(int(params));
          },
          safe(params) {
            return this.check(int(params));
          },
          positive(params) {
            return this.check( _gt(0, params));
          },
          nonnegative(params) {
            return this.check( _gte(0, params));
          },
          negative(params) {
            return this.check( _lt(0, params));
          },
          nonpositive(params) {
            return this.check( _lte(0, params));
          },
          multipleOf(value, params) {
            return this.check( _multipleOf(value, params));
          },
          step(value, params) {
            return this.check( _multipleOf(value, params));
          },
          finite() {
            return this;
          }
        })
      );
      function number(params) {
        return _number(ZodNumber, params);
      }
      const ZodNumberFormat = $constructor("ZodNumberFormat", (inst, def) => {
        $ZodNumberFormat.init(inst, def);
        ZodNumber.init(inst, def);
      });
      function int(params) {
        return _int(ZodNumberFormat, params);
      }
      const ZodBoolean = $constructor("ZodBoolean", (inst, def) => {
        $ZodBoolean.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json);
      });
      function boolean(params) {
        return _boolean(ZodBoolean, params);
      }
      const ZodUnknown = $constructor("ZodUnknown", (inst, def) => {
        $ZodUnknown.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor();
      });
      function unknown() {
        return _unknown(ZodUnknown);
      }
      const ZodNever = $constructor("ZodNever", (inst, def) => {
        $ZodNever.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json);
      });
      function never(params) {
        return _never(ZodNever, params);
      }
      const ZodArray = $constructor("ZodArray", (inst, def) => {
        _ensureDefaultMemoizer();
        $ZodArray.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
        inst.element = def.element;
      }, {
        min(n2, params) {
          return this.check( _minLength(n2, params));
        },
        nonempty(params) {
          return this.check( _minLength(1, params));
        },
        max(n2, params) {
          return this.check( _maxLength(n2, params));
        },
        length(n2, params) {
          return this.check( _length(n2, params));
        },
        unwrap() {
          return this.element;
        }
      });
      function array(element, params) {
        return _array(ZodArray, element, params);
      }
      const ZodObject = $constructor("ZodObject", (inst, def) => {
        _ensureDefaultMemoizer();
        $ZodObjectJIT.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
        installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
      }, {
        keyof() {
          return _enum(Object.keys(this._zod.def.shape));
        },
        catchall(catchall) {
          return this.clone(mergeDefs(this._zod.def, { catchall }));
        },
        passthrough() {
          return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
        },
        loose() {
          return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
        },
        strict() {
          return this.clone(mergeDefs(this._zod.def, { catchall: never() }));
        },
        strip() {
          return this.clone(mergeDefs(this._zod.def, { catchall: void 0 }));
        },
        extend(incoming) {
          return extend(this, incoming);
        },
        safeExtend(incoming) {
          return safeExtend(this, incoming);
        },
        merge(other) {
          return merge(this, other);
        },
        pick(mask) {
          return pick(this, mask);
        },
        omit(mask) {
          return omit(this, mask);
        },
        partial(...args) {
          return partial(ZodOptional, this, args[0]);
        },
        exactPartial(...args) {
          return partial(ZodExactOptional, this, args[0], "exactPartial");
        },
        required(...args) {
          return required(ZodNonOptional, this, args[0]);
        }
      });
      function strictObject(shape, params) {
        return new ZodObject({
          type: "object",
          shape,
          catchall: never(),
          ...normalizeParams(params)
        });
      }
      const ZodUnion = $constructor("ZodUnion", (inst, def) => {
        $ZodUnion.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
        inst.options = def.options;
      });
      function union(options, params) {
        return new ZodUnion({
          type: "union",
          options,
          ...normalizeParams(params)
        });
      }
      const ZodIntersection = $constructor("ZodIntersection", (inst, def) => {
        $ZodIntersection.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
      });
      function intersection(left, right) {
        return new ZodIntersection({
          type: "intersection",
          left,
          right
        });
      }
      const ZodRecord = $constructor("ZodRecord", (inst, def) => {
        _ensureDefaultMemoizer();
        $ZodRecord.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
        inst.keyType = def.keyType;
        inst.valueType = def.valueType;
      });
      function record$1(keyType, valueType, params) {
        if (!valueType || !valueType._zod) {
          return new ZodRecord({
            type: "record",
            keyType: string(),
            valueType: keyType,
            ...normalizeParams(valueType)
          });
        }
        return new ZodRecord({
          type: "record",
          keyType,
          valueType,
          ...normalizeParams(params)
        });
      }
      const ZodEnum = $constructor("ZodEnum", (inst, def) => {
        $ZodEnum.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json);
        inst.enum = def.entries;
        inst.options = [...inst._zod.values];
        const keys = new Set(Object.keys(def.entries));
        inst.extract = (values, params) => {
          const newEntries = {};
          for (const value of values) {
            if (keys.has(value)) {
              newEntries[value] = def.entries[value];
            } else
              throw new Error(`Key ${value} not found in enum`);
          }
          return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries
          });
        };
        inst.exclude = (values, params) => {
          const newEntries = { ...def.entries };
          for (const value of values) {
            if (keys.has(value)) {
              delete newEntries[value];
            } else
              throw new Error(`Key ${value} not found in enum`);
          }
          return new ZodEnum({
            ...def,
            checks: [],
            ...normalizeParams(params),
            entries: newEntries
          });
        };
      });
      function _enum(values, params) {
        const entries = Array.isArray(values) ? Object.fromEntries(values.map((v2) => [v2, v2])) : values;
        return new ZodEnum({
          type: "enum",
          entries,
          ...normalizeParams(params)
        });
      }
      const ZodLiteral = $constructor("ZodLiteral", (inst, def) => {
        $ZodLiteral.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
        inst.values = new Set(def.values);
        Object.defineProperty(inst, "value", {
          get() {
            if (def.values.length > 1) {
              throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
            }
            return def.values[0];
          }
        });
      });
      function literal(value, params) {
        return new ZodLiteral({
          type: "literal",
          values: Array.isArray(value) ? value : [value],
          ...normalizeParams(params)
        });
      }
      const ZodTransform = $constructor("ZodTransform", (inst, def) => {
        _ensureDefaultMemoizer();
        $ZodTransform.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
        inst._zod.parse = (payload, _ctx) => {
          if (_ctx.direction === "backward") {
            throw new $ZodEncodeError(inst.constructor.name);
          }
          payload.addIssue = (issue$1) => {
            if (typeof issue$1 === "string") {
              payload.issues.push(issue(issue$1, payload.value, def));
            } else {
              const _issue = issue$1;
              if (_issue.fatal)
                _issue.continue = false;
              _issue.code ?? (_issue.code = "custom");
              if (!("input" in _issue))
                _issue.input = payload.value;
              _issue.inst ?? (_issue.inst = inst);
              payload.issues.push(issue(_issue));
            }
          };
          const output = def.transform(payload.value, payload);
          if (output instanceof Promise) {
            return output.then((output2) => {
              payload.value = output2;
              return payload;
            });
          }
          payload.value = output;
          return payload;
        };
      });
      function transform(fn) {
        return new ZodTransform({
          type: "transform",
          transform: fn
        });
      }
      const ZodOptional = $constructor("ZodOptional", (inst, def) => {
        $ZodOptional.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
        inst.unwrap = () => inst._zod.def.innerType;
      });
      function optional(innerType) {
        return new ZodOptional({
          type: "optional",
          innerType
        });
      }
      const ZodExactOptional = $constructor("ZodExactOptional", (inst, def) => {
        $ZodExactOptional.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
        inst.unwrap = () => inst._zod.def.innerType;
      });
      function exactOptional(innerType) {
        return new ZodExactOptional({
          type: "optional",
          innerType
        });
      }
      const ZodNullable = $constructor("ZodNullable", (inst, def) => {
        $ZodNullable.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
        inst.unwrap = () => inst._zod.def.innerType;
      });
      function nullable(innerType) {
        return new ZodNullable({
          type: "nullable",
          innerType
        });
      }
      const ZodDefault = $constructor("ZodDefault", (inst, def) => {
        $ZodDefault.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
        inst.unwrap = () => inst._zod.def.innerType;
        inst.removeDefault = inst.unwrap;
      });
      function _default(innerType, defaultValue) {
        return new ZodDefault({
          type: "default",
          innerType,
          get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
          }
        });
      }
      const ZodPrefault = $constructor("ZodPrefault", (inst, def) => {
        $ZodPrefault.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
        inst.unwrap = () => inst._zod.def.innerType;
      });
      function prefault(innerType, defaultValue) {
        return new ZodPrefault({
          type: "prefault",
          innerType,
          get defaultValue() {
            return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
          }
        });
      }
      const ZodNonOptional = $constructor("ZodNonOptional", (inst, def) => {
        $ZodNonOptional.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
        inst.unwrap = () => inst._zod.def.innerType;
      });
      function nonoptional(innerType, params) {
        return new ZodNonOptional({
          type: "nonoptional",
          innerType,
          ...normalizeParams(params)
        });
      }
      const ZodCatch = $constructor("ZodCatch", (inst, def) => {
        $ZodCatch.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
        inst.unwrap = () => inst._zod.def.innerType;
        inst.removeCatch = inst.unwrap;
      });
      function _catch(innerType, catchValue) {
        return new ZodCatch({
          type: "catch",
          innerType,
          catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
        });
      }
      const ZodPipe = $constructor("ZodPipe", (inst, def) => {
        $ZodPipe.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
        inst.in = def.in;
        inst.out = def.out;
      });
      function pipe(in_, out) {
        return new ZodPipe({
          type: "pipe",
          in: in_,
          out
});
      }
      const ZodReadonly = $constructor("ZodReadonly", (inst, def) => {
        $ZodReadonly.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
        inst.unwrap = () => inst._zod.def.innerType;
      });
      function readonly(innerType) {
        return new ZodReadonly({
          type: "readonly",
          innerType
        });
      }
      const ZodCustom = $constructor("ZodCustom", (inst, def) => {
        $ZodCustom.init(inst, def);
        ZodType.init(inst, def);
        inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
      });
      function refine(fn, _params = {}) {
        return _refine(ZodCustom, fn, _params);
      }
      function superRefine(fn, params) {
        return _superRefine(fn, params);
      }
      const text = string().min(1);
      const origin = url().refine((value) => {
        const u2 = new URL(value);
        return u2.origin === value && u2.protocol === "https:";
      }, "Expected an HTTPS origin without path");
      const path = text.regex(/^[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)*$/, "Expected a simple property path");
      const pattern = text.refine((value) => {
        try {
          new RegExp(value);
          return value.startsWith("^") && value.endsWith("$");
        } catch {
          return false;
        }
      }, "Expected a valid anchored regular expression");
      const template = (keys) => text.refine((value) => [...value.matchAll(/\{(\w+)\}/g)].every((m) => keys.includes(m[1])), `Allowed placeholders: ${keys.join(", ")}`);
      const filenameSchema = strictObject({
        single: template(["title", "author", "id", "date", "site"]),
        batch_item: template(["title", "author", "id", "date", "site", "index"]),
        batch: template(["site", "type", "id", "date", "tagname"])
      });
      const runtimeFields = {
        poll_ms: number().int().min(100).max(1e4),
        debounce_ms: number().int().min(10).max(2e3),
        timeout_ms: number().int().min(1e3).max(12e4)
      };
      const runtimeSchema = strictObject({
        poll_ms: runtimeFields.poll_ms.default(500),
        debounce_ms: runtimeFields.debounce_ms.default(100),
        timeout_ms: runtimeFields.timeout_ms.default(3e4)
      });
      const runtimeOverrideSchema = strictObject({
        poll_ms: runtimeFields.poll_ms.optional(),
        debounce_ms: runtimeFields.debounce_ms.optional(),
        timeout_ms: runtimeFields.timeout_ms.optional()
      });
      const routeSchema = strictObject({
        name: text,
        kind: _enum(["listing", "thread", "entry"]),
        pattern,
        id_group: number().int().min(1).max(20).optional(),
        origins: array(origin).min(1).optional(),
        query_keys: array(text).optional()
      });
      const layoutSchema = strictObject({
        name: text,
        route_names: array(text).default([]),
        root_selector: text,
        row_selector: text,
        link_selector: text,
        title_selector: text.optional(),
        title_attribute: text.optional(),
        exclude_selectors: array(text).default([]),
        empty_selector: text.optional(),
        loading_selector: text.optional(),
activity_selector: text.optional(),
        activity_attribute: text.optional()
      });
      const bodyVars = ["title", "author", "posted_at", "updated_at", "downloaded_at", "url", "views", "replies", "favorites", "frontmatter", "date", "content", "comments", "index", "delimiter", "count", "nested", "missing", "reason"];
      const templateBlockSchema = strictObject({ template: template(bodyVars) });
      const endpoint = template(["base_url", "topic_id", "thread_id", "post_id", "page", "page_size", "order"]);
      const profileSchema = strictObject({
        schema_version: literal(1),
        engine: _enum(["forum-json", "discourse-raw"]),
        transport: _enum(["gm", "fetch"]),
        enabled: boolean().default(true),
        site: strictObject({ id: text.regex(/^[a-z0-9][a-z0-9-]*$/), name: text, base_url: origin, origins: array(origin).min(1), aliases: array(text).default([]) }),
        activation: strictObject({ matches: array(text).min(1), connect: array(text).default([]) }),
        routes: array(routeSchema).min(1),
        batch: strictObject({ layouts: array(layoutSchema).default([]), label_selector: text.optional(), label_attribute: text.optional() }).default({ layouts: [] }),
        runtime: runtimeSchema.prefault({}),
        api: strictObject({
          raw_endpoint: endpoint.optional(),
          json_endpoint: endpoint.optional(),
          thread_endpoint: endpoint.optional(),
          posts_endpoint: endpoint.optional(),
nested_endpoint: endpoint.optional(),
          max_pages: number().int().min(1).max(1e3).default(100),
          page_size: number().int().min(1).max(1e3).default(20),
          page_delay: strictObject({ min_ms: number().min(0).max(6e4).default(100), max_ms: number().min(0).max(6e4).default(100), jitter: number().min(0).max(1).default(0) }).optional(),
          order: _enum(["time_asc", "time_desc", "hot_desc"]).optional(),
          content_format: _enum(["bbcode", "html", "markdown"]).optional(),
          request: strictObject({ credentials: boolean().optional(), accept: text.optional() }).optional(),
          id_extraction: strictObject({ patterns: array(text) }).optional(),
          response: strictObject({ success_field: path.optional(), success_value: union([number(), string(), boolean()]).optional(), data_field: path.optional(), posts_field: path.optional(), nested_posts_field: path.optional() }).optional(),
          fields: record$1(string(), union([path, record$1(string(), path)])).optional()
        }),
        metadata: strictObject({
          title_cleanup: text.optional(),
title_selectors: array(text).optional(),
          tags: array(text).optional(),
          source_url: endpoint.optional()
        }).optional(),
        http: strictObject({ user_agent: text.optional() }).optional(),
        page_separator: string().optional(),
        delimiter: string().default("---"),
        frontmatter: templateBlockSchema.optional(),
        document: templateBlockSchema.optional(),
        comment: templateBlockSchema.optional(),
        comments_header: templateBlockSchema.optional(),
        reply: templateBlockSchema.optional(),
        replies_gap: templateBlockSchema.optional(),
        filename: filenameSchema.prefault({ single: "[{id}] {title}", batch_item: "{index} - [{id}] {title}", batch: "[{date}] [{site}] [{type}] [{id}] {tagname}" })
      }).superRefine((p2, ctx) => {
        const fail = (key, message) => ctx.addIssue({ code: "custom", path: key, message });
        if (!p2.site.origins.includes(p2.site.base_url)) fail(["site", "origins"], "Must include site.base_url");
        const names = new Set();
        for (const [i2, route] of p2.routes.entries()) {
          if (names.has(route.name)) fail(["routes", i2, "name"], "Duplicate route name");
          names.add(route.name);
          if (route.kind === "thread" && !route.id_group) fail(["routes", i2, "id_group"], "Thread route requires an ID capture");
          if (route.origins?.some((o2) => !p2.site.origins.includes(o2))) fail(["routes", i2, "origins"], "Route origins must belong to site.origins");
        }
        for (const [i2, layout] of p2.batch.layouts.entries()) if (layout.route_names.some((n2) => !names.has(n2))) fail(["batch", "layouts", i2, "route_names"], "Unknown route name");
        const required2 = p2.engine === "forum-json" ? ["thread_endpoint", "posts_endpoint"] : ["raw_endpoint"];
        for (const key of required2) if (!p2.api[key]) fail(["api", key], `Required for ${p2.engine}`);
        if (p2.engine === "forum-json") {
          for (const key of ["success_field", "success_value", "data_field", "posts_field"]) if (p2.api.response?.[key] === void 0) fail(["api", "response", key], "Required for forum-json");
          for (const key of ["title", "author", "content", "posted_at", "updated_at", "views", "replies", "favorites"]) if (typeof p2.api.fields?.[key] !== "string") fail(["api", "fields", key], "Required property path for forum-json");
          const post = p2.api.fields?.post;
          for (const key of ["id", "author", "content", "posted_at"]) if (!post || typeof post === "string" || typeof post[key] !== "string") fail(["api", "fields", "post", key], "Required property path for forum-json");
          if (!p2.api.content_format) fail(["api", "content_format"], "Required for forum-json");
          if (!p2.metadata?.source_url) fail(["metadata", "source_url"], "Required for forum-json");
          for (const key of ["frontmatter", "document", "comment", "comments_header"]) if (!p2[key]) fail([key], "Required for forum-json");
        }
        if (p2.engine === "forum-json" && !p2.api.thread_endpoint?.includes("{thread_id}")) fail(["api", "thread_endpoint"], "Must include {thread_id}");
        if (p2.engine === "discourse-raw" && !p2.api.raw_endpoint?.includes("{topic_id}")) fail(["api", "raw_endpoint"], "Must include {topic_id}");
        if (p2.api.page_delay && p2.api.page_delay.min_ms > p2.api.page_delay.max_ms) fail(["api", "page_delay"], "min_ms must not exceed max_ms");
        if (p2.api.nested_endpoint && !p2.api.nested_endpoint.includes("{post_id}")) fail(["api", "nested_endpoint"], "Must include {post_id}");
        for (const key of ["raw_endpoint", "json_endpoint", "thread_endpoint", "posts_endpoint", "nested_endpoint"]) {
          if (!p2.api[key]) continue;
          try {
            const url2 = new URL(p2.api[key].replace("{base_url}", p2.site.base_url).replace(/\{\w+\}/g, "1"));
            if (url2.protocol !== "https:") fail(["api", key], "Expected an HTTPS endpoint");
            if (!p2.site.origins.includes(url2.origin) && !p2.activation.connect.includes(url2.hostname)) fail(["activation", "connect"], `Missing endpoint host ${url2.hostname}`);
          } catch {
            fail(["api", key], "Invalid endpoint URL");
          }
        }
      });
      class ConfigError extends Error {
        constructor(source, message) {
          super(`${source}: ${message}`);
          this.source = source;
          this.name = "ConfigError";
        }
        code = "INVALID_CONFIG";
      }
      function deepFreeze(value) {
        if (value && typeof value === "object" && !Object.isFrozen(value)) {
          Object.freeze(value);
          for (const child of Object.values(value)) deepFreeze(child);
        }
        return value;
      }
      function normalizeProfile(input, source = "profile") {
        const result = profileSchema.safeParse(input);
        if (!result.success) throw new ConfigError(source, result.error.issues.map((i2) => `${i2.path.join(".") || "<root>"}: ${i2.message}`).join("; "));
        return deepFreeze(result.data);
      }
      function resolveProfiles(inputs) {
        const profiles = Object.create(null);
        const aliases2 = new Map();
        for (const [source, input] of Object.entries(inputs).sort(([a2], [b2]) => a2.localeCompare(b2))) {
          const p2 = normalizeProfile(input, source);
          if (profiles[p2.site.id]) throw new ConfigError(source, `Duplicate site.id ${p2.site.id}`);
          for (const alias of [p2.site.id, p2.site.name, ...p2.site.aliases]) {
            const previous = aliases2.get(alias.toLowerCase());
            if (previous && previous !== p2.site.id) throw new ConfigError(source, `Alias collision: ${alias} (${previous})`);
            aliases2.set(alias.toLowerCase(), p2.site.id);
          }
          profiles[p2.site.id] = p2;
        }
        return deepFreeze(profiles);
      }
      const profileOverrideSchema = strictObject({
        enabled: boolean().optional(),
        document: templateBlockSchema.optional(),
        frontmatter: templateBlockSchema.optional(),
        comment: templateBlockSchema.optional(),
        comments_header: templateBlockSchema.optional(),
        reply: templateBlockSchema.optional(),
        replies_gap: templateBlockSchema.optional(),
        filename: filenameSchema.partial().optional(),
        runtime: runtimeOverrideSchema.optional()
      });
      const userOverridesSchema = strictObject({
        schema_version: literal(1),
        global: profileOverrideSchema.default({}),
        sites: record$1(string(), profileOverrideSchema).default({})
      });
      const OVERRIDES_STORAGE_KEY = "markify_overrides_v1";
      const LEGACY_BACKUP_STORAGE_KEY = "markify_templates_backup_v1";
      function parseUserOverrides(input) {
        const parsed = userOverridesSchema.safeParse(input);
        if (!parsed.success) throw new ConfigError("user overrides", parsed.error.issues.map((i2) => `${i2.path.join(".")}: ${i2.message}`).join("; "));
        return deepFreeze(parsed.data);
      }
      function resolveProfile(profile, layers = []) {
        let result = structuredClone(profile);
        for (const input of layers) {
          const layer = profileOverrideSchema.parse(input);
          result = { ...result, ...layer, filename: { ...result.filename, ...layer.filename }, runtime: { ...result.runtime, ...layer.runtime } };
        }
        return normalizeProfile(result, profile.site.id);
      }
      function applyUserOverrides(profiles, input, invocation = {}) {
        const overrides = parseUserOverrides(input);
        for (const id of Object.keys(overrides.sites)) if (!Object.hasOwn(profiles, id)) throw new ConfigError(`user overrides.sites.${id}`, "Unknown stable site ID");
        return deepFreeze(Object.fromEntries(Object.entries(profiles).map(([id, p2]) => [id, resolveProfile(p2, [overrides.global, overrides.sites[id] ?? {}, invocation])])));
      }
      function resetSiteOverrides(input, siteId) {
        const parsed = parseUserOverrides(input);
        const sites = { ...parsed.sites };
        delete sites[siteId];
        return parseUserOverrides({ ...parsed, sites });
      }
      function migrateLegacyOverrides(legacy, existing) {
        if (existing !== void 0 && existing !== null) return { overrides: parseUserOverrides(existing), warnings: [] };
        const candidate = legacy && typeof legacy === "object" ? legacy.filename : void 0;
        let filename;
        const warnings = [];
        if (candidate !== void 0) {
          const result = filenameSchema.partial().safeParse(candidate);
          if (result.success) {
            filename = { ...result.data, ...result.data.single ? { batch_item: result.data.single } : {} };
            warnings.push("Legacy filename values preserved; their origin as defaults or user customizations is unknown.");
          } else warnings.push("Legacy filenames failed validation; retained in backup for manual recovery.");
        }
        return { overrides: parseUserOverrides({ schema_version: 1, global: filename ? { filename } : {}, sites: {} }), backup: structuredClone(legacy), warnings };
      }
      const compiled = new WeakMap();
      function classifyRoute(input, profile) {
        let url2;
        try {
          url2 = new URL(input);
        } catch {
          return null;
        }
        if (url2.username || url2.password || !profile.site.origins.includes(url2.origin)) return null;
        let rules2 = compiled.get(profile);
        if (!rules2) {
          rules2 = profile.routes.map((route) => ({ route, regex: new RegExp(route.pattern) }));
          compiled.set(profile, rules2);
        }
        const matches = [];
        for (const { route, regex } of rules2) {
          if (route.origins && !route.origins.includes(url2.origin)) continue;
          const match2 = regex.exec(url2.pathname);
          if (!match2) continue;
          const id = route.id_group ? match2[route.id_group] : void 0;
          if (route.kind === "thread" && !id) throw new Error(`INVALID_ROUTE_CAPTURE: ${profile.site.id}/${route.name}`);
          const query = new URLSearchParams();
          for (const key of [...new Set(route.query_keys ?? url2.searchParams.keys())].sort()) for (const value of url2.searchParams.getAll(key)) query.append(key, value);
          matches.push({
            profileId: profile.site.id,
            name: route.name,
            kind: route.kind,
            id,
            url: url2,
            key: `${profile.site.id}:${route.name}:${url2.pathname.replace(/\/$/, "")}?${query}`
          });
        }
        if (matches.length > 1) throw new Error(`AMBIGUOUS_ROUTE: ${profile.site.id}: ${matches.map((m) => m.name).join(", ")}`);
        return matches[0] ?? null;
      }
      function classifyRegistryRoute(input, profiles) {
        const matches = Object.values(profiles).filter((p2) => p2.enabled).map((p2) => classifyRoute(input, p2)).filter((m) => m !== null);
        if (matches.length > 1) throw new Error(`AMBIGUOUS_PROFILE: ${matches.map((m) => m.profileId).join(", ")}`);
        return matches[0] ?? null;
      }
      let cachedConfig = deepFreeze({ adapters: {} });
      function getConfig() {
        return cachedConfig;
      }
      function setConfig(config2) {
        cachedConfig = deepFreeze({ ...structuredClone(config2), adapters: resolveProfiles(config2.adapters) });
      }
      function getAdapterConfig(name) {
        const alias = name.toLowerCase();
        return Object.values(cachedConfig.adapters).find((p2) => [p2.site.id, p2.site.name, ...p2.site.aliases].some((n2) => n2.toLowerCase() === alias));
      }
      function extractIdFromUrl(input, patterns) {
        let url2;
        try {
          url2 = new URL(input);
        } catch {
          return null;
        }
        for (const value of [url2.pathname, url2.href]) for (const pattern2 of patterns) {
          const match2 = new RegExp(pattern2).exec(value);
          if (match2?.[1]) return match2[1];
        }
        return null;
      }
      function interpolate(template2, vars) {
        return template2.replace(/\{(\w+)\}/g, (_, key) => vars[key]?.toString() ?? `{${key}}`);
      }
      const config = Object.freeze( Object.defineProperty({
        __proto__: null,
        ConfigError,
        LEGACY_BACKUP_STORAGE_KEY,
        OVERRIDES_STORAGE_KEY,
        applyUserOverrides,
        classifyRegistryRoute,
        classifyRoute,
        deepFreeze,
        extractIdFromUrl,
        filenameSchema,
        getAdapterConfig,
        getConfig,
        interpolate,
        layoutSchema,
        migrateLegacyOverrides,
        normalizeProfile,
        parseUserOverrides,
        profileOverrideSchema,
        profileSchema,
        resetSiteOverrides,
        resolveProfile,
        resolveProfiles,
        routeSchema,
        runtimeOverrideSchema,
        runtimeSchema,
        setConfig,
        templateBlockSchema,
        userOverridesSchema
      }, Symbol.toStringTag, { value: "Module" }));
      function pageTitle(doc, profile) {
        for (const selector of profile.metadata?.title_selectors ?? []) {
          let text2;
          try {
            text2 = doc.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim();
          } catch {
          }
          if (text2) return text2;
        }
        return profile.metadata?.title_cleanup ? doc.title.replace(new RegExp(profile.metadata.title_cleanup), "").trim() : doc.title;
      }
      class ConversionError extends Error {
        constructor(code, message, details = {}) {
          super(message);
          this.code = code;
          this.details = details;
          this.name = "ConversionError";
        }
      } exports("C", ConversionError);
      function assertNotAborted(signal) {
        if (signal?.aborted) throw new ConversionError("ABORTED", "Export cancelled");
      }
      function readPath(value, path2) {
        for (const key of path2.split(".")) {
          if (!key || ["__proto__", "prototype", "constructor"].includes(key) || !isRecord(value) || !Object.prototype.hasOwnProperty.call(value, key)) return void 0;
          value = value[key];
        }
        return value;
      }
      function isRecord(value) {
        return typeof value === "object" && value !== null && !Array.isArray(value);
      }
      function record(value, path2) {
        if (!isRecord(value)) throw new ConversionError("INVALID_RESPONSE", `Expected object at ${path2}`);
        return value;
      }
      function field(data, key, mapping) {
        const path2 = mapping[key];
        if (typeof path2 !== "string") throw new ConversionError("CONFIG_INVALID", `Missing field mapping: ${key}`);
        return readPath(data, path2);
      }
      function textField(value, path2, allowEmpty = false) {
        if (typeof value !== "string" || !allowEmpty && !value.trim()) throw new ConversionError("INVALID_RESPONSE", `Expected ${allowEmpty ? "" : "nonempty "}string at ${path2}`);
        return value;
      }
      function numberField(value, path2) {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new ConversionError("INVALID_RESPONSE", `Expected nonnegative number at ${path2}`);
        return value;
      }
      function dateField(value, path2) {
        const date2 = new Date(numberField(value, path2) * 1e3);
        if (!Number.isFinite(date2.getTime())) throw new ConversionError("INVALID_RESPONSE", `Invalid timestamp at ${path2}`);
        return date2.toISOString();
      }
      function parseJson(text2, responseConfig, stage) {
        let parsed;
        try {
          parsed = JSON.parse(text2);
        } catch {
          throw new ConversionError("INVALID_RESPONSE", `Malformed JSON during ${stage}`, { stage });
        }
        const result = record(parsed, stage);
        if (typeof responseConfig.success_field === "string" && readPath(result, responseConfig.success_field) !== responseConfig.success_value) {
          throw new ConversionError("API_REJECTED", `API success check failed during ${stage}`, { stage });
        }
        return result;
      }
      function requestOptions(config2, context) {
        const api = record(config2.api, "api");
        const request2 = isRecord(api.request) ? api.request : {};
        const runtime = isRecord(config2.runtime) ? config2.runtime : {};
        return {
credentials: typeof request2.credentials === "boolean" ? request2.credentials : void 0,
          headers: typeof request2.accept === "string" ? { Accept: request2.accept } : {},
          timeoutMs: typeof runtime.timeout_ms === "number" ? runtime.timeout_ms : 3e4,
          signal: context.signal
        };
      }
      const fetchHttpFetcher = {
        async get(url2, options) {
          const response = await fetch(url2, {
            credentials: options?.credentials ? "include" : "same-origin",
            headers: options?.headers,
            signal: options?.signal
          });
          return { ok: response.ok, status: response.status, text: await response.text() };
        }
      };
      async function request(fetcher, url2, options, details) {
        assertNotAborted(options.signal);
        const controller = new AbortController();
        let timeout;
        let rejectAbort = () => {
        };
        const aborted2 = new Promise((_resolve, reject) => {
          rejectAbort = reject;
        });
        const cancel = () => {
          rejectAbort(new ConversionError("ABORTED", "Export cancelled", details));
          controller.abort();
        };
        options.signal?.addEventListener("abort", cancel, { once: true });
        timeout = setTimeout(() => {
          rejectAbort(new ConversionError("TIMEOUT", `Request timed out during ${details.stage}`, details));
          controller.abort();
        }, options.timeoutMs ?? 3e4);
        try {
          const response = await Promise.race([
            fetcher.get(url2, { ...options, signal: controller.signal }),
            aborted2
          ]);
          assertNotAborted(options.signal);
          return response;
        } catch (error2) {
          if (error2 instanceof ConversionError) throw error2;
          assertNotAborted(options.signal);
          throw new ConversionError("NETWORK_ERROR", `Request failed during ${details.stage}`, details);
        } finally {
          clearTimeout(timeout);
          options.signal?.removeEventListener("abort", cancel);
        }
      }
      function requireOk(response, stage) {
        if (!response.ok) throw new ConversionError(
          response.status === 401 || response.status === 403 ? "ACCESS_DENIED" : "HTTP_ERROR",
          `HTTP ${response.status} during ${stage}`,
          { stage, status: response.status }
        );
      }
      async function pageDelay(api, signal) {
        assertNotAborted(signal);
        const config2 = isRecord(api.page_delay) ? api.page_delay : {};
        const min = typeof config2.min_ms === "number" ? config2.min_ms : 0;
        const max = typeof config2.max_ms === "number" ? config2.max_ms : min;
        const jitter = typeof config2.jitter === "number" ? config2.jitter : 0;
        const duration2 = Math.max(0, Math.round((min + Math.random() * (max - min)) * (1 + (Math.random() * 2 - 1) * jitter)));
        if (!duration2) return;
        await new Promise((resolve, reject) => {
          const finish = () => {
            signal?.removeEventListener("abort", cancel);
            resolve();
          };
          const timer = setTimeout(finish, duration2);
          const cancel = () => {
            clearTimeout(timer);
            signal?.removeEventListener("abort", cancel);
            reject(new ConversionError("ABORTED", "Export cancelled"));
          };
          signal?.addEventListener("abort", cancel, { once: true });
        });
      }
      const CODE = /(^|\n)(```|~~~)[^\n]*\n[\s\S]*?\n\2[ \t]*(?=\n|$)|`[^`\n]+`/g;
      function outsideCode(text2, transform2) {
        const codes = [];
        const hidden = text2.replace(CODE, (match2, lead) => `${lead ?? ""}${codes.push(match2.slice((lead ?? "").length)) - 1}`);
        return transform2(hidden).replace(/\uE000(\d+)\uE001/g, (_, index, offset, whole) => {
          const code = codes[Number(index)];
          const prefix = whole.slice(whole.lastIndexOf("\n", offset - 1) + 1, offset);
          return /^(?:> ?)+$/.test(prefix) ? code.replace(/\n/g, `
${prefix}`) : code;
        });
      }
      const quoteLines = (body) => body.trim().split("\n").map((line) => line ? `> ${line}` : ">").join("\n");
      function quoteHeader(attributes, baseUrl) {
        if (!attributes) return "";
        const [name, ...rest] = attributes.split(",").map((part) => part.trim());
        const fields = Object.fromEntries(rest.map((part) => part.split(":").map((value) => value.trim())).filter((pair) => pair.length === 2));
        const link = fields.topic && /^\d+$/.test(fields.topic) ? ` [#${fields.post ?? 1}](${baseUrl}/t/${fields.topic}${fields.post && /^\d+$/.test(fields.post) ? `/${fields.post}` : ""})` : "";
        return name ? `**${name}**${link}:

` : "";
      }
      function discourseToMarkdown(raw, baseUrl) {
        return outsideCode(raw, (text2) => {
          let out = text2.replace(/\]\(upload:\/\/([A-Za-z0-9]+(?:\.[A-Za-z0-9]+)?)\)/g, `](${baseUrl}/uploads/short-url/$1)`).replace(/\[([^\]\n|]+)\|attachment\]\(/g, "[$1](");
          const quote2 = /\[quote(?:="([^"\]]*)")?\]\s*\n?((?:(?!\[quote[=\]])[\s\S])*?)\n?\s*\[\/quote\]/i;
          for (let match2 = out.match(quote2); match2; match2 = out.match(quote2)) {
            const block = `
${quoteLines(quoteHeader(match2[1], baseUrl) + match2[2])}
`;
            out = out.replace(match2[0], () => block);
          }
          return out.replace(
            /\[details(?:=(?:"([^"\]]*)"|([^\]]*)))?\]\s*\n?([\s\S]*?)\n?\s*\[\/details\]/gi,
            (_, quoted, bare, body) => `<details>
<summary>${(quoted ?? bare ?? "Details").trim() || "Details"}</summary>

${body.trim()}

</details>`
          ).replace(/\[spoiler\]\s*\n([\s\S]*?)\n\s*\[\/spoiler\]/gi, (_, body) => `<details>
<summary>Spoiler</summary>

${body.trim()}

</details>`).replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, "$1").replace(/\[poll\b[^\]]*\]\s*\n?/gi, "**Poll:**\n\n").replace(/\n?\s*\[\/poll\]/gi, "").replace(/\n{3,}/g, "\n\n");
        });
      }
      async function topicMetadata(topicId, fetcher, config2, options) {
        const api = record(config2.api, "api");
        const site = record(config2.site, "site");
        if (typeof api.json_endpoint !== "string") return {};
        try {
          const url2 = interpolate(api.json_endpoint, { base_url: String(site.base_url), topic_id: topicId });
          const response = await request(fetcher, url2, { ...options, headers: { ...options.headers, Accept: "application/json" } }, { stage: "topic-json" });
          if (!response.ok) return {};
          const topic = JSON.parse(response.text);
          const metadata = {};
          if (typeof topic.title === "string" && topic.title.trim()) metadata.title = topic.title;
          const creator = isRecord(topic.details) && isRecord(topic.details.created_by) ? topic.details.created_by.username : void 0;
          if (typeof creator === "string") metadata.author = creator;
          if (typeof topic.created_at === "string") metadata.date = topic.created_at;
          const tags = Array.isArray(topic.tags) ? topic.tags.map((tag) => isRecord(tag) ? tag.name : tag).filter((tag) => typeof tag === "string" && !!tag) : [];
          const profileTags = isRecord(config2.metadata) && Array.isArray(config2.metadata.tags) ? config2.metadata.tags.filter((tag) => typeof tag === "string") : [];
          if (tags.length || profileTags.length) metadata.tags = [... new Set([...profileTags, ...tags])];
          if (typeof topic.views === "number") metadata.views = topic.views;
          if (typeof topic.posts_count === "number") metadata.replies = Math.max(0, topic.posts_count - 1);
          if (typeof topic.like_count === "number") metadata.likes = topic.like_count;
          if (typeof topic.last_posted_at === "string") metadata.updated = topic.last_posted_at;
          return metadata;
        } catch (error2) {
          if (error2?.name === "AbortError" || error2?.code === "ABORTED") throw error2;
          return {};
        }
      }
      async function fetchDiscourseThreadState(topicId, fetcher, config2, context = {}) {
        const api = record(config2.api, "api");
        const site = record(config2.site, "site");
        const options = requestOptions(config2, context);
        const url2 = interpolate(textField(api.json_endpoint, "api.json_endpoint"), { base_url: String(site.base_url), topic_id: topicId });
        const response = await request(fetcher, url2, { ...options, headers: { ...options.headers, Accept: "application/json" } }, { stage: "topic-json" });
        requireOk(response, "topic");
        let topic;
        try {
          topic = JSON.parse(response.text);
        } catch {
          throw new ConversionError("INVALID_RESPONSE", "Topic JSON is not valid JSON", { stage: "topic-json" });
        }
        if (!isRecord(topic)) throw new ConversionError("INVALID_RESPONSE", "Topic JSON is not an object", { stage: "topic-json" });
        return {
          replies: typeof topic.posts_count === "number" ? Math.max(0, topic.posts_count - 1) : void 0,
          updated: typeof topic.last_posted_at === "string" ? topic.last_posted_at : void 0
        };
      }
      async function fetchDiscourseRawContent(topicId, fetcher, config2, context = {}) {
        const api = record(config2.api, "api");
        const site = record(config2.site, "site");
        const rawEndpoint = textField(api.raw_endpoint, "api.raw_endpoint");
        const maxPages = numberField(api.max_pages, "api.max_pages");
        const options = requestOptions(config2, context);
        const separator = typeof config2.page_separator === "string" ? config2.page_separator : "\n\n---\n\n";
        const pages = [];
        const seen2 = new Set();
        const baseUrl = String(site.base_url);
        if (context.onMetadata) {
          context.onProgress?.("Fetching topic details");
          const metadata = await topicMetadata(topicId, fetcher ?? fetchHttpFetcher, config2, options);
          if (Object.keys(metadata).length) context.onMetadata(metadata);
        }
        for (let page = 1; page <= maxPages; page++) {
          assertNotAborted(context.signal);
          context.onProgress?.(`Fetching topic page ${page}`);
          const url2 = interpolate(rawEndpoint, { base_url: baseUrl, topic_id: topicId, page });
          const response = await request(fetcher ?? fetchHttpFetcher, url2, options, { stage: "topic", page });
          requireOk(response, "topic");
          if (!response.text.trim()) {
            if (!pages.length) throw new ConversionError("INCOMPLETE_CONTENT", "Topic response contains no content", { stage: "topic", page });
            return pages.map((text2) => discourseToMarkdown(text2, baseUrl)).join(separator);
          }
          if (seen2.has(response.text)) throw new ConversionError("REPEATED_PAGE", "Topic pagination returned a repeated page", { stage: "topic", page });
          seen2.add(response.text);
          pages.push(response.text);
          if (page < maxPages) await pageDelay(api, context.signal);
        }
        throw new ConversionError("PAGE_LIMIT", "Topic page limit reached before an empty terminal page", { stage: "topic", page: maxPages });
      }
      const N$1 = "\n";
      const TAB = "	";
      const EQ = "=";
      const QUOTEMARK = '"';
      const SPACE = " ";
      const OPEN_BRAKET = "[";
      const CLOSE_BRAKET = "]";
      const SLASH = "/";
      const BACKSLASH = "\\";
      function isTagNode(el) {
        return typeof el === "object" && el !== null && "tag" in el;
      }
      function isStringNode(el) {
        return typeof el === "string";
      }
      function keysReduce(obj, reduce2, def) {
        const keys = Object.keys(obj);
        return keys.reduce((acc, key) => reduce2(acc, key, obj), def);
      }
      function getNodeLength(node2) {
        if (isTagNode(node2) && Array.isArray(node2.content)) {
          return node2.content.reduce((count, contentNode) => {
            return count + getNodeLength(contentNode);
          }, 0);
        }
        if (isStringNode(node2)) {
          return String(node2).length;
        }
        return 0;
      }
      function appendToNode(node2, value) {
        if (Array.isArray(node2.content)) {
          node2.content.push(value);
        }
      }
      function escapeAttrValue(value) {
        return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/(javascript|data|vbscript|file):/gi, "$1%3A");
      }
      function attrValue(name, value) {
        switch (typeof value) {
          case "boolean":
            return value ? `${name}` : "";
          case "number":
            return `${name}="${value}"`;
          case "string":
            return `${name}="${escapeAttrValue(value)}"`;
          case "object":
            return `${name}="${escapeAttrValue(JSON.stringify(value))}"`;
          default:
            return "";
        }
      }
      function attrsToString(values) {
        if (values == null) {
          return "";
        }
        return keysReduce(values, (arr, key, obj) => [
          ...arr,
          attrValue(key, obj[key])
        ], [
          ""
        ]).join(" ");
      }
      function getUniqAttr(attrs) {
        return keysReduce(attrs || {}, (res, key, obj) => obj[key] === key ? obj[key] : null, null);
      }
      const getTagAttrs = (tag, params) => {
        const uniqAttr = getUniqAttr(params);
        if (uniqAttr) {
          const tagAttr = attrValue(tag, uniqAttr);
          const attrs = {
            ...params
          };
          delete attrs[String(uniqAttr)];
          const attrsStr = attrsToString(attrs);
          return `${tagAttr}${attrsStr}`;
        }
        return `${tag}${attrsToString(params)}`;
      };
      const toString = (node2, openTag, closeTag) => {
        if (isTagNode(node2)) {
          return node2.toString({
            openTag,
            closeTag
          });
        }
        return String(node2);
      };
      const nodeTreeToString = (content, openTag, closeTag) => {
        if (Array.isArray(content)) {
          return content.reduce((r2, node2) => {
            if (node2 !== null) {
              return r2 + toString(node2, openTag, closeTag);
            }
            return r2;
          }, "");
        }
        if (content) {
          return toString(content, openTag, closeTag);
        }
        return null;
      };
      class TagNode {
        get length() {
          return getNodeLength(this);
        }
        attr(name, value) {
          if (typeof value !== "undefined") {
            this.attrs[name] = value;
          }
          return this.attrs[name];
        }
        append(value) {
          return appendToNode(this, value);
        }
        setStart(value) {
          this.start = value;
        }
        setEnd(value) {
          this.end = value;
        }
        toTagStart({ openTag = OPEN_BRAKET, closeTag = CLOSE_BRAKET } = {}) {
          const tagAttrs = getTagAttrs(String(this.tag), this.attrs);
          return `${openTag}${tagAttrs}${closeTag}`;
        }
        toTagEnd({ openTag = OPEN_BRAKET, closeTag = CLOSE_BRAKET } = {}) {
          return `${openTag}${SLASH}${this.tag}${closeTag}`;
        }
        toTagNode() {
          return new TagNode(this.tag, this.attrs, this.content, this.start, this.end);
        }
        toString({ openTag = OPEN_BRAKET, closeTag = CLOSE_BRAKET } = {}) {
          const content = this.content ? nodeTreeToString(this.content, openTag, closeTag) : "";
          const tagStart = this.toTagStart({
            openTag,
            closeTag
          });
          if (this.content === null || Array.isArray(this.content) && this.content.length === 0) {
            return tagStart;
          }
          return `${tagStart}${content}${this.toTagEnd({
      openTag,
      closeTag
    })}`;
        }
        toJSON() {
          return {
            tag: this.tag,
            attrs: this.attrs,
            content: this.content,
            start: this.start,
            end: this.end
          };
        }
        static create(tag, attrs = {}, content = null, start) {
          return new TagNode(tag, attrs, content, start);
        }
        static isOf(node2, type) {
          return node2.tag === type;
        }
        constructor(tag, attrs, content, start, end) {
          this.tag = tag;
          this.attrs = attrs;
          this.content = content;
          this.start = start;
          this.end = end;
        }
      }
      const TYPE_ID = "t";
      const VALUE_ID = "v";
      const LINE_ID = "l";
      const COLUMN_ID = "r";
      const START_POS_ID = "s";
      const END_POS_ID = "e";
      const TYPE_WORD = 1;
      const TYPE_TAG = 2;
      const TYPE_ATTR_NAME = 3;
      const TYPE_ATTR_VALUE = 4;
      const TYPE_SPACE = 5;
      const TYPE_NEW_LINE = 6;
      const getTokenValue = (token) => {
        if (token && typeof token[VALUE_ID] !== "undefined") {
          return token[VALUE_ID];
        }
        return "";
      };
      const getTokenLine = (token) => token && token[LINE_ID] || 0;
      const getTokenColumn = (token) => token && token[COLUMN_ID] || 0;
      const getStartPosition = (token) => token && token[START_POS_ID] || 0;
      const getEndPosition = (token) => token && token[END_POS_ID] || 0;
      const isTextToken = (token) => {
        if (token && typeof token[TYPE_ID] !== "undefined") {
          return token[TYPE_ID] === TYPE_SPACE || token[TYPE_ID] === TYPE_NEW_LINE || token[TYPE_ID] === TYPE_WORD;
        }
        return false;
      };
      const isTagToken = (token) => {
        if (token && typeof token[TYPE_ID] !== "undefined") {
          return token[TYPE_ID] === TYPE_TAG;
        }
        return false;
      };
      const isTagEnd = (token) => getTokenValue(token).charCodeAt(0) === SLASH.charCodeAt(0);
      const isTagStart = (token) => !isTagEnd(token);
      const isAttrNameToken = (token) => {
        if (token && typeof token[TYPE_ID] !== "undefined") {
          return token[TYPE_ID] === TYPE_ATTR_NAME;
        }
        return false;
      };
      const isAttrValueToken = (token) => {
        if (token && typeof token[TYPE_ID] !== "undefined") {
          return token[TYPE_ID] === TYPE_ATTR_VALUE;
        }
        return false;
      };
      const getTagName = (token) => {
        const value = getTokenValue(token);
        return isTagEnd(token) ? value.slice(1) : value;
      };
      const tokenToText = (token, openTag = OPEN_BRAKET, closeTag = CLOSE_BRAKET) => {
        let text2 = openTag;
        text2 += getTokenValue(token);
        text2 += closeTag;
        return text2;
      };
      class Token {
        get type() {
          return this[TYPE_ID];
        }
        isEmpty() {
          return this[TYPE_ID] === 0 || isNaN(this[TYPE_ID]);
        }
        isText() {
          return isTextToken(this);
        }
        isTag() {
          return isTagToken(this);
        }
        isAttrName() {
          return isAttrNameToken(this);
        }
        isAttrValue() {
          return isAttrValueToken(this);
        }
        isStart() {
          return isTagStart(this);
        }
        isEnd() {
          return isTagEnd(this);
        }
        getName() {
          return getTagName(this);
        }
        getValue() {
          return getTokenValue(this);
        }
        getLine() {
          return getTokenLine(this);
        }
        getColumn() {
          return getTokenColumn(this);
        }
        getStart() {
          return getStartPosition(this);
        }
        getEnd() {
          return getEndPosition(this);
        }
        toString({ openTag = OPEN_BRAKET, closeTag = CLOSE_BRAKET } = {}) {
          return tokenToText(this, openTag, closeTag);
        }
        constructor(type, value, row = 0, col = 0, start = 0, end = 0) {
          this[LINE_ID] = row;
          this[COLUMN_ID] = col;
          this[TYPE_ID] = type || 0;
          this[VALUE_ID] = String(value);
          this[START_POS_ID] = start;
          this[END_POS_ID] = end;
        }
      }
      class CharGrabber {
        skip(num = 1, silent) {
          this.c.pos += num;
          if (this.o && this.o.onSkip && !silent) {
            this.o.onSkip();
          }
        }
        hasNext() {
          return this.c.len > this.c.pos;
        }
        getCurr() {
          if (typeof this.s[this.c.pos] === "undefined") {
            return "";
          }
          return this.s[this.c.pos];
        }
        getPos() {
          return this.c.pos;
        }
        getLength() {
          return this.c.len;
        }
        getRest() {
          return this.s.substring(this.c.pos);
        }
        getNext() {
          const nextPos = this.c.pos + 1;
          return nextPos <= this.s.length - 1 ? this.s[nextPos] : null;
        }
        getPrev() {
          const prevPos = this.c.pos - 1;
          if (typeof this.s[prevPos] === "undefined") {
            return null;
          }
          return this.s[prevPos];
        }
        isLast() {
          return this.c.pos === this.c.len;
        }
        includes(val) {
          return this.s.indexOf(val, this.c.pos) >= 0;
        }
        grabWhile(condition, silent) {
          let start = 0;
          if (this.hasNext()) {
            start = this.c.pos;
            while (this.hasNext() && condition(this.getCurr())) {
              this.skip(1, silent);
            }
          }
          return this.s.substring(start, this.c.pos);
        }
        grabN(num = 0) {
          return this.s.substring(this.c.pos, this.c.pos + num);
        }
substrUntilChar(char) {
          const { pos } = this.c;
          const idx = this.s.indexOf(char, pos);
          return idx >= 0 ? this.s.substring(pos, idx) : "";
        }
        constructor(source, options = {}) {
          this.s = source;
          this.c = {
            pos: 0,
            len: source.length
          };
          this.o = options;
        }
      }
      const createCharGrabber = (source, options) => new CharGrabber(source, options);
      const trimChar = (str, charToRemove) => {
        while (str.charAt(0) === charToRemove) {
          str = str.substring(1);
        }
        while (str.charAt(str.length - 1) === charToRemove) {
          str = str.substring(0, str.length - 1);
        }
        return str;
      };
      const unquote = (str) => str.replace(BACKSLASH + QUOTEMARK, QUOTEMARK);
      const EM = "!";
      function createTokenOfType(type, value, r2 = 0, cl = 0, p2 = 0, e2 = 0) {
        return new Token(type, value, r2, cl, p2, e2);
      }
      const STATE_WORD = 0;
      const STATE_TAG = 1;
      const STATE_TAG_ATTRS = 2;
      const TAG_STATE_NAME = 0;
      const TAG_STATE_ATTR = 1;
      const TAG_STATE_VALUE = 2;
      const WHITESPACES = [
        SPACE,
        TAB
      ];
      const SPECIAL_CHARS = [
        EQ,
        SPACE,
        TAB
      ];
      const END_POS_OFFSET = 2;
      const isWhiteSpace = (char) => WHITESPACES.indexOf(char) >= 0;
      const isEscapeChar = (char) => char === BACKSLASH;
      const isSpecialChar = (char) => SPECIAL_CHARS.indexOf(char) >= 0;
      const isNewLine = (char) => char === N$1;
      const unq = (val) => unquote(trimChar(val, QUOTEMARK));
      function createLexer(buffer, options = {}) {
        let row = 0;
        let prevCol = 0;
        let col = 0;
        let tokenIndex = -1;
        let stateMode = STATE_WORD;
        let tagMode = TAG_STATE_NAME;
        let contextFreeTag = "";
        const tokens = new Array(Math.floor(buffer.length));
        const openTag = options.openTag || OPEN_BRAKET;
        const closeTag = options.closeTag || CLOSE_BRAKET;
        const escapeTags = !!options.enableEscapeTags;
        const contextFreeTags = (options.contextFreeTags || []).filter(Boolean).map((tag) => tag.toLowerCase());
        const caseFreeTags = options.caseFreeTags || false;
        const nestedMap = new Map();
        const onToken = options.onToken || (() => {
        });
        const RESERVED_CHARS = [
          closeTag,
          openTag,
          QUOTEMARK,
          BACKSLASH,
          SPACE,
          TAB,
          EQ,
          N$1,
          EM
        ];
        const NOT_CHAR_TOKENS = [
          openTag,
          SPACE,
          TAB,
          N$1
        ];
        const isCharReserved = (char) => RESERVED_CHARS.indexOf(char) >= 0;
        const isCharToken = (char) => NOT_CHAR_TOKENS.indexOf(char) === -1;
        const isEscapableChar = (char) => char === openTag || char === closeTag || char === BACKSLASH;
        const onSkip = () => {
          col++;
        };
        const setupContextFreeTag = (name, isClosingTag) => {
          if (contextFreeTag !== "" && isClosingTag) {
            contextFreeTag = "";
          }
          const tagName = name.toLowerCase();
          if (contextFreeTag === "" && isTokenNested(name) && contextFreeTags.includes(tagName)) {
            contextFreeTag = tagName;
          }
        };
        const toEndTag = (tagName) => `${openTag}${SLASH}${tagName}${closeTag}`;
        const chars = createCharGrabber(buffer, {
          onSkip
        });
        function emitToken(type, value, startPos, endPos) {
          const token = createTokenOfType(type, value, row, prevCol, startPos, endPos);
          onToken(token);
          prevCol = col;
          tokenIndex += 1;
          tokens[tokenIndex] = token;
        }
        function nextTagState(tagChars, isSingleValueTag, masterStartPos) {
          if (tagMode === TAG_STATE_ATTR) {
            const validAttrName = (char) => !(char === EQ || isWhiteSpace(char));
            const name2 = tagChars.grabWhile(validAttrName);
            const isEnd = tagChars.isLast();
            const isValue = tagChars.getCurr() !== EQ;
            tagChars.skip();
            if (isEnd || isValue) {
              emitToken(TYPE_ATTR_VALUE, unq(name2));
            } else {
              emitToken(TYPE_ATTR_NAME, name2);
            }
            if (isEnd) {
              return TAG_STATE_NAME;
            }
            if (isValue) {
              return TAG_STATE_ATTR;
            }
            return TAG_STATE_VALUE;
          }
          if (tagMode === TAG_STATE_VALUE) {
            let stateSpecial = false;
            const validAttrValue = (char) => {
              const isQM = char === QUOTEMARK;
              const prevChar = tagChars.getPrev();
              const nextChar = tagChars.getNext();
              const isPrevSLASH = prevChar === BACKSLASH;
              const isNextEQ = nextChar === EQ;
              const isWS = isWhiteSpace(char);
              const isNextWS = !!nextChar && isWhiteSpace(nextChar);
              if (stateSpecial && isSpecialChar(char)) {
                return true;
              }
              if (isQM && !isPrevSLASH) {
                stateSpecial = !stateSpecial;
                if (!stateSpecial && !(isNextEQ || isNextWS)) {
                  return false;
                }
              }
              if (!isSingleValueTag) {
                return !isWS;
              }
              return true;
            };
            const name2 = tagChars.grabWhile(validAttrValue);
            tagChars.skip();
            emitToken(TYPE_ATTR_VALUE, unq(name2));
            if (tagChars.getPrev() === QUOTEMARK) {
              prevCol++;
            }
            if (tagChars.isLast()) {
              return TAG_STATE_NAME;
            }
            return TAG_STATE_ATTR;
          }
          const start = masterStartPos + tagChars.getPos() - 1;
          const validName = (char) => !(char === EQ || isWhiteSpace(char) || tagChars.isLast());
          const name = tagChars.grabWhile(validName);
          emitToken(TYPE_TAG, name, start, masterStartPos + tagChars.getLength() + 1);
          setupContextFreeTag(name);
          tagChars.skip();
          prevCol++;
          if (isSingleValueTag) {
            return TAG_STATE_VALUE;
          }
          const hasEQ = tagChars.includes(EQ);
          return hasEQ ? TAG_STATE_ATTR : TAG_STATE_VALUE;
        }
        function stateTag() {
          const currChar = chars.getCurr();
          const nextChar = chars.getNext();
          const isNextCharReserved = Boolean(nextChar && isCharReserved(nextChar));
          chars.skip();
          const substr = chars.substrUntilChar(closeTag);
          const hasInvalidChars = substr.length === 0 || substr.indexOf(openTag) >= 0;
          const isLastChar = chars.isLast();
          const hasSpace = substr.indexOf(SPACE) >= 0;
          const isSpaceRestricted = hasSpace && options.whitespaceInTags === false;
          if (isNextCharReserved || hasInvalidChars || isLastChar || isSpaceRestricted) {
            emitToken(TYPE_WORD, currChar);
            return STATE_WORD;
          }
          const isNoAttrsInTag = substr.indexOf(EQ) === -1;
          const isClosingTag = substr[0] === SLASH;
          if (isNoAttrsInTag || isClosingTag) {
            const startPos = chars.getPos() - 1;
            const name = chars.grabWhile((char) => char !== closeTag);
            const endPos = startPos + name.length + END_POS_OFFSET;
            chars.skip();
            emitToken(TYPE_TAG, name, startPos, endPos);
            setupContextFreeTag(name, isClosingTag);
            return STATE_WORD;
          }
          return STATE_TAG_ATTRS;
        }
        function stateAttrs() {
          const startPos = chars.getPos();
          const silent = true;
          const tagStr = chars.grabWhile((char) => char !== closeTag, silent);
          const tagGrabber = createCharGrabber(tagStr, {
            onSkip
          });
          const eqParts = tagStr.split(EQ);
          const tagName = eqParts[0];
          const isEndTag = tagName[0] === SLASH;
          const isSingleAttrTag = tagName.indexOf(SPACE) === -1;
          const isSingleValueTag = !isEndTag && isSingleAttrTag;
          tagMode = TAG_STATE_NAME;
          while (tagGrabber.hasNext()) {
            tagMode = nextTagState(tagGrabber, isSingleValueTag, startPos);
          }
          chars.skip();
          return STATE_WORD;
        }
        function stateWord() {
          if (isNewLine(chars.getCurr())) {
            emitToken(TYPE_NEW_LINE, chars.getCurr());
            chars.skip();
            col = 0;
            prevCol = 0;
            row++;
            return STATE_WORD;
          }
          if (isWhiteSpace(chars.getCurr())) {
            const word2 = chars.grabWhile(isWhiteSpace);
            emitToken(TYPE_SPACE, word2);
            return STATE_WORD;
          }
          if (chars.getCurr() === openTag) {
            if (contextFreeTag) {
              const fullTagName = toEndTag(contextFreeTag);
              const foundTag = chars.grabN(fullTagName.length);
              const isContextFreeEnded = foundTag.toLowerCase() === fullTagName.toLowerCase();
              if (isContextFreeEnded) {
                return STATE_TAG;
              }
            } else if (chars.includes(closeTag)) {
              return STATE_TAG;
            }
            emitToken(TYPE_WORD, chars.getCurr());
            chars.skip();
            prevCol++;
            return STATE_WORD;
          }
          if (escapeTags) {
            if (isEscapeChar(chars.getCurr())) {
              const currChar = chars.getCurr();
              const nextChar = chars.getNext();
              chars.skip();
              if (nextChar && isEscapableChar(nextChar)) {
                chars.skip();
                emitToken(TYPE_WORD, nextChar);
                return STATE_WORD;
              }
              emitToken(TYPE_WORD, currChar);
              return STATE_WORD;
            }
            const isChar = (char) => isCharToken(char) && !isEscapeChar(char);
            const word2 = chars.grabWhile(isChar);
            emitToken(TYPE_WORD, word2);
            return STATE_WORD;
          }
          const word = chars.grabWhile(isCharToken);
          emitToken(TYPE_WORD, word);
          return STATE_WORD;
        }
        function tokenize() {
          stateMode = STATE_WORD;
          while (chars.hasNext()) {
            switch (stateMode) {
              case STATE_TAG:
                stateMode = stateTag();
                break;
              case STATE_TAG_ATTRS:
                stateMode = stateAttrs();
                break;
              case STATE_WORD:
              default:
                stateMode = stateWord();
                break;
            }
          }
          tokens.length = tokenIndex + 1;
          return tokens;
        }
        function isTokenNested(tokenValue) {
          const value = toEndTag(tokenValue);
          if (nestedMap.has(value)) {
            return !!nestedMap.get(value);
          } else {
            const buf = caseFreeTags ? buffer.toLowerCase() : buffer;
            const val = caseFreeTags ? value.toLowerCase() : value;
            const status = buf.indexOf(val) > -1;
            nestedMap.set(value, status);
            return status;
          }
        }
        return {
          tokenize,
          isTokenNested
        };
      }
      class NodeList {
        last() {
          const len = this.n.length;
          if (len > 0) {
            return this.n[len - 1];
          }
          return void 0;
        }
        has() {
          return this.n.length > 0;
        }
        flush() {
          return this.n.length ? this.n.pop() : void 0;
        }
        push(value) {
          this.n.push(value);
        }
        ref() {
          return this.n;
        }
        constructor() {
          this.n = [];
        }
      }
      const createList = () => new NodeList();
      function parse(input, opts = {}) {
        const options = opts;
        const openTag = options.openTag || OPEN_BRAKET;
        const closeTag = options.closeTag || CLOSE_BRAKET;
        const onlyAllowTags = (options.onlyAllowTags || []).filter(Boolean).map((tag) => tag.toLowerCase());
        const caseFreeTags = options.caseFreeTags || false;
        let tokenizer = null;
        const nodes = createList();
        const nestedNodes = createList();
        let activeTagNode = null;
        let activeTagNodesAttrName = null;
        const nestedTagsMap = new Set();
        function getValue(tokenValue) {
          return caseFreeTags ? tokenValue.toLowerCase() : tokenValue;
        }
        function isTokenNested(token) {
          const tokenValue = token.getValue();
          const value = getValue(tokenValue);
          const { isTokenNested: isTokenNested2 } = tokenizer || {};
          if (!nestedTagsMap.has(value) && typeof isTokenNested2 === "function") {
            if (isTokenNested2(value)) {
              nestedTagsMap.add(value);
              return true;
            }
          }
          return nestedTagsMap.has(value);
        }
        function isTagNested(tagName) {
          return Boolean(nestedTagsMap.has(getValue(tagName)));
        }
        function isTagAllowed(value) {
          if (onlyAllowTags.length) {
            return onlyAllowTags.indexOf(value.toLowerCase()) >= 0;
          }
          return true;
        }
        function activeTagNodeFlush() {
          if (activeTagNode) {
            activeTagNode = null;
            activeTagNodesAttrName = null;
          }
        }
        function getNodesContent() {
          const lastNestedNode = nestedNodes.last();
          if (lastNestedNode && isTagNode(lastNestedNode)) {
            return lastNestedNode.content;
          }
          return nodes.ref();
        }
        function nodesAppendAsString(nodes2, node2, isNested = true) {
          if (Array.isArray(nodes2) && typeof node2 !== "undefined") {
            nodes2.push(node2.toTagStart({
              openTag,
              closeTag
            }));
            if (Array.isArray(node2.content) && node2.content.length) {
              node2.content.forEach((item) => {
                nodes2.push(item);
              });
              if (isNested) {
                nodes2.push(node2.toTagEnd({
                  openTag,
                  closeTag
                }));
              }
            }
          }
        }
        function nodesAppend(node2) {
          const nodes2 = getNodesContent();
          if (Array.isArray(nodes2) && typeof node2 !== "undefined") {
            if (isTagNode(node2)) {
              if (isTagAllowed(node2.tag)) {
                nodes2.push(node2.toTagNode());
              } else {
                nodesAppendAsString(nodes2, node2);
              }
            } else {
              nodes2.push(node2);
            }
          }
        }
        function tagHandleStart(token) {
          activeTagNodeFlush();
          const tagNode = TagNode.create(token.getValue(), {}, [], {
            from: token.getStart(),
            to: token.getEnd()
          });
          const isNested = isTokenNested(token);
          activeTagNode = tagNode;
          if (isNested) {
            nestedNodes.push(tagNode);
          } else {
            nodesAppend(tagNode);
          }
        }
        function tagHandleEnd(token) {
          const tagName = token.getValue().slice(1);
          const lastNestedNode = nestedNodes.flush();
          activeTagNodeFlush();
          if (lastNestedNode) {
            if (isTagNode(lastNestedNode)) {
              lastNestedNode.setEnd({
                from: token.getStart(),
                to: token.getEnd()
              });
            }
            nodesAppend(lastNestedNode);
          } else if (!isTagNested(tagName)) {
            nodesAppend(token.toString({
              openTag,
              closeTag
            }));
          } else if (typeof options.onError === "function") {
            const tag = token.getValue();
            const line = token.getLine();
            const column = token.getColumn();
            options.onError({
              tagName: tag,
              lineNumber: line,
              columnNumber: column
            });
          }
        }
        function nodeHandle(token) {
          const tokenValue = token.getValue();
          const isNested = isTagNested(token.toString());
          if (activeTagNode) {
            switch (token.type) {
              case TYPE_ATTR_NAME:
                activeTagNodesAttrName = tokenValue;
                if (tokenValue) {
                  activeTagNode.attr(tokenValue, "");
                }
                break;
              case TYPE_ATTR_VALUE:
                if (activeTagNodesAttrName) {
                  activeTagNode.attr(activeTagNodesAttrName, tokenValue);
                  activeTagNodesAttrName = null;
                } else {
                  activeTagNode.attr(tokenValue, tokenValue);
                }
                break;
              case TYPE_SPACE:
              case TYPE_NEW_LINE:
              case TYPE_WORD:
                if (isNested) {
                  activeTagNode.append(tokenValue);
                } else {
                  nodesAppend(tokenValue);
                }
                break;
              case TYPE_TAG:
                nodesAppend(token.toString({
                  openTag,
                  closeTag
                }));
                break;
            }
          } else if (token.isText()) {
            nodesAppend(tokenValue);
          } else if (token.isTag()) {
            nodesAppend(token.toString({
              openTag,
              closeTag
            }));
          }
        }
        function onToken(token) {
          if (token.isTag()) {
            if (token.isStart()) {
              tagHandleStart(token);
            }
            if (token.isEnd()) {
              tagHandleEnd(token);
            }
          } else {
            nodeHandle(token);
          }
        }
        const lexer = opts.createTokenizer ? opts.createTokenizer : createLexer;
        tokenizer = lexer(input, {
          onToken,
          openTag,
          closeTag,
          onlyAllowTags: options.onlyAllowTags,
          contextFreeTags: options.contextFreeTags,
          caseFreeTags: options.caseFreeTags,
          enableEscapeTags: options.enableEscapeTags,
          whitespaceInTags: options.whitespaceInTags
        });
        tokenizer.tokenize();
        do {
          const node2 = nestedNodes.flush();
          if (isTagNode(node2) && isTagNested(node2.tag)) {
            nodesAppendAsString(getNodesContent(), node2, false);
          } else if (typeof node2 !== "undefined") {
            nodesAppend(node2);
          }
        } while (nestedNodes.has());
        return nodes.ref();
      }
      const isObj = (value) => typeof value === "object" && value !== null;
      const isBool = (value) => typeof value === "boolean";
      function iterate(t2, cb) {
        const tree = t2;
        if (Array.isArray(tree)) {
          for (let idx = 0; idx < tree.length; idx++) {
            tree[idx] = iterate(cb(tree[idx]), cb);
          }
        } else if (isObj(tree) && "content" in tree) {
          iterate(tree.content, cb);
        }
        return tree;
      }
      function same(expected, actual) {
        if (typeof expected !== typeof actual) {
          return false;
        }
        if (!isObj(expected) || expected === null) {
          return expected === actual;
        }
        if (Array.isArray(expected)) {
          return expected.every((exp) => [].some.call(actual, (act) => same(exp, act)));
        }
        if (isObj(expected) && isObj(actual)) {
          return Object.keys(expected).every((key) => {
            const ao = actual[key];
            const eo = expected[key];
            if (isObj(eo) && isObj(ao)) {
              return same(eo, ao);
            }
            if (isBool(eo)) {
              return eo !== (ao === null);
            }
            return ao === eo;
          });
        }
        return false;
      }
      function match(t2, expression, cb) {
        if (Array.isArray(expression)) {
          return iterate(t2, (node2) => {
            for (let idx = 0; idx < expression.length; idx++) {
              if (same(expression[idx], node2)) {
                return cb(node2);
              }
            }
            return node2;
          });
        }
        return iterate(t2, (node2) => same(expression, node2) ? cb(node2) : node2);
      }
      let C1 = "C1";
      let C2 = "C2";
      function createTree(tree, options) {
        const extendedTree = tree;
        extendedTree.messages = [
          ...extendedTree.messages || []
        ];
        extendedTree.options = {
          ...options,
          ...extendedTree.options
        };
        extendedTree.walk = function walkNodes(cb) {
          return iterate(this, cb);
        };
        extendedTree.match = function matchNodes(expr, cb) {
          return match(this, expr, cb);
        };
        return extendedTree;
      }
      function bbob(plugs) {
        const plugins = typeof plugs === "function" ? [
          plugs
        ] : plugs || [];
        const mockRender = () => "";
        return {
          process(input, opts) {
            const options = opts || {
              skipParse: false,
              parser: parse,
              render: mockRender,
              data: null
            };
            const parseFn = options.parser || parse;
            const renderFn = options.render;
            const data = options.data || null;
            if (typeof parseFn !== "function") {
              throw new Error(C1);
            }
            const raw = options.skipParse && Array.isArray(input) ? input : parseFn(input, options);
            let tree = options.skipParse && Array.isArray(input) ? createTree(input || [], options) : createTree(raw, options);
            for (let idx = 0; idx < plugins.length; idx++) {
              const plugin = plugins[idx];
              if (typeof plugin === "function" && renderFn) {
                const newTree = plugin(tree, {
                  parse: parseFn,
                  render: renderFn,
                  iterate,
                  data
                });
                tree = createTree(newTree || tree, options);
              }
            }
            return {
              get html() {
                if (typeof renderFn !== "function") {
                  throw new Error(C2);
                }
                return renderFn(tree, tree.options);
              },
              tree,
              raw,
              messages: tree.messages
            };
          }
        };
      }
      const SELFCLOSE_END_TAG = "/>";
      const CLOSE_START_TAG = "</";
      const START_TAG = "<";
      const END_TAG = ">";
      function renderNode(node2, options) {
        const { stripTags = false } = options || {};
        if (typeof node2 === "undefined" || node2 === null) {
          return "";
        }
        if (typeof node2 === "string" || typeof node2 === "number") {
          return String(node2);
        }
        if (Array.isArray(node2)) {
          return render(node2, options);
        }
        if (isTagNode(node2)) {
          if (stripTags) {
            return render(node2.content, options);
          }
          const attrs = attrsToString(node2.attrs);
          if (node2.content === null) {
            return START_TAG + node2.tag + attrs + SELFCLOSE_END_TAG;
          }
          return START_TAG + node2.tag + attrs + END_TAG + render(node2.content, options) + CLOSE_START_TAG + node2.tag + END_TAG;
        }
        return "";
      }
      function render(nodes, options) {
        if (nodes && Array.isArray(nodes)) {
          return nodes.reduce((r2, node2) => r2 + renderNode(node2, options), "");
        }
        if (nodes) {
          return renderNode(nodes, options);
        }
        return "";
      }
      function html(source, plugins, options) {
        return bbob(plugins).process(source, {
          ...options,
          render
        }).html;
      }
      function process(tags, tree, core, options) {
        return tree.walk((node2) => {
          if (isTagNode(node2)) {
            const tag = node2.tag;
            const tagCallback = tags[tag];
            if (typeof tagCallback === "function") {
              return tagCallback(node2, core, options);
            }
          }
          return node2;
        });
      }
      function createPreset(defTags, processor = process) {
        const presetFactory = (opts) => {
          presetFactory.options = Object.assign(presetFactory.options || {}, opts);
          function presetExecutor(tree, core) {
            return processor(defTags, tree, core, presetFactory.options || {});
          }
          presetExecutor.options = presetFactory.options;
          return presetExecutor;
        };
        presetFactory.extend = function presetExtend(callback) {
          const newTags = callback(defTags, presetFactory.options);
          return createPreset(newTags, processor);
        };
        return presetFactory;
      }
      const isStartsWith = (node2, type) => node2[0] === type;
      const styleAttrs = (attrs) => {
        const values = attrs || {};
        return Object.keys(values).reduce((acc, key) => {
          const value = values[key];
          if (typeof value === "string") {
            if (key === "color") {
              return acc.concat(`color:${value};`);
            }
            if (key === "size") {
              return acc.concat(`font-size:${value};`);
            }
          }
          return acc;
        }, []).join(" ");
      };
      const toListNodes = (content) => {
        if (content && Array.isArray(content)) {
          return content.reduce((acc, node2) => {
            const listItem = acc[acc.length - 1];
            if (isStringNode(node2) && isStartsWith(String(node2), "*")) {
              const content2 = String(node2).slice(1);
              acc.push(TagNode.create("li", {}, [
                content2
              ]));
              return acc;
            }
            if (isTagNode(node2) && TagNode.isOf(node2, "*")) {
              acc.push(TagNode.create("li", {}, []));
              return acc;
            }
            if (!isTagNode(listItem)) {
              acc.push(node2);
              return acc;
            }
            if (listItem && isTagNode(listItem) && Array.isArray(listItem.content)) {
              listItem.content = listItem.content.concat(node2);
              return acc;
            }
            acc.push(node2);
            return acc;
          }, []);
        }
        return content;
      };
      const renderUrl = (node2, render2) => getUniqAttr(node2.attrs) ? getUniqAttr(node2.attrs) : render2(node2.content || []);
      const toNode = (tag, attrs, content) => TagNode.create(tag, attrs, content);
      const toStyle = (style) => ({
        style
      });
      const defineStyleNode = (tag, style) => (node2) => toNode(tag, toStyle(style), node2.content);
      const defaultTags = (function createTags() {
        const tags = {
          b: defineStyleNode("span", "font-weight: bold;"),
          i: defineStyleNode("span", "font-style: italic;"),
          u: defineStyleNode("span", "text-decoration: underline;"),
          s: defineStyleNode("span", "text-decoration: line-through;"),
          url: (node2, { render: render2 }) => toNode("a", {
            href: renderUrl(node2, render2)
          }, node2.content),
          img: (node2, { render: render2 }) => toNode("img", {
            ...node2.attrs,
            src: render2(node2.content)
          }, null),
          quote: (node2) => toNode("blockquote", {}, [
            toNode("p", {}, node2.content)
          ]),
          code: (node2) => toNode("pre", {}, node2.content),
          style: (node2) => toNode("span", toStyle(styleAttrs(node2.attrs)), node2.content),
          list: (node2) => {
            const type = getUniqAttr(node2.attrs);
            return toNode(type ? "ol" : "ul", type ? {
              type
            } : {}, toListNodes(node2.content));
          },
          color: (node2) => toNode("span", toStyle(`color: ${getUniqAttr(node2.attrs)};`), node2.content)
        };
        return tags;
      })();
      const presetHTML5 = createPreset(defaultTags);
      function createTurndownService$1(config2) {
        const service = new TurndownService({
          headingStyle: "atx",
          codeBlockStyle: "fenced",
          emDelimiter: "*",
          strongDelimiter: "**",
          linkStyle: "inlined",
          ...config2
        });
        service.addRule("strikethrough", {
          filter: ["del", "s", "strike"],
          replacement: (content) => `~~${content}~~`
        });
        const bold = /font-weight\s*:\s*(?:bold|[6-9]00)/i;
        const italic = /font-style\s*:\s*italic/i;
        const strike = /text-decoration\s*:\s*line-through/i;
        service.addRule("bbcodeEmphasis", {
          filter: (node2) => node2.nodeName === "SPAN" && [bold, italic, strike].some((style) => style.test(node2.getAttribute("style") ?? "")),
          replacement: (content, node2) => {
            const style = node2.getAttribute("style") ?? "";
            const open2 = `${strike.test(style) ? "~~" : ""}${bold.test(style) ? "**" : ""}${italic.test(style) ? "*" : ""}`;
            return content.trim() ? `${open2}${content}${[...open2].reverse().join("")}` : content;
          }
        });
        service.remove(["script", "style", "nav", "header", "footer", "aside", "iframe"]);
        return service;
      }
      const BLOCK_TAG = /\n*(<\/?(?:blockquote|p|pre|ul|ol|li|table|thead|tbody|tr|td|th|h[1-6])\b[^>]*>)\n*/g;
      function expandForumTags(body, attachments) {
        return body.replace(/\[attach\]\s*(\d+)\s*\[\/attach\]/gi, (_, id) => {
          const file = attachments?.get(id);
          if (!file) return `[i]attachment ${id}[/i]`;
          return file.image ? `[img]${file.url}[/img]` : `[url=${file.url}]${file.name?.replace(/[[\]]/g, "") || `attachment ${id}`}[/url]`;
        }).replace(/\[email\]([^\[\]\s]+)\[\/email\]/gi, "[url=mailto:$1]$1[/url]").replace(/\[email=([^\]\s]+)\]([\s\S]*?)\[\/email\]/gi, "[url=mailto:$1]$2[/url]");
      }
      function bbcodeToHtml(body, attachments) {
        const html$1 = html(expandForumTags(body.replace(/\r\n?/g, "\n"), attachments), presetHTML5());
        return html$1.split(/(<pre>[\s\S]*?<\/pre>)/).map((part) => part.startsWith("<pre>") ? part.replace(/^<pre>([\s\S]*)<\/pre>$/, "<pre><code>$1</code></pre>") : part.replace(BLOCK_TAG, "$1").replace(/\n/g, "<br>")).join("");
      }
      function bodyToMarkdown(body, format, attachments) {
        if (format === "markdown") return body;
        const html2 = format === "bbcode" ? bbcodeToHtml(body, attachments) : body;
        return createTurndownService$1().turndown(html2);
      }
      function renderTemplate(template2, values) {
        return template2.replace(/\{(\w+)\}/g, (match2, key) => Object.prototype.hasOwnProperty.call(values, key) ? String(values[key] ?? "") : match2);
      }
      function renderFrontmatter(template2, values) {
        return template2.split("\n").map((line) => {
          if (!/\{\w+\}/.test(line)) return line;
          const match2 = line.match(/^(\s*(?:[^:#]+:\s*|-\s+))(.*)$/);
          if (!match2) return renderTemplate(line, values);
          let scalar = match2[2];
          if (scalar.startsWith('"') && scalar.endsWith('"') || scalar.startsWith("'") && scalar.endsWith("'")) scalar = scalar.slice(1, -1);
          const exact = scalar.match(/^\{(\w+)\}$/);
          const value = exact && Object.prototype.hasOwnProperty.call(values, exact[1]) ? values[exact[1]] : renderTemplate(scalar, values);
          return match2[1] + JSON.stringify(value ?? "");
        }).join("\n");
      }
      function attachmentsOf(item, mapping, fields) {
        const shape = fields.attachment;
        if (typeof mapping.attachments !== "string" || !isRecord(shape)) return void 0;
        const list = readPath(item, mapping.attachments);
        if (!Array.isArray(list)) return void 0;
        const files = new Map();
        for (const entry of list) {
          const id = typeof shape.id === "string" ? readPath(entry, shape.id) : void 0;
          const url2 = typeof shape.url === "string" ? readPath(entry, shape.url) : void 0;
          if (typeof id !== "string" && typeof id !== "number" || typeof url2 !== "string" || !/^https?:\/\//.test(url2)) continue;
          const name = typeof shape.name === "string" ? readPath(entry, shape.name) : void 0;
          const image = typeof shape.image === "string" ? readPath(entry, shape.image) : void 0;
          files.set(String(id), { url: url2, name: typeof name === "string" ? name : void 0, image: image === true || image === 1 || image === "1" });
        }
        return files;
      }
      async function fetchForumThreadState(threadId, fetcher, config2, context = {}) {
        const api = record(config2.api, "api");
        const fields = record(api.fields, "api.fields");
        const responseConfig = record(api.response, "api.response");
        const response = await request(fetcher, interpolate(textField(api.thread_endpoint, "api.thread_endpoint"), { thread_id: threadId }), requestOptions(config2, context), { stage: "thread" });
        requireOk(response, "thread");
        const dataPath = textField(responseConfig.data_field, "api.response.data_field");
        const thread = record(readPath(parseJson(response.text, responseConfig, "thread"), dataPath), dataPath);
        return {
          replies: numberField(field(thread, "replies", fields), "thread.replies"),
          updated: dateField(field(thread, "updated_at", fields), "thread.updated_at")
        };
      }
      async function fetchForumApiContent(threadId, fetcher, config2, onProgress, context = {}) {
        const api = record(config2.api, "api");
        const fields = record(api.fields, "api.fields");
        const postFields = record(fields.post, "api.fields.post");
        const responseConfig = record(api.response, "api.response");
        const options = requestOptions(config2, context);
        const progress = onProgress ?? context.onProgress;
        const endpoint2 = textField(api.thread_endpoint, "api.thread_endpoint");
        const response = await request(fetcher, interpolate(endpoint2, { thread_id: threadId }), options, { stage: "thread" });
        requireOk(response, "thread");
        const parsed = parseJson(response.text, responseConfig, "thread");
        const dataPath = textField(responseConfig.data_field, "api.response.data_field");
        const thread = record(readPath(parsed, dataPath), dataPath);
        const title = textField(field(thread, "title", fields), "thread.title");
        const author = textField(field(thread, "author", fields), "thread.author");
        const content = textField(field(thread, "content", fields), "thread.content");
        const postedAt = dateField(field(thread, "posted_at", fields), "thread.posted_at");
        const updatedAt = dateField(field(thread, "updated_at", fields), "thread.updated_at");
        const views = numberField(field(thread, "views", fields), "thread.views");
        const replies = numberField(field(thread, "replies", fields), "thread.replies");
        const favorites = numberField(field(thread, "favorites", fields) ?? 0, "thread.favorites");
        const format = textField(api.content_format, "api.content_format");
        const delimiter = typeof config2.delimiter === "string" ? config2.delimiter : "---";
        const metadata = record(config2.metadata, "metadata");
        const site = record(config2.site, "site");
        const source = interpolate(textField(metadata.source_url, "metadata.source_url"), {
          thread_id: threadId,
          base_url: String(site.base_url)
        });
        const allPosts = [];
        const seen2 = new Set();
        const signatures = new Set();
        let complete = replies === 0;
        let pageCount = 0;
        if (replies > 0) {
          const maxPages = numberField(api.max_pages, "api.max_pages");
          const pageSize = numberField(api.page_size, "api.page_size");
          if (!Number.isInteger(maxPages) || maxPages < 1 || !Number.isInteger(pageSize) || pageSize < 1) throw new ConversionError("CONFIG_INVALID", "Pagination limits must be positive integers");
          const postsEndpoint = textField(api.posts_endpoint, "api.posts_endpoint");
          const postsPath = textField(responseConfig.posts_field, "api.response.posts_field");
          for (let page = 1; page <= maxPages; page++) {
            assertNotAborted(context.signal);
            progress?.(`Fetching comments page ${page}`);
            const url2 = interpolate(postsEndpoint, {
              thread_id: threadId,
              page_size: pageSize,
              order: String(api.order),
              page
            });
            const postsResponse = await request(fetcher, url2, options, { stage: "comments", page });
            requireOk(postsResponse, "comments");
            const pageData = parseJson(postsResponse.text, responseConfig, "comments");
            const posts = readPath(pageData, postsPath);
            if (!Array.isArray(posts)) throw new ConversionError("INVALID_RESPONSE", `Expected array at ${postsPath}`, { stage: "comments", page });
            const ids = [];
            let newCount = 0;
            for (const value of posts) {
              const post = record(value, "post");
              const id = field(post, "id", postFields);
              if (typeof id !== "string" && typeof id !== "number" || String(id) === "") throw new ConversionError("INVALID_RESPONSE", "Missing post ID", { stage: "comments", page });
              const key = String(id);
              ids.push(key);
              if (!seen2.has(key)) {
                seen2.add(key);
                allPosts.push(post);
                newCount++;
              }
            }
            const signature = JSON.stringify(ids);
            if (posts.length && (signatures.has(signature) || newCount === 0)) throw new ConversionError("REPEATED_PAGE", "Comments pagination returned no new posts", { stage: "comments", page });
            signatures.add(signature);
            pageCount = page;
            if (posts.length < pageSize) {
              complete = true;
              break;
            }
            if (page < maxPages) await pageDelay(api, context.signal);
          }
          if (!complete) throw new ConversionError("PAGE_LIMIT", "Comments page limit reached before a terminal page", { stage: "comments", page: pageCount });
        }
        assertNotAborted(context.signal);
        let comments = "";
        let exported = allPosts.length;
        let missingTotal = 0;
        if (allPosts.length) {
          const commentTemplate = textField(record(config2.comment, "comment").template, "comment.template");
          const headerTemplate = textField(record(config2.comments_header, "comments_header").template, "comments_header.template");
          const replyTemplate = isRecord(config2.reply) && typeof config2.reply.template === "string" ? config2.reply.template : "> **{author}** - *{date}*\n>\n{content}\n";
          const gapTemplate = isRecord(config2.replies_gap) && typeof config2.replies_gap.template === "string" ? config2.replies_gap.template : "> *{missing} more replies are not included ({reason}).*\n";
          if (api.order === "time_desc") allPosts.reverse();
          const rendered = [];
          const replyContext = { api, postFields, responseConfig, options, fetcher, threadId, signal: context.signal, progress };
          for (const [index, post] of allPosts.entries()) {
            const thread2 = await collectReplies(post, replyContext);
            exported += thread2.replies.length;
            missingTotal += thread2.missing;
            let nested = thread2.replies.map((reply) => renderTemplate(replyTemplate, {
              author: textField(field(reply, "author", postFields), "reply.author"),
              date: dateField(field(reply, "posted_at", postFields), "reply.posted_at"),
              content: quote(bodyToMarkdown(textField(field(reply, "content", postFields), "reply.content", true), format, attachmentsOf(reply, postFields, fields))),
              delimiter
            })).join("\n");
            if (thread2.missing) nested += `${nested ? "\n" : ""}${renderTemplate(gapTemplate, { missing: thread2.missing, reason: thread2.reason ?? "not returned by the API" })}`;
            if (nested) nested += "\n";
            const values2 = {
              author: textField(field(post, "author", postFields), "post.author"),
              date: dateField(field(post, "posted_at", postFields), "post.posted_at"),
              content: bodyToMarkdown(textField(field(post, "content", postFields), "post.content"), format, attachmentsOf(post, postFields, fields)),
              index: index + 1,
              delimiter,
              nested
            };
            rendered.push(commentTemplate.includes("{nested}") ? renderTemplate(commentTemplate, values2) : renderTemplate(commentTemplate, values2) + nested);
          }
          comments = renderTemplate(headerTemplate, { count: exported, delimiter }) + rendered.join("");
        }
        const downloadedAt = ( new Date()).toISOString();
        const values = {
          title,
          author,
          posted_at: postedAt,
          updated_at: updatedAt,
          downloaded_at: downloadedAt,
          url: `[${title.replace(/([\[\]])/g, "\\$1")}](${source})`,
          views,
          replies,
          favorites
        };
        const frontmatter = renderFrontmatter(textField(record(config2.frontmatter, "frontmatter").template, "frontmatter.template"), values);
        const result = renderTemplate(textField(record(config2.document, "document").template, "document.template"), {
          ...values,
          frontmatter,
          content: bodyToMarkdown(content, format, attachmentsOf(thread, fields, fields)),
          comments,
          delimiter,
          date: postedAt
        });
        context.onMetadata?.({
title,
          author,
          id: threadId,
          source,
          date: postedAt,
          downloaded: downloadedAt,
          replies,
          updated: updatedAt,
          commentsExported: exported,
          commentsMissing: missingTotal,
          commentsPages: pageCount
        });
        return result;
      }
      function quote(markdown) {
        return markdown.split("\n").map((line) => line ? `> ${line}` : ">").join("\n");
      }
      async function collectReplies(post, context) {
        const { api, postFields } = context;
        const childPath = typeof postFields.children === "string" ? postFields.children : void 0;
        if (!childPath) return { replies: [], missing: 0 };
        const preview = readPath(post, childPath);
        const replies = Array.isArray(preview) ? preview.filter(isRecord) : [];
        const counted = typeof postFields.children_count === "string" ? readPath(post, postFields.children_count) : void 0;
        const total = typeof counted === "number" && Number.isFinite(counted) ? counted : replies.length;
        let reason = total > replies.length ? context.denied : void 0;
        const postId = field(post, "id", postFields);
        if (!reason && total > replies.length && typeof api.nested_endpoint === "string" && (typeof postId === "string" || typeof postId === "number")) {
          try {
            const seen2 = new Set(replies.map((reply) => String(field(reply, "id", postFields))));
            const pageSize = typeof api.page_size === "number" ? api.page_size : 20;
            const maxPages = typeof api.max_pages === "number" ? api.max_pages : 100;
            const postsPath = typeof context.responseConfig.nested_posts_field === "string" ? context.responseConfig.nested_posts_field : textField(context.responseConfig.posts_field, "api.response.posts_field");
            for (let page = 1; page <= maxPages && seen2.size < total; page++) {
              context.progress?.(`Fetching replies to post ${postId}`);
              const url2 = interpolate(api.nested_endpoint, { post_id: String(postId), thread_id: context.threadId, page_size: pageSize, page });
              const response = await request(context.fetcher, url2, context.options, { stage: "replies", page });
              if (response.status === 401 || response.status === 403) throw new ConversionError("ACCESS_DENIED", "login required", { stage: "replies", status: response.status });
              if (!response.ok) throw new ConversionError("HTTP_ERROR", `HTTP ${response.status}`, { stage: "replies", status: response.status });
              let message;
              try {
                message = readPath(JSON.parse(response.text), "msg");
              } catch {
              }
              let pageData;
              try {
                pageData = parseJson(response.text, context.responseConfig, "replies");
              } catch (error2) {
                throw new ConversionError("API_REJECTED", typeof message === "string" && message ? message : error2.message);
              }
              const items = readPath(pageData, postsPath);
              if (!Array.isArray(items)) throw new ConversionError("INVALID_RESPONSE", `Expected array at ${postsPath}`);
              let added = 0;
              for (const item of items.filter(isRecord)) {
                const key = String(field(item, "id", postFields));
                if (!seen2.has(key)) {
                  seen2.add(key);
                  replies.push(item);
                  added++;
                }
              }
              if (items.length < pageSize || added === 0) break;
              await pageDelay(api, context.signal);
            }
          } catch (error2) {
            assertNotAborted(context.signal);
            if (error2 instanceof ConversionError && error2.code === "ABORTED") throw error2;
            reason = error2 instanceof Error ? error2.message : String(error2);
            if (error2 instanceof ConversionError && error2.code === "ACCESS_DENIED") context.denied = reason;
          }
        }
        replies.sort((a2, b2) => Number(field(a2, "posted_at", postFields)) - Number(field(b2, "posted_at", postFields)));
        return { replies, missing: Math.max(0, total - replies.length), reason };
      }
      const defaultAdapter = {
        name: "Default",
        urlPatterns: ["*"],
        contentSelectors: [
          "article",
          '[role="main"]',
          "main",
          ".post-content",
          ".article-content",
          ".entry-content",
          "#content",
          ".content"
        ],
        removeSelectors: [
          "script",
          "style",
          "nav",
          "header",
          "footer",
          "aside",
          "iframe",
          ".advertisement",
          ".ads",
          ".sidebar"
        ]
      };
      const contentEngines = exports("j", {
        "forum-json": (id, fetcher, profile, context) => fetchForumApiContent(id, fetcher, profile, context?.onProgress, context),
        "discourse-raw": fetchDiscourseRawContent
      });
      const stateEngines = {
        "forum-json": fetchForumThreadState,
        "discourse-raw": fetchDiscourseThreadState
      };
      function fetchThreadState(id, fetcher, profile, context) {
        const engine = stateEngines[profile.engine];
        if (!engine) throw new ConversionError("CONFIG_INVALID", `Unknown engine: ${profile.engine}`);
        return engine(id, fetcher, profile, context);
      }
      function createProfileAdapter(profile) {
        return {
          id: profile.site.id,
          name: profile.site.name,
          config: profile,
          urlPatterns: profile.activation.matches,
          matchesUrl: (url2) => classifyRoute(url2, profile)?.kind === "thread",
          hasApi: true,
          includesFrontmatter: profile.engine === "forum-json",
          extractMetadata(doc, url2) {
            const route = classifyRoute(url2, profile);
            return { title: pageTitle(doc, profile), url: url2, id: route?.id, tags: profile.metadata?.tags };
          },
          async fetchViaApi(url2, fetcher, override, context) {
            const resolved = override ?? profile;
            const route = classifyRoute(url2, resolved);
            if (route?.kind !== "thread" || !route.id) throw new ConversionError("UNSUPPORTED_ROUTE", `Expected ${resolved.site.id} thread route`);
            const engine = contentEngines[resolved.engine];
            if (!engine) throw new ConversionError("CONFIG_INVALID", `Unknown engine: ${resolved.engine}`);
            return engine(route.id, fetcher, resolved, context);
          }
        };
      }
      function getProfileAdapters() {
        return Object.values(getConfig().adapters).filter((p2) => p2.enabled).map(createProfileAdapter);
      }
      function findProfileAdapter(url2) {
        const profiles = getConfig().adapters;
        const route = classifyRegistryRoute(url2, profiles);
        return route?.kind === "thread" ? createProfileAdapter(profiles[route.profileId]) : null;
      }
      const builtInAdapters = exports("g", [
        mediumAdapter,
        substackAdapter,
        wikipediaAdapter,
        githubAdapter,
        redditAdapter,
        devtoAdapter,
        defaultAdapter
]);
      function getBuiltInAdapters() {
        return [...getProfileAdapters(), ...builtInAdapters];
      }
      function listAdapters() {
        return getBuiltInAdapters().filter((a2) => a2.name !== "Default").map((a2) => ({
          name: a2.name,
          patterns: a2.urlPatterns.map((p2) => p2 instanceof RegExp ? p2.source : p2),
          hasApi: a2.hasApi ?? false
        }));
      }
      function sanitizeFilename(filename) {
        return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 200);
      }
      function formatDate(date2 = new Date()) {
        return date2.toISOString().split("T")[0];
      }
      const yamlItem = (value) => typeof value === "string" && !/^[\p{L}\p{N}_][\p{L}\p{N}_ ./+-]*$/u.test(value) ? JSON.stringify(value) : String(value);
      function generateFrontmatter(metadata) {
        const lines = ["---"];
        if (metadata.title) lines.push(`title: ${JSON.stringify(String(metadata.title))}`);
        if (metadata.url) lines.push(`source: ${metadata.url}`);
        if (metadata.date) lines.push(`date: ${metadata.date}`);
        if (metadata.downloaded) lines.push(`downloaded: ${metadata.downloaded}`);
        if (metadata.author) lines.push(`author: ${JSON.stringify(String(metadata.author))}`);
        if (metadata.description) lines.push(`description: ${JSON.stringify(String(metadata.description))}`);
        if (metadata.tags && metadata.tags.length > 0) {
          lines.push("tags:");
          metadata.tags.forEach((tag) => lines.push(`  - ${yamlItem(tag)}`));
        }
        Object.keys(metadata).forEach((key) => {
          if (!["title", "url", "date", "downloaded", "author", "description", "tags", "source"].includes(key)) {
            const value = metadata[key];
            if (value === void 0 || value === null) return;
            if (typeof value === "string") {
              lines.push(`${key}: ${JSON.stringify(value)}`);
            } else if (Array.isArray(value)) {
              lines.push(`${key}:`);
              value.forEach((item) => lines.push(`  - ${yamlItem(item)}`));
            } else {
              lines.push(`${key}: ${value}`);
            }
          }
        });
        lines.push("---");
        return lines.join("\n");
      }
      function extractMainContent(doc) {
        const selectors = [
          "article",
          '[role="main"]',
          "main",
          ".post-content",
          ".article-content",
          ".entry-content",
          "#content",
          ".content"
        ];
        for (const selector of selectors) {
          const element = doc.querySelector(selector);
          if (element) {
            return element;
          }
        }
        return doc.body;
      }
      function formatMessage(template2, values) {
        return template2.replace(/\{(\w+)\}/g, (match2, key) => {
          return values[key] !== void 0 ? String(values[key]) : match2;
        });
      }
      const defaultTemplates = exports("m", {
        document: {
          enabled: false,
          template: "{frontmatter}\n\n{content}"
        },
        frontmatter: {
          enabled: true,
          fields: ["title", "source", "date", "downloaded", "author", "tags"]
        },
        content: {
          separator: "\n\n---\n\n"
        },
        comment: {
          enabled: false,
          template: "## Comment {index} - {author}\n**Posted:** {date}\n\n{content}"
        },
        filename: {
          single: "{title}",
          batch: "{site}-{type}-{tagname}"
        }
      });
      function replacePlaceholders(template2, data) {
        let result = template2;
        for (const [key, value] of Object.entries(data)) {
          const placeholder = new RegExp(`\\{${key}\\}`, "g");
          result = result.replace(placeholder, String(value || ""));
        }
        return result;
      }
      function applyCommentTemplate(template2, data) {
        return replacePlaceholders(template2, {
          author: data.author || "Unknown",
          date: data.date || "",
          content: data.content,
          index: String(data.index || 0)
        });
      }
      function applyDocumentTemplate(template2, data) {
        return replacePlaceholders(template2, data);
      }
      function parseForumPosts(rawMarkdown) {
        const posts = [];
        const sections = rawMarkdown.split(/\n(?=#{1,3}\s)/);
        for (const section of sections) {
          if (section.trim().length === 0) continue;
          const authorMatch = section.match(/^#{1,3}\s*(.+?)(?:\s*-\s*(.+?))?$/m);
          const author = authorMatch ? authorMatch[1].trim() : void 0;
          const date2 = authorMatch && authorMatch[2] ? authorMatch[2].trim() : void 0;
          posts.push({
            author,
            date: date2,
            content: section
          });
        }
        return posts.length > 0 ? posts : [{ content: rawMarkdown }];
      }
      function applyFilenameTemplate(template2, context) {
        const values = {
          date: context.date || formatDate(),
          title: context.title || "untitled",
          id: context.id || "",
          author: context.author || "",
          site: context.site || "",
          type: context.type || "",
          tagname: context.tagname || "",
          index: context.index || ""
        };
        let result = template2.replace(/\{(\w+)\}/g, (match2, key) => Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match2);
        result = result.replace(/\s*-\s*-\s*/g, " - ");
        result = result.replace(/^[\s-]+|[\s-]+$/g, "");
        return sanitizeFilename(result);
      }
      var LogLevel = exports("L", ((LogLevel2) => {
        LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
        LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
        LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
        LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
        return LogLevel2;
      })(LogLevel || {}));
      let infoSink = (...args) => console.log(...args);
      let debugSink = (...args) => console.debug(...args);
      function routeLogsToStderr() {
        infoSink = debugSink = (...args) => console.error(...args);
      }
      class Logger {
        level = 1;
        prefix;
        constructor(prefix = "Markify") {
          this.prefix = prefix;
        }
        setLevel(level) {
          this.level = level;
        }
        debug(message, ...args) {
          if (this.level <= 0) {
            debugSink(`[${this.prefix}:DEBUG]`, message, ...args);
          }
        }
        info(message, ...args) {
          if (this.level <= 1) {
            infoSink(`[${this.prefix}]`, message, ...args);
          }
        }
        warn(message, ...args) {
          if (this.level <= 2) {
            console.warn(`[${this.prefix}:WARN]`, message, ...args);
          }
        }
        error(message, ...args) {
          if (this.level <= 3) {
            console.error(`[${this.prefix}:ERROR]`, message, ...args);
          }
        }
      } exports("b", Logger);
      const logger = exports("G", new Logger("Markify"));
      const batchLogger = exports("f", new Logger("Markify:Batch"));
      const adapterLogger = exports("c", new Logger("Markify:Adapter"));
      var define_process_env_default = {};
      async function fetchViaJinaReader(url2, config2, fetcher) {
        const jinaUrl = `https://r.jina.ai/${url2}`;
        const headers = {
          "Accept": "application/json"
        };
        const token = config2?.jinaToken ?? define_process_env_default.JINA_TOKEN;
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        if (config2?.targetSelector) {
          headers["X-Target-Selector"] = config2.targetSelector;
        }
        if (config2?.removeSelector) {
          headers["X-Remove-Selector"] = config2.removeSelector;
        }
        if (config2?.includeLinks === false) {
          headers["X-Retain-Images"] = "none";
        }
        logger.info(`Fetching via Jina Reader: ${jinaUrl}`);
        try {
          const doFetch = fetcher ?? createDefaultFetcher();
          const response = await doFetch.get(jinaUrl, { headers });
          if (!response.ok) {
            logger.warn(`Jina Reader returned ${response.status} for ${url2}`);
            return null;
          }
          try {
            const json = JSON.parse(response.text);
            if (json.data) {
              return {
                content: json.data.content || "",
                title: json.data.title || "",
                url: json.data.url || url2,
                description: json.data.description,
                source: "jina"
              };
            }
          } catch {
          }
          const titleMatch = response.text.match(/^#\s+(.+)$/m);
          return {
            content: response.text,
            title: titleMatch?.[1] || "",
            url: url2,
            source: "jina"
          };
        } catch (error2) {
          logger.error("Jina Reader request failed:", error2);
          return null;
        }
      }
      function hasSiteApi(url2) {
        return findSiteAdapter(url2, getBuiltInAdapters())?.hasApi === true;
      }
      function createDefaultFetcher() {
        return {
          get: async (url2, opts) => {
            const res = await fetch(url2, {
              headers: opts?.headers
            });
            return {
              status: res.status,
              ok: res.ok,
              text: await res.text()
            };
          }
        };
      }
      const defaultConversion = {
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        emDelimiter: "*",
        strongDelimiter: "**",
        linkStyle: "inlined",
        removeElements: ["script", "style", "nav", "header", "footer", "aside", "iframe"]
      };
      function createTurndownService(config2) {
        const c = { ...defaultConversion, ...config2 };
        const service = new TurndownService({
          headingStyle: c.headingStyle,
          codeBlockStyle: c.codeBlockStyle,
          emDelimiter: c.emDelimiter,
          strongDelimiter: c.strongDelimiter,
          linkStyle: c.linkStyle
        });
        service.addRule("strikethrough", {
          filter: ["del", "s", "strike"],
          replacement: (content) => `~~${content}~~`
        });
        service.remove(c.removeElements || []);
        return service;
      }
      async function convert(options) {
        const {
          url: url2,
          html: html2,
          document: doc,
          adapterName,
          includeFrontmatter = true,
          templates: templates2,
          fetcher,
          signal,
          onProgress,
          metadataSnapshot,
          adapterConfig,
          conversion,
          strategy = "dom-only",
readerConfig
        } = options;
        let adapter = null;
        const adapters = getBuiltInAdapters();
        if (adapterName) {
          adapter = adapters.find((a2) => a2.name.toLowerCase() === adapterName.toLowerCase() || a2.id === adapterName) ?? null;
        }
        if (!adapter) {
          adapter = findSiteAdapter(url2, adapters);
        }
        logger.info(`Using adapter: ${adapter?.name || "Default"}, strategy: ${strategy}`);
        const siteApiResult = await trySiteApi(adapter, url2, fetcher, adapterConfig, signal, onProgress);
        if (siteApiResult !== null) {
          const pageMetadata = !metadataSnapshot && doc && adapter?.extractMetadata ? await adapter.extractMetadata(doc, url2) : {};
          return buildResult(
            siteApiResult.markdown,
            adapter,
            url2,
            templates2,
            includeFrontmatter,
            adapter?.includesFrontmatter ?? false,
            { ...pageMetadata, ...metadataSnapshot, ...siteApiResult.metadata },
            adapterConfig
          );
        }
        if (strategy === "api-first" || strategy === "api-only") {
          const jinaConfig = {
            ...readerConfig,
            targetSelector: readerConfig?.targetSelector ?? adapter?.contentSelectors?.join(", "),
            removeSelector: readerConfig?.removeSelector ?? adapter?.removeSelectors?.join(", ")
          };
          const readerResult = await fetchViaJinaReader(url2, jinaConfig, fetcher);
          if (readerResult) {
            logger.info(`Jina Reader returned ${readerResult.content.length} chars`);
            let markdown = readerResult.content;
            if (adapter?.postProcess) {
              markdown = adapter.postProcess(markdown);
            }
            const metadata = {
              title: readerResult.title || "Untitled",
              url: readerResult.url,
              date: formatDate(),
              downloaded: formatDate(),
              description: readerResult.description
            };
            if (adapter?.extractMetadata && doc) {
              const adapterMeta = await adapter.extractMetadata(doc, url2);
              Object.assign(metadata, adapterMeta);
            }
            if (adapter?.frontmatterFields) {
              Object.assign(metadata, adapter.frontmatterFields);
            }
            let finalContent = markdown;
            if (includeFrontmatter) {
              const frontmatter = generateFrontmatter(metadata);
              finalContent = `${frontmatter}
${markdown}`;
            }
            return {
              markdown: finalContent,
              metadata,
              adapter: adapter?.name || "Jina Reader",
              filename: buildFilename(metadata, adapter, templates2)
            };
          }
          if (strategy === "api-only") {
            throw new Error(
              `No API available for ${url2}. Site API not matched, Jina Reader failed. Use strategy 'api-first' to allow DOM fallback.`
            );
          }
          logger.warn("Jina Reader failed, falling back to DOM parsing...");
        }
        return convertViaDom(options, adapter);
      }
      async function trySiteApi(adapter, url2, fetcher, adapterConfig, signal, onProgress) {
        if (!adapter?.hasApi || !adapter?.fetchViaApi) {
          return null;
        }
        if (!fetcher) {
          fetcher = {
            get: async (fetchUrl, opts) => {
              const res = await fetch(fetchUrl, {
                credentials: opts?.credentials ? "include" : "same-origin",
                headers: opts?.headers,
                signal: opts?.signal
              });
              return { status: res.status, ok: res.ok, text: await res.text() };
            }
          };
        }
        logger.info(`Trying site API for ${adapter.name}...`);
        const { getAdapterConfig: getAdapterConfig2 } = await __vitePreload(async () => {
          const { getAdapterConfig: getAdapterConfig3 } = await Promise.resolve().then(() => config);
          return { getAdapterConfig: getAdapterConfig3 };
        }, void 0 );
        const resolvedConfig = adapterConfig ?? adapter.config ?? getAdapterConfig2(adapter.id ?? adapter.name);
        let metadata = {};
        const result = await adapter.fetchViaApi(url2, fetcher, resolvedConfig, {
          signal,
          onProgress,
          onMetadata: (value) => {
            metadata = { ...metadata, ...value };
          }
        });
        return result === null ? null : { markdown: result, metadata };
      }
      async function convertViaDom(options, adapter) {
        const {
          url: url2,
          html: html2,
          document: doc,
          includeFrontmatter = true,
          templates: templates2,
          conversion
        } = options;
        const turndownService = createTurndownService(conversion);
        let markdown;
        if (doc) {
          let contentElement;
          if (adapter?.contentSelectors) {
            for (const selector of adapter.contentSelectors) {
              contentElement = doc.querySelector(selector);
              if (contentElement) break;
            }
          }
          if (!contentElement) {
            contentElement = extractMainContent(doc);
          }
          let contentClone = contentElement.cloneNode(true);
          if (adapter?.removeSelectors) {
            for (const selector of adapter.removeSelectors) {
              const elements = contentClone.querySelectorAll(selector);
              Array.from(elements).forEach((el) => el.remove());
            }
          }
          if (adapter?.preProcess) {
            contentClone = adapter.preProcess(contentClone);
          }
          const htmlString = contentClone.outerHTML || contentClone.innerHTML || String(contentClone);
          markdown = turndownService.turndown(htmlString);
          if (adapter?.postProcess) {
            markdown = adapter.postProcess(markdown);
          }
        } else if (html2) {
          markdown = turndownService.turndown(html2);
        } else {
          throw new Error("DOM strategy requires either document or html to be provided");
        }
        const metadata = await extractMetadataFromDoc(adapter, doc, url2);
        let finalContent = markdown;
        if (includeFrontmatter && !adapter?.includesFrontmatter) {
          const frontmatter = generateFrontmatter(metadata);
          if (templates2?.content?.header) {
            finalContent = templates2.content.header + finalContent;
          }
          if (templates2?.content?.footer) {
            finalContent = finalContent + templates2.content.footer;
          }
          if (templates2?.document?.enabled && templates2?.document?.template) {
            finalContent = applyDocumentTemplate(templates2.document.template, {
              frontmatter,
              content: finalContent,
              ...metadata
            });
          } else {
            finalContent = frontmatter ? `${frontmatter}
${finalContent}` : finalContent;
          }
        }
        return {
          markdown: finalContent,
          metadata,
          adapter: adapter?.name || "Default",
          filename: buildFilename(metadata, adapter, templates2)
        };
      }
      async function buildResult(rawMarkdown, adapter, url2, templates2, includeFrontmatter, adapterIncludesFrontmatter, metadataSnapshot = {}, adapterConfig) {
        const metadata = {
          title: "Untitled",
          url: url2,
          date: formatDate(),
          downloaded: formatDate(),
          ...metadataSnapshot
        };
        let finalContent = rawMarkdown;
        if (includeFrontmatter && !adapterIncludesFrontmatter) {
          const frontmatter = generateFrontmatter(metadata);
          finalContent = `${frontmatter}
${rawMarkdown}`;
        }
        return {
          markdown: finalContent,
          metadata,
          adapter: adapter?.name || "API",
          filename: buildFilename(metadata, adapter, templates2, adapterConfig)
        };
      }
      function buildFilename(metadata, adapter, templates2, adapterConfig) {
        return applyFilenameTemplate(
          adapterConfig?.filename.single ?? adapter?.config?.filename.single ?? templates2?.filename?.single ?? "{title}",
          {
            title: metadata.title || "untitled",
            id: metadata.id,
            author: metadata.author,
            site: adapter?.id ?? adapter?.name,
            date: formatDate()
          }
        );
      }
      async function extractMetadataFromDoc(adapter, doc, url2) {
        const date2 = formatDate();
        let metadata = {
          title: doc?.title || "Untitled",
          url: url2,
          date: date2,
          downloaded: formatDate()
        };
        if (adapter?.extractMetadata && doc) {
          const customMetadata = await adapter.extractMetadata(doc, url2);
          metadata = { ...metadata, ...customMetadata };
        } else if (doc) {
          const authorMeta = doc.querySelector('meta[name="author"]');
          const descMeta = doc.querySelector('meta[name="description"]');
          const keywordsMeta = doc.querySelector('meta[name="keywords"]');
          if (authorMeta?.getAttribute("content")) metadata.author = authorMeta.getAttribute("content");
          if (descMeta?.getAttribute("content")) metadata.description = descMeta.getAttribute("content");
          const keywordsContent = keywordsMeta?.getAttribute("content");
          const tags = keywordsContent?.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0) || ["web-clip"];
          metadata.tags = tags;
        }
        if (adapter?.frontmatterFields) {
          metadata = { ...metadata, ...adapter.frontmatterFields };
        }
        return metadata;
      }
      const zh = typeof navigator !== "undefined" && /^zh\b/i.test(navigator.language);
      const t$1 = (english, chinese) => zh ? chinese : english;
      const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
      function mountDialog(id) {
        document.getElementById(id)?.remove();
        const element = document.createElement("div");
        element.id = id;
        element.setAttribute("data-markify-owned", id);
        const root2 = element.attachShadow({ mode: "open" });
        document.body.appendChild(element);
        return { element, root: root2, close: () => element.remove() };
      }
      const DIALOG_STYLE = `
:host { all: initial; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 2147483646;
  font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; color: #e5e7eb; }
.panel { background: #18181b; border: 1px solid #3f3f46; border-radius: 14px; width: min(680px, calc(100vw - 32px)); max-height: calc(100vh - 48px);
  display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,.5); }
header, footer { padding: 16px 20px; display: flex; gap: 12px; align-items: center; }
header { border-bottom: 1px solid #3f3f46; }
footer { border-top: 1px solid #3f3f46; justify-content: flex-end; }
h2 { margin: 0; font-size: 18px; color: #c4b5fd; flex: 1; }
main { padding: 4px 20px 16px; overflow-y: auto; }
section { padding: 14px 0; border-bottom: 1px solid #27272a; }
section:last-child { border-bottom: 0; }
h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #a1a1aa; }
label.row { display: grid; grid-template-columns: 170px 1fr; gap: 10px; align-items: center; margin: 8px 0; }
label.check { display: flex; gap: 8px; align-items: center; white-space: nowrap; }
input[type=text], input[type=number], select, textarea { box-sizing: border-box; width: 100%; padding: 7px 10px; border-radius: 8px; border: 1px solid #52525b;
  background: #27272a; color: #f4f4f5; font: inherit; }
textarea { min-height: 84px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
input::placeholder, textarea::placeholder { color: #71717a; }
.hint { color: #a1a1aa; font-size: 12px; margin: 4px 0 0; }
.preview { color: #a7f3d0; font-family: ui-monospace, monospace; font-size: 12px; }
.buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
button { padding: 8px 14px; border-radius: 8px; border: 1px solid #52525b; background: #3f3f46; color: #fafafa; font: inherit; cursor: pointer; }
button:hover { background: #52525b; }
button.primary { background: #7c3aed; border-color: #7c3aed; }
button.primary:hover { background: #6d28d9; }
button.danger { border-color: #7f1d1d; background: #450a0a; }
.error { color: #fca5a5; white-space: pre-wrap; flex: 1; font-size: 12px; }
details summary { cursor: pointer; color: #d4d4d8; }
@media (max-width: 560px) { label.row { grid-template-columns: 1fr; } }
`;
      const TEMPLATE_BLOCKS = ["document", "frontmatter", "comments_header", "comment", "reply", "replies_gap"];
      const FILENAMES = ["single", "batch_item", "batch"];
      const SAMPLE = { title: "示例标题 Example", id: "12345", author: "author", date: "2026-01-01", index: "001", type: "category", tagname: "tag" };
      const L$1 = {
        title: t$1("Markify Settings", "Markify 设置"),
        scope: t$1("Applies to", "应用于"),
        allSites: t$1("All sites (defaults)", "所有站点（默认）"),
        thisSite: t$1("this page", "当前页面"),
        enabled: t$1("Enable Markify on this site", "在此站点启用 Markify"),
        enabledHint: t$1("Off: no buttons or checkboxes here until you turn it back on (the menu stays).", "关闭后此站点不显示按钮和复选框（菜单仍可用）。"),
        filenames: t$1("File names", "文件名"),
        single: t$1("Single thread", "单个帖子"),
        batchItem: t$1("File inside a ZIP", "ZIP 内的文件"),
        batch: t$1("ZIP archive", "ZIP 压缩包"),
        inherit: t$1("Empty = use", "留空 = 使用"),
        preview: t$1("Preview", "预览"),
        placeholders: t$1("Placeholders", "可用占位符"),
        network: t$1("Network", "网络"),
        timeout: t$1("Request timeout (seconds)", "请求超时（秒）"),
        templates: t$1("Templates (advanced)", "模板（高级）"),
        templatesHint: t$1("Empty = the built-in template shown in grey.", "留空 = 使用灰色显示的内置模板。"),
        agent: t$1("AI Console API", "AI 控制台 API"),
        agentOn: t$1("On: agents with this site's token can export through window.markify.", "已开启：持有本站令牌的 AI 可通过 window.markify 导出。"),
        agentOff: t$1("Off.", "已关闭。"),
        agentCopy: t$1("Copy token (turns it on)", "复制令牌（同时开启）"),
        agentRevoke: t$1("Turn off and revoke", "关闭并吊销令牌"),
        history: t$1("Download history", "下载记录"),
        historyCount: (all, site) => site === void 0 ? t$1(`${all} downloads`, `共 ${all} 条`) : t$1(`${site} on this site, ${all} in total`, `本站 ${site} 条，共 ${all} 条`),
        clearSite: t$1("Clear this site", "清除本站记录"),
        clearAll: t$1("Clear all", "清除全部记录"),
        manageHistory: t$1("Manage and check for updates…", "管理与检查更新…"),
        resetButton: t$1("Reset button position", "重置按钮位置"),
        config: t$1("Configuration", "配置"),
        export: t$1("Copy configuration (JSON)", "复制配置（JSON）"),
        import: t$1("Import", "导入"),
        importHint: t$1("Paste exported JSON here, then Import", "在此粘贴导出的 JSON，然后点导入"),
        resetSite: t$1("Reset this site", "重置本站设置"),
        resetAll: t$1("Reset everything", "重置全部设置"),
        cancel: t$1("Cancel", "取消"),
        save: t$1("Save and reload", "保存并刷新"),
        saved: t$1("Settings saved", "设置已保存"),
        confirmClearAll: t$1("Clear the whole download history?", "确定清除全部下载记录？"),
        confirmResetAll: t$1("Reset every setting to the defaults?", "确定将所有设置恢复默认？"),
        copied: t$1("Configuration copied to the clipboard", "配置已复制到剪贴板"),
        done: t$1("Done", "完成")
      };
      const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
      function prune(layer) {
        const out = {};
        for (const [key, value] of Object.entries(layer)) {
          if (value === void 0 || value === "" || value === null) continue;
          if (typeof value === "object" && !Array.isArray(value)) {
            const inner = prune(value);
            if (Object.keys(inner).length) out[key] = inner;
          } else out[key] = value;
        }
        return out;
      }
      async function showSettings(host) {
        const saved = await host.loadOverrides();
        const draft = { global: clone(saved.global), sites: clone(saved.sites) };
        const profiles = host.profiles;
        let scope = profiles.some((profile) => profile.site.id === host.currentSiteId) ? host.currentSiteId : "";
        const { root: root2, close } = mountDialog("markify-settings");
        const layerOf = (id) => id ? draft.sites[id] ??= {} : draft.global;
        const profileOf = (id) => profiles.find((profile) => profile.site.id === id);
        const inherited = (id, read, fromProfile) => {
          if (id) {
            const global = read(draft.global);
            if (global !== void 0 && global !== "") return String(global);
            return String(fromProfile(profileOf(id)) ?? "");
          }
          const values = [...new Set(profiles.map((profile) => String(fromProfile(profile) ?? "")))];
          return values.length === 1 ? values[0] : t$1("each site's default", "各站点默认值");
        };
        async function render2() {
          const layer = layerOf(scope);
          const profile = scope ? profileOf(scope) : void 0;
          const history = await host.history();
          const agentOn = scope ? await host.agentEnabled(scope) : false;
          const filenameRows = FILENAMES.map((key) => {
            const label = { single: L$1.single, batch_item: L$1.batchItem, batch: L$1.batch }[key];
            const fallback = inherited(scope, (l2) => l2.filename?.[key], (p2) => p2.filename[key]);
            const keys = key === "batch" ? "site, type, id, date, tagname" : `title, author, id, date, site${key === "batch_item" ? ", index" : ""}`;
            return `<label class="row"><span>${label}</span><span>
                <input type="text" data-field="filename.${key}" value="${escape(layer.filename?.[key])}" placeholder="${escape(`${L$1.inherit} ${fallback}`)}">
                <div class="hint">${L$1.placeholders}: ${keys.split(", ").map((k) => `{${k}}`).join(" ")}</div>
                <div class="hint">${L$1.preview}: <span class="preview" data-preview="${key}"></span></div></span></label>`;
          }).join("");
          const blocks = profile ? TEMPLATE_BLOCKS.filter((block) => profile[block]?.template) : [];
          const templates2 = blocks.length ? `<section><details><summary>${L$1.templates}</summary><p class="hint">${L$1.templatesHint}</p>
            ${blocks.map((block) => `<label class="row"><span>${block}</span><textarea data-field="${block}.template" placeholder="${escape(profile[block].template)}">${escape(layer[block]?.template)}</textarea></label>`).join("")}
            </details></section>` : "";
          const fallbackMs = inherited(scope, (l2) => l2.runtime?.timeout_ms, (p2) => p2.runtime.timeout_ms);
          const timeoutFallback = /^\d+$/.test(fallbackMs) ? String(Number(fallbackMs) / 1e3) : fallbackMs;
          const siteCount = scope ? history.filter((entry) => entry.site === scope).length : void 0;
          root2.innerHTML = `<style>${DIALOG_STYLE}</style>
            <div class="overlay" part="overlay"><div class="panel" role="dialog" aria-modal="true" aria-label="${escape(L$1.title)}">
            <header><h2>⚙️ ${L$1.title}</h2>
                <label class="check">${L$1.scope}
                <select data-action="scope">
                    <option value="">${L$1.allSites}</option>
                    ${profiles.map((p2) => `<option value="${escape(p2.site.id)}" ${p2.site.id === scope ? "selected" : ""}>${escape(p2.site.name)}${p2.site.id === host.currentSiteId ? ` (${L$1.thisSite})` : ""}</option>`).join("")}
                </select></label>
            </header>
            <main>
                ${scope ? `<section><label class="check"><input type="checkbox" data-field="enabled" ${layer.enabled === false ? "" : "checked"}> ${L$1.enabled}</label>
                    <p class="hint">${L$1.enabledHint}</p></section>` : ""}
                <section><h3>${L$1.filenames}</h3>${filenameRows}</section>
                <section><h3>${L$1.network}</h3>
                    <label class="row"><span>${L$1.timeout}</span><input type="number" min="1" max="120" step="1" data-field="runtime.timeout_ms"
                        value="${layer.runtime?.timeout_ms ? layer.runtime.timeout_ms / 1e3 : ""}" placeholder="${escape(`${L$1.inherit} ${timeoutFallback}`)}"></label>
                </section>
                ${scope ? `<section><h3>${L$1.agent}</h3><p class="hint" data-status="agent">${agentOn ? L$1.agentOn : L$1.agentOff}</p>
                    <div class="buttons"><button data-action="agent-copy">${L$1.agentCopy}</button>${agentOn ? `<button class="danger" data-action="agent-revoke">${L$1.agentRevoke}</button>` : ""}</div></section>` : ""}
                <section><h3>${L$1.history}</h3><p class="hint" data-status="history">${L$1.historyCount(history.length, siteCount)}</p>
                    <div class="buttons">${scope ? `<button data-action="clear-site">${L$1.clearSite}</button>` : ""}
                    <button class="danger" data-action="clear-all">${L$1.clearAll}</button><button data-action="reset-button">${L$1.resetButton}</button><button class="primary" data-action="open-history">${L$1.manageHistory}</button></div></section>
                ${templates2}
                <section><h3>${L$1.config}</h3>
                    <div class="buttons"><button data-action="export">${L$1.export}</button>
                    ${scope ? `<button data-action="reset-site">${L$1.resetSite}</button>` : ""}<button class="danger" data-action="reset-all">${L$1.resetAll}</button></div>
                    <textarea data-input="import" placeholder="${escape(L$1.importHint)}"></textarea>
                    <div class="buttons"><button data-action="import">${L$1.import}</button></div>
                </section>
            </main>
            <footer><span class="error" role="alert"></span><button data-action="cancel">${L$1.cancel}</button><button class="primary" data-action="save">${L$1.save}</button></footer>
            </div></div>`;
          updatePreviews();
        }
        function collect() {
          const layer = layerOf(scope);
          for (const input of Array.from(root2.querySelectorAll("[data-field]"))) {
            const [group, key] = input.dataset.field.split(".");
            let value = input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked ? void 0 : false : input.value.trim();
            if (group === "runtime" && value !== "") value = Math.round(Number(value) * 1e3);
            if (key) layer[group] = { ...layer[group] ?? {}, [key]: value };
            else layer[group] = value;
          }
          const pruned = prune(layer);
          if (scope) {
            if (Object.keys(pruned).length) draft.sites[scope] = pruned;
            else delete draft.sites[scope];
          } else draft.global = pruned;
        }
        function updatePreviews() {
          const site = scope || profiles[0]?.site.id || "site";
          for (const key of FILENAMES) {
            const input = root2.querySelector(`[data-field="filename.${key}"]`);
            const target = root2.querySelector(`[data-preview="${key}"]`);
            if (!input || !target) continue;
            const template2 = input.value.trim() || (scope ? draft.global.filename?.[key] || profileOf(scope).filename[key] : profileOf(site)?.filename[key] ?? "{title}");
            try {
              target.textContent = applyFilenameTemplate(template2, { ...SAMPLE, site }) + (key === "batch" ? ".zip" : ".md");
            } catch (error2) {
              target.textContent = error2 instanceof Error ? error2.message : String(error2);
            }
          }
        }
        const fail = (error2) => {
          const box = root2.querySelector(".error");
          if (box) box.textContent = error2 instanceof Error ? error2.message : String(error2);
        };
        const overrides = () => ({ schema_version: 1, global: prune(draft.global), sites: Object.fromEntries(Object.entries(draft.sites).map(([id, layer]) => [id, prune(layer)]).filter(([, layer]) => Object.keys(layer).length)) });
        async function act(action) {
          switch (action) {
            case "cancel":
              close();
              return;
            case "save":
              collect();
              await host.saveOverrides(overrides());
              host.notify(L$1.saved);
              close();
              host.reload();
              return;
            case "agent-copy":
              await host.agentCopyToken(scope);
              break;
            case "agent-revoke":
              await host.agentRevoke(scope);
              break;
            case "clear-site":
              await host.clearHistory(scope);
              break;
            case "clear-all":
              if (!confirm(L$1.confirmClearAll)) return;
              await host.clearHistory();
              break;
            case "reset-button":
              await host.resetButtonPosition();
              host.notify(L$1.done);
              return;
            case "open-history":
              close();
              host.openHistory();
              return;
            case "export":
              collect();
              await host.copy(JSON.stringify(overrides(), null, 2));
              host.notify(L$1.copied);
              return;
            case "import": {
              const text2 = root2.querySelector('[data-input="import"]').value;
              const parsed = JSON.parse(text2);
              await host.saveOverrides(parsed);
              host.notify(L$1.saved);
              close();
              host.reload();
              return;
            }
            case "reset-site":
              await host.saveOverrides({ ...saved, sites: Object.fromEntries(Object.entries(saved.sites).filter(([id]) => id !== scope)) });
              host.notify(L$1.saved);
              close();
              host.reload();
              return;
            case "reset-all":
              if (!confirm(L$1.confirmResetAll)) return;
              await host.saveOverrides({ schema_version: 1, global: {}, sites: {} });
              host.notify(L$1.saved);
              close();
              host.reload();
              return;
            default:
              return;
          }
          await render2();
        }
        root2.addEventListener("click", (event) => {
          if (!event.isTrusted) return;
          const target = event.target;
          if (target.classList.contains("overlay")) {
            close();
            return;
          }
          const action = target.closest("[data-action]")?.dataset.action;
          if (!action || action === "scope") return;
          fail("");
          void act(action).catch(fail);
        });
        root2.addEventListener("change", (event) => {
          const target = event.target;
          if (target.dataset.action !== "scope") return;
          collect();
          scope = target.value;
          void render2().catch(fail);
        });
        root2.addEventListener("input", () => updatePreviews());
        root2.addEventListener("keydown", (event) => {
          if (event.key === "Escape") close();
        });
        await render2();
      }
      function updateStatus(record2, latest = record2.check) {
        if (!latest) return { changed: false, checked: false };
        const newReplies = typeof latest.replies === "number" && typeof record2.replies === "number" && latest.replies > record2.replies ? latest.replies - record2.replies : void 0;
        const active = latest.updated ? Date.parse(latest.updated) > Date.parse(record2.downloadedAt) : false;
        return { changed: active || newReplies !== void 0, newReplies, checked: true };
      }
      const STORAGE_KEY = "markify_download_history";
      let aliases = new Map();
      let writes = Promise.resolve();
      const storage = {
        getValue: async (key, fallback) => GM.getValue(key, fallback),
        setValue: (key, value) => GM.setValue(key, value)
      };
      function configureHistoryProfiles(profiles) {
        const next2 = new Map();
        for (const profile of profiles) {
          for (const alias of [profile.site.id, ...profile.site.name ? [profile.site.name] : [], ...profile.site.aliases]) {
            const key = alias.toLowerCase();
            if (next2.has(key) && next2.get(key) !== profile.site.id) throw new Error(`Conflicting history alias: ${alias}`);
            next2.set(key, profile.site.id);
          }
        }
        aliases = next2;
      }
      const canonical = (site) => aliases.get(site.toLowerCase()) ?? site;
      const keyFor = (id, site) => `${canonical(site)}:${id}`;
      function normalizeHistory(history) {
        const merged = {};
        for (const record2 of Object.values(history)) {
          if (!record2 || typeof record2.id !== "string" || typeof record2.site !== "string") continue;
          const key = keyFor(record2.id, record2.site);
          if (!merged[key] || record2.downloadedAt >= merged[key].downloadedAt) merged[key] = { ...record2, site: canonical(record2.site) };
        }
        return merged;
      }
      async function getDownloadHistory(store = storage) {
        return Object.values(normalizeHistory(await store.getValue(STORAGE_KEY, {})));
      }
      async function isDownloaded(id, site) {
        return (await getDownloadHistory()).some((record2) => record2.id === id && record2.site === canonical(site));
      }
      function mutate(change, store, active = () => true) {
        const task = writes.catch(() => void 0).then(async () => {
          if (!active()) return;
          const history = await store.getValue(STORAGE_KEY, {});
          if (!active()) return;
          change(history);
          await store.setValue(STORAGE_KEY, history);
        });
        writes = task;
        return task;
      }
      const snapshotOf$1 = (value) => ({
        ...typeof value?.replies === "number" ? { replies: value.replies } : {},
        ...typeof value?.updated === "string" && value.updated ? { updated: value.updated } : {}
      });
      async function markManyAsDownloaded(items, site, type, active = () => true, store = storage) {
        const downloadedAt = ( new Date()).toISOString();
        await mutate((history) => {
          for (const item of items) history[keyFor(item.id, site)] = { id: item.id, title: item.title, ...snapshotOf$1(item), site: canonical(site), type, downloadedAt };
        }, store, active);
      }
      async function markAsDownloaded(id, site, title, type, snapshot) {
        await markManyAsDownloaded([{ id, title, ...snapshot }], site, type);
      }
      async function recordCheck(id, site, latest) {
        let status;
        await mutate((history) => {
          for (const record2 of Object.values(history)) {
            if (!record2 || keyFor(record2.id, record2.site) !== keyFor(id, site)) continue;
            record2.check = { at: ( new Date()).toISOString(), ...snapshotOf$1(latest) };
            status = updateStatus(record2);
          }
        }, storage);
        return status;
      }
      async function removeDownload(id, site) {
        await mutate((history) => {
          for (const [key, record2] of Object.entries(history)) if (keyFor(record2.id, record2.site) === keyFor(id, site)) delete history[key];
        }, storage);
      }
      async function clearSiteHistory(site) {
        await mutate((history) => {
          for (const [key, record2] of Object.entries(history)) if (record2 && canonical(record2.site) === canonical(site)) delete history[key];
        }, storage);
      }
      async function clearHistory() {
        await mutate((history) => {
          for (const key of Object.keys(history)) delete history[key];
        }, storage);
      }
      async function getDownloadStats() {
        const records = await getDownloadHistory();
        return { total: records.length, single: records.filter((r2) => r2.type === "single").length, batch: records.filter((r2) => r2.type === "batch").length };
      }
      const downloadHistory = Object.freeze( Object.defineProperty({
        __proto__: null,
        clearHistory,
        clearSiteHistory,
        configureHistoryProfiles,
        getDownloadHistory,
        getDownloadStats,
        isDownloaded,
        markAsDownloaded,
        markManyAsDownloaded,
        normalizeHistory,
        recordCheck,
        removeDownload,
        updateStatus
      }, Symbol.toStringTag, { value: "Module" }));
      const L = {
        title: t$1("Download history", "下载记录"),
        site: t$1("Site", "站点"),
        all: t$1("All sites", "所有站点"),
        show: t$1("Show", "显示"),
        every: t$1("All", "全部"),
        changed: t$1("Updated since download", "下载后有更新"),
        unchecked: t$1("Not checked", "未检查"),
        summary: (total, changed, unchecked) => t$1(`${total} threads · ${changed} updated · ${unchecked} not checked`, `共 ${total} 条 · ${changed} 条有更新 · ${unchecked} 条未检查`),
        check: t$1("Check for updates", "检查更新"),
        stop: t$1("Stop", "停止"),
        checking: (done, total) => t$1(`Checking ${done}/${total}…`, `检查中 ${done}/${total}…`),
        checkHere: (name) => t$1(`Open ${name} to check or re-download its threads.`, `打开 ${name} 的页面才能检查或重新下载它的帖子。`),
        upToDate: t$1("Up to date", "最新"),
        updated: (replies) => replies ? t$1(`Updated · +${replies} replies`, `有更新 · +${replies} 条回复`) : t$1("Updated", "有更新"),
        failed: t$1("Check failed", "检查失败"),
        redownload: t$1("Download again", "重新下载"),
        remove: t$1("Remove", "删除"),
        empty: t$1("Nothing here yet.", "还没有记录。"),
        close: t$1("Close", "关闭"),
        downloaded: t$1("Downloaded", "下载于"),
        checkedAt: t$1("checked", "检查于")
      };
      const when = (iso) => iso ? new Date(iso).toLocaleString(void 0, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
      const EXTRA_STYLE = `
.panel { width: min(860px, calc(100vw - 32px)); }
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 12px 0; }
.toolbar select { width: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
td { padding: 8px 6px; border-top: 1px solid #27272a; vertical-align: top; }
td.title a { color: #e4e4e7; text-decoration: none; }
td.title a:hover { text-decoration: underline; }
td.title .meta { color: #a1a1aa; font-size: 12px; margin-top: 2px; }
td.actions { white-space: nowrap; text-align: right; }
td.actions button { padding: 4px 10px; font-size: 12px; }
.chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; white-space: nowrap; }
.chip.changed { background: #451a03; color: #fdba74; }
.chip.fresh { background: #052e16; color: #86efac; }
.chip.unknown { background: #27272a; color: #a1a1aa; }
.chip.failed { background: #450a0a; color: #fca5a5; }
`;
      async function showHistory(host) {
        const { root: root2, close: unmount } = mountDialog("markify-history");
        let site = host.profiles.some((profile) => profile.site.id === host.currentSiteId) ? host.currentSiteId : "";
        let filter = "all";
        let records = [];
        const failures = new Map();
        let checking;
        const close = () => {
          checking?.abort();
          unmount();
        };
        const nameOf = (id) => host.profiles.find((profile) => profile.site.id === id)?.site.name ?? id;
        const key = (record2) => `${record2.site}:${record2.id}`;
        const visible = () => records.filter((record2) => !site || record2.site === site).filter((record2) => filter === "all" || (filter === "changed" ? updateStatus(record2).changed : !updateStatus(record2).checked)).sort((a2, b2) => b2.downloadedAt.localeCompare(a2.downloadedAt));
        function chip(record2) {
          if (failures.has(key(record2))) return `<span class="chip failed" title="${escape(failures.get(key(record2)))}">${L.failed}</span>`;
          const status = updateStatus(record2);
          if (!status.checked) return `<span class="chip unknown">${L.unchecked}</span>`;
          return status.changed ? `<span class="chip changed">${L.updated(status.newReplies)}</span>` : `<span class="chip fresh">${L.upToDate}</span>`;
        }
        function row(record2) {
          const url2 = host.sourceUrl(record2.site, record2.id);
          const here = record2.site === host.currentSiteId;
          return `<tr data-key="${escape(key(record2))}">
            <td class="title">${url2 ? `<a href="${escape(url2)}" target="_blank" rel="noopener noreferrer">${escape(record2.title)}</a>` : escape(record2.title)}
                <div class="meta">${site ? "" : `${escape(nameOf(record2.site))} · `}${L.downloaded} ${escape(when(record2.downloadedAt))}${record2.check ? ` · ${L.checkedAt} ${escape(when(record2.check.at))}` : ""}</div></td>
            <td>${chip(record2)}</td>
            <td class="actions">${here ? `<button data-action="redownload">${L.redownload}</button> ` : ""}<button data-action="remove">${L.remove}</button></td>
        </tr>`;
        }
        async function render2() {
          records = await host.history();
          const ofSite = records.filter((record2) => !site || record2.site === site);
          const changed = ofSite.filter((record2) => updateStatus(record2).changed).length;
          const unchecked = ofSite.filter((record2) => !updateStatus(record2).checked).length;
          const list = visible();
          const canCheck = !!site && site === host.currentSiteId;
          root2.innerHTML = `<style>${DIALOG_STYLE}${EXTRA_STYLE}</style>
            <div class="overlay"><div class="panel" role="dialog" aria-modal="true" aria-label="${escape(L.title)}">
            <header><h2>📜 ${L.title}</h2></header>
            <main>
                <div class="toolbar">
                    <label class="check">${L.site}<select data-action="site"><option value="">${L.all}</option>
                        ${host.profiles.map((p2) => `<option value="${escape(p2.site.id)}" ${p2.site.id === site ? "selected" : ""}>${escape(p2.site.name)}</option>`).join("")}</select></label>
                    <label class="check">${L.show}<select data-action="filter">
                        <option value="all" ${filter === "all" ? "selected" : ""}>${L.every}</option>
                        <option value="changed" ${filter === "changed" ? "selected" : ""}>${L.changed}</option>
                        <option value="unchecked" ${filter === "unchecked" ? "selected" : ""}>${L.unchecked}</option></select></label>
                    ${canCheck ? `<button class="primary" data-action="check">${L.check}</button>` : ""}
                </div>
                <p class="hint" data-status="summary">${L.summary(ofSite.length, changed, unchecked)}</p>
                ${site && !canCheck ? `<p class="hint">${escape(L.checkHere(nameOf(site)))}</p>` : ""}
                ${list.length ? `<table><tbody>${list.map(row).join("")}</tbody></table>` : `<p class="hint">${L.empty}</p>`}
            </main>
            <footer><span class="error" role="alert"></span><button data-action="close">${L.close}</button></footer>
            </div></div>`;
        }
        const setStatus = (text2) => {
          const status = root2.querySelector('[data-status="summary"]');
          if (status) status.textContent = text2;
        };
        async function checkAll() {
          const controller = new AbortController();
          checking = controller;
          const button = root2.querySelector('[data-action="check"]');
          if (button) {
            button.textContent = L.stop;
            button.dataset.action = "stop";
          }
          const queue = visible().sort((a2, b2) => (a2.check?.at ?? "").localeCompare(b2.check?.at ?? ""));
          try {
            for (const [index, record2] of queue.entries()) {
              if (controller.signal.aborted) break;
              setStatus(L.checking(index + 1, queue.length));
              try {
                await host.recordCheck(record2.site, record2.id, await host.check(record2.site, record2.id));
                failures.delete(key(record2));
              } catch (error2) {
                failures.set(key(record2), error2 instanceof Error ? error2.message : String(error2));
              }
              if (index < queue.length - 1) await host.delay(controller.signal).catch(() => void 0);
            }
          } finally {
            if (checking === controller) checking = void 0;
          }
          if (!controller.signal.aborted) await render2();
        }
        async function act(action, target) {
          const record2 = records.find((entry) => key(entry) === target.closest("tr")?.dataset.key);
          switch (action) {
            case "close":
              close();
              return;
            case "check":
              await checkAll();
              return;
            case "stop":
              checking?.abort();
              checking = void 0;
              await render2();
              return;
            case "redownload":
              if (record2) {
                await host.redownload(record2);
                failures.delete(key(record2));
              }
              break;
            case "remove":
              if (record2) await host.remove(record2.site, record2.id);
              break;
            default:
              return;
          }
          await render2();
        }
        const fail = (error2) => {
          const box = root2.querySelector(".error");
          if (box) box.textContent = error2 instanceof Error ? error2.message : String(error2);
        };
        root2.addEventListener("click", (event) => {
          if (!event.isTrusted) return;
          const target = event.target;
          if (target.classList.contains("overlay")) {
            close();
            return;
          }
          const action = target.closest("button[data-action]")?.dataset.action;
          if (action) void act(action, target).catch(fail);
        });
        root2.addEventListener("change", (event) => {
          const target = event.target;
          if (target.dataset.action === "site") site = target.value;
          else if (target.dataset.action === "filter") filter = target.value;
          else return;
          checking?.abort();
          void render2().catch(fail);
        });
        root2.addEventListener("keydown", (event) => {
          if (event.key === "Escape") close();
        });
        await render2();
      }
      var define_MARKIFY_CONFIG_default = { adapters: { "1point3acres": { schema_version: 1, engine: "forum-json", transport: "gm", enabled: true, site: { id: "1point3acres", name: "1Point3Acres", base_url: "https://www.1point3acres.com", origins: ["https://www.1point3acres.com", "https://instant.1point3acres.com"], aliases: ["1point3acres"] }, activation: { matches: ["https://www.1point3acres.com/home/*", "https://www.1point3acres.com/bbs/thread-*", "https://instant.1point3acres.com/thread/*"], connect: ["api.1point3acres.com"] }, routes: [{ name: "discover", kind: "listing", pattern: "^/home/discover/([^/]+)/?$", id_group: 1, origins: ["https://www.1point3acres.com"], query_keys: ["page", "sort", "order", "tab", "type"] }, { name: "forum", kind: "listing", pattern: "^/home/forum/([^/]+)/?$", id_group: 1, origins: ["https://www.1point3acres.com"], query_keys: ["page", "sort", "order", "tab", "type"] }, { name: "tag", kind: "listing", pattern: "^/home/tag/([^/]+)/?$", id_group: 1, origins: ["https://www.1point3acres.com"], query_keys: ["page", "sort", "order", "tab", "type"] }, { name: "thread", kind: "thread", pattern: "^/home/thread/(\\d+)/?$", id_group: 1, origins: ["https://www.1point3acres.com"] }, { name: "pins", kind: "thread", pattern: "^/home/pins/(\\d+)/?$", id_group: 1, origins: ["https://www.1point3acres.com"] }, { name: "bbs-thread", kind: "thread", pattern: "^/bbs/thread-(\\d+)-\\d+-\\d+\\.html$", id_group: 1, origins: ["https://www.1point3acres.com"] }, { name: "instant-thread", kind: "thread", pattern: "^/thread/(\\d+)/?$", id_group: 1, origins: ["https://instant.1point3acres.com"] }, { name: "home", kind: "entry", pattern: "^/home/?$", origins: ["https://www.1point3acres.com"] }], batch: { layouts: [{ name: "forum-thread-items", route_names: ["discover", "forum", "tag"], root_selector: "main", row_selector: '[data-sentry-component="ForumThreadItem"]', link_selector: 'a[href*="/home/thread/"]:has(h3), a[href*="/home/pins/"]:has(h3)', title_selector: "h3", title_attribute: "title", exclude_selectors: ["aside", "[data-ad]"] }, { name: "legacy-home-thread-items", route_names: ["forum", "tag"], root_selector: "main", row_selector: '[data-sentry-component="HomeThreadItem"]', link_selector: 'a[href*="/home/pins/"]', title_selector: "h3", exclude_selectors: ["aside", "[data-ad]"] }], label_selector: "main h1" }, runtime: { poll_ms: 500, debounce_ms: 100, timeout_ms: 3e4 }, api: { thread_endpoint: "https://api.1point3acres.com/api/v3/home-threads/{thread_id}", posts_endpoint: "https://api.1point3acres.com/api/threads/{thread_id}/nested-posts?ps={page_size}&order={order}&pg={page}", nested_endpoint: "https://api.1point3acres.com/api/posts/{post_id}/nested-posts?ps={page_size}&pg={page}", max_pages: 100, page_size: 20, order: "time_asc", content_format: "bbcode", id_extraction: { patterns: ["thread-(\\d+)", "/pins/(\\d+)", "/thread/(\\d+)"] }, response: { success_field: "errno", success_value: 0, data_field: "thread", posts_field: "posts" }, fields: { title: "subject", author: "author", content: "message_bbcode", posted_at: "dateline", updated_at: "lastpost", views: "views", replies: "replies", favorites: "favtimes", attachments: "attachment_list", post: { id: "pid", author: "author", content: "message_bbcode", posted_at: "dateline", children: "replies.data", children_count: "replies.count", attachments: "attachment_list" }, attachment: { id: "aid", url: "url", name: "filename", image: "isimage" } } }, metadata: { tags: ["1point3acres", "forum"], source_url: "https://www.1point3acres.com/bbs/thread-{thread_id}-1-1.html" }, delimiter: "---", frontmatter: { template: '---\ntitle: "{title}"\nauthor: {author}\nposted_at: {posted_at}\nupdated_at: {updated_at}\ndownloaded_at: {downloaded_at}\nsource: {url}\nviews: {views}\nreplies: {replies}\nfavorites: {favorites}\ntags:\n  - 1point3acres\n  - forum\n---\n' }, document: { template: "{frontmatter}\n# {title}\n\n**Author:** {author} | **Date:** {date}\n\n---\n\n{content}\n\n---\n\n**Views:** {views} | **Replies:** {replies} | **Favorites:** {favorites}\n\n{comments}" }, comment: { template: "**{author}** - *{date}*\n\n{content}\n\n{nested}{delimiter}\n" }, comments_header: { template: "\n{delimiter}\n\n## Comments ({count})\n" }, reply: { template: "> **{author}** - *{date}*\n>\n{content}\n" }, replies_gap: { template: "> *{missing} more replies are not included ({reason}).*\n" }, filename: { single: "{title}", batch_item: "{id} - {title}", batch: "{site}-{type}-{tagname}-{date}" } }, linuxdo: { schema_version: 1, engine: "discourse-raw", transport: "fetch", enabled: true, site: { id: "linuxdo", name: "LINUX DO", base_url: "https://linux.do", origins: ["https://linux.do"], aliases: ["linux.do", "LinuxDo"] }, activation: { matches: ["https://linux.do/*"], connect: ["self"] }, routes: [{ name: "thread", kind: "thread", pattern: "^/t/(?:[^/]+/)?(\\d+)(?:/\\d+)?/?$", id_group: 1 }, { name: "category", kind: "listing", pattern: "^/c/([^/]+)(?:/[^/]+)*/?$", id_group: 1, query_keys: ["page", "order", "ascending", "status", "q"] }, { name: "tag", kind: "listing", pattern: "^/tags?/([^/]+)/?$", id_group: 1, query_keys: ["page", "order", "ascending"] }, { name: "search", kind: "listing", pattern: "^/search/?$", query_keys: ["q", "page", "expanded"] }, { name: "latest", kind: "listing", pattern: "^/(latest|new|top|hot)/?$", id_group: 1, query_keys: ["order", "ascending", "period", "page"] }, { name: "home", kind: "entry", pattern: "^/(?:categories)?/?$" }], batch: { layouts: [{ name: "topic-list", route_names: ["category", "tag", "latest"], root_selector: "#main-outlet", row_selector: "tr.topic-list-item", link_selector: 'a.title[href*="/t/"], a.raw-topic-link[href*="/t/"]', exclude_selectors: ["aside"], activity_selector: ".activity .relative-date, .age .relative-date", activity_attribute: "data-time" }, { name: "search-results", route_names: ["search"], root_selector: "#main-outlet", row_selector: ".fps-result", link_selector: 'a.search-link[href*="/t/"]', title_selector: ".topic-title", exclude_selectors: ["aside"] }], label_selector: "h1" }, runtime: { poll_ms: 500, debounce_ms: 100, timeout_ms: 3e4 }, api: { raw_endpoint: "{base_url}/raw/{topic_id}?page={page}", json_endpoint: "{base_url}/t/{topic_id}.json", max_pages: 100, page_size: 20, page_delay: { min_ms: 200, max_ms: 200, jitter: 0 }, request: { credentials: true, accept: "text/plain" } }, metadata: { title_cleanup: "[\\s\\-]+LINUX DO$", title_selectors: ["#topic-title .fancy-title", "#topic-title h1"], tags: ["linuxdo", "forum"], source_url: "{base_url}/t/{topic_id}" }, page_separator: "\n\n---\n\n", delimiter: "---", filename: { single: "{title}", batch_item: "{id} - {title}", batch: "{site}-{type}-{tagname}-{date}" } }, uscardforum: { schema_version: 1, engine: "discourse-raw", transport: "fetch", enabled: true, site: { id: "uscardforum", name: "US Card Forum", base_url: "https://www.uscardforum.com", origins: ["https://www.uscardforum.com"], aliases: ["USCardForum"] }, activation: { matches: ["https://www.uscardforum.com/*"], connect: ["self"] }, routes: [{ name: "thread", kind: "thread", pattern: "^/t/(?:[^/]+/)?(\\d+)(?:/\\d+)?/?$", id_group: 1 }, { name: "category", kind: "listing", pattern: "^/c/([^/]+)(?:/[^/]+)*/?$", id_group: 1, query_keys: ["page", "order", "ascending", "status", "q"] }, { name: "tag", kind: "listing", pattern: "^/tags?/([^/]+)/?$", id_group: 1, query_keys: ["page", "order", "ascending"] }, { name: "search", kind: "listing", pattern: "^/search/?$", query_keys: ["q", "page", "expanded"] }, { name: "latest", kind: "listing", pattern: "^/(latest|new|top|hot)/?$", id_group: 1, query_keys: ["order", "ascending", "period", "page"] }, { name: "home", kind: "entry", pattern: "^/(?:categories)?/?$" }], batch: { layouts: [{ name: "topic-list", route_names: ["category", "tag", "latest"], root_selector: "#main-outlet", row_selector: "tr.topic-list-item", link_selector: 'a.title[href*="/t/"], a.raw-topic-link[href*="/t/"]', exclude_selectors: ["aside"], activity_selector: ".activity .relative-date, .age .relative-date", activity_attribute: "data-time" }, { name: "search-results", route_names: ["search"], root_selector: "#main-outlet", row_selector: ".fps-result", link_selector: 'a.search-link[href*="/t/"]', title_selector: ".topic-title", exclude_selectors: ["aside"] }], label_selector: "h1" }, runtime: { poll_ms: 500, debounce_ms: 100, timeout_ms: 3e4 }, api: { raw_endpoint: "{base_url}/raw/{topic_id}?page={page}", json_endpoint: "{base_url}/t/{topic_id}.json", max_pages: 100, page_size: 20, page_delay: { min_ms: 100, max_ms: 100, jitter: 0 }, request: { credentials: true, accept: "text/plain" }, id_extraction: { patterns: ["/t/[^/]+/(\\d+)", "/t/(\\d+)"] } }, metadata: { title_cleanup: "[\\s\\-]+(美国信用卡指南|US Card Forum)$", title_selectors: ["#topic-title .fancy-title", "#topic-title h1"], tags: ["uscardforum", "forum", "credit-cards"], source_url: "{base_url}/t/{topic_id}" }, page_separator: "\n\n---\n\n", delimiter: "---", filename: { single: "{title}", batch_item: "{id} - {title}", batch: "{site}-{type}-{tagname}-{date}" } } }, templates: { document: { enabled: true, template: "{frontmatter}\n\n{content}\n" }, frontmatter: { enabled: true, fields: ["author", "date", "description", "downloaded", "source", "tags", "title"] }, content: { separator: "\n\n---\n\n" }, comment: { enabled: true, template: "## Comment {index} - {author}\n**Posted:** {date}\n\n{content}\n" }, filename: { single: "[{id}] {title}", batch_item: "{index} - [{id}] {title}", batch: "[{date}] [{site}] [{type}] [{id}] {tagname}" } } };
      var define_MARKIFY_NOTIFICATIONS_default = { messages: { clipboard_success: "Copied to clipboard!", download_success: "Downloaded as {filename}", history_cleared: "Download history cleared", settings_reset: "Settings reset to defaults", settings_saved: "Settings saved successfully!", stats_reset: "Stats reset successfully", api_fetching: "Fetching forum content via API...", downloading: "Downloading {current}/{total}...", processing: "Processing {item}...", conversion_failed: "Failed to convert page. Check console for details.", download_failed: "Failed to create ZIP: {error}", no_files: "No files were successfully downloaded", batch_complete: "Successfully downloaded all {total} items!", batch_partial: "Downloaded {success}/{total} items. {failed} failed.", stats_summary: "Downloaded: {total} total\n{single} single | {batch} batch\nHistory: {tracked} tracked", clear_history_confirm: "Clear all download history? This cannot be undone." }, timeouts: { long: 5e3, medium: 3e3, short: 2e3 }, delays: { cleanup: 100, dom_stabilize: 1e3, batch_item: { min_ms: 1e3, max_ms: 3e3, jitter: 0.25 }, api_page: { min_ms: 500, max_ms: 1500, jitter: 0.2 } }, http: { user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" } };
      var define_MARKIFY_PACKAGE_default = { author: "isandrel", description: "Convert web pages to Obsidian-formatted Markdown with YAML frontmatter", name: "Markify", repository: "https://github.com/isandrel/Markify", version: "0.0.5", strings: { app_title: "Markify", app_title_batch: "Markify Batch Download", app_title_error: "Markify Batch Download Error", app_title_stats: "Markify Stats" }, menu: { clear_history: "🗑️ Clear History", history: "📜 Download History", reset_stats: "🔄 Reset Stats", settings: "⚙️ Settings", stats: "📊 View Stats" } };
      var define_MARKIFY_TEMPLATES_default = { document: { enabled: true, template: "{frontmatter}\n\n{content}\n" }, frontmatter: { enabled: true, fields: ["author", "date", "description", "downloaded", "source", "tags", "title"] }, content: { separator: "\n\n---\n\n" }, comment: { enabled: true, template: "## Comment {index} - {author}\n**Posted:** {date}\n\n{content}\n" }, filename: { single: "[{id}] {title}", batch_item: "{index} - [{id}] {title}", batch: "[{date}] [{site}] [{type}] [{id}] {tagname}" } };
      var define_MARKIFY_THEME_default = { colors: { primary: "#7c3aed", primary_hover: "#6d28d9", primary_active: "#5b21b6", secondary: "#059669", secondary_hover: "#047857", secondary_active: "#065f46", success: "#22c55e", error: "#ef4444", warning: "#f59e0b", info: "#3b82f6", background: "#1a1a1a", surface: "#2a2a2a", text_primary: "#e5e7eb", text_secondary: "#a78bfa", text_muted: "#cdd6f4", overlay_alpha: 0.7, shadow_alpha: 0.4, shadow_alpha_hover: 0.5 } };
      var define_MARKIFY_UI_default = { ui: { buttons: { copy_text: "📋 Copy", download_text: "📥 Download", gap: "10px" }, indicators: { downloaded_icon: "✓ ", downloaded_tooltip: "Already downloaded", font_size_title: "1.2em" }, position: { default_right: "20px", default_top: "25%", z_index: 1e4 }, style: { border_radius: "8px", font_family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', font_size: "14px", font_weight: "600", padding: "12px 20px" }, shadows: { button_default: "0 4px 12px rgba(124, 58, 237, 0.4)", button_hover: "0 6px 16px rgba(124, 58, 237, 0.5)", copy_default: "0 4px 12px rgba(5, 150, 105, 0.4)", copy_hover: "0 6px 16px rgba(5, 150, 105, 0.5)" }, animations: { hover_transform: "translateY(-2px)", transition: "all 0.2s ease" } }, conversion: { code_block_style: "fenced", em_delimiter: "*", heading_style: "atx", link_style: "inlined", strong_delimiter: "**", remove_elements: { tags: ["aside", "footer", "header", "iframe", "nav", "script", "style"] } } };
      const theme = define_MARKIFY_THEME_default;
      const notifications = define_MARKIFY_NOTIFICATIONS_default;
      const ui = define_MARKIFY_UI_default;
      const pkg = { package: define_MARKIFY_PACKAGE_default };
      const templates = define_MARKIFY_TEMPLATES_default;
      const compiledConfig = define_MARKIFY_CONFIG_default;
      async function initializeConfig() {
        const existing = await GM.getValue(OVERRIDES_STORAGE_KEY, null);
        const legacy = await GM.getValue("markify_templates", null);
        const migration = migrateLegacyOverrides(legacy, existing);
        if (existing === null) {
          if (migration.backup != null && await GM.getValue(LEGACY_BACKUP_STORAGE_KEY, null) === null) {
            await GM.setValue(LEGACY_BACKUP_STORAGE_KEY, migration.backup);
          }
          applyUserOverrides(compiledConfig.adapters, migration.overrides);
          await GM.setValue(OVERRIDES_STORAGE_KEY, migration.overrides);
        }
        for (const warning of migration.warnings) console.warn("[Markify config]", warning);
        setConfig({ ...compiledConfig, adapters: applyUserOverrides(compiledConfig.adapters, migration.overrides) });
      }
      async function loadOverrides() {
        return parseUserOverrides(await GM.getValue(OVERRIDES_STORAGE_KEY, { schema_version: 1, global: {}, sites: {} }));
      }
      async function saveOverrides(input) {
        const overrides = parseUserOverrides(input);
        applyUserOverrides(compiledConfig.adapters, overrides);
        await GM.setValue(OVERRIDES_STORAGE_KEY, overrides);
      }
      async function resetOverridesForSite(siteId) {
        await saveOverrides(resetSiteOverrides(await loadOverrides(), siteId));
      }
      function getProfiles() {
        return getConfig().adapters;
      }
      function abortError() {
        return new DOMException("Download cancelled", "AbortError");
      }
      function createGMFetcher(timeoutMs, request2 = (details) => GM.xmlHttpRequest(details)) {
        return {
          get(url2, options = {}) {
            return new Promise((resolve, reject) => {
              if (options.signal?.aborted) {
                reject(abortError());
                return;
              }
              let settled = false;
              let handle;
              const finish = (response, error2) => {
                if (settled) return;
                settled = true;
                options.signal?.removeEventListener("abort", cancel);
                if (error2) reject(error2);
                else resolve(response);
              };
              const cancel = () => {
                finish(void 0, abortError());
                handle?.abort?.();
              };
              options.signal?.addEventListener("abort", cancel, { once: true });
              try {
                handle = request2({
                  method: "GET",
                  url: url2,
                  headers: options.headers,
                  timeout: options.timeoutMs ?? timeoutMs,
                  anonymous: options.credentials === false,
                  onload: (response) => finish({
                    status: response.status,
                    ok: response.status >= 200 && response.status < 300,
                    text: response.responseText
                  }),
                  onerror: () => finish(void 0, new Error("Network request failed")),
                  ontimeout: () => finish(void 0, new Error("Request timed out")),
                  onabort: () => finish(void 0, abortError())
                });
                if (options.signal?.aborted && !settled) cancel();
              } catch (error2) {
                finish(void 0, error2 instanceof Error ? error2 : new Error(String(error2)));
              }
            });
          }
        };
      }
      function createFetchFetcher(timeoutMs, fetchImpl = fetch) {
        return {
          async get(url2, options = {}) {
            if (options.signal?.aborted) throw abortError();
            const controller = new AbortController();
            const cancel = () => controller.abort(options.signal?.reason);
            options.signal?.addEventListener("abort", cancel, { once: true });
            const timer = setTimeout(() => controller.abort(new Error("Request timed out")), options.timeoutMs ?? timeoutMs);
            try {
              const response = await fetchImpl(url2, {
                headers: options.headers,
                credentials: options.credentials === true ? "include" : options.credentials === false ? "omit" : "same-origin",
                signal: controller.signal
              });
              return { status: response.status, ok: response.ok, text: await response.text() };
            } finally {
              clearTimeout(timer);
              options.signal?.removeEventListener("abort", cancel);
            }
          }
        };
      }
      function createProfileFetcher(profile) {
        return profile.transport === "gm" ? createGMFetcher(profile.runtime.timeout_ms) : createFetchFetcher(profile.runtime.timeout_ms);
      }
      class NavigationController {
        constructor(options) {
          this.options = options;
        }
        timer;
        key;
        lastUrl = "";
        active = false;
        interval = 0;
        start() {
          if (this.active) return;
          this.active = true;
          this.key = void 0;
          this.lastUrl = "";
          this.options.window.addEventListener("popstate", this.check);
          this.options.window.addEventListener("hashchange", this.check);
          this.check();
          if (!this.timer) this.setPoll(this.options.fallbackPollMs ?? 500);
        }
        setPoll(milliseconds) {
          if (this.timer && this.interval === milliseconds) return;
          clearInterval(this.timer);
          this.interval = milliseconds;
          this.timer = setInterval(this.check, milliseconds);
        }
        check = () => {
          if (!this.active) return;
          const url2 = this.options.window.location.href;
          if (url2 === this.lastUrl) return;
          this.lastUrl = url2;
          try {
            const route = this.options.resolve(url2);
            this.setPoll(route?.pollMs ?? this.options.fallbackPollMs ?? 500);
            const key = route?.key ?? null;
            if (key !== this.key) {
              this.key = key;
              this.options.onRoute(route, url2);
            }
          } catch (error2) {
            this.key = null;
            this.options.onRoute(null, url2);
            this.options.onError(error2);
          }
        };
        stop() {
          this.active = false;
          clearInterval(this.timer);
          this.timer = void 0;
          this.options.window.removeEventListener("popstate", this.check);
          this.options.window.removeEventListener("hashchange", this.check);
        }
      }
      function activityOf(element, layout) {
        if (!layout.activity_selector) return void 0;
        const node2 = element.querySelector(layout.activity_selector);
        const raw = (layout.activity_attribute ? node2?.getAttribute(layout.activity_attribute) : node2?.textContent)?.trim();
        if (!raw) return void 0;
        const number2 = /^\d+$/.test(raw) ? Number(raw) : NaN;
        const time2 = Number.isFinite(number2) ? number2 < 1e12 ? number2 * 1e3 : number2 : Date.parse(raw);
        return Number.isFinite(time2) ? new Date(time2).toISOString() : void 0;
      }
      class ProfileBatchCapability {
        constructor(profile, fetchContent, environment = {}) {
          this.profile = profile;
          this.fetchContent = fetchContent;
          this.document = environment.document ?? document;
          this.currentURL = environment.url ?? (() => window.location.href);
          this.diagnostic = { site: profile.site.id, status: "unsupported", count: 0 };
        }
        document;
        currentURL;
        diagnostic;
        get siteId() {
          return this.profile.site.id;
        }
        get debounceMs() {
          return this.profile.runtime.debounce_ms;
        }
        get filename() {
          return this.profile.filename;
        }
        get pageKey() {
          return classifyRoute(this.currentURL(), this.profile)?.key ?? this.currentURL();
        }
        isListingPage() {
          return classifyRoute(this.currentURL(), this.profile)?.kind === "listing";
        }
        extractRows() {
          const route = classifyRoute(this.currentURL(), this.profile);
          this.diagnostic = { site: this.siteId, route: route?.name, status: "unsupported", count: 0 };
          if (route?.kind !== "listing") return [];
          for (const layout of this.profile.batch.layouts) {
            if (!layout.route_names.includes(route.name)) continue;
            try {
              const roots = Array.from(this.document.querySelectorAll(layout.root_selector));
              if (!roots.length) continue;
              if (layout.loading_selector && roots.some((root2) => root2.querySelector(layout.loading_selector))) {
                this.diagnostic = { ...this.diagnostic, layout: layout.name, status: "loading" };
                return [];
              }
              const rows = [];
              const seen2 = new Set();
              for (const root2 of roots) {
                for (const element of Array.from(root2.querySelectorAll(layout.row_selector))) {
                  if (layout.exclude_selectors.some((selector) => element.closest(selector))) continue;
                  for (const link of Array.from(element.querySelectorAll(layout.link_selector))) {
                    const href = link.getAttribute("href");
                    if (!href) continue;
                    let url2;
                    try {
                      url2 = new URL(href, route.url);
                    } catch {
                      continue;
                    }
                    const thread = classifyRoute(url2.href, this.profile);
                    if (thread?.kind !== "thread" || !thread.id || seen2.has(thread.id)) continue;
                    const titleNode = layout.title_selector ? element.querySelector(layout.title_selector) : link;
                    const title = layout.title_attribute ? titleNode?.getAttribute(layout.title_attribute)?.trim() || titleNode?.textContent?.trim() : titleNode?.textContent?.trim();
                    if (!title) continue;
                    seen2.add(thread.id);
                    rows.push({ id: thread.id, title, url: url2.href, element, link, activity: activityOf(element, layout) });
                    break;
                  }
                }
              }
              if (rows.length) {
                this.diagnostic = { ...this.diagnostic, layout: layout.name, status: "ready", count: rows.length };
                return rows;
              }
              if (layout.empty_selector && roots.some((root2) => root2.querySelector(layout.empty_selector))) {
                this.diagnostic = { ...this.diagnostic, layout: layout.name, status: "empty" };
                return [];
              }
            } catch (error2) {
              throw new Error(`[${this.siteId}] batch.layouts.${layout.name}: ${error2 instanceof Error ? error2.message : String(error2)}`);
            }
          }
          return [];
        }
        fetchItem(id, onProgress, signal, item) {
          return this.fetchContent(id, onProgress, signal, item);
        }
        getFilenameContext() {
          const route = classifyRoute(this.currentURL(), this.profile);
          if (route?.kind !== "listing") throw new Error(`[${this.siteId}] Not a supported listing`);
          const id = route.id ?? route.url.searchParams.get("q") ?? route.name;
          const labelNode = this.profile.batch.label_selector ? this.document.querySelector(this.profile.batch.label_selector) : null;
          const label = (this.profile.batch.label_attribute ? labelNode?.getAttribute(this.profile.batch.label_attribute) : labelNode?.textContent)?.trim();
          return { site: this.siteId, type: route.name, id, tagname: label || id };
        }
      }
      "stream" in Blob.prototype || Object.defineProperty(Blob.prototype, "stream", { value() {
        return new Response(this).body;
      } }), "setBigUint64" in DataView.prototype || Object.defineProperty(DataView.prototype, "setBigUint64", { value(e2, n2, t2) {
        const i2 = Number(0xffffffffn & n2), r2 = Number(n2 >> 32n);
        this.setUint32(e2 + (t2 ? 0 : 4), i2, t2), this.setUint32(e2 + (t2 ? 4 : 0), r2, t2);
      } });
      var e = (e2) => new DataView(new ArrayBuffer(e2)), n = (e2) => new Uint8Array(e2.buffer || e2), t = (e2) => new TextEncoder().encode(String(e2)), i = (e2) => Math.min(4294967295, Number(e2)), r = (e2) => Math.min(65535, Number(e2));
      function o(e2, i2, r2) {
        void 0 === i2 || i2 instanceof Date || (i2 = new Date(i2));
        const o2 = void 0 !== e2;
        if (r2 || (r2 = o2 ? 436 : 509), e2 instanceof File) return { isFile: o2, t: i2 || new Date(e2.lastModified), bytes: e2.stream(), mode: r2 };
        if (e2 instanceof Response) return { isFile: o2, t: i2 || new Date(e2.headers.get("Last-Modified") || Date.now()), bytes: e2.body, mode: r2 };
        if (void 0 === i2) i2 = new Date();
        else if (isNaN(i2)) throw new Error("Invalid modification date.");
        if (!o2) return { isFile: o2, t: i2, mode: r2 };
        if ("string" == typeof e2) return { isFile: o2, t: i2, bytes: t(e2), mode: r2 };
        if (e2 instanceof Blob) return { isFile: o2, t: i2, bytes: e2.stream(), mode: r2 };
        if (e2 instanceof Uint8Array || e2 instanceof ReadableStream) return { isFile: o2, t: i2, bytes: e2, mode: r2 };
        if (e2 instanceof ArrayBuffer || ArrayBuffer.isView(e2)) return { isFile: o2, t: i2, bytes: n(e2), mode: r2 };
        if (Symbol.asyncIterator in e2) return { isFile: o2, t: i2, bytes: f(e2[Symbol.asyncIterator]()), mode: r2 };
        throw new TypeError("Unsupported input format.");
      }
      function f(e2, n2 = e2) {
        return new ReadableStream({ async pull(n3) {
          let t2 = 0;
          for (; n3.desiredSize > t2; ) {
            const i2 = await e2.next();
            if (!i2.value) {
              n3.close();
              break;
            }
            {
              const e3 = a(i2.value);
              n3.enqueue(e3), t2 += e3.byteLength;
            }
          }
        }, cancel(e3) {
          n2.throw?.(e3);
        } });
      }
      function a(e2) {
        return "string" == typeof e2 ? t(e2) : e2 instanceof Uint8Array ? e2 : n(e2);
      }
      function s(e2, i2, r2) {
        let [o2, f2] = (function(e3) {
          return e3 ? e3 instanceof Uint8Array ? [e3, 1] : ArrayBuffer.isView(e3) || e3 instanceof ArrayBuffer ? [n(e3), 1] : [t(e3), 0] : [void 0, 0];
        })(i2);
        if (e2 instanceof File) return { i: d(o2 || t(e2.name)), o: BigInt(e2.size), u: f2 };
        if (e2 instanceof Response) {
          const n2 = e2.headers.get("content-disposition"), i3 = n2 && n2.match(/;\s*filename\*?\s*=\s*(?:UTF-\d+''|)["']?([^;"'\r\n]*)["']?(?:;|$)/i), a2 = i3 && i3[1] || e2.url && new URL(e2.url).pathname.split("/").findLast(Boolean), s2 = a2 && decodeURIComponent(a2), u2 = r2 || +e2.headers.get("content-length");
          return { i: d(o2 || t(s2)), o: BigInt(u2), u: f2 };
        }
        return o2 = d(o2, void 0 !== e2 || void 0 !== r2), "string" == typeof e2 ? { i: o2, o: BigInt(t(e2).length), u: f2 } : e2 instanceof Blob ? { i: o2, o: BigInt(e2.size), u: f2 } : e2 instanceof ArrayBuffer || ArrayBuffer.isView(e2) ? { i: o2, o: BigInt(e2.byteLength), u: f2 } : { i: o2, o: u(e2, r2), u: f2 };
      }
      function u(e2, n2) {
        return n2 > -1 ? BigInt(n2) : e2 ? void 0 : 0n;
      }
      function d(e2, n2 = 1) {
        if (!e2 || e2.every(((c) => 47 === c))) throw new Error("The file must have a name.");
        if (n2) for (; 47 === e2[e2.length - 1]; ) e2 = e2.subarray(0, -1);
        else 47 !== e2[e2.length - 1] && (e2 = new Uint8Array([...e2, 47]));
        return e2;
      }
      var l = new Uint32Array(256);
      for (let e2 = 0; e2 < 256; ++e2) {
        let n2 = e2;
        for (let e3 = 0; e3 < 8; ++e3) n2 = n2 >>> 1 ^ (1 & n2 && 3988292384);
        l[e2] = n2;
      }
      function y(e2, n2 = 0) {
        n2 = ~n2;
        for (var t2 = 0, i2 = e2.length; t2 < i2; t2++) n2 = n2 >>> 8 ^ l[255 & n2 ^ e2[t2]];
        return ~n2 >>> 0;
      }
      function w(e2, n2, t2 = 0) {
        const i2 = e2.getSeconds() >> 1 | e2.getMinutes() << 5 | e2.getHours() << 11, r2 = e2.getDate() | e2.getMonth() + 1 << 5 | e2.getFullYear() - 1980 << 9;
        n2.setUint16(t2, i2, 1), n2.setUint16(t2 + 2, r2, 1);
      }
      function B({ i: e2, u: n2 }, t2) {
        return 8 * (!n2 || (t2 ?? (function(e3) {
          try {
            b.decode(e3);
          } catch {
            return 0;
          }
          return 1;
        })(e2)));
      }
      var b = new TextDecoder("utf8", { fatal: 1 });
      function p(t2, i2 = 0) {
        const r2 = e(30);
        return r2.setUint32(0, 1347093252), r2.setUint32(4, 754976768 | i2), w(t2.t, r2, 10), r2.setUint16(26, t2.i.length, 1), n(r2);
      }
      async function* g(e2) {
        let { bytes: n2 } = e2;
        if ("then" in n2 && (n2 = await n2), n2 instanceof Uint8Array) yield n2, e2.l = y(n2, 0), e2.o = BigInt(n2.length);
        else {
          e2.o = 0n;
          const t2 = n2.getReader();
          for (; ; ) {
            const { value: n3, done: i2 } = await t2.read();
            if (i2) break;
            e2.l = y(n3, e2.l), e2.o += BigInt(n3.length), yield n3;
          }
        }
      }
      function I(t2, r2) {
        const o2 = e(16 + (r2 ? 8 : 0));
        return o2.setUint32(0, 1347094280), o2.setUint32(4, t2.isFile ? t2.l : 0, 1), r2 ? (o2.setBigUint64(8, t2.o, 1), o2.setBigUint64(16, t2.o, 1)) : (o2.setUint32(8, i(t2.o), 1), o2.setUint32(12, i(t2.o), 1)), n(o2);
      }
      function v(t2, r2, o2 = 0, f2 = 0) {
        const a2 = e(46);
        return a2.setUint32(0, 1347092738), a2.setUint32(4, 755182848), a2.setUint16(8, 2048 | o2), w(t2.t, a2, 12), a2.setUint32(16, t2.isFile ? t2.l : 0, 1), a2.setUint32(20, i(t2.o), 1), a2.setUint32(24, i(t2.o), 1), a2.setUint16(28, t2.i.length, 1), a2.setUint16(30, f2, 1), a2.setUint16(40, t2.mode | (t2.isFile ? 32768 : 16384), 1), a2.setUint32(42, i(r2), 1), n(a2);
      }
      function h(t2, i2, r2) {
        const o2 = e(r2);
        return o2.setUint16(0, 1, 1), o2.setUint16(2, r2 - 4, 1), 16 & r2 && (o2.setBigUint64(4, t2.o, 1), o2.setBigUint64(12, t2.o, 1)), o2.setBigUint64(r2 - 8, i2, 1), n(o2);
      }
      function D(e2) {
        return e2 instanceof File || e2 instanceof Response ? [[e2], [e2]] : [[e2.input, e2.name, e2.size], [e2.input, e2.lastModified, e2.mode]];
      }
      var S = (e2) => (function(e3) {
        let n2 = BigInt(22), t2 = 0n, i2 = 0;
        for (const r2 of e3) {
          if (!r2.i) throw new Error("Every file must have a non-empty name.");
          if (void 0 === r2.o) throw new Error(`Missing size for file "${new TextDecoder().decode(r2.i)}".`);
          const e4 = r2.o >= 0xffffffffn, o2 = t2 >= 0xffffffffn;
          t2 += BigInt(46 + r2.i.length + (e4 && 8)) + r2.o, n2 += BigInt(r2.i.length + 46 + (12 * o2 | 28 * e4)), i2 || (i2 = e4);
        }
        return (i2 || t2 >= 0xffffffffn) && (n2 += BigInt(76)), n2 + t2;
      })((function* (e3) {
        for (const n2 of e3) yield s(...D(n2)[0]);
      })(e2));
      function A(e2, n2 = {}) {
        const t2 = { "Content-Type": "application/zip", "Content-Disposition": "attachment" };
        return ("bigint" == typeof n2.length || Number.isInteger(n2.length)) && n2.length > 0 && (t2["Content-Length"] = String(n2.length)), n2.metadata && (t2["Content-Length"] = String(S(n2.metadata))), new Response(N(e2, n2), { headers: t2 });
      }
      function N(t2, a2 = {}) {
        const u2 = (function(e2) {
          const n2 = e2[Symbol.iterator in e2 ? Symbol.iterator : Symbol.asyncIterator]();
          return { async next() {
            const e3 = await n2.next();
            if (e3.done) return e3;
            const [t3, i2] = D(e3.value);
            return { done: 0, value: Object.assign(o(...i2), s(...t3)) };
          }, throw: n2.throw?.bind(n2), [Symbol.asyncIterator]() {
            return this;
          } };
        })(t2);
        return f((async function* (t3, o2) {
          const f2 = [];
          let a3 = 0n, s2 = 0n, u3 = 0;
          for await (const e2 of t3) {
            const n2 = B(e2, o2.buffersAreUTF8);
            yield p(e2, n2), yield new Uint8Array(e2.i), e2.isFile && (yield* g(e2));
            const t4 = e2.o >= 0xffffffffn, i2 = 12 * (a3 >= 0xffffffffn) | 28 * t4;
            yield I(e2, t4), f2.push(v(e2, a3, n2, i2)), f2.push(e2.i), i2 && f2.push(h(e2, a3, i2)), t4 && (a3 += 8n), s2++, a3 += BigInt(46 + e2.i.length) + e2.o, u3 || (u3 = t4);
          }
          let d2 = 0n;
          for (const e2 of f2) yield e2, d2 += BigInt(e2.length);
          if (u3 || a3 >= 0xffffffffn) {
            const t4 = e(76);
            t4.setUint32(0, 1347094022), t4.setBigUint64(4, BigInt(44), 1), t4.setUint32(12, 755182848), t4.setBigUint64(24, s2, 1), t4.setBigUint64(32, s2, 1), t4.setBigUint64(40, d2, 1), t4.setBigUint64(48, a3, 1), t4.setUint32(56, 1347094023), t4.setBigUint64(64, a3 + d2, 1), t4.setUint32(72, 1, 1), yield n(t4);
          }
          const l2 = e(22);
          l2.setUint32(0, 1347093766), l2.setUint16(8, r(s2), 1), l2.setUint16(10, r(s2), 1), l2.setUint32(12, i(d2), 1), l2.setUint32(16, i(a3), 1), yield n(l2);
        })(u2, a2), u2);
      }
      function initiateDownload(blob, filename, doc = document) {
        const url2 = URL.createObjectURL(blob);
        const anchor2 = doc.createElement("a");
        try {
          anchor2.href = url2;
          anchor2.download = filename;
          anchor2.style.display = "none";
          doc.body.appendChild(anchor2);
          anchor2.click();
        } finally {
          anchor2.remove();
          setTimeout(() => URL.revokeObjectURL(url2), 100);
        }
      }
      class BatchDownloadManager {
        constructor(adapter, services = {}) {
          this.adapter = adapter;
          const doc = services.document ?? document;
          this.startKey = adapter.pageKey;
          this.services = {
            document: doc,
            history: getDownloadHistory,
            saveHistory: (items, site, active) => markManyAsDownloaded(items, site, "batch", active),
            zip: (files) => A(files).blob(),
            download: (blob, filename) => initiateDownload(blob, filename, doc),
            delay: async () => void 0,
            notify: (message) => {
              GM.notification({ title: "Markify Batch Download", text: message, timeout: 5e3 });
            },
            ...services
          };
        }
        services;
        startKey;
        rows = new Map();
        selected = new Set();
        panel = null;
        selectAll = null;
        button = null;
        observer = null;
        timer;
        generation = 0;
        destroyed = false;
        running = false;
        refreshPromise = null;
        refreshAgain = false;
        abort = new AbortController();
        active(generation = this.generation) {
          return !this.destroyed && generation === this.generation && this.adapter.pageKey === this.startKey;
        }
        initializeUI() {
          if (!this.active() || !this.adapter.isListingPage() || this.panel) return;
          this.createPanel();
          const Observer = this.services.document.defaultView?.MutationObserver;
          if (Observer) {
            this.observer = new Observer((mutations) => {
              const owned = (node2) => {
                const element = node2.nodeType === 1 ? node2 : node2.parentElement;
                return !!element?.closest("[data-markify-owned]");
              };
              if (mutations.every((m) => owned(m.target) || m.type === "childList" && [...m.addedNodes, ...m.removedNodes].every(owned))) return;
              clearTimeout(this.timer);
              this.timer = setTimeout(() => {
                void this.refresh().catch((error2) => this.report(error2));
              }, this.adapter.debounceMs);
            });
            this.observer.observe(this.services.document.body, { childList: true, subtree: true, attributes: true, characterData: true, attributeFilter: ["href", "data-sentry-component", "aria-busy"] });
          }
          void this.refresh().catch((error2) => this.report(error2));
        }
        refresh() {
          if (!this.active()) return Promise.resolve();
          this.refreshAgain = true;
          if (this.refreshPromise) return this.refreshPromise;
          this.refreshPromise = this.reconcile().finally(() => {
            this.refreshPromise = null;
          });
          return this.refreshPromise;
        }
        async reconcile() {
          const generation = this.generation;
          while (this.refreshAgain && this.active(generation)) {
            this.refreshAgain = false;
            const discovered = this.adapter.extractRows();
            const records = await this.services.history();
            if (!this.active(generation)) return;
            const current = new Map(discovered.filter((row) => row.element.isConnected).map((row) => [row.id, row]));
            for (const [id, owned] of this.rows) {
              if (current.get(id)?.element !== owned.row.element || !owned.wrapper.isConnected) {
                this.detach(owned);
                this.rows.delete(id);
              }
              if (!current.has(id)) this.selected.delete(id);
            }
            for (const row of current.values()) {
              const existing = this.rows.get(row.id);
              if (existing) {
                existing.row = row;
                continue;
              }
              const record2 = records.find((entry) => entry.site === this.adapter.siteId && entry.id === row.id);
              this.rows.set(row.id, this.attach(row, record2));
            }
            this.updateControls();
          }
        }
        attach(row, record2) {
          const doc = this.services.document;
          const wrapper = doc.createElement("div");
          wrapper.className = "markify-checkbox-wrapper";
          wrapper.dataset.markifyOwned = "row";
          wrapper.style.cssText = "position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:20;display:flex;align-items:center;pointer-events:auto;";
          const checkbox = doc.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "markify-batch-checkbox";
          checkbox.dataset.itemId = row.id;
          checkbox.setAttribute("aria-label", `Select ${row.title}`);
          checkbox.style.cssText = "width:18px;height:18px;margin:0;cursor:pointer;";
          checkbox.checked = this.selected.has(row.id);
          for (const event of ["click", "pointerdown", "keydown"]) wrapper.addEventListener(event, (e2) => e2.stopPropagation());
          checkbox.addEventListener("change", (e2) => {
            e2.stopPropagation();
            if (this.running || !this.active()) {
              checkbox.checked = this.selected.has(row.id);
              return;
            }
            if (checkbox.checked) this.selected.add(row.id);
            else this.selected.delete(row.id);
            this.updateControls();
          });
          wrapper.appendChild(checkbox);
          if (record2) {
            const listed = !!(row.activity && record2.downloadedAt && Date.parse(row.activity) > Date.parse(record2.downloadedAt));
            const changed = listed || !!record2.downloadedAt && updateStatus(record2).changed;
            const indicator = doc.createElement("span");
            indicator.className = "markify-history-indicator";
            indicator.dataset.markifyStatus = changed ? "updated" : "downloaded";
            indicator.textContent = changed ? "✓↻" : "✓";
            indicator.title = changed ? "Downloaded; updated since" : "Already downloaded";
            indicator.style.cssText = `color:${changed ? "#f59e0b" : "#22c55e"};margin-left:4px;`;
            wrapper.appendChild(indicator);
          }
          const host = row.element.tagName === "TR" ? row.link.closest("td, th") ?? row.element : row.element;
          const owned = { host, row, wrapper, checkbox, position: host.style.position, padding: host.style.paddingLeft };
          const padding = Number.parseFloat(doc.defaultView?.getComputedStyle?.(host).paddingLeft ?? "") || 0;
          host.style.position = "relative";
          host.style.paddingLeft = `${padding + 36}px`;
          host.appendChild(wrapper);
          return owned;
        }
        detach(owned) {
          owned.wrapper.remove();
          owned.host.style.position = owned.position;
          owned.host.style.paddingLeft = owned.padding;
        }
        destroy() {
          if (this.destroyed) return;
          this.destroyed = true;
          this.generation++;
          this.abort.abort();
          this.observer?.disconnect();
          clearTimeout(this.timer);
          for (const owned of this.rows.values()) this.detach(owned);
          this.rows.clear();
          this.selected.clear();
          this.panel?.remove();
          this.panel = this.button = this.selectAll = null;
        }
        createPanel() {
          const doc = this.services.document;
          this.panel = doc.createElement("div");
          this.panel.id = "markify-batch-panel";
          this.panel.dataset.markifyOwned = "panel";
          this.panel.style.cssText = "position:fixed;bottom:80px;right:20px;z-index:10001;background:#1e1e2e;color:#cdd6f4;border-radius:12px;padding:16px 20px;display:flex;gap:12px;align-items:center;";
          this.selectAll = doc.createElement("input");
          this.selectAll.type = "checkbox";
          this.selectAll.id = "markify-select-all";
          this.selectAll.addEventListener("change", () => {
            if (this.running || !this.active()) return;
            this.selected.clear();
            if (this.selectAll?.checked) for (const id of this.rows.keys()) this.selected.add(id);
            this.updateControls();
          });
          const label = doc.createElement("label");
          label.htmlFor = this.selectAll.id;
          label.textContent = "Select All";
          this.button = doc.createElement("button");
          this.button.style.cssText = "background:#7c3aed;color:white;border:0;border-radius:8px;padding:10px 18px;";
          this.button.addEventListener("click", () => {
            void this.downloadSelected();
          });
          this.panel.append(this.selectAll, label, this.button);
          doc.body.append(this.panel);
          this.updateControls();
        }
        updateControls() {
          if (this.button) {
            if (!this.running) this.button.textContent = `📥 Download Selected (${this.selected.size})`;
            this.button.disabled = this.running || !this.selected.size || !this.active();
          }
          if (this.selectAll) {
            this.selectAll.checked = this.rows.size > 0 && this.selected.size === this.rows.size;
            this.selectAll.indeterminate = this.selected.size > 0 && this.selected.size < this.rows.size;
            this.selectAll.disabled = this.running || !this.rows.size;
          }
          for (const [id, owned] of this.rows) {
            owned.checkbox.checked = this.selected.has(id);
            owned.checkbox.disabled = this.running;
          }
        }
        report(error2) {
          if (this.active()) this.services.notify(error2 instanceof Error ? error2.message : String(error2));
        }
        async downloadSelected() {
          if (this.running || !this.active()) return;
          const items = this.adapter.extractRows().filter((row) => this.selected.has(row.id)).map(({ id, title, url: url2 }) => Object.freeze({ id, title, url: url2 }));
          if (!items.length) return;
          this.running = true;
          this.updateControls();
          const generation = this.generation;
          const active = () => this.active(generation);
          const filenames = { ...this.adapter.filename };
          const successful = [];
          const failures = [];
          try {
            const context = { ...await this.adapter.getFilenameContext() };
            if (!active()) return;
            const files = [];
            const usedNames = new Set();
            for (const [index, item] of items.entries()) {
              if (!active()) return;
              if (this.button) this.button.textContent = `Processing ${index + 1}/${items.length}`;
              try {
                const markdown = await this.adapter.fetchItem(item.id, (message) => {
                  if (active() && this.button) this.button.textContent = message;
                }, this.abort.signal, item);
                if (!active()) return;
                if (!markdown?.trim()) throw new Error("No complete content returned");
                const base = applyFilenameTemplate(filenames.batch_item, { ...context, id: item.id, title: item.title, index: String(index + 1).padStart(3, "0") });
                let name = `${base}.md`;
                let suffix = 1;
                while (usedNames.has(name.toLowerCase())) name = `${base} [${item.id}${suffix++ > 1 ? `-${suffix - 1}` : ""}].md`;
                usedNames.add(name.toLowerCase());
                files.push({ name, input: markdown });
                successful.push(item);
              } catch (error2) {
                if (!active()) return;
                failures.push(`${item.title}: ${error2 instanceof Error ? error2.message : String(error2)}`);
              }
              if (index < items.length - 1) await this.services.delay(this.abort.signal);
            }
            if (!active()) return;
            if (!files.length) {
              this.services.notify(`No files downloaded. ${failures.join("; ")}`);
              return;
            }
            const blob = await this.services.zip(files);
            if (!active()) return;
            this.services.download(blob, `${applyFilenameTemplate(filenames.batch, context)}.zip`);
            if (!active()) return;
            try {
              await this.services.saveHistory(successful, this.adapter.siteId, active);
            } catch (error2) {
              if (active()) this.services.notify(`ZIP download started, but history could not be saved: ${error2 instanceof Error ? error2.message : String(error2)}`);
            }
            if (!active()) return;
            for (const item of successful) this.selected.delete(item.id);
            this.services.notify(`Download started for ${successful.length}/${items.length} items.${failures.length ? ` ${failures.length} failed and remain selected. ${failures.join("; ")}` : ""}`);
          } catch (error2) {
            this.report(error2);
          } finally {
            this.running = false;
            if (active()) this.updateControls();
          }
        }
      }
      const AGENT_API_STORAGE_KEY = "markify_agent_api_v1";
      const MAX_BATCH = 50;
      const AGENT_CLIENT = Symbol("markify.client");
      const MAX_TOKEN_FAILURES = 5;
      function normalizeAgentSettings(value) {
        const sites = {};
        const raw = value?.sites;
        if (raw && typeof raw === "object") {
          for (const [site, entry] of Object.entries(raw)) {
            if (typeof entry?.token === "string" && entry.token.length >= 32) sites[site] = { token: entry.token, createdAt: String(entry.createdAt ?? "") };
          }
        }
        return { sites };
      }
      function newAgentToken(random = (bytes) => crypto.getRandomValues(bytes)) {
        return `mfy_${Array.from(random(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
      }
      function sameToken(given, expected) {
        let diff = given.length ^ expected.length;
        for (let index = 0; index < expected.length; index++) diff |= (given.charCodeAt(index) || 0) ^ expected.charCodeAt(index);
        return diff === 0;
      }
      const tokenSchema = { type: "string", description: "Secret token from the Markify menu (🤖 AI Console API)" };
      const targetSchema = {
        oneOf: [{ type: "string", description: "Thread URL on this site, or a numeric thread id" }, { type: "integer", minimum: 1 }]
      };
      class AgentApiError extends Error {
        constructor(code, message) {
          super(message);
          this.code = code;
          this.name = "AgentApiError";
        }
      }
      function errorOf(error2) {
        if (error2 instanceof AgentApiError) return { code: error2.code, message: error2.message };
        const code = typeof error2?.code === "string" ? error2.code : error2?.name === "AbortError" ? "ABORTED" : "EXPORT_FAILED";
        return { code, message: error2 instanceof Error ? error2.message : String(error2) };
      }
      function resolveTarget(target, profile, currentUrl) {
        let url2;
        if (target === void 0 || target === null || target === "") {
          url2 = currentUrl;
        } else if (typeof target === "number" && Number.isInteger(target) && target > 0 || typeof target === "string" && /^\d+$/.test(target)) {
          const template2 = profile.metadata?.source_url;
          if (!template2) throw new AgentApiError("INVALID_TARGET", `${profile.site.name} has no thread URL template; pass a full URL`);
          url2 = interpolate(template2, { base_url: profile.site.base_url, thread_id: String(target), topic_id: String(target) });
        } else if (typeof target === "string") {
          url2 = target;
        } else {
          throw new AgentApiError("INVALID_TARGET", "Target must be a thread URL or a numeric thread id");
        }
        let route;
        try {
          route = classifyRoute(url2, profile);
        } catch {
          route = null;
        }
        if (route?.kind !== "thread" || !route.id) {
          throw new AgentApiError("INVALID_TARGET", target === void 0 || target === null || target === "" ? "This page is not a thread; pass a thread id or URL" : `Not a ${profile.site.name} thread: ${String(target)}`);
        }
        return { url: url2, id: route.id };
      }
      function createAgentApi(host) {
        let queue = Promise.resolve();
        const serial = (task) => {
          const next2 = queue.catch(() => void 0).then(task);
          queue = next2;
          return next2;
        };
        const site = () => {
          const profile = host.profile();
          if (!profile) throw new AgentApiError("UNSUPPORTED_SITE", "Markify has no enabled profile for this site");
          return profile;
        };
        async function exportOne(target, options = {}) {
          let profile;
          let resolved;
          try {
            profile = site();
            resolved = resolveTarget(target, profile, host.location());
            const outcome = await host.exportThread(resolved.url, { title: options.title, download: options.download === true });
            return { ok: true, site: profile.site.id, id: resolved.id, url: resolved.url, ...outcome };
          } catch (error2) {
            return { ok: false, site: profile?.site.id ?? "unknown", id: resolved?.id, url: resolved?.url, error: errorOf(error2) };
          }
        }
        const commands = [
          {
            name: "status",
            description: "Where the browser is: site, page kind (thread, listing, entry) and thread id, plus the API version.",
            input: { type: "object", properties: {}, additionalProperties: false },
            async run() {
              const profile = host.profile();
              let route = null;
              try {
                route = profile ? classifyRoute(host.location(), profile) : null;
              } catch {
              }
              return {
                version: host.version,
                url: host.location(),
                site: profile ? { id: profile.site.id, name: profile.site.name } : null,
                page: route ? { kind: route.kind, route: route.name, id: route.id ?? null } : null
              };
            }
          },
          {
            name: "export",
            description: "Convert one thread to Markdown (with frontmatter and comments) using the logged-in session. Defaults to the current thread page. Returns the Markdown; only downloads a file when download is true.",
            input: {
              type: "object",
              properties: {
                target: targetSchema,
                download: { type: "boolean", default: false, description: "Also save the .md file and record it in download history" },
                title: { type: "string", description: "Title to use when the site API has none and the thread is not the open page" }
              },
              additionalProperties: false
            },
            run: (args) => serial(() => exportOne(args.target, { download: args.download, title: typeof args.title === "string" ? args.title : void 0 }))
          },
          {
            name: "list",
            description: "Threads shown on the current listing page (feed, category, tag, search, latest), with whether each was downloaded before.",
            input: { type: "object", properties: {}, additionalProperties: false },
            async run() {
              const profile = site();
              const items = await host.listRows();
              if (!items) throw new AgentApiError("NOT_A_LISTING", "This page is not a listing; open a feed, category, tag or search page");
              return { site: profile.site.id, url: host.location(), items };
            }
          },
          {
            name: "exportMany",
            description: `Convert several threads (at most ${MAX_BATCH}) one after another with polite delays. Returns one result per target, in order; failures do not stop the rest. With zip true, also downloads a ZIP of the successes.`,
            input: {
              type: "object",
              properties: {
                targets: { type: "array", items: targetSchema, minItems: 1, maxItems: MAX_BATCH },
                zip: { type: "boolean", default: false, description: "Also download a ZIP of the successful exports and record them in history" }
              },
              required: ["targets"],
              additionalProperties: false
            },
            run: (args) => serial(async () => {
              const targets = args.targets;
              if (!Array.isArray(targets) || !targets.length) throw new AgentApiError("INVALID_TARGET", "targets must be a non-empty array");
              if (targets.length > MAX_BATCH) throw new AgentApiError("TOO_MANY", `At most ${MAX_BATCH} targets per call`);
              const titles = new Map((await host.listRows().catch(() => null) ?? []).map((item) => [item.id, item.title]));
              const results = [];
              for (const [index, target] of targets.entries()) {
                const id = typeof target === "number" || /^\d+$/.test(String(target)) ? String(target) : void 0;
                results.push(await exportOne(target, { title: id ? titles.get(id) : void 0 }));
                if (index < targets.length - 1) await host.delay();
              }
              if (args.zip) {
                const ok = results.filter((result) => result.ok);
                if (ok.length) {
                  const zip = await host.downloadZip(ok.map((result) => ({ id: result.id, title: result.title, markdown: result.markdown, metadata: result.metadata })));
                  return { results, zip };
                }
              }
              return { results };
            })
          },
          {
            name: "history",
            description: "Threads of the current site already downloaded with Markify (read-only).",
            input: { type: "object", properties: {}, additionalProperties: false },
            async run() {
              const profile = site();
              return { site: profile.site.id, items: await host.history(profile.site.id) };
            }
          }
        ];
        let failures = 0;
        async function authorize(token) {
          if (failures >= MAX_TOKEN_FAILURES) throw new AgentApiError("LOCKED", "Too many wrong tokens; reload the page and copy the token from the Markify menu");
          const profile = site();
          const expected = await host.token(profile.site.id);
          if (!expected) throw new AgentApiError("DISABLED", `The AI console API is off for ${profile.site.name}; enable it from the Markify menu (🤖 AI Console API)`);
          if (typeof token !== "string" || !sameToken(token, expected)) {
            failures++;
            throw new AgentApiError("UNAUTHORIZED", "Wrong or revoked token; copy the current one from the Markify menu (🤖 AI Console API)");
          }
        }
        const help = () => ({
          name: "markify",
          version: host.version,
          usage: "The user copies a token from the Markify menu (🤖 AI Console API). Then: const m = await markify.connect(token); await m.export() on a thread page, or await m.exportMany((await m.list()).items.slice(0, 5).map(i => i.id)). Every command returns a Promise of plain JSON.",
          commands: commands.map((command) => ({ name: command.name, description: command.description, input: command.input })),
          errors: [
            "DISABLED",
            "UNAUTHORIZED",
            "LOCKED",
            "UNSUPPORTED_SITE",
            "INVALID_TARGET",
            "NOT_A_LISTING",
            "TOO_MANY",
            "ACCESS_DENIED",
            "HTTP_ERROR",
            "TIMEOUT",
            "REPEATED_PAGE",
            "PAGE_LIMIT",
            "EXPORT_FAILED"
          ]
        });
        async function call(token, name, args = {}) {
          await authorize(token);
          const command = commands.find((entry) => entry.name === name);
          if (!command) throw new AgentApiError("UNKNOWN_COMMAND", `No command ${name}`);
          return command.run(args);
        }
        const client = (token) => ({
          [AGENT_CLIENT]: true,
          help: async () => help(),
          status: () => call(token, "status"),
          export: (target, options = {}) => call(token, "export", { ...options, target }),
          list: () => call(token, "list"),
          exportMany: (targets, options = {}) => call(token, "exportMany", { ...options, targets }),
          history: () => call(token, "history")
        });
        return {
          help,
          commands,
          call,
resetLock: () => {
            failures = 0;
          },
root: {
            help: async () => help(),
            connect: async (token) => {
              await authorize(token);
              return client(token);
            }
          }
        };
      }
      const plain = (value) => value === void 0 ? value : JSON.parse(JSON.stringify(value));
      function installAgentApi(target, api, scope = globalThis) {
        const exportFunction = typeof scope.exportFunction === "function" ? scope.exportFunction : void 0;
        const cloneInto = typeof scope.cloneInto === "function" ? scope.cloneInto : void 0;
        const pageWindow = target.wrappedJSObject ?? target;
        const toPage = (value) => cloneInto ? cloneInto(value, target) : value;
        const expose = (methods) => {
          const object = exportFunction ? new target.Object() : {};
          for (const [name, method] of Object.entries(methods)) {
            const call = (...args) => {
              const result = Promise.resolve().then(() => method(...args.map(plain))).then(
                (value) => value?.[AGENT_CLIENT] ? expose(value) : toPage(plain(value)),
                (error2) => {
                  throw toPage(plain(errorOf(error2)));
                }
              );
              if (!exportFunction) return result;
              return new target.Promise(exportFunction((resolve, reject) => {
                result.then(resolve, reject);
              }, target));
            };
            if (exportFunction) exportFunction(call, object, { defineAs: name });
            else object[name] = call;
          }
          if (!exportFunction) Object.freeze(object);
          return object;
        };
        try {
          Object.defineProperty(pageWindow, "markify", { value: expose(api.root), configurable: false, enumerable: false, writable: false });
        } catch (error2) {
          console.warn("[Markify] This page already defines window.markify; the AI console API is unavailable here", error2);
          return false;
        }
        const modelContext = target.navigator?.modelContext;
        if (typeof modelContext?.registerTool === "function") {
          for (const command of api.commands) {
            try {
              modelContext.registerTool({
                name: `markify_${command.name}`,
                description: command.description,
                inputSchema: {
                  ...command.input,
                  properties: { token: tokenSchema, ...command.input.properties },
                  required: ["token", ...command.input.required ?? []]
                },
                execute: async (input) => {
                  const { token, ...args } = plain(input ?? {});
                  let text2;
                  try {
                    text2 = JSON.stringify(await api.call(token, command.name, args));
                  } catch (error2) {
                    text2 = JSON.stringify({ ok: false, error: errorOf(error2) });
                  }
                  return { content: [{ type: "text", text: text2 }] };
                }
              });
            } catch (error2) {
              console.warn("[Markify] WebMCP tool registration failed", command.name, error2);
            }
          }
        }
        return true;
      }
      let downloadButton = null;
      let activeButton = null;
      let activeSingleAbort = null;
      let activeBatchManager = null;
      let routeGeneration = 0;
      function snapshotOf(metadata) {
        return {
          replies: typeof metadata?.replies === "number" ? metadata.replies : void 0,
          updated: typeof metadata?.updated === "string" ? metadata.updated : void 0
        };
      }
      async function configuredBatchDelay(signal) {
        const delay = notifications?.delays?.batch_item;
        const min = typeof delay === "object" ? delay.min_ms : 1e3;
        const max = typeof delay === "object" ? delay.max_ms : 3e3;
        const jitter = typeof delay === "object" ? delay.jitter : 0.25;
        const base = min + Math.random() * Math.max(0, max - min);
        const milliseconds = Math.max(0, Math.round(base * (1 + (Math.random() * 2 - 1) * jitter)));
        await new Promise((resolve, reject) => {
          const timer = setTimeout(finish, milliseconds);
          function finish() {
            signal.removeEventListener("abort", cancel);
            resolve();
          }
          function cancel() {
            clearTimeout(timer);
            signal.removeEventListener("abort", cancel);
            reject(new DOMException("Download cancelled", "AbortError"));
          }
          if (signal.aborted) cancel();
          else signal.addEventListener("abort", cancel, { once: true });
        });
      }
      async function activateRoute(route, url2) {
        const generation = ++routeGeneration;
        activeSingleAbort?.abort();
        activeBatchManager?.destroy();
        activeBatchManager = null;
        document.querySelector('[data-markify-owned="history"]')?.remove();
        const toolbar = document.querySelector("#markify-container");
        if (toolbar) toolbar.style.display = "none";
        if (!route) return;
        const profile = getProfiles()[route.profileId];
        if (!profile) return;
        if (route.kind === "thread") {
          if (toolbar) toolbar.style.display = "flex";
          await showDownloadStatus(url2, () => generation === routeGeneration && window.location.href === url2);
          return;
        }
        if (route.kind !== "listing" || generation !== routeGeneration) return;
        const snapshots = new Map();
        const capability = new ProfileBatchCapability(profile, async (id, onProgress, signal, item) => {
          if (!item) throw new Error("Batch item URL is missing");
          const result = await convert({
            url: item.url,
            templates,
            fetcher: createProfileFetcher(profile),
            adapterConfig: profile,
            signal,
            onProgress,
            metadataSnapshot: { title: item.title, url: item.url, id, tags: profile.metadata?.tags, date: formatDate(), downloaded: formatDate() },
            includeFrontmatter: true,
            strategy: "api-only"
          });
          snapshots.set(id, snapshotOf(result.metadata));
          return result.markdown;
        }, { document, url: () => window.location.href });
        const manager = new BatchDownloadManager(capability, {
          saveHistory: (items, site, active) => markManyAsDownloaded(items.map((item) => ({ ...item, ...snapshots.get(item.id) })), site, "batch", active),
          delay: configuredBatchDelay,
          notify: (text2) => GM.notification({
            text: text2,
            title: pkg?.package?.strings?.app_title_batch,
            timeout: notifications?.timeouts?.long
          })
        });
        if (generation !== routeGeneration) {
          manager.destroy();
          return;
        }
        activeBatchManager = manager;
        manager.initializeUI();
      }
      async function convertToMarkdown(url2, metadataSnapshot, profile, signal) {
        const adapter = findProfileAdapter(url2) ?? findSiteAdapter(url2, builtInAdapters);
        logger.info(`Using adapter: ${adapter?.name || "None"}`);
        return convert({
          url: url2,
          document,
          templates,
          fetcher: profile ? createProfileFetcher(profile) : createFetchFetcher(3e4),
          adapterConfig: profile,
          metadataSnapshot,
          signal,
          onProgress: (progress) => {
            if (!signal.aborted && activeButton) activeButton.textContent = progress;
          },
          includeFrontmatter: true,
          conversion: {
            headingStyle: ui?.conversion?.heading_style,
            codeBlockStyle: ui?.conversion?.code_block_style,
            emDelimiter: ui?.conversion?.em_delimiter,
            strongDelimiter: ui?.conversion?.strong_delimiter,
            linkStyle: ui?.conversion?.link_style,
            removeElements: ui?.conversion?.remove_elements?.tags || ["script", "style", "nav", "header", "footer", "aside", "iframe"]
          }
        });
      }
      async function getPageMetadata(url2) {
        const adapter = findProfileAdapter(url2) ?? findSiteAdapter(url2, builtInAdapters);
        const metadata = {
          title: document.title || "Untitled",
          url: url2,
          date: formatDate(),
          downloaded: formatDate()
        };
        if (adapter?.extractMetadata) {
          const customMetadata = await adapter.extractMetadata(document, url2);
          Object.assign(metadata, customMetadata);
        } else {
          const authorMeta = document.querySelector('meta[name="author"]');
          const descMeta = document.querySelector('meta[name="description"]');
          const keywordsMeta = document.querySelector('meta[name="keywords"]');
          if (authorMeta?.content) metadata.author = authorMeta.content;
          if (descMeta?.content) metadata.description = descMeta.content;
          const tags = keywordsMeta?.content.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0) || ["web-clip"];
          metadata.tags = tags;
        }
        if (adapter?.frontmatterFields) {
          Object.assign(metadata, adapter.frontmatterFields);
        }
        return { metadata, adapter };
      }
      function downloadMarkdown(content, filename) {
        const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
        const url2 = URL.createObjectURL(blob);
        const a2 = document.createElement("a");
        a2.href = url2;
        a2.download = filename;
        a2.style.display = "none";
        document.body.appendChild(a2);
        a2.click();
        setTimeout(() => {
          document.body.removeChild(a2);
          URL.revokeObjectURL(url2);
        }, notifications?.delays?.cleanup);
      }
      function routeFor(url2) {
        return classifyRegistryRoute(url2, getProfiles());
      }
      async function handleDownload(mode = "download") {
        if (activeSingleAbort) return;
        const startUrl = window.location.href;
        const route = routeFor(startUrl);
        const profile = route ? getProfiles()[route.profileId] : void 0;
        const controller = new AbortController();
        activeSingleAbort = controller;
        try {
          const captured = await getPageMetadata(startUrl);
          const result = await convertToMarkdown(startUrl, captured.metadata, profile, controller.signal);
          if (controller.signal.aborted) return;
          const metadata = result.metadata;
          const adapter = captured.adapter;
          const filenameTemplate = profile?.filename.single ?? templates?.filename?.single ?? "{title}";
          const { applyFilenameTemplate: applyFilenameTemplate2 } = await __vitePreload(async () => {
            const { applyFilenameTemplate: applyFilenameTemplate22 } = await module.import('./index-CSOeiHu3-COwhfQWm.js');
            return { applyFilenameTemplate: applyFilenameTemplate22 };
          }, true ? void 0 : void 0);
          const filename = applyFilenameTemplate2(filenameTemplate, {
            title: metadata.title || captured.metadata.title || "untitled",
            id: route?.id,
            author: metadata.author,
            site: profile?.site.id ?? adapter?.name,
            date: formatDate()
          }) + ".md";
          if (mode === "clipboard") {
            await GM.setClipboard(result.markdown, "text");
            GM.notification({
              text: notifications?.messages?.clipboard_success || "Copied to clipboard!",
              title: pkg?.package?.strings?.app_title || "Markify",
              timeout: notifications?.timeouts?.short || 2e3
            });
          } else {
            downloadMarkdown(result.markdown, filename);
            GM.notification({
              text: formatMessage(notifications?.messages?.download_success || "Downloaded {filename}", { filename }),
              title: pkg?.package?.strings?.app_title || "Markify",
              timeout: notifications?.timeouts?.medium || 3e3
            });
            if (route?.id && profile) {
              const { markAsDownloaded: markAsDownloaded2 } = await __vitePreload(async () => {
                const { markAsDownloaded: markAsDownloaded22 } = await Promise.resolve().then(() => downloadHistory);
                return { markAsDownloaded: markAsDownloaded22 };
              }, true ? void 0 : void 0);
              await markAsDownloaded2(route.id, profile.site.id, metadata.title || captured.metadata.title, "single", snapshotOf(metadata));
              logger.info(`Marked ${route.id} as downloaded`);
            }
          }
          const stats = await GM.getValue("markify_stats", 0);
          await GM.setValue("markify_stats", stats + 1);
        } catch (error2) {
          if (controller.signal.aborted) return;
          console.error("Failed to convert page:", error2);
          GM.notification({
            text: notifications?.messages?.conversion_failed,
            title: pkg?.package?.strings?.app_title,
            timeout: notifications?.timeouts?.long
          });
        } finally {
          if (activeSingleAbort === controller) activeSingleAbort = null;
          if (activeButton) {
            activeButton.textContent = activeButton === downloadButton ? ui?.ui?.buttons?.download_text : ui?.ui?.buttons?.copy_text;
            activeButton = null;
          }
        }
      }
      async function showDownloadStatus(url2 = window.location.href, active = () => true) {
        document.querySelector('[data-markify-owned="history"]')?.remove();
        const route = routeFor(url2);
        if (route?.kind !== "thread" || !route.id) return;
        const profile = getProfiles()[route.profileId];
        const { isDownloaded: isDownloaded2 } = await __vitePreload(async () => {
          const { isDownloaded: isDownloaded3 } = await Promise.resolve().then(() => downloadHistory);
          return { isDownloaded: isDownloaded3 };
        }, void 0 );
        const downloaded = await isDownloaded2(route.id, profile.site.id);
        if (!active() || !downloaded) return;
        const titleElement = document.querySelector("h1.text-xl, h1.font-bold, h1");
        if (!titleElement) return;
        const indicator = document.createElement("span");
        indicator.dataset.markifyOwned = "history";
        indicator.dataset.markifyStatus = "downloaded";
        indicator.textContent = ui?.ui?.indicators?.downloaded_icon;
        indicator.title = ui?.ui?.indicators?.downloaded_tooltip;
        indicator.style.cssText = `
        color: ${theme?.colors?.success};
        font-size: ${ui?.ui?.indicators?.font_size_title};
        margin-right: 6px;
        font-weight: bold;
    `;
        titleElement.insertBefore(indicator, titleElement.firstChild);
        logger.info("Download status indicator added to post page");
        try {
          const status = await recordCheck(route.id, profile.site.id, await fetchThreadState(route.id, createProfileFetcher(profile), profile));
          if (!active() || !status?.changed) return;
          indicator.dataset.markifyStatus = "updated";
          indicator.textContent = `${indicator.textContent} ↻${status.newReplies ? ` +${status.newReplies}` : ""}`;
          indicator.title = status.newReplies ? t$1(`Downloaded; ${status.newReplies} new replies since`, `已下载；之后新增 ${status.newReplies} 条回复`) : t$1("Downloaded; updated since", "已下载；之后有更新");
          indicator.style.color = theme?.colors?.warning || "#f59e0b";
        } catch (error2) {
          logger.info(`Update check skipped: ${error2 instanceof Error ? error2.message : String(error2)}`);
        }
      }
      async function createDownloadButton() {
        const container = document.createElement("div");
        container.id = "markify-container";
        Object.assign(container.style, {
          position: "fixed",
          top: ui?.ui?.position?.default_top,
          right: ui?.ui?.position?.default_right,
          zIndex: String(ui?.ui?.position?.z_index),
          display: "flex",
          gap: ui?.ui?.buttons?.gap,
          flexDirection: "row",
          cursor: "move",
          userSelect: "none"
        });
        container.style.display = "none";
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        container.addEventListener("mousedown", (e2) => {
          if (e2.target.tagName === "BUTTON") return;
          e2.preventDefault();
          isDragging = true;
          const rect = container.getBoundingClientRect();
          initialX = e2.clientX - rect.left;
          initialY = e2.clientY - rect.top;
          container.style.cursor = "grabbing";
        });
        document.addEventListener("mousemove", (e2) => {
          if (!isDragging) return;
          e2.preventDefault();
          currentX = e2.clientX - initialX;
          currentY = e2.clientY - initialY;
          const maxX = window.innerWidth - container.offsetWidth;
          const maxY = window.innerHeight - container.offsetHeight;
          currentX = Math.max(0, Math.min(currentX, maxX));
          currentY = Math.max(0, Math.min(currentY, maxY));
          container.style.left = currentX + "px";
          container.style.top = currentY + "px";
          container.style.right = "auto";
          container.style.bottom = "auto";
        });
        document.addEventListener("mouseup", () => {
          if (isDragging) {
            isDragging = false;
            container.style.cursor = "move";
            const rect = container.getBoundingClientRect();
            GM.setValue("markify_button_x", rect.left);
            GM.setValue("markify_button_y", rect.top);
          }
        });
        const savedX = await GM.getValue("markify_button_x", null);
        const savedY = await GM.getValue("markify_button_y", null);
        if (savedX !== null && savedY !== null) {
          container.style.left = savedX + "px";
          container.style.top = savedY + "px";
          container.style.right = "auto";
        }
        const baseButtonStyle = {
          padding: ui?.ui?.style?.padding,
          border: "none",
          borderRadius: ui?.ui?.style?.border_radius,
          fontSize: ui?.ui?.style?.font_size,
          fontWeight: ui?.ui?.style?.font_weight,
          cursor: "pointer",
          transition: ui?.ui?.animations?.transition,
          fontFamily: ui?.ui?.style?.font_family,
          color: "white"
        };
        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = ui?.ui?.buttons?.download_text;
        downloadButton = downloadBtn;
        downloadBtn.id = "markify-download-btn";
        Object.assign(downloadBtn.style, {
          ...baseButtonStyle,
          backgroundColor: theme?.colors?.primary,
          boxShadow: ui?.ui?.shadows?.button_default
        });
        downloadBtn.addEventListener("mouseenter", () => {
          downloadBtn.style.backgroundColor = theme?.colors?.primary_hover;
          downloadBtn.style.transform = ui?.ui?.animations?.hover_transform;
          downloadBtn.style.boxShadow = ui?.ui?.shadows?.button_hover;
        });
        downloadBtn.addEventListener("mouseleave", () => {
          downloadBtn.style.backgroundColor = theme?.colors?.primary;
          downloadBtn.style.transform = "translateY(0)";
          downloadBtn.style.boxShadow = ui?.ui?.shadows?.button_default;
        });
        downloadBtn.addEventListener("click", () => {
          if (activeSingleAbort) return;
          activeButton = downloadBtn;
          void handleDownload("download");
        });
        const copyBtn = document.createElement("button");
        copyBtn.textContent = ui?.ui?.buttons?.copy_text;
        copyBtn.id = "markify-copy-btn";
        Object.assign(copyBtn.style, {
          ...baseButtonStyle,
          backgroundColor: theme?.colors?.secondary,
          boxShadow: ui?.ui?.shadows?.copy_default
        });
        copyBtn.addEventListener("mouseenter", () => {
          copyBtn.style.backgroundColor = theme?.colors?.secondary_hover;
          copyBtn.style.transform = ui?.ui?.animations?.hover_transform;
          copyBtn.style.boxShadow = ui?.ui?.shadows?.copy_hover;
        });
        copyBtn.addEventListener("mouseleave", () => {
          copyBtn.style.backgroundColor = theme?.colors?.secondary;
          copyBtn.style.transform = "translateY(0)";
          copyBtn.style.boxShadow = ui?.ui?.shadows?.copy_default;
        });
        copyBtn.addEventListener("click", () => {
          if (activeSingleAbort) return;
          activeButton = copyBtn;
          void handleDownload("clipboard");
        });
        container.appendChild(downloadBtn);
        container.appendChild(copyBtn);
        document.body.appendChild(container);
      }
      function currentProfile() {
        return Object.values(getProfiles()).find((profile) => profile.enabled && profile.site.origins.includes(window.location.origin));
      }
      const agentHost = {
        version: pkg?.package?.version,
        location: () => window.location.href,
        profile: currentProfile,
        async exportThread(url2, options) {
          const profile = currentProfile();
          const route = classifyRoute(url2, profile);
          const current = classifyRoute(window.location.href, profile);
          const snapshot = current?.kind === "thread" && current.id === route?.id ? (await getPageMetadata(window.location.href)).metadata : { title: options.title || "Untitled", url: url2, id: route?.id, tags: profile.metadata?.tags, date: formatDate(), downloaded: formatDate() };
          const result = await convertToMarkdown(url2, { ...snapshot, url: url2 }, profile, options.signal ?? new AbortController().signal);
          const title = result.metadata.title || snapshot.title || "untitled";
          const filename = applyFilenameTemplate(profile.filename.single, { title, id: route?.id, author: result.metadata.author, site: profile.site.id, date: formatDate() }) + ".md";
          if (options.download) {
            downloadMarkdown(result.markdown, filename);
            if (route?.id) await markAsDownloaded(route.id, profile.site.id, title, "single", snapshotOf(result.metadata));
          }
          return { markdown: result.markdown, filename, title, metadata: { ...result.metadata } };
        },
        async listRows() {
          const profile = currentProfile();
          if (!profile || classifyRoute(window.location.href, profile)?.kind !== "listing") return null;
          const rows = new ProfileBatchCapability(profile, async () => null, { document, url: () => window.location.href }).extractRows();
          const done = new Set((await getDownloadHistory()).filter((record2) => record2.site === profile.site.id).map((record2) => record2.id));
          return rows.map((row) => ({ id: row.id, title: row.title, url: row.url, downloaded: done.has(row.id) }));
        },
        async history(siteId) {
          return (await getDownloadHistory()).filter((record2) => record2.site === siteId).map(({ id, title, downloadedAt, type }) => ({ id, title, downloadedAt, type }));
        },
        async downloadZip(items) {
          const profile = currentProfile();
          const context = { site: profile.site.id, date: formatDate() };
          const used = new Set();
          const files = items.map((item, index) => {
            const base = applyFilenameTemplate(profile.filename.batch_item, { ...context, id: item.id, title: item.title, index: String(index + 1).padStart(3, "0") });
            let name = `${base}.md`;
            if (used.has(name.toLowerCase())) name = `${base} [${item.id}].md`;
            used.add(name.toLowerCase());
            return { name, input: item.markdown };
          });
          const archive = `${applyFilenameTemplate(profile.filename.batch, context)}.zip`;
          initiateDownload(await A(files).blob(), archive);
          await markManyAsDownloaded(items.map(({ id, title, metadata }) => ({ id, title, ...snapshotOf(metadata) })), profile.site.id, "batch");
          return archive;
        },
        delay: (signal) => configuredBatchDelay(signal ?? new AbortController().signal),
        async token(siteId) {
          return normalizeAgentSettings(await GM.getValue(AGENT_API_STORAGE_KEY, null)).sites[siteId]?.token;
        }
      };
      const agentApi = createAgentApi(agentHost);
      let agentApiInstalled = false;
      function installAgentApiOnce() {
        if (!agentApiInstalled) agentApiInstalled = installAgentApi(typeof unsafeWindow !== "undefined" ? unsafeWindow : window, agentApi);
        return agentApiInstalled;
      }
      async function agentApiMenu(action, profile = currentProfile()) {
        if (!profile) {
          GM.notification({ text: "Markify has no profile for this site.", title: "Markify", timeout: 3e3 });
          return;
        }
        const settings = normalizeAgentSettings(await GM.getValue(AGENT_API_STORAGE_KEY, null));
        if (action === "disable") {
          delete settings.sites[profile.site.id];
          await GM.setValue(AGENT_API_STORAGE_KEY, settings);
          GM.notification({ text: `AI console API turned off for ${profile.site.name}; its token is revoked.`, title: "Markify", timeout: 4e3 });
          return;
        }
        const token = settings.sites[profile.site.id]?.token ?? newAgentToken();
        settings.sites[profile.site.id] = { token, createdAt: settings.sites[profile.site.id]?.createdAt || ( new Date()).toISOString() };
        await GM.setValue(AGENT_API_STORAGE_KEY, settings);
        agentApi.resetLock();
        const installed = profile.site.id !== currentProfile()?.site.id || installAgentApiOnce();
        await GM.setClipboard(token, "text");
        GM.notification({
          text: installed ? `AI console API on for ${profile.site.name}. Token copied; give it to your agent: await markify.connect(token)` : "Token copied, but this page blocks window.markify. Reload and try again.",
          title: "Markify",
          timeout: 6e3
        });
      }
      function threadUrl(profile, id) {
        const template2 = profile.metadata?.source_url;
        return template2 ? interpolate(template2, { base_url: profile.site.base_url, thread_id: id, topic_id: id }) : void 0;
      }
      function checkDelay(signal) {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            signal.removeEventListener("abort", stop);
            resolve();
          }, 800 + Math.random() * 700);
          function stop() {
            clearTimeout(timer);
            reject(new DOMException("Stopped", "AbortError"));
          }
          if (signal.aborted) stop();
          else signal.addEventListener("abort", stop, { once: true });
        });
      }
      function openHistory() {
        const builtIn = Object.values(compiledConfig.adapters);
        const profileFor = (siteId) => getProfiles()[siteId] ?? compiledConfig.adapters[siteId];
        return showHistory({
          profiles: builtIn,
          currentSiteId: currentProfile()?.site.id,
          history: getDownloadHistory,
          check: (siteId, id) => fetchThreadState(id, createProfileFetcher(profileFor(siteId)), profileFor(siteId)),
          recordCheck: (siteId, id, state) => recordCheck(id, siteId, state),
          async redownload(record2) {
            const url2 = threadUrl(profileFor(record2.site), record2.id);
            if (!url2) throw new Error(`${record2.site} has no thread URL template`);
            const { filename } = await agentHost.exportThread(url2, { title: record2.title, download: true });
            GM.notification({ text: formatMessage(notifications?.messages?.download_success, { filename }), title: "Markify", timeout: 3e3 });
          },
          remove: (siteId, id) => removeDownload(id, siteId),
          sourceUrl: (siteId, id) => threadUrl(profileFor(siteId), id),
          delay: checkDelay,
          notify: (text2) => {
            GM.notification({ text: text2, title: "Markify", timeout: 3e3 });
          }
        });
      }
      function openSettings() {
        const builtIn = Object.values(compiledConfig.adapters);
        return showSettings({
          profiles: builtIn,
currentSiteId: builtIn.find((profile) => profile.site.origins.includes(window.location.origin))?.site.id,
          loadOverrides,
          saveOverrides,
          agentEnabled: async (siteId) => !!await agentHost.token(siteId),
          agentCopyToken: (siteId) => agentApiMenu("token", getProfiles()[siteId] ?? compiledConfig.adapters[siteId]),
          agentRevoke: (siteId) => agentApiMenu("disable", getProfiles()[siteId] ?? compiledConfig.adapters[siteId]),
          history: getDownloadHistory,
          clearHistory: (siteId) => siteId ? clearSiteHistory(siteId) : clearHistory(),
          async resetButtonPosition() {
            await GM.deleteValue("markify_button_x");
            await GM.deleteValue("markify_button_y");
            const toolbar = document.querySelector("#markify-container");
            if (toolbar) Object.assign(toolbar.style, { left: "", top: ui?.ui?.position?.default_top, right: ui?.ui?.position?.default_right });
          },
          copy: (text2) => GM.setClipboard(text2, "text"),
          notify: (text2) => {
            GM.notification({ text: text2, title: pkg?.package?.strings?.app_title, timeout: notifications?.timeouts?.short });
          },
          reload: () => window.location.reload(),
          openHistory: () => {
            void openHistory();
          }
        });
      }
      (async function main() {
        if (document.readyState === "loading") {
          await new Promise((resolve) => {
            document.addEventListener("DOMContentLoaded", resolve);
          });
        }
        await initializeConfig();
        configureHistoryProfiles(Object.values(getProfiles()));
        GM.registerMenuCommand(pkg?.package?.menu?.settings, () => {
          void openSettings().catch((error2) => console.error("[Markify] Settings failed to open", error2));
        });
        GM.registerMenuCommand(pkg?.package?.menu?.stats, async () => {
          const count = await GM.getValue("markify_stats", 0);
          const { getDownloadStats: getDownloadStats2 } = await __vitePreload(async () => {
            const { getDownloadStats: getDownloadStats3 } = await Promise.resolve().then(() => downloadHistory);
            return { getDownloadStats: getDownloadStats3 };
          }, void 0 );
          const stats = await getDownloadStats2();
          GM.notification({
            text: formatMessage(notifications?.messages?.stats_summary, {
              total: count,
              single: stats.single,
              batch: stats.batch,
              tracked: stats.total
            }),
            title: pkg?.package?.strings?.app_title_stats,
            timeout: notifications?.timeouts?.long
          });
        });
        GM.registerMenuCommand(pkg?.package?.menu?.history, () => openHistory().catch((error2) => console.error("[Markify] History failed to open", error2)));
        GM.registerMenuCommand(pkg?.package?.menu?.clear_history, async () => {
          if (confirm(notifications?.messages?.clear_history_confirm)) {
            const { clearHistory: clearHistory2 } = await __vitePreload(async () => {
              const { clearHistory: clearHistory22 } = await Promise.resolve().then(() => downloadHistory);
              return { clearHistory: clearHistory22 };
            }, void 0 );
            await clearHistory2();
            GM.notification({
              text: notifications?.messages?.history_cleared,
              title: pkg?.package?.strings?.app_title,
              timeout: notifications?.timeouts?.short
            });
          }
        });
        GM.registerMenuCommand(pkg?.package?.menu?.reset_stats, async () => {
          await GM.setValue("markify_stats", 0);
          GM.notification({
            text: notifications?.messages?.stats_reset,
            title: pkg?.package?.strings?.app_title,
            timeout: notifications?.timeouts?.short
          });
        });
        GM.registerMenuCommand("📤 Export Configuration", async () => {
          await GM.setClipboard(JSON.stringify(await loadOverrides(), null, 2), "text");
          GM.notification({ text: "Configuration copied to clipboard.", title: "Markify", timeout: 2e3 });
        });
        GM.registerMenuCommand("📥 Import Configuration", async () => {
          const value = prompt("Paste exported Markify configuration JSON:");
          if (!value) return;
          try {
            await saveOverrides(JSON.parse(value));
            GM.notification({ text: "Configuration saved. Reloading the page.", title: "Markify", timeout: 2e3 });
            window.location.reload();
          } catch (error2) {
            GM.notification({ text: `Invalid configuration: ${error2 instanceof Error ? error2.message : String(error2)}`, title: "Markify", timeout: 5e3 });
          }
        });
        GM.registerMenuCommand("↩️ Reset Current Site Configuration", async () => {
          const route = routeFor(window.location.href);
          if (!route) return;
          await resetOverridesForSite(route.profileId);
          GM.notification({ text: `Reset ${route.profileId} configuration. Reloading the page.`, title: "Markify", timeout: 2e3 });
          window.location.reload();
        });
        GM.registerMenuCommand("🤖 AI Console API: copy token (turns it on for this site)", () => agentApiMenu("token"));
        GM.registerMenuCommand("🤖 AI Console API: turn off and revoke token (this site)", () => agentApiMenu("disable"));
        const agentSite = currentProfile();
        if (agentSite && await agentHost.token(agentSite.site.id)) installAgentApiOnce();
        await createDownloadButton();
        const navigation = new NavigationController({
          window,
          resolve: (url2) => {
            const route = classifyRegistryRoute(url2, getProfiles());
            if (!route) return null;
            return { ...route, pollMs: getProfiles()[route.profileId].runtime.poll_ms };
          },
          onRoute: (route, url2) => {
            void activateRoute(route, url2).catch((error2) => console.error("[Markify] Route activation failed", error2));
          },
          onError: (error2) => console.error("[Markify] Route classification failed", error2)
        });
        navigation.start();
        console.log("[Markify] Ready! Click the button to download this page as Markdown.");
        console.log("[Markify] Right-click the button to copy to clipboard instead.");
      })();

    })
  };
}));

System.register("./index-CSOeiHu3-COwhfQWm.js", ['./__monkey.entry-oE3Twt20.js'], (function (exports, module) {
  'use strict';
  var applyFilenameTemplate;
  return {
    setters: [module => {
      applyFilenameTemplate = module.a;
      exports({ ConversionError: module.C, LogLevel: module.L, Logger: module.b, adapterLogger: module.c, applyCommentTemplate: module.d, applyDocumentTemplate: module.e, applyFilenameTemplate: module.a, batchLogger: module.f, builtInAdapters: module.g, classifyRegistryRoute: module.h, classifyRoute: module.i, contentEngines: module.j, convert: module.k, createProfileAdapter: module.l, defaultTemplates: module.m, extractIdFromUrl: module.n, extractMainContent: module.o, fetch1Point3AcresContent: module.p, fetchDiscourseRawContent: module.q, fetchForumApiContent: module.p, fetchThreadState: module.r, fetchUSCardForumContent: module.q, fetchViaJinaReader: module.s, findProfileAdapter: module.t, findSiteAdapter: module.u, formatDate: module.v, formatMessage: module.w, generateFrontmatter: module.x, getAdapterConfig: module.y, getBuiltInAdapters: module.z, getConfig: module.A, getProfileAdapters: module.B, hasSiteApi: module.D, interpolate: module.E, listAdapters: module.F, logger: module.G, matchesPattern: module.H, parseForumPosts: module.I, replacePlaceholders: module.J, routeLogsToStderr: module.K, sanitizeFilename: module.M, setConfig: module.N });
    }],
    execute: (function () {

      exports({
        buildHeaders: buildHeaders,
        getUserAgent: getUserAgent,
        humanDelay: humanDelay,
        sleep: sleep
      });

      function getUserAgent(override) {
        if (override) return override;
        const nav = globalThis.navigator;
        if (nav?.userAgent && typeof globalThis.document !== "undefined") {
          return nav.userAgent;
        }
        try {
          const { getConfig } = require("../config");
          const config = getConfig();
          const ua = config?.notifications;
          const httpConfig = ua?.http ?? config?.http;
          if (httpConfig?.user_agent) {
            return httpConfig.user_agent;
          }
        } catch {
        }
        return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
      }
      async function humanDelay(config) {
        const min = config?.min_ms ?? 800;
        const max = config?.max_ms ?? 2500;
        const jitter = config?.jitter ?? 0.2;
        let delay = min + Math.random() * (max - min);
        if (jitter > 0) {
          const jitterAmount = delay * jitter;
          delay += (Math.random() - 0.5) * 2 * jitterAmount;
        }
        delay = Math.max(200, Math.round(delay));
        await new Promise((resolve) => setTimeout(resolve, delay));
        return delay;
      }
      async function sleep(ms) {
        await new Promise((resolve) => setTimeout(resolve, ms));
      }
      function buildHeaders(existing, config) {
        return {
          "User-Agent": getUserAgent(config?.user_agent),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          ...existing ?? {}
        };
      }

    })
  };
}));

System.import("./__entry.js", "./");