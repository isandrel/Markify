// ==UserScript==
// @name         Markify
// @namespace    https://github.com/isandrel/Markify
// @version      0.0.3
// @author       isandrel
// @description  Convert web pages to Obsidian-formatted Markdown with YAML frontmatter
// @license      AGPL-3.0-or-later
// @icon         https://cdn.jsdelivr.net/npm/@tabler/icons@latest/icons/download.svg
// @homepageURL  https://github.com/isandrel/Markify
// @supportURL   https://github.com/isandrel/Markify/issues
// @downloadURL  https://github.com/isandrel/Markify/raw/main/dist/markify.user.js
// @updateURL    https://github.com/isandrel/Markify/raw/main/dist/markify.user.js
// @match        https://instant.1point3acres.com/thread/*
// @match        https://www.1point3acres.com/bbs/thread-*
// @match        https://www.1point3acres.com/home/forum/*
// @match        https://www.1point3acres.com/home/pins/*
// @match        https://www.1point3acres.com/home/tag/*
// @match        https://www.uscardforum.com/c/*
// @match        https://www.uscardforum.com/search*
// @match        https://www.uscardforum.com/t/*/*
// @match        https://www.uscardforum.com/tag/*
// @match        https://www.uscardforum.com/tags/*
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/system.min.js
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/extras/named-register.min.js
// @require      data:application/javascript,%3B(typeof%20System!%3D'undefined')%26%26(System%3Dnew%20System.constructor())%3B
// @grant        GM.deleteValue
// @grant        GM.getValue
// @grant        GM.listValues
// @grant        GM.notification
// @grant        GM.openInTab
// @grant        GM.registerMenuCommand
// @grant        GM.setClipboard
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// ==/UserScript==


System.register("./__entry.js", ['./main-JT_1PqFi-BEs5AMbq.js'], (function (exports, module) {
	'use strict';
	return {
		setters: [null],
		execute: (function () {



		})
	};
}));

System.register("./main-JT_1PqFi-BEs5AMbq.js", [], (function (exports, module) {
  'use strict';
  return {
    execute: (function () {

      exports({
        d: fetchDiscourseRawContent,
        f: fetchForumApiContent
      });

      const scriptRel = (function detectScriptRel() {
        const relList = typeof document !== "undefined" && document.createElement("link").relList;
        return relList && relList.supports && relList.supports("modulepreload") ? "modulepreload" : "preload";
      })();
      const assetsURL = function(dep) {
        return "/" + dep;
      };
      const seen = {};
      const __vitePreload = exports("_", function preload(baseModule, deps, importerUrl) {
        let promise = Promise.resolve();
        if (deps && deps.length > 0) {
          let allSettled = function(promises$2) {
            return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
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
      });
      function extend(destination) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];
          for (var key in source) {
            if (source.hasOwnProperty(key)) destination[key] = source[key];
          }
        }
        return destination;
      }
      function repeat(character, count) {
        return Array(count + 1).join(character);
      }
      function trimLeadingNewlines(string) {
        return string.replace(/^\n*/, "");
      }
      function trimTrailingNewlines(string) {
        var indexEnd = string.length;
        while (indexEnd > 0 && string[indexEnd - 1] === "\n") indexEnd--;
        return string.substring(0, indexEnd);
      }
      function trimNewlines(string) {
        return trimTrailingNewlines(trimLeadingNewlines(string));
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
      function isBlock(node) {
        return is(node, blockElements);
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
      function isVoid(node) {
        return is(node, voidElements);
      }
      function hasVoid(node) {
        return has(node, voidElements);
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
      function isMeaningfulWhenBlank(node) {
        return is(node, meaningfulWhenBlankElements);
      }
      function hasMeaningfulWhenBlank(node) {
        return has(node, meaningfulWhenBlankElements);
      }
      function is(node, tagNames) {
        return tagNames.indexOf(node.nodeName) >= 0;
      }
      function has(node, tagNames) {
        return node.getElementsByTagName && tagNames.some(function(tagName) {
          return node.getElementsByTagName(tagName).length;
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
        replacement: function(content, node, options) {
          return options.br + "\n";
        }
      };
      rules.heading = {
        filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
        replacement: function(content, node, options) {
          var hLevel = Number(node.nodeName.charAt(1));
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
        replacement: function(content, node) {
          var parent = node.parentNode;
          if (parent.nodeName === "LI" && parent.lastElementChild === node) {
            return "\n" + content;
          } else {
            return "\n\n" + content + "\n\n";
          }
        }
      };
      rules.listItem = {
        filter: "li",
        replacement: function(content, node, options) {
          var prefix = options.bulletListMarker + "   ";
          var parent = node.parentNode;
          if (parent.nodeName === "OL") {
            var start = parent.getAttribute("start");
            var index2 = Array.prototype.indexOf.call(parent.children, node);
            prefix = (start ? Number(start) + index2 : index2 + 1) + ".  ";
          }
          var isParagraph = /\n$/.test(content);
          content = trimNewlines(content) + (isParagraph ? "\n" : "");
          content = content.replace(/\n/gm, "\n" + " ".repeat(prefix.length));
          return prefix + content + (node.nextSibling ? "\n" : "");
        }
      };
      rules.indentedCodeBlock = {
        filter: function(node, options) {
          return options.codeBlockStyle === "indented" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
        },
        replacement: function(content, node, options) {
          return "\n\n    " + node.firstChild.textContent.replace(/\n/g, "\n    ") + "\n\n";
        }
      };
      rules.fencedCodeBlock = {
        filter: function(node, options) {
          return options.codeBlockStyle === "fenced" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
        },
        replacement: function(content, node, options) {
          var className = node.firstChild.getAttribute("class") || "";
          var language = (className.match(/language-(\S+)/) || [null, ""])[1];
          var code = node.firstChild.textContent;
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
        replacement: function(content, node, options) {
          return "\n\n" + options.hr + "\n\n";
        }
      };
      rules.inlineLink = {
        filter: function(node, options) {
          return options.linkStyle === "inlined" && node.nodeName === "A" && node.getAttribute("href");
        },
        replacement: function(content, node) {
          var href = node.getAttribute("href");
          if (href) href = href.replace(/([()])/g, "\\$1");
          var title = cleanAttribute(node.getAttribute("title"));
          if (title) title = ' "' + title.replace(/"/g, '\\"') + '"';
          return "[" + content + "](" + href + title + ")";
        }
      };
      rules.referenceLink = {
        filter: function(node, options) {
          return options.linkStyle === "referenced" && node.nodeName === "A" && node.getAttribute("href");
        },
        replacement: function(content, node, options) {
          var href = node.getAttribute("href");
          var title = cleanAttribute(node.getAttribute("title"));
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
        replacement: function(content, node, options) {
          if (!content.trim()) return "";
          return options.emDelimiter + content + options.emDelimiter;
        }
      };
      rules.strong = {
        filter: ["strong", "b"],
        replacement: function(content, node, options) {
          if (!content.trim()) return "";
          return options.strongDelimiter + content + options.strongDelimiter;
        }
      };
      rules.code = {
        filter: function(node) {
          var hasSiblings = node.previousSibling || node.nextSibling;
          var isCodeBlock = node.parentNode.nodeName === "PRE" && !hasSiblings;
          return node.nodeName === "CODE" && !isCodeBlock;
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
        replacement: function(content, node) {
          var alt = cleanAttribute(node.getAttribute("alt"));
          var src = node.getAttribute("src") || "";
          var title = cleanAttribute(node.getAttribute("title"));
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
        forNode: function(node) {
          if (node.isBlank) return this.blankRule;
          var rule;
          if (rule = findRule(this.array, node, this.options)) return rule;
          if (rule = findRule(this._keep, node, this.options)) return rule;
          if (rule = findRule(this._remove, node, this.options)) return rule;
          return this.defaultRule;
        },
        forEach: function(fn) {
          for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
        }
      };
      function findRule(rules2, node, options) {
        for (var i = 0; i < rules2.length; i++) {
          var rule = rules2[i];
          if (filterValue(rule, node, options)) return rule;
        }
        return void 0;
      }
      function filterValue(rule, node, options) {
        var filter = rule.filter;
        if (typeof filter === "string") {
          if (filter === node.nodeName.toLowerCase()) return true;
        } else if (Array.isArray(filter)) {
          if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true;
        } else if (typeof filter === "function") {
          if (filter.call(rule, node, options)) return true;
        } else {
          throw new TypeError("`filter` needs to be a string, array, or function");
        }
      }
      function collapseWhitespace(options) {
        var element = options.element;
        var isBlock2 = options.isBlock;
        var isVoid2 = options.isVoid;
        var isPre = options.isPre || function(node2) {
          return node2.nodeName === "PRE";
        };
        if (!element.firstChild || isPre(element)) return;
        var prevText = null;
        var keepLeadingWs = false;
        var prev = null;
        var node = next(prev, element, isPre);
        while (node !== element) {
          if (node.nodeType === 3 || node.nodeType === 4) {
            var text = node.data.replace(/[ \r\n\t]+/g, " ");
            if ((!prevText || / $/.test(prevText.data)) && !keepLeadingWs && text[0] === " ") {
              text = text.substr(1);
            }
            if (!text) {
              node = remove(node);
              continue;
            }
            node.data = text;
            prevText = node;
          } else if (node.nodeType === 1) {
            if (isBlock2(node) || node.nodeName === "BR") {
              if (prevText) {
                prevText.data = prevText.data.replace(/ $/, "");
              }
              prevText = null;
              keepLeadingWs = false;
            } else if (isVoid2(node) || isPre(node)) {
              prevText = null;
              keepLeadingWs = true;
            } else if (prevText) {
              keepLeadingWs = false;
            }
          } else {
            node = remove(node);
            continue;
          }
          var nextNode = next(prev, node, isPre);
          prev = node;
          node = nextNode;
        }
        if (prevText) {
          prevText.data = prevText.data.replace(/ $/, "");
          if (!prevText.data) {
            remove(prevText);
          }
        }
      }
      function remove(node) {
        var next2 = node.nextSibling || node.parentNode;
        node.parentNode.removeChild(node);
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
        } catch (e) {
        }
        return canParse;
      }
      function createHTMLParser() {
        var Parser = function() {
        };
        {
          if (shouldUseActiveX()) {
            Parser.prototype.parseFromString = function(string) {
              var doc = new window.ActiveXObject("htmlfile");
              doc.designMode = "on";
              doc.open();
              doc.write(string);
              doc.close();
              return doc;
            };
          } else {
            Parser.prototype.parseFromString = function(string) {
              var doc = document.implementation.createHTMLDocument("");
              doc.open();
              doc.write(string);
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
        } catch (e) {
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
      function isPreOrCode(node) {
        return node.nodeName === "PRE" || node.nodeName === "CODE";
      }
      function Node(node, options) {
        node.isBlock = isBlock(node);
        node.isCode = node.nodeName === "CODE" || node.parentNode.isCode;
        node.isBlank = isBlank(node);
        node.flankingWhitespace = flankingWhitespace(node, options);
        return node;
      }
      function isBlank(node) {
        return !isVoid(node) && !isMeaningfulWhenBlank(node) && /^\s*$/i.test(node.textContent) && !hasVoid(node) && !hasMeaningfulWhenBlank(node);
      }
      function flankingWhitespace(node, options) {
        if (node.isBlock || options.preformattedCode && node.isCode) {
          return { leading: "", trailing: "" };
        }
        var edges = edgeWhitespace(node.textContent);
        if (edges.leadingAscii && isFlankedByWhitespace("left", node, options)) {
          edges.leading = edges.leadingNonAscii;
        }
        if (edges.trailingAscii && isFlankedByWhitespace("right", node, options)) {
          edges.trailing = edges.trailingNonAscii;
        }
        return { leading: edges.leading, trailing: edges.trailing };
      }
      function edgeWhitespace(string) {
        var m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
        return {
          leading: m[1],
leadingAscii: m[2],
          leadingNonAscii: m[3],
          trailing: m[4],
trailingNonAscii: m[5],
          trailingAscii: m[6]
        };
      }
      function isFlankedByWhitespace(side, node, options) {
        var sibling;
        var regExp;
        var isFlanked;
        if (side === "left") {
          sibling = node.previousSibling;
          regExp = / $/;
        } else {
          sibling = node.nextSibling;
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
          blankReplacement: function(content, node) {
            return node.isBlock ? "\n\n" : "";
          },
          keepReplacement: function(content, node) {
            return node.isBlock ? "\n\n" + node.outerHTML + "\n\n" : node.outerHTML;
          },
          defaultReplacement: function(content, node) {
            return node.isBlock ? "\n\n" + content + "\n\n" : content;
          }
        };
        this.options = extend({}, defaults, options);
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
          var output = process$2.call(this, new RootNode(input, this.options));
          return postProcess.call(this, output);
        },
use: function(plugin) {
          if (Array.isArray(plugin)) {
            for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
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
escape: function(string) {
          return escapes.reduce(function(accumulator, escape) {
            return accumulator.replace(escape[0], escape[1]);
          }, string);
        }
      };
      function process$2(parentNode) {
        var self = this;
        return reduce.call(parentNode.childNodes, function(output, node) {
          node = new Node(node, self.options);
          var replacement = "";
          if (node.nodeType === 3) {
            replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
          } else if (node.nodeType === 1) {
            replacement = replacementForNode.call(self, node);
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
      function replacementForNode(node) {
        var rule = this.rules.forNode(node);
        var content = process$2.call(this, node);
        var whitespace = node.flankingWhitespace;
        if (whitespace.leading || whitespace.trailing) content = content.trim();
        return whitespace.leading + rule.replacement(content, node, this.options) + whitespace.trailing;
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
      function matchesPattern(url, pattern) {
        if (pattern instanceof RegExp) {
          return pattern.test(url);
        }
        const regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(url);
      }
      function findSiteAdapter(url, adapters) {
        for (const adapter of adapters) {
          for (const pattern of adapter.urlPatterns) {
            if (matchesPattern(url, pattern)) {
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
          const categories = Array.from(doc.querySelectorAll("#mw-normal-catlinks a")).slice(1).map((a) => a.textContent?.trim() || "");
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
        extractMetadata: (doc, url) => {
          const repoName = doc.querySelector('h1[itemprop="name"] a')?.textContent?.trim();
          const parsedUrl = new URL(url);
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
        extractMetadata: (doc, url) => {
          const parsedUrl = new URL(url);
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
      var LogLevel = ((LogLevel2) => {
        LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
        LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
        LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
        LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
        return LogLevel2;
      })(LogLevel || {});
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
            console.debug(`[${this.prefix}:DEBUG]`, message, ...args);
          }
        }
        info(message, ...args) {
          if (this.level <= 1) {
            console.log(`[${this.prefix}]`, message, ...args);
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
      }
      const logger = new Logger("Markify");
      const batchLogger = exports("c", new Logger("Markify:Batch"));
      const adapterLogger = exports("a", new Logger("Markify:Adapter"));
      function getUserAgent(override) {
        if (override) return override;
        const nav = globalThis.navigator;
        if (nav?.userAgent) {
          return nav.userAgent;
        }
        try {
          const { getConfig: getConfig2 } = require("../config");
          const config2 = getConfig2();
          const ua = config2?.notifications;
          const httpConfig = ua?.http ?? config2?.http;
          if (httpConfig?.user_agent) {
            return httpConfig.user_agent;
          }
        } catch {
        }
        return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
      }
      async function humanDelay(config2) {
        const min = config2?.min_ms ?? 800;
        const max = config2?.max_ms ?? 2500;
        const jitter = config2?.jitter ?? 0.2;
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
      function buildHeaders(existing, config2) {
        return {
          "User-Agent": getUserAgent(config2?.user_agent),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          ...existing ?? {}
        };
      }
      const http = exports("h", Object.freeze( Object.defineProperty({
        __proto__: null,
        buildHeaders,
        getUserAgent,
        humanDelay,
        sleep
      }, Symbol.toStringTag, { value: "Module" })));
      let cachedConfig = null;
      function getConfig() {
        if (cachedConfig) return cachedConfig;
        try {
          cachedConfig = loadConfigFromDisk();
          return cachedConfig;
        } catch {
          cachedConfig = { adapters: {} };
          return cachedConfig;
        }
      }
      function setConfig(config2) {
        cachedConfig = config2;
      }
      function getAdapterConfig(adapterName) {
        const config2 = getConfig();
        const key = Object.keys(config2.adapters).find(
          (k) => k.toLowerCase() === adapterName.toLowerCase() || config2.adapters[k]?.site?.name?.toLowerCase() === adapterName.toLowerCase()
        );
        return key ? config2.adapters[key] : void 0;
      }
      function extractIdFromUrl$1(url, patterns) {
        const pathname = new URL(url).pathname;
        for (const pattern of patterns) {
          const regex = new RegExp(pattern);
          const match2 = pathname.match(regex);
          if (match2?.[1]) return match2[1];
        }
        for (const pattern of patterns) {
          const regex = new RegExp(pattern);
          const match2 = url.match(regex);
          if (match2?.[1]) return match2[1];
        }
        return null;
      }
      function interpolate(template, vars) {
        return template.replace(/\{(\w+)\}/g, (_, key) => {
          return vars[key]?.toString() ?? `{${key}}`;
        });
      }
      function loadConfigFromDisk() {
        const fs = require("fs");
        const path = require("path");
        const candidates = [
          path.resolve(process.cwd(), "config"),
          path.resolve(__dirname, "../../config"),
          path.resolve(__dirname, "../../../config"),
          path.resolve(__dirname, "../../../../config")
        ];
        let configDir = null;
        for (const dir of candidates) {
          if (fs.existsSync(dir)) {
            configDir = dir;
            break;
          }
        }
        if (!configDir) {
          logger.warn("Config directory not found, using defaults");
          return { adapters: {} };
        }
        logger.info(`Loading config from: ${configDir}`);
        let parseTOML;
        try {
          parseTOML = require("@iarna/toml").parse;
        } catch {
          try {
            logger.warn("TOML parser not available, adapter configs will not be loaded");
            return { adapters: {} };
          } catch {
            return { adapters: {} };
          }
        }
        const config2 = { adapters: {} };
        const adaptersDir = path.join(configDir, "adapters");
        if (fs.existsSync(adaptersDir)) {
          const files = fs.readdirSync(adaptersDir).filter((f) => f.endsWith(".toml"));
          for (const file of files) {
            const name = file.replace(".toml", "");
            try {
              const content = fs.readFileSync(path.join(adaptersDir, file), "utf-8");
              config2.adapters[name] = parseTOML(content);
              logger.info(`Loaded adapter config: ${name}`);
            } catch (error) {
              logger.warn(`Failed to load adapter config ${file}:`, error);
            }
          }
        }
        const mainFiles = ["templates.toml", "sites.toml", "theme.toml", "notifications.toml", "ui.toml"];
        for (const file of mainFiles) {
          const filePath = path.join(configDir, file);
          if (fs.existsSync(filePath)) {
            try {
              const content = fs.readFileSync(filePath, "utf-8");
              const key = file.replace(".toml", "");
              config2[key] = parseTOML(content);
            } catch (error) {
              logger.warn(`Failed to load ${file}:`, error);
            }
          }
        }
        return config2;
      }
      const config = Object.freeze( Object.defineProperty({
        __proto__: null,
        extractIdFromUrl: extractIdFromUrl$1,
        getAdapterConfig,
        getConfig,
        interpolate,
        setConfig
      }, Symbol.toStringTag, { value: "Module" }));
      function cfg$1() {
        return getAdapterConfig("US Card Forum") ?? getAdapterConfig("uscardforum");
      }
      const usCardForumAdapter = {
        name: "US Card Forum",
        urlPatterns: [
          "https://www.uscardforum.com/t/*/*"
        ],
        hasApi: true,
        extractMetadata: (doc, url) => {
          const config2 = cfg$1();
          const cleanupPattern = config2?.metadata?.title_cleanup ?? "";
          const title = cleanupPattern ? doc.title.replace(new RegExp(cleanupPattern), "").trim() : doc.title;
          const idPatterns = config2?.api?.id_extraction;
          const topicId = idPatterns?.patterns ? extractIdFromUrl$1(url, idPatterns.patterns) : null;
          const baseUrl = config2?.site?.base_url ?? "";
          const sourceTemplate = config2?.metadata?.source_url;
          const source = topicId && sourceTemplate ? interpolate(sourceTemplate, { base_url: baseUrl, topic_id: topicId }) : url;
          const tags = config2?.metadata?.tags;
          return {
            title,
            ...tags ? { tags } : {},
            source
          };
        },
        fetchViaApi: async (url, fetcher, configOverride) => {
          const config2 = configOverride ?? cfg$1();
          if (!config2?.api) {
            throw new Error("US Card Forum adapter requires TOML config (config/adapters/uscardforum.toml)");
          }
          const api = config2.api;
          const idExtraction = api.id_extraction;
          if (!idExtraction?.patterns?.length) {
            throw new Error("US Card Forum config missing api.id_extraction.patterns");
          }
          const topicId = extractIdFromUrl$1(url, idExtraction.patterns);
          if (!topicId) {
            throw new Error(`Could not extract topic ID from URL: ${url}`);
          }
          return fetchDiscourseRawContent(topicId, fetcher, config2);
        }
      };
      async function fetchDiscourseRawContent(topicId, fetcher, config2) {
        const api = config2.api;
        const site = config2.site ?? {};
        const baseUrl = site.base_url;
        const rawEndpoint = api.raw_endpoint;
        const maxPages = api.max_pages ?? 100;
        const pageDelay = api.page_delay;
        const separator = config2.page_separator ?? "\n\n---\n\n";
        const requestConfig = api.request ?? {};
        const credentials = requestConfig.credentials ?? true;
        if (!rawEndpoint) {
          throw new Error("Config missing api.raw_endpoint");
        }
        const headers = buildHeaders({}, config2.http);
        const doFetch = fetcher ?? {
          get: async (url, opts) => {
            const res = await fetch(url, {
              credentials: opts?.credentials ? "include" : "same-origin",
              headers
            });
            return { status: res.status, ok: res.ok, text: await res.text() };
          }
        };
        const pages = [];
        let page = 1;
        logger.info(`Fetching Discourse topic ${topicId} (all pages)...`);
        while (page <= maxPages) {
          const url = interpolate(rawEndpoint, { base_url: baseUrl, topic_id: topicId, page });
          try {
            const response = await doFetch.get(url, { credentials, headers });
            if (!response.ok) {
              if (page === 1) {
                throw new Error(`Failed to fetch content: ${response.status}`);
              }
              break;
            }
            const text = response.text;
            if (!text || text.trim().length === 0) {
              break;
            }
            pages.push(text);
            logger.info(`Fetched page ${page} (${text.length} characters)`);
            if (pageDelay) {
              const waited = await humanDelay(pageDelay);
              logger.info(`Waited ${waited}ms before next page`);
            }
            page++;
          } catch (error) {
            logger.error(`Error fetching page ${page}:`, error);
            if (page === 1) {
              return null;
            }
            break;
          }
        }
        logger.info(`Complete! Downloaded ${pages.length} pages, total ${pages.join("").length} characters`);
        return pages.join(separator);
      }
      const N = "\n";
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
      function getNodeLength(node) {
        if (isTagNode(node) && Array.isArray(node.content)) {
          return node.content.reduce((count, contentNode) => {
            return count + getNodeLength(contentNode);
          }, 0);
        }
        if (isStringNode(node)) {
          return String(node).length;
        }
        return 0;
      }
      function appendToNode(node, value) {
        if (Array.isArray(node.content)) {
          node.content.push(value);
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
      const toString = (node, openTag, closeTag) => {
        if (isTagNode(node)) {
          return node.toString({
            openTag,
            closeTag
          });
        }
        return String(node);
      };
      const nodeTreeToString = (content, openTag, closeTag) => {
        if (Array.isArray(content)) {
          return content.reduce((r, node) => {
            if (node !== null) {
              return r + toString(node, openTag, closeTag);
            }
            return r;
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
        static isOf(node, type) {
          return node.tag === type;
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
        let text = openTag;
        text += getTokenValue(token);
        text += closeTag;
        return text;
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
      function createTokenOfType(type, value, r = 0, cl = 0, p = 0, e = 0) {
        return new Token(type, value, r, cl, p, e);
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
      const isNewLine = (char) => char === N;
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
          N,
          EM
        ];
        const NOT_CHAR_TOKENS = [
          openTag,
          SPACE,
          TAB,
          N
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
        function nodesAppendAsString(nodes2, node, isNested = true) {
          if (Array.isArray(nodes2) && typeof node !== "undefined") {
            nodes2.push(node.toTagStart({
              openTag,
              closeTag
            }));
            if (Array.isArray(node.content) && node.content.length) {
              node.content.forEach((item) => {
                nodes2.push(item);
              });
              if (isNested) {
                nodes2.push(node.toTagEnd({
                  openTag,
                  closeTag
                }));
              }
            }
          }
        }
        function nodesAppend(node) {
          const nodes2 = getNodesContent();
          if (Array.isArray(nodes2) && typeof node !== "undefined") {
            if (isTagNode(node)) {
              if (isTagAllowed(node.tag)) {
                nodes2.push(node.toTagNode());
              } else {
                nodesAppendAsString(nodes2, node);
              }
            } else {
              nodes2.push(node);
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
          const node = nestedNodes.flush();
          if (isTagNode(node) && isTagNested(node.tag)) {
            nodesAppendAsString(getNodesContent(), node, false);
          } else if (typeof node !== "undefined") {
            nodesAppend(node);
          }
        } while (nestedNodes.has());
        return nodes.ref();
      }
      const isObj = (value) => typeof value === "object" && value !== null;
      const isBool = (value) => typeof value === "boolean";
      function iterate(t, cb) {
        const tree = t;
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
      function match(t, expression, cb) {
        if (Array.isArray(expression)) {
          return iterate(t, (node) => {
            for (let idx = 0; idx < expression.length; idx++) {
              if (same(expression[idx], node)) {
                return cb(node);
              }
            }
            return node;
          });
        }
        return iterate(t, (node) => same(expression, node) ? cb(node) : node);
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
      function renderNode(node, options) {
        const { stripTags = false } = options || {};
        if (typeof node === "undefined" || node === null) {
          return "";
        }
        if (typeof node === "string" || typeof node === "number") {
          return String(node);
        }
        if (Array.isArray(node)) {
          return render(node, options);
        }
        if (isTagNode(node)) {
          if (stripTags) {
            return render(node.content, options);
          }
          const attrs = attrsToString(node.attrs);
          if (node.content === null) {
            return START_TAG + node.tag + attrs + SELFCLOSE_END_TAG;
          }
          return START_TAG + node.tag + attrs + END_TAG + render(node.content, options) + CLOSE_START_TAG + node.tag + END_TAG;
        }
        return "";
      }
      function render(nodes, options) {
        if (nodes && Array.isArray(nodes)) {
          return nodes.reduce((r, node) => r + renderNode(node, options), "");
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
      function process$1(tags, tree, core, options) {
        return tree.walk((node) => {
          if (isTagNode(node)) {
            const tag = node.tag;
            const tagCallback = tags[tag];
            if (typeof tagCallback === "function") {
              return tagCallback(node, core, options);
            }
          }
          return node;
        });
      }
      function createPreset(defTags, processor = process$1) {
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
      const isStartsWith = (node, type) => node[0] === type;
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
          return content.reduce((acc, node) => {
            const listItem = acc[acc.length - 1];
            if (isStringNode(node) && isStartsWith(String(node), "*")) {
              const content2 = String(node).slice(1);
              acc.push(TagNode.create("li", {}, [
                content2
              ]));
              return acc;
            }
            if (isTagNode(node) && TagNode.isOf(node, "*")) {
              acc.push(TagNode.create("li", {}, []));
              return acc;
            }
            if (!isTagNode(listItem)) {
              acc.push(node);
              return acc;
            }
            if (listItem && isTagNode(listItem) && Array.isArray(listItem.content)) {
              listItem.content = listItem.content.concat(node);
              return acc;
            }
            acc.push(node);
            return acc;
          }, []);
        }
        return content;
      };
      const renderUrl = (node, render2) => getUniqAttr(node.attrs) ? getUniqAttr(node.attrs) : render2(node.content || []);
      const toNode = (tag, attrs, content) => TagNode.create(tag, attrs, content);
      const toStyle = (style) => ({
        style
      });
      const defineStyleNode = (tag, style) => (node) => toNode(tag, toStyle(style), node.content);
      const defaultTags = (function createTags() {
        const tags = {
          b: defineStyleNode("span", "font-weight: bold;"),
          i: defineStyleNode("span", "font-style: italic;"),
          u: defineStyleNode("span", "text-decoration: underline;"),
          s: defineStyleNode("span", "text-decoration: line-through;"),
          url: (node, { render: render2 }) => toNode("a", {
            href: renderUrl(node, render2)
          }, node.content),
          img: (node, { render: render2 }) => toNode("img", {
            ...node.attrs,
            src: render2(node.content)
          }, null),
          quote: (node) => toNode("blockquote", {}, [
            toNode("p", {}, node.content)
          ]),
          code: (node) => toNode("pre", {}, node.content),
          style: (node) => toNode("span", toStyle(styleAttrs(node.attrs)), node.content),
          list: (node) => {
            const type = getUniqAttr(node.attrs);
            return toNode(type ? "ol" : "ul", type ? {
              type
            } : {}, toListNodes(node.content));
          },
          color: (node) => toNode("span", toStyle(`color: ${getUniqAttr(node.attrs)};`), node.content)
        };
        return tags;
      })();
      const presetHTML5 = createPreset(defaultTags);
      function cfg() {
        return getAdapterConfig("1Point3Acres") ?? getAdapterConfig("1point3acres");
      }
      function readField(data, fieldName, fieldConfig) {
        const apiField = typeof fieldConfig[fieldName] === "string" ? fieldConfig[fieldName] : fieldName;
        return data[apiField];
      }
      const onePoint3AcresAdapter = {
        name: "1Point3Acres",
urlPatterns: [
          "https://www.1point3acres.com/bbs/thread-*",
          "https://www.1point3acres.com/home/pins/*",
          "https://instant.1point3acres.com/thread/*"
        ],
        hasApi: true,
        includesFrontmatter: true,
        preProcess: (element) => element,
        fetchViaApi: async (url, fetcher, configOverride) => {
          const config2 = configOverride ?? cfg();
          if (!config2?.api) {
            throw new Error("1Point3Acres adapter requires TOML config (config/adapters/1point3acres.toml)");
          }
          const idPatterns = config2.api.id_extraction?.patterns;
          if (!idPatterns?.length) {
            throw new Error("1Point3Acres config missing api.id_extraction.patterns");
          }
          const threadId = extractIdFromUrl$1(url, idPatterns);
          if (!threadId) {
            throw new Error(`Could not extract thread ID from URL: ${url}`);
          }
          return fetchForumApiContent(threadId, fetcher, config2);
        }
      };
      async function fetchForumApiContent(threadId, fetcher, config2, onProgress) {
        try {
          const api = config2.api;
          const fields = api.fields ?? {};
          const postFields = typeof fields.post === "object" && fields.post !== null ? fields.post : fields;
          const responseConfig = api.response ?? {};
          const threadEndpoint = api.thread_endpoint;
          if (!threadEndpoint) {
            throw new Error("Config missing api.thread_endpoint");
          }
          const apiUrl = interpolate(threadEndpoint, { thread_id: threadId });
          logger.info(`Fetching thread content from: ${apiUrl}`);
          const headers = buildHeaders({}, config2.http);
          const response = await fetcher.get(apiUrl, { headers });
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }
          const parsed = JSON.parse(response.text);
          const successField = responseConfig.success_field;
          const successValue = responseConfig.success_value;
          const dataField = responseConfig.data_field;
          if (successField && parsed[successField] !== successValue) {
            throw new Error(`Invalid API response: ${successField}=${parsed[successField]}`);
          }
          const thread = dataField ? parsed[dataField] : parsed;
          if (!thread) {
            throw new Error(`API response missing data field: ${dataField}`);
          }
          const title = readField(thread, "title", fields);
          const author = readField(thread, "author", fields);
          const contentRaw = readField(thread, "content", fields);
          const postedAt = readField(thread, "posted_at", fields);
          const updatedAt = readField(thread, "updated_at", fields);
          const views = readField(thread, "views", fields);
          const replies = readField(thread, "replies", fields);
          const favorites = readField(thread, "favorites", fields) ?? 0;
          const delimiter = config2.delimiter ?? "---";
          const frontmatterTpl = config2.frontmatter?.template;
          const docTpl = config2.document?.template;
          const commentTpl = config2.comment?.template;
          const commentsHeaderTpl = config2.comments_header?.template;
          const sourceUrlTpl = config2.metadata?.source_url;
          if (!frontmatterTpl || !docTpl) {
            throw new Error("Config missing frontmatter.template or document.template");
          }
          const contentFormat = api.content_format ?? "bbcode";
          const contentHtml = contentFormat === "bbcode" ? convertBBCodeToHTML(contentRaw || "") : contentRaw || "";
          let commentsMarkdown = "";
          if (replies > 0) {
            try {
              const pageSize = api.page_size;
              const order = api.order;
              const maxPages = api.max_pages;
              const postsEndpoint = api.posts_endpoint;
              const pageDelay = api.page_delay;
              if (!postsEndpoint) {
                throw new Error("Config missing api.posts_endpoint");
              }
              let allPosts = [];
              let currentPage = 1;
              let hasMorePages = true;
              logger.info(`Fetching ${replies} comments (${pageSize} per page)...`);
              while (hasMorePages && currentPage <= maxPages) {
                const postsUrl = interpolate(postsEndpoint, {
                  thread_id: threadId,
                  page_size: pageSize,
                  order,
                  page: currentPage
                });
                logger.info(`Fetching page ${currentPage}: ${postsUrl}`);
                if (onProgress) {
                  onProgress(`📥 Page ${currentPage}/${Math.ceil(replies / pageSize)}...`);
                }
                const postsResponse = await fetcher.get(postsUrl, { headers });
                if (!postsResponse.ok) {
                  throw new Error(`Posts request failed: ${postsResponse.status}`);
                }
                const postsData = JSON.parse(postsResponse.text);
                if (postsData.posts && Array.isArray(postsData.posts)) {
                  allPosts = allPosts.concat(postsData.posts);
                  logger.info(`Page ${currentPage}: ${postsData.posts.length} comments (total: ${allPosts.length})`);
                  if (postsData.posts.length < pageSize) {
                    hasMorePages = false;
                  } else {
                    currentPage++;
                    if (pageDelay) {
                      const waited = await humanDelay(pageDelay);
                      logger.info(`Waited ${waited}ms before next page`);
                    }
                  }
                } else {
                  hasMorePages = false;
                }
              }
              if (allPosts.length > 0 && commentTpl && commentsHeaderTpl) {
                commentsMarkdown = commentsHeaderTpl.replace(/{count}/g, allPosts.length.toString()).replace(/{delimiter}/g, delimiter);
                if (order === "time_desc") {
                  allPosts.reverse();
                }
                for (const post of allPosts) {
                  const postDate2 = new Date(post[postFields.posted_at ?? "dateline"] * 1e3).toLocaleString();
                  const postContent = contentFormat === "bbcode" ? convertBBCodeToHTML(post[postFields.content ?? "message_bbcode"] || "") : post[postFields.content ?? "message_bbcode"] || "";
                  const comment = commentTpl.replace(/{author}/g, post[postFields.author ?? "author"]).replace(/{date}/g, postDate2).replace(/{content}/g, postContent).replace(/{delimiter}/g, delimiter);
                  commentsMarkdown += comment;
                }
                logger.info(`Added ${allPosts.length} comments from ${currentPage - 1} pages`);
              }
            } catch (error) {
              logger.error("Error fetching posts:", error);
            }
          }
          const threadUrl = sourceUrlTpl ? interpolate(sourceUrlTpl, { thread_id: threadId }) : `thread-${threadId}`;
          const postDate = new Date(postedAt * 1e3).toISOString();
          const lastUpdated = new Date(updatedAt * 1e3).toISOString();
          const downloadedDate = ( new Date()).toISOString();
          const sourceLink = `"[${title}](${threadUrl})"`;
          const frontmatter = frontmatterTpl.replace(/{title}/g, title).replace(/{author}/g, author).replace(/{posted_at}/g, postDate).replace(/{updated_at}/g, lastUpdated).replace(/{downloaded_at}/g, downloadedDate).replace(/{url}/g, sourceLink).replace(/{views}/g, views.toString()).replace(/{replies}/g, replies.toString()).replace(/{favorites}/g, favorites.toString());
          const markdown = docTpl.replace(/{frontmatter}/g, frontmatter).replace(/{title}/g, title).replace(/{author}/g, author).replace(/{date}/g, new Date(postedAt * 1e3).toLocaleString()).replace(/{content}/g, contentHtml).replace(/{views}/g, views.toString()).replace(/{replies}/g, replies.toString()).replace(/{favorites}/g, favorites.toString()).replace(/{comments}/g, commentsMarkdown).replace(/{delimiter}/g, delimiter);
          return markdown;
        } catch (error) {
          logger.error("Error fetching forum API content:", error);
          return null;
        }
      }
      function convertBBCodeToHTML(bbcode) {
        return html(bbcode, presetHTML5());
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
      const builtInAdapters = [
        mediumAdapter,
        substackAdapter,
        wikipediaAdapter,
        githubAdapter,
        redditAdapter,
        devtoAdapter,
        usCardForumAdapter,
        onePoint3AcresAdapter,
        defaultAdapter
];
      function listAdapters() {
        return builtInAdapters.filter((a) => a.name !== "Default").map((a) => ({
          name: a.name,
          patterns: a.urlPatterns.map((p) => p instanceof RegExp ? p.source : p),
          hasApi: a.hasApi ?? false
        }));
      }
      function sanitizeFilename(filename) {
        return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 200);
      }
      function formatDate(date = new Date()) {
        return date.toISOString().split("T")[0];
      }
      function generateFrontmatter(metadata) {
        const lines = ["---"];
        if (metadata.title) lines.push(`title: "${metadata.title}"`);
        if (metadata.url) lines.push(`source: ${metadata.url}`);
        if (metadata.date) lines.push(`date: ${metadata.date}`);
        if (metadata.downloaded) lines.push(`downloaded: ${metadata.downloaded}`);
        if (metadata.author) lines.push(`author: "${metadata.author}"`);
        if (metadata.description) lines.push(`description: "${metadata.description}"`);
        if (metadata.tags && metadata.tags.length > 0) {
          lines.push("tags:");
          metadata.tags.forEach((tag) => lines.push(`  - ${tag}`));
        }
        Object.keys(metadata).forEach((key) => {
          if (!["title", "url", "date", "downloaded", "author", "description", "tags", "source"].includes(key)) {
            const value = metadata[key];
            if (typeof value === "string") {
              lines.push(`${key}: "${value}"`);
            } else if (Array.isArray(value)) {
              lines.push(`${key}:`);
              value.forEach((item) => lines.push(`  - ${item}`));
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
      function formatMessage(template, values) {
        return template.replace(/\{(\w+)\}/g, (match2, key) => {
          return values[key] !== void 0 ? String(values[key]) : match2;
        });
      }
      const defaultTemplates = {
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
      };
      function replacePlaceholders(template, data) {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
          const placeholder = new RegExp(`\\{${key}\\}`, "g");
          result = result.replace(placeholder, String(value || ""));
        }
        return result;
      }
      function applyCommentTemplate(template, data) {
        return replacePlaceholders(template, {
          author: data.author || "Unknown",
          date: data.date || "",
          content: data.content,
          index: String(data.index || 0)
        });
      }
      function applyDocumentTemplate(template, data) {
        return replacePlaceholders(template, data);
      }
      function parseForumPosts(rawMarkdown) {
        const posts = [];
        const sections = rawMarkdown.split(/\n(?=#{1,3}\s)/);
        for (const section of sections) {
          if (section.trim().length === 0) continue;
          const authorMatch = section.match(/^#{1,3}\s*(.+?)(?:\s*-\s*(.+?))?$/m);
          const author = authorMatch ? authorMatch[1].trim() : void 0;
          const date = authorMatch && authorMatch[2] ? authorMatch[2].trim() : void 0;
          posts.push({
            author,
            date,
            content: section
          });
        }
        return posts.length > 0 ? posts : [{ content: rawMarkdown }];
      }
      function applyFilenameTemplate(template, context) {
        let result = template;
        result = result.replace(/{date}/g, context.date || formatDate());
        result = result.replace(/{title}/g, context.title || "untitled");
        result = result.replace(/{id}/g, context.id || "");
        result = result.replace(/{author}/g, context.author || "");
        result = result.replace(/{site}/g, context.site || "");
        result = result.replace(/{type}/g, context.type || "");
        result = result.replace(/{tagname}/g, context.tagname || "");
        result = result.replace(/\s*-\s*-\s*/g, " - ");
        result = result.replace(/^[\s-]+|[\s-]+$/g, "");
        return sanitizeFilename(result);
      }
      var define_process_env_default = {};
      async function fetchViaJinaReader(url, config2, fetcher) {
        const jinaUrl = `https://r.jina.ai/${url}`;
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
            logger.warn(`Jina Reader returned ${response.status} for ${url}`);
            return null;
          }
          try {
            const json = JSON.parse(response.text);
            if (json.data) {
              return {
                content: json.data.content || "",
                title: json.data.title || "",
                url: json.data.url || url,
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
            url,
            source: "jina"
          };
        } catch (error) {
          logger.error("Jina Reader request failed:", error);
          return null;
        }
      }
      function hasSiteApi(url) {
        const { builtInAdapters: builtInAdapters2, matchesPattern: matchesPattern2 } = require("./adapters");
        for (const adapter of builtInAdapters2) {
          if (!adapter.hasApi) continue;
          for (const pattern of adapter.urlPatterns) {
            if (matchesPattern2(url, pattern)) {
              return true;
            }
          }
        }
        return false;
      }
      function createDefaultFetcher() {
        return {
          get: async (url, opts) => {
            const res = await fetch(url, {
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
          url,
          html: html2,
          document: doc,
          adapterName,
          includeFrontmatter = true,
          templates: templates2,
          fetcher,
          conversion,
          strategy = "dom-only",
readerConfig
        } = options;
        let adapter = null;
        if (adapterName) {
          adapter = builtInAdapters.find((a) => a.name.toLowerCase() === adapterName.toLowerCase()) ?? null;
        }
        if (!adapter) {
          adapter = findSiteAdapter(url, builtInAdapters);
        }
        logger.info(`Using adapter: ${adapter?.name || "Default"}, strategy: ${strategy}`);
        const siteApiResult = await trySiteApi(adapter, url, fetcher, templates2);
        if (siteApiResult !== null) {
          return buildResult(siteApiResult, adapter, url, templates2, includeFrontmatter, adapter?.includesFrontmatter ?? false);
        }
        if (strategy === "api-first" || strategy === "api-only") {
          const jinaConfig = {
            ...readerConfig,
            targetSelector: readerConfig?.targetSelector ?? adapter?.contentSelectors?.join(", "),
            removeSelector: readerConfig?.removeSelector ?? adapter?.removeSelectors?.join(", ")
          };
          const readerResult = await fetchViaJinaReader(url, jinaConfig, fetcher);
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
              const adapterMeta = await adapter.extractMetadata(doc, url);
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
              `No API available for ${url}. Site API not matched, Jina Reader failed. Use strategy 'api-first' to allow DOM fallback.`
            );
          }
          logger.warn("Jina Reader failed, falling back to DOM parsing...");
        }
        return convertViaDom(options, adapter);
      }
      async function trySiteApi(adapter, url, fetcher, templates2) {
        if (!adapter?.hasApi || !adapter?.fetchViaApi) {
          return null;
        }
        if (!fetcher) {
          fetcher = {
            get: async (fetchUrl, opts) => {
              const res = await fetch(fetchUrl, {
                credentials: opts?.credentials ? "include" : "same-origin",
                headers: opts?.headers
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
        const adapterConfig = getAdapterConfig2(adapter.name);
        const mergedConfig = {
          ...adapterConfig,
          ...templates2?.[adapter.name.toLowerCase()] || {},
          ...templates2?.[adapter.name.toLowerCase().replace(/\s+/g, "")] || {}
        };
        const result = await adapter.fetchViaApi(url, fetcher, mergedConfig);
        return result;
      }
      async function convertViaDom(options, adapter) {
        const {
          url,
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
        const metadata = await extractMetadataFromDoc(adapter, doc, url);
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
      async function buildResult(rawMarkdown, adapter, url, templates2, includeFrontmatter, adapterIncludesFrontmatter) {
        const metadata = {
          title: "Untitled",
          url,
          date: formatDate(),
          downloaded: formatDate()
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
          filename: buildFilename(metadata, adapter, templates2)
        };
      }
      function buildFilename(metadata, adapter, templates2) {
        return applyFilenameTemplate(
          templates2?.filename?.single || "{title}",
          {
            title: metadata.title || "untitled",
            author: metadata.author,
            site: adapter?.name,
            date: formatDate()
          }
        );
      }
      async function extractMetadataFromDoc(adapter, doc, url) {
        const date = formatDate();
        let metadata = {
          title: doc?.title || "Untitled",
          url,
          date,
          downloaded: formatDate()
        };
        if (adapter?.extractMetadata && doc) {
          const customMetadata = await adapter.extractMetadata(doc, url);
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
      const index = exports("i", Object.freeze( Object.defineProperty({
        __proto__: null,
        LogLevel,
        Logger,
        adapterLogger,
        applyCommentTemplate,
        applyDocumentTemplate,
        applyFilenameTemplate,
        batchLogger,
        buildHeaders,
        builtInAdapters,
        convert,
        defaultTemplates,
        extractIdFromUrl: extractIdFromUrl$1,
        extractMainContent,
        fetch1Point3AcresContent: fetchForumApiContent,
        fetchDiscourseRawContent,
        fetchForumApiContent,
        fetchUSCardForumContent: fetchDiscourseRawContent,
        fetchViaJinaReader,
        findSiteAdapter,
        formatDate,
        formatMessage,
        generateFrontmatter,
        getAdapterConfig,
        getConfig,
        getUserAgent,
        hasSiteApi,
        humanDelay,
        interpolate,
        listAdapters,
        logger,
        matchesPattern,
        parseForumPosts,
        replacePlaceholders,
        sanitizeFilename,
        setConfig,
        sleep
      }, Symbol.toStringTag, { value: "Module" })));
      var define_MARKIFY_ADAPTER_USCARDFORUM_default = { site: { name: "US Card Forum", base_url: "https://www.uscardforum.com" }, batch: { listing_patterns: ["/c/", "/search", "/tag/", "/tags/"], exclude_pattern: "/t/", selectors: { topic_links: 'a.title[href*="/t/"], a[href*="/t/"].raw-topic-link', search_links: 'a.search-link[href*="/t/"]', search_title: ".topic-title > span", containers: { search_result: ".fps-result", topic_row: "tr.topic-list-item", generic: ".topic-list-item, .ember-view" } }, patterns: { topic_id: "/t/[^/]+/(\\d+)", category: "/c/([^/]+)", tag: "/tag[s]?/([^/]+)" }, types: { category: "category", listing: "listing", search: "search", tag: "tag" } } };
      var define_MARKIFY_NOTIFICATIONS_default = {};
      var define_MARKIFY_PACKAGE_default = { author: "isandrel", description: "Convert web pages to Obsidian-formatted Markdown with YAML frontmatter", name: "Markify", repository: "https://github.com/isandrel/Markify", version: "0.0.3", strings: { app_title: "Markify", app_title_batch: "Markify Batch Download", app_title_error: "Markify Batch Download Error", app_title_stats: "Markify Stats" }, menu: { clear_history: "🗑️ Clear History", history: "📜 Download History", reset_stats: "� Reset Stats", settings: "⚙️ Settings", stats: "� View Stats" } };
      var define_MARKIFY_TEMPLATES_default$1 = { document: { enabled: true, template: "{frontmatter}\n\n{content}\n" }, frontmatter: { enabled: true, fields: ["author", "date", "description", "downloaded", "source", "tags", "title"] }, content: { separator: "\n\n---\n\n" }, comment: { enabled: true, template: "## Comment {index} - {author}\n**Posted:** {date}\n\n{content}\n" }, filename: { single: "[{id}] {title}", batch_item: "{index} - [{id}] {title}", batch: "[{date}] [{site}] [{type}] [{id}] {tagname}" }, "1point3acres": { site: { name: "1Point3Acres", base_url: "https://www.1point3acres.com", url_patterns: ["https://www.1point3acres.com/bbs/thread-*", "https://www.1point3acres.com/home/pins/*", "https://instant.1point3acres.com/thread/*"] }, api: { thread_endpoint: "https://api.1point3acres.com/api/v3/home-threads/{thread_id}", posts_endpoint: "https://api.1point3acres.com/api/threads/{thread_id}/nested-posts?ps={page_size}&order={order}&pg={page}", max_pages: 100, page_size: 20, order: "time_asc", content_format: "bbcode", response: { success_field: "errno", success_value: 0, data_field: "thread" }, id_extraction: { patterns: ["thread-(\\d+)", "/pins/(\\d+)", "/thread/(\\d+)"] }, fields: { title: "subject", author: "author", content: "message_bbcode", posted_at: "dateline", updated_at: "lastpost", views: "views", replies: "replies", favorites: "favtimes", post: { author: "author", content: "message_bbcode", posted_at: "dateline" } } }, metadata: { tags: ["1point3acres", "forum"], source_url: "https://www.1point3acres.com/bbs/thread-{thread_id}-1-1.html", delimiter: "---" }, frontmatter: { template: '---\ntitle: "{title}"\nauthor: {author}\nposted_at: {posted_at}\nupdated_at: {updated_at}\ndownloaded_at: {downloaded_at}\nsource: {url}\nviews: {views}\nreplies: {replies}\nfavorites: {favorites}\ntags:\n  - 1point3acres\n  - forum\n---\n' }, document: { template: "{frontmatter}\n# {title}\n\n**Author:** {author} | **Date:** {date}\n\n---\n\n{content}\n\n---\n\n**Views:** {views} | **Replies:** {replies} | **Favorites:** {favorites}\n\n{comments}" }, comment: { template: "**{author}** - *{date}*\n\n{content}\n\n{delimiter}\n" }, comments_header: { template: "\n{delimiter}\n\n## Comments ({count})\n" }, filename: { single: "{title}", batch_item: "{id} - {title}", batch: "{site}-{type}-{tagname}-{date}" }, batch: { listing_patterns: ["/bbs/forum-", "/home/explore"] } }, uscardforum: { site: { name: "US Card Forum", base_url: "https://www.uscardforum.com", url_patterns: ["https://www.uscardforum.com/t/*/*"] }, api: { raw_endpoint: "{base_url}/raw/{topic_id}?page={page}", json_endpoint: "{base_url}/t/{topic_id}.json?print=true&include_raw=true", max_pages: 100, page_delay_ms: 100, request: { credentials: true, accept: "text/plain" }, id_extraction: { patterns: ["/t/[^/]+/(\\d+)", "/t/(\\d+)"] } }, metadata: { title_cleanup: "[\\s\\-]+(美国信用卡指南|US Card Forum)$", tags: ["uscardforum", "forum", "credit-cards"], source_url: "{base_url}/t/{topic_id}", page_separator: "\n\n---\n\n" }, batch: { listing_patterns: ["/c/", "/search", "/tag/", "/tags/"], exclude_pattern: "/t/", selectors: { topic_links: 'a.title[href*="/t/"], a[href*="/t/"].raw-topic-link', search_links: 'a.search-link[href*="/t/"]', search_title: ".topic-title > span", containers: { search_result: ".fps-result", topic_row: "tr.topic-list-item", generic: ".topic-list-item, .ember-view" } }, patterns: { topic_id: "/t/[^/]+/(\\d+)", category: "/c/([^/]+)", tag: "/tag[s]?/([^/]+)" }, types: { category: "category", listing: "listing", search: "search", tag: "tag" } }, filename: { single: "{title}", batch_item: "{id} - {title}", batch: "{site}-{type}-{tagname}-{date}" } } };
      var define_MARKIFY_THEME_default = {};
      var define_MARKIFY_UI_default = {};
      const theme = exports("t", define_MARKIFY_THEME_default);
      const notifications = exports("n", define_MARKIFY_NOTIFICATIONS_default);
      const ui = exports("u", define_MARKIFY_UI_default);
      const pkg = exports("p", define_MARKIFY_PACKAGE_default);
      const templates = exports("e", define_MARKIFY_TEMPLATES_default$1);
      const adapterUSCardForum = exports("b", define_MARKIFY_ADAPTER_USCARDFORUM_default);
      const defaultSettings = {
buttonPosition: "bottom-right",
        buttonText: ui?.ui?.button_text || "📥 Markify",
        buttonColor: theme?.colors?.primary || "#7c3aed",
includeImages: true,
        includeTables: true,
        includeCodeBlocks: true,
includeTitle: true,
        includeUrl: true,
        includeDate: true,
        includeAuthor: true,
        includeTags: true,
        customTags: [],
enabledAdapters: ["all"],
        customCSS: ""
      };
      async function loadSettings() {
        const stored = await GM.getValue("markify_settings", null);
        if (!stored) {
          return defaultSettings;
        }
        try {
          const parsed = JSON.parse(stored);
          return { ...defaultSettings, ...parsed };
        } catch {
          return defaultSettings;
        }
      }
      async function saveSettings(settings) {
        await GM.setValue("markify_settings", JSON.stringify(settings));
        GM.notification({
          text: notifications.messages.settings_saved,
          title: pkg.package.strings.app_title,
          timeout: notifications.timeouts.short
        });
      }
      async function resetSettings() {
        await GM.deleteValue("markify_settings");
        GM.notification({
          text: notifications.messages.settings_reset,
          title: pkg.package.strings.app_title,
          timeout: notifications.timeouts.short
        });
      }
      function createSettingsUI() {
        const container = document.createElement("div");
        container.id = "markify-settings";
        container.innerHTML = `
    <style>
      #markify-settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        backdrop-filter: blur(4px);
      }
      
      #markify-settings-panel {
        background: #1a1a1a;
        border-radius: 16px;
        padding: 32px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      #markify-settings-panel h2 {
        margin: 0 0 24px 0;
        font-size: 24px;
        font-weight: 700;
        color: ${theme?.colors?.primary || "#7c3aed"};
      }
      
      .markify-setting-group {
        margin-bottom: 24px;
      }
      
      .markify-setting-group h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 12px 0;
        color: ${theme?.colors?.text_secondary || "#9ca3af"};
      }
      
      .markify-setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #333;
      }
      
      .markify-setting-item:last-child {
        border-bottom: none;
      }
      
      .markify-setting-item label {
        font-size: 14px;
        color: ${theme?.colors?.text_primary || "#f3f4f6"};
      }
      
      .markify-setting-item input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }
      
      .markify-setting-item select,
      .markify-setting-item input[type="text"] {
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #fff;
        font-size: 14px;
      }
      
      .markify-buttons {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      
      .markify-btn {
        flex: 1;
        padding: 12px 24px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .markify-btn-primary {
        background: ${theme?.colors?.primary || "#7c3aed"};
        color: white;
      }
      
      .markify-btn-primary:hover {
        background: ${theme?.colors?.primary_hover || "#6d28d9"};
      }
      
      .markify-btn-secondary {
        background: #374151;
        color: white;
      }
      
      .markify-btn-secondary:hover {
        background: #4b5563;
      }
    </style>
    
    <div id="markify-settings-overlay">
      <div id="markify-settings-panel">
        <h2>⚙️ Markify Settings</h2>
        
        <div class="markify-setting-group">
          <h3>UI Settings</h3>
          <div class="markify-setting-item">
            <label>Button Position</label>
            <select id="button-position">
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right" selected>Bottom Right</option>
            </select>
          </div>
          <div class="markify-setting-item">
            <label>Button Text</label>
            <input type="text" id="button-text" value="📥 Markify" />
          </div>
        </div>
        
        <div class="markify-setting-group">
          <h3>Frontmatter</h3>
          <div class="markify-setting-item">
            <label>Include Title</label>
            <input type="checkbox" id="include-title" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include URL</label>
            <input type="checkbox" id="include-url" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include Date</label>
            <input type="checkbox" id="include-date" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include Author</label>
            <input type="checkbox" id="include-author" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include Tags</label>
            <input type="checkbox" id="include-tags" checked />
          </div>
        </div>
        
        <div class="markify-setting-group">
          <h3>Content Options</h3>
          <div class="markify-setting-item">
            <label>Include Images</label>
            <input type="checkbox" id="include-images" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include Tables</label>
            <input type="checkbox" id="include-tables" checked />
          </div>
          <div class="markify-setting-item">
            <label>Include Code Blocks</label>
            <input type="checkbox" id="include-code" checked />
          </div>
        </div>
        
        <div class="markify-buttons">
          <button class="markify-btn markify-btn-secondary" id="markify-close">Cancel</button>
          <button class="markify-btn markify-btn-secondary" id="markify-reset">Reset to Defaults</button>
          <button class="markify-btn markify-btn-primary" id="markify-save">Save Settings</button>
        </div>
      </div>
    </div>
  `;
        return container;
      }
      async function showSettings() {
        const settings = await loadSettings();
        const ui2 = createSettingsUI();
        document.body.appendChild(ui2);
        const btnPos = ui2.querySelector("#button-position");
        const btnText = ui2.querySelector("#button-text");
        const includeTitle = ui2.querySelector("#include-title");
        const includeUrl = ui2.querySelector("#include-url");
        const includeDate = ui2.querySelector("#include-date");
        const includeAuthor = ui2.querySelector("#include-author");
        const includeTags = ui2.querySelector("#include-tags");
        const includeImages = ui2.querySelector("#include-images");
        const includeTables = ui2.querySelector("#include-tables");
        const includeCode = ui2.querySelector("#include-code");
        btnPos.value = settings.buttonPosition;
        btnText.value = settings.buttonText;
        includeTitle.checked = settings.includeTitle;
        includeUrl.checked = settings.includeUrl;
        includeDate.checked = settings.includeDate;
        includeAuthor.checked = settings.includeAuthor;
        includeTags.checked = settings.includeTags;
        includeImages.checked = settings.includeImages;
        includeTables.checked = settings.includeTables;
        includeCode.checked = settings.includeCodeBlocks;
        ui2.querySelector("#markify-close")?.addEventListener("click", () => {
          ui2.remove();
        });
        ui2.querySelector("#markify-reset")?.addEventListener("click", async () => {
          await resetSettings();
          ui2.remove();
          window.location.reload();
        });
        ui2.querySelector("#markify-save")?.addEventListener("click", async () => {
          const newSettings = {
            ...settings,
            buttonPosition: btnPos.value,
            buttonText: btnText.value,
            includeTitle: includeTitle.checked,
            includeUrl: includeUrl.checked,
            includeDate: includeDate.checked,
            includeAuthor: includeAuthor.checked,
            includeTags: includeTags.checked,
            includeImages: includeImages.checked,
            includeTables: includeTables.checked,
            includeCodeBlocks: includeCode.checked
          };
          await saveSettings(newSettings);
          ui2.remove();
          window.location.reload();
        });
        ui2.querySelector("#markify-settings-overlay")?.addEventListener("click", (e) => {
          if (e.target === ui2.querySelector("#markify-settings-overlay")) {
            ui2.remove();
          }
        });
      }
      var define_MARKIFY_TEMPLATES_default = { document: { enabled: true, template: "{frontmatter}\n\n{content}\n" }, frontmatter: { enabled: true, fields: ["author", "date", "description", "downloaded", "source", "tags", "title"] }, content: { separator: "\n\n---\n\n" }, comment: { enabled: true, template: "## Comment {index} - {author}\n**Posted:** {date}\n\n{content}\n" }, filename: { single: "[{id}] {title}", batch_item: "{index} - [{id}] {title}", batch: "[{date}] [{site}] [{type}] [{id}] {tagname}" }, "1point3acres": { site: { name: "1Point3Acres", base_url: "https://www.1point3acres.com", url_patterns: ["https://www.1point3acres.com/bbs/thread-*", "https://www.1point3acres.com/home/pins/*", "https://instant.1point3acres.com/thread/*"] }, api: { thread_endpoint: "https://api.1point3acres.com/api/v3/home-threads/{thread_id}", posts_endpoint: "https://api.1point3acres.com/api/threads/{thread_id}/nested-posts?ps={page_size}&order={order}&pg={page}", max_pages: 100, page_size: 20, order: "time_asc", content_format: "bbcode", response: { success_field: "errno", success_value: 0, data_field: "thread" }, id_extraction: { patterns: ["thread-(\\d+)", "/pins/(\\d+)", "/thread/(\\d+)"] }, fields: { title: "subject", author: "author", content: "message_bbcode", posted_at: "dateline", updated_at: "lastpost", views: "views", replies: "replies", favorites: "favtimes", post: { author: "author", content: "message_bbcode", posted_at: "dateline" } } }, metadata: { tags: ["1point3acres", "forum"], source_url: "https://www.1point3acres.com/bbs/thread-{thread_id}-1-1.html", delimiter: "---" }, frontmatter: { template: '---\ntitle: "{title}"\nauthor: {author}\nposted_at: {posted_at}\nupdated_at: {updated_at}\ndownloaded_at: {downloaded_at}\nsource: {url}\nviews: {views}\nreplies: {replies}\nfavorites: {favorites}\ntags:\n  - 1point3acres\n  - forum\n---\n' }, document: { template: "{frontmatter}\n# {title}\n\n**Author:** {author} | **Date:** {date}\n\n---\n\n{content}\n\n---\n\n**Views:** {views} | **Replies:** {replies} | **Favorites:** {favorites}\n\n{comments}" }, comment: { template: "**{author}** - *{date}*\n\n{content}\n\n{delimiter}\n" }, comments_header: { template: "\n{delimiter}\n\n## Comments ({count})\n" }, filename: { single: "{title}", batch_item: "{id} - {title}", batch: "{site}-{type}-{tagname}-{date}" }, batch: { listing_patterns: ["/bbs/forum-", "/home/explore"] } }, uscardforum: { site: { name: "US Card Forum", base_url: "https://www.uscardforum.com", url_patterns: ["https://www.uscardforum.com/t/*/*"] }, api: { raw_endpoint: "{base_url}/raw/{topic_id}?page={page}", json_endpoint: "{base_url}/t/{topic_id}.json?print=true&include_raw=true", max_pages: 100, page_delay_ms: 100, request: { credentials: true, accept: "text/plain" }, id_extraction: { patterns: ["/t/[^/]+/(\\d+)", "/t/(\\d+)"] } }, metadata: { title_cleanup: "[\\s\\-]+(美国信用卡指南|US Card Forum)$", tags: ["uscardforum", "forum", "credit-cards"], source_url: "{base_url}/t/{topic_id}", page_separator: "\n\n---\n\n" }, batch: { listing_patterns: ["/c/", "/search", "/tag/", "/tags/"], exclude_pattern: "/t/", selectors: { topic_links: 'a.title[href*="/t/"], a[href*="/t/"].raw-topic-link', search_links: 'a.search-link[href*="/t/"]', search_title: ".topic-title > span", containers: { search_result: ".fps-result", topic_row: "tr.topic-list-item", generic: ".topic-list-item, .ember-view" } }, patterns: { topic_id: "/t/[^/]+/(\\d+)", category: "/c/([^/]+)", tag: "/tag[s]?/([^/]+)" }, types: { category: "category", listing: "listing", search: "search", tag: "tag" } }, filename: { single: "{title}", batch_item: "{id} - {title}", batch: "{site}-{type}-{tagname}-{date}" } } };
      let downloadButton = null;
      let activeButton = null;
      function createGMFetcher() {
        return {
          get: async (url, opts) => {
            return new Promise((resolve, reject) => {
              GM.xmlHttpRequest({
                method: "GET",
                url,
                onload: (res) => {
                  resolve({
                    status: res.status,
                    ok: res.status >= 200 && res.status < 300,
                    text: res.responseText
                  });
                },
                onerror: () => reject(new Error("Network error"))
              });
            });
          }
        };
      }
      function createFetchFetcher() {
        return {
          get: async (url, opts) => {
            const res = await fetch(url, { credentials: opts?.credentials ? "include" : "same-origin" });
            return { status: res.status, ok: res.ok, text: await res.text() };
          }
        };
      }
      async function convertToMarkdown() {
        const url = window.location.href;
        const adapter = findSiteAdapter(url, builtInAdapters);
        logger.info(`Using adapter: ${adapter?.name || "None"}`);
        const templates2 = await GM.getValue("markify_templates", null);
        adapter?.name === "1Point3Acres" ? (progress) => {
          if (activeButton) activeButton.textContent = progress;
        } : void 0;
        const fetcher = adapter?.name === "1Point3Acres" ? createGMFetcher() : createFetchFetcher();
        if (adapter?.name === "US Card Forum") {
          GM.notification({
            text: notifications?.messages?.api_fetching || "Fetching content...",
            title: pkg?.package?.strings?.app_title || "Markify",
            timeout: notifications?.timeouts?.short || 2e3
          });
        }
        const result = await convert({
          url,
          document,
          templates: templates2,
          fetcher,
          includeFrontmatter: true,
          conversion: {
            headingStyle: ui?.conversion?.heading_style || "atx",
            codeBlockStyle: ui?.conversion?.code_block_style || "fenced",
            emDelimiter: ui?.conversion?.em_delimiter || "*",
            strongDelimiter: ui?.conversion?.strong_delimiter || "**",
            linkStyle: ui?.conversion?.link_style || "inlined",
            removeElements: ui?.conversion?.remove_elements?.tags || ["script", "style", "nav", "header", "footer", "aside", "iframe"]
          }
        });
        if (activeButton && adapter?.name === "1Point3Acres") {
          activeButton.textContent = activeButton === downloadButton ? ui?.ui?.buttons?.download_text || "📥 Markify" : ui?.ui?.buttons?.copy_text || "📋 Copy";
          activeButton = null;
        }
        return result.markdown;
      }
      async function getPageMetadata() {
        const url = window.location.href;
        const adapter = findSiteAdapter(url, builtInAdapters);
        const metadata = {
          title: document.title || "Untitled",
          url,
          date: formatDate(),
          downloaded: formatDate()
        };
        if (adapter?.extractMetadata) {
          const customMetadata = await adapter.extractMetadata(document, url);
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
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, notifications?.delays?.cleanup || 100);
      }
      function extractIdFromUrl() {
        const pathname = window.location.pathname;
        const threadMatch = pathname.match(/thread-(\d+)/);
        const pinsMatch = pathname.match(/\/pins\/(\d+)/);
        if (threadMatch) return threadMatch[1];
        if (pinsMatch) return pinsMatch[1];
        const uscfMatch = pathname.match(/\/t\/[^/]+\/(\d+)/);
        if (uscfMatch) return uscfMatch[1];
        return void 0;
      }
      async function handleDownload(mode = "download") {
        try {
          const markdown = await convertToMarkdown();
          const { metadata, adapter } = await getPageMetadata();
          const templates2 = await GM.getValue("markify_templates", null);
          const filenameTemplate = templates2?.filename?.single || "{title}";
          const { applyFilenameTemplate: applyFilenameTemplate2 } = await __vitePreload(async () => {
            const { applyFilenameTemplate: applyFilenameTemplate3 } = await Promise.resolve().then(() => index);
            return { applyFilenameTemplate: applyFilenameTemplate3 };
          }, true ? void 0 : void 0);
          const filename = applyFilenameTemplate2(filenameTemplate, {
            title: metadata.title || document.title || "untitled",
            id: extractIdFromUrl(),
            author: metadata.author,
            site: adapter?.name,
            date: formatDate()
          }) + ".md";
          if (mode === "clipboard") {
            await GM.setClipboard(markdown, "text");
            GM.notification({
              text: notifications?.messages?.clipboard_success || "Copied to clipboard!",
              title: pkg?.package?.strings?.app_title || "Markify",
              timeout: notifications?.timeouts?.short || 2e3
            });
          } else {
            downloadMarkdown(markdown, filename);
            GM.notification({
              text: formatMessage(notifications?.messages?.download_success || "Downloaded {filename}", { filename }),
              title: pkg?.package?.strings?.app_title || "Markify",
              timeout: notifications?.timeouts?.medium || 3e3
            });
            const id = extractIdFromUrl();
            if (id && adapter) {
              const { markAsDownloaded } = await __vitePreload(async () => {
                const { markAsDownloaded: markAsDownloaded2 } = await module.import('./download-history-W88f4QTw-DAx0nYVv.js');
                return { markAsDownloaded: markAsDownloaded2 };
              }, true ? void 0 : void 0);
              await markAsDownloaded(id, adapter.name, metadata.title || document.title || "untitled", "single");
              logger.info(`Marked ${id} as downloaded`);
            }
          }
          const stats = await GM.getValue("markify_stats", 0);
          await GM.setValue("markify_stats", stats + 1);
        } catch (error) {
          console.error("Failed to convert page:", error);
          GM.notification({
            text: notifications?.messages?.conversion_failed || "Failed to convert page",
            title: pkg?.package?.strings?.app_title || "Markify",
            timeout: notifications?.timeouts?.long || 5e3
          });
        }
      }
      async function showDownloadStatus() {
        const id = extractIdFromUrl();
        const adapter = findSiteAdapter(window.location.href, builtInAdapters);
        if (!id || !adapter) return;
        const { isDownloaded } = await __vitePreload(async () => {
          const { isDownloaded: isDownloaded2 } = await module.import('./download-history-W88f4QTw-DAx0nYVv.js');
          return { isDownloaded: isDownloaded2 };
        }, void 0 );
        const downloaded = await isDownloaded(id, adapter.name);
        if (downloaded) {
          const titleElement = document.querySelector("h1.text-xl, h1.font-bold, h1");
          if (titleElement) {
            const indicator = document.createElement("span");
            indicator.textContent = ui?.ui?.indicators?.downloaded_icon || "✓";
            indicator.title = ui?.ui?.indicators?.downloaded_tooltip || "Already downloaded";
            indicator.style.cssText = `
                color: ${theme?.colors?.success || "#22c55e"};
                font-size: ${ui?.ui?.indicators?.font_size_title || "1.2em"};
                margin-right: 6px;
                font-weight: bold;
            `;
            titleElement.insertBefore(indicator, titleElement.firstChild);
            logger.info("Download status indicator added to post page");
          }
        }
      }
      async function createDownloadButton() {
        await loadSettings();
        const container = document.createElement("div");
        container.id = "markify-container";
        Object.assign(container.style, {
          position: "fixed",
          top: ui?.ui?.position?.default_top || "20px",
          right: ui?.ui?.position?.default_right || "20px",
          zIndex: String(ui?.ui?.position?.z_index || 9999),
          display: "flex",
          gap: ui?.ui?.buttons?.gap || "8px",
          flexDirection: "row",
          cursor: "move",
          userSelect: "none"
        });
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        container.addEventListener("mousedown", (e) => {
          if (e.target.tagName === "BUTTON") return;
          isDragging = true;
          const rect = container.getBoundingClientRect();
          initialX = e.clientX - rect.left;
          initialY = e.clientY - rect.top;
          container.style.cursor = "grabbing";
        });
        document.addEventListener("mousemove", (e) => {
          if (!isDragging) return;
          e.preventDefault();
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
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
          padding: ui?.ui?.style?.padding || "10px 18px",
          border: "none",
          borderRadius: ui?.ui?.style?.border_radius || "8px",
          fontSize: ui?.ui?.style?.font_size || "14px",
          fontWeight: ui?.ui?.style?.font_weight || "600",
          cursor: "pointer",
          transition: ui?.ui?.animations?.transition || "all 0.2s ease",
          fontFamily: ui?.ui?.style?.font_family || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: "white"
        };
        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = ui?.ui?.buttons?.download_text || "📥 Markify";
        downloadButton = downloadBtn;
        downloadBtn.id = "markify-download-btn";
        Object.assign(downloadBtn.style, {
          ...baseButtonStyle,
          backgroundColor: theme?.colors?.primary || "#7c3aed",
          boxShadow: ui?.ui?.shadows?.button_default || "0 2px 4px rgba(0,0,0,0.1)"
        });
        downloadBtn.addEventListener("mouseenter", () => {
          downloadBtn.style.backgroundColor = theme?.colors?.primary_hover || "#6d28d9";
          downloadBtn.style.transform = ui?.ui?.animations?.hover_transform || "translateY(-2px)";
          downloadBtn.style.boxShadow = ui?.ui?.shadows?.button_hover || "0 4px 8px rgba(0,0,0,0.2)";
        });
        downloadBtn.addEventListener("mouseleave", () => {
          downloadBtn.style.backgroundColor = theme?.colors?.primary || "#7c3aed";
          downloadBtn.style.transform = "translateY(0)";
          downloadBtn.style.boxShadow = ui?.ui?.shadows?.button_default || "0 2px 4px rgba(0,0,0,0.1)";
        });
        downloadBtn.addEventListener("click", () => {
          activeButton = downloadBtn;
          handleDownload("download");
        });
        const copyBtn = document.createElement("button");
        copyBtn.textContent = ui?.ui?.buttons?.copy_text || "📋 Copy";
        copyBtn.id = "markify-copy-btn";
        Object.assign(copyBtn.style, {
          ...baseButtonStyle,
          backgroundColor: theme?.colors?.secondary || "#059669",
          boxShadow: ui?.ui?.shadows?.copy_default || "0 2px 4px rgba(0,0,0,0.1)"
        });
        copyBtn.addEventListener("mouseenter", () => {
          copyBtn.style.backgroundColor = theme?.colors?.secondary_hover || "#047857";
          copyBtn.style.transform = ui?.ui?.animations?.hover_transform || "translateY(-2px)";
          copyBtn.style.boxShadow = ui?.ui?.shadows?.copy_hover || "0 4px 8px rgba(0,0,0,0.2)";
        });
        copyBtn.addEventListener("mouseleave", () => {
          copyBtn.style.backgroundColor = theme?.colors?.secondary || "#059669";
          copyBtn.style.transform = "translateY(0)";
          copyBtn.style.boxShadow = ui?.ui?.shadows?.copy_default || "0 2px 4px rgba(0,0,0,0.1)";
        });
        copyBtn.addEventListener("click", () => {
          activeButton = copyBtn;
          handleDownload("clipboard");
        });
        container.appendChild(downloadBtn);
        container.appendChild(copyBtn);
        document.body.appendChild(container);
      }
      (async function main() {
        if (document.readyState === "loading") {
          await new Promise((resolve) => {
            document.addEventListener("DOMContentLoaded", resolve);
          });
        }
        const existingTemplates = await GM.getValue("markify_templates", null);
        if (!existingTemplates && typeof define_MARKIFY_TEMPLATES_default !== "undefined") {
          await GM.setValue("markify_templates", define_MARKIFY_TEMPLATES_default);
          console.log("[Markify] Templates loaded from config");
        }
        GM.registerMenuCommand(pkg?.package?.menu?.settings || "⚙️ Settings", () => {
          showSettings();
        });
        GM.registerMenuCommand(pkg?.package?.menu?.stats || "📊 View Stats", async () => {
          const count = await GM.getValue("markify_stats", 0);
          const { getDownloadStats } = await __vitePreload(async () => {
            const { getDownloadStats: getDownloadStats2 } = await module.import('./download-history-W88f4QTw-DAx0nYVv.js');
            return { getDownloadStats: getDownloadStats2 };
          }, void 0 );
          const stats = await getDownloadStats();
          GM.notification({
            text: formatMessage(notifications?.messages?.stats_summary || "Total: {total} | Single: {single} | Batch: {batch} | Tracked: {tracked}", {
              total: count,
              single: stats.single,
              batch: stats.batch,
              tracked: stats.total
            }),
            title: pkg?.package?.strings?.app_title_stats || "Markify Stats",
            timeout: notifications?.timeouts?.long || 5e3
          });
        });
        GM.registerMenuCommand(pkg?.package?.menu?.history || "📜 Download History", async () => {
          const { getDownloadHistory } = await __vitePreload(async () => {
            const { getDownloadHistory: getDownloadHistory2 } = await module.import('./download-history-W88f4QTw-DAx0nYVv.js');
            return { getDownloadHistory: getDownloadHistory2 };
          }, void 0 );
          const history = await getDownloadHistory();
          const recent = history.slice(-10).reverse();
          const summary = recent.map((r) => `${r.title} (${r.site})`).join("\n");
          alert(`Download History (${history.length} items)

Recent:
${summary || "No history yet"}`);
        });
        GM.registerMenuCommand(pkg?.package?.menu?.clear_history || "🗑️ Clear History", async () => {
          if (confirm(notifications?.messages?.clear_history_confirm || "Clear download history?")) {
            const { clearHistory } = await __vitePreload(async () => {
              const { clearHistory: clearHistory2 } = await module.import('./download-history-W88f4QTw-DAx0nYVv.js');
              return { clearHistory: clearHistory2 };
            }, void 0 );
            await clearHistory();
            GM.notification({
              text: notifications?.messages?.history_cleared || "History cleared",
              title: pkg?.package?.strings?.app_title || "Markify",
              timeout: notifications?.timeouts?.short || 2e3
            });
          }
        });
        GM.registerMenuCommand(pkg?.package?.menu?.reset_stats || "🔄 Reset Stats", async () => {
          await GM.setValue("markify_stats", 0);
          GM.notification({
            text: notifications?.messages?.stats_reset || "Stats reset",
            title: pkg?.package?.strings?.app_title || "Markify",
            timeout: notifications?.timeouts?.short || 2e3
          });
        });
        createDownloadButton();
        await showDownloadStatus();
        setTimeout(async () => {
          const { OnePoint3AcresBatchCapability } = await __vitePreload(async () => {
            const { OnePoint3AcresBatchCapability: OnePoint3AcresBatchCapability2 } = await module.import('./1point3acres-batch-ChFQOU_e-oC4WZemO.js');
            return { OnePoint3AcresBatchCapability: OnePoint3AcresBatchCapability2 };
          }, void 0 );
          const batchCapability1p3a = new OnePoint3AcresBatchCapability();
          if (batchCapability1p3a.isListingPage()) {
            logger.info("1Point3Acres listing page detected - initializing batch download");
            const { BatchDownloadManager } = await __vitePreload(async () => {
              const { BatchDownloadManager: BatchDownloadManager2 } = await module.import('./BatchDownloadManager-BrHbaN0L-1lksZJqR.js');
              return { BatchDownloadManager: BatchDownloadManager2 };
            }, void 0 );
            const batchManager = new BatchDownloadManager(batchCapability1p3a);
            batchManager.initializeUI();
          }
          const { USCardForumBatchCapability } = await __vitePreload(async () => {
            const { USCardForumBatchCapability: USCardForumBatchCapability2 } = await module.import('./uscardforum-batch-z2trcuDT-DLRjjlxj.js');
            return { USCardForumBatchCapability: USCardForumBatchCapability2 };
          }, void 0 );
          const batchCapabilityUSCF = new USCardForumBatchCapability();
          if (batchCapabilityUSCF.isListingPage()) {
            logger.info("USCardForum listing page detected - initializing batch download");
            const { BatchDownloadManager } = await __vitePreload(async () => {
              const { BatchDownloadManager: BatchDownloadManager2 } = await module.import('./BatchDownloadManager-BrHbaN0L-1lksZJqR.js');
              return { BatchDownloadManager: BatchDownloadManager2 };
            }, void 0 );
            const batchManager = new BatchDownloadManager(batchCapabilityUSCF);
            batchManager.initializeUI();
          }
        }, notifications?.delays?.dom_stabilize || 1e3);
        console.log("[Markify] Ready! Click the button to download this page as Markdown.");
        console.log("[Markify] Right-click the button to copy to clipboard instead.");
      })();

    })
  };
}));

System.register("./download-history-W88f4QTw-DAx0nYVv.js", [], (function (exports, module) {
  'use strict';
  return {
    execute: (function () {

      exports({
        clearHistory: clearHistory,
        getDownloadHistory: getDownloadHistory,
        getDownloadStats: getDownloadStats,
        isDownloaded: isDownloaded,
        markAsDownloaded: markAsDownloaded,
        removeDownload: removeDownload
      });

      function getStorageKey(id, site) {
        return `${site}:${id}`;
      }
      async function getDownloadHistory() {
        const history = await GM.getValue("markify_download_history", {});
        return Object.values(history);
      }
      async function isDownloaded(id, site) {
        const history = await GM.getValue("markify_download_history", {});
        const key = getStorageKey(id, site);
        return key in history;
      }
      async function markAsDownloaded(id, site, title, type) {
        const history = await GM.getValue("markify_download_history", {});
        const key = getStorageKey(id, site);
        history[key] = {
          id,
          site,
          title,
          downloadedAt: ( new Date()).toISOString(),
          type
        };
        await GM.setValue("markify_download_history", history);
      }
      async function removeDownload(id, site) {
        const history = await GM.getValue("markify_download_history", {});
        const key = getStorageKey(id, site);
        delete history[key];
        await GM.setValue("markify_download_history", history);
      }
      async function clearHistory() {
        await GM.setValue("markify_download_history", {});
      }
      async function getDownloadStats() {
        const records = await getDownloadHistory();
        return {
          total: records.length,
          single: records.filter((r) => r.type === "single").length,
          batch: records.filter((r) => r.type === "batch").length
        };
      }

    })
  };
}));

System.register("./1point3acres-batch-ChFQOU_e-oC4WZemO.js", ['./main-JT_1PqFi-BEs5AMbq.js'], (function (exports, module) {
  'use strict';
  var adapterLogger, fetchForumApiContent;
  return {
    setters: [module => {
      adapterLogger = module.a;
      fetchForumApiContent = module.f;
    }],
    execute: (function () {

      class OnePoint3AcresBatchCapability {
        isListingPage() {
          const url = window.location.href;
          return (url.includes("/home/forum/") || url.includes("/home/tag/")) && !url.includes("/pins/") && !url.includes("/thread-");
        }
        extractItems() {
          adapterLogger.debug("Extracting thread items from page");
          const items = [];
          const threadElements = document.querySelectorAll('a[href*="/home/pins/"]');
          adapterLogger.debug(`Found ${threadElements.length} thread link elements`);
          threadElements.forEach((element) => {
            const anchor = element;
            const href = anchor.getAttribute("href");
            if (href) {
              const match = href.match(/\/pins\/(\d+)/);
              if (match) {
                const threadId = match[1];
                const title = anchor.textContent?.trim() || `Thread ${threadId}`;
                items.push({
                  id: threadId,
                  title,
                  url: `https://www.1point3acres.com${href}`
                });
              }
            }
          });
          adapterLogger.info(`Extracted ${items.length} valid thread items`);
          return items;
        }
        async fetchItem(itemId, onProgress) {
          const fetcher = {
            get: async (url) => {
              return new Promise((resolve, reject) => {
                GM.xmlHttpRequest({
                  method: "GET",
                  url,
                  onload: (res) => {
                    resolve({ status: res.status, ok: res.status >= 200 && res.status < 300, text: res.responseText });
                  },
                  onerror: () => reject(new Error("Network error"))
                });
              });
            }
          };
          const templates = globalThis.__MARKIFY_TEMPLATES__;
          return fetchForumApiContent(itemId, fetcher, templates, onProgress);
        }
        async getFilenameContext() {
          const tagMatch = window.location.pathname.match(/\/tag\/(\d+)/);
          if (tagMatch) {
            const tagId = tagMatch[1];
            const tagName = await this.fetchTagName(tagId);
            return {
              site: "1point3acres",
              type: "tag",
              id: tagId,
              tagname: tagName || tagId
};
          }
          const forumMatch = window.location.pathname.match(/\/forum\/(\d+)/);
          const forumId = forumMatch?.[1] || "unknown";
          const forumName = await this.fetchForumName(forumId);
          return {
            site: "1point3acres",
            type: "forum",
            id: forumId,
            tagname: forumName || forumId
};
        }
async fetchTagName(tagId) {
          try {
            const apiUrl = `https://api.1point3acres.com/api/tags/${tagId}`;
            adapterLogger.debug(`Fetching tag name from: ${apiUrl}`);
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.errno === 0 && data.data?.tagname) {
              adapterLogger.info(`Tag name: ${data.data.tagname}`);
              return data.data.tagname;
            }
          } catch (error) {
            adapterLogger.warn(`Failed to fetch tag name for ${tagId}:`, error);
          }
          return null;
        }
async fetchForumName(forumId) {
          adapterLogger.debug(`Forum name API not implemented, using ID: ${forumId}`);
          return null;
        }
      } exports("OnePoint3AcresBatchCapability", OnePoint3AcresBatchCapability);

    })
  };
}));

System.register("./BatchDownloadManager-BrHbaN0L-1lksZJqR.js", ['./main-JT_1PqFi-BEs5AMbq.js'], (function (exports, module) {
  'use strict';
  var batchLogger, __vitePreload, ui, theme, templates, notifications, pkg;
  return {
    setters: [module => {
      batchLogger = module.c;
      __vitePreload = module._;
      ui = module.u;
      theme = module.t;
      templates = module.e;
      notifications = module.n;
      pkg = module.p;
    }],
    execute: (function () {

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
      class BatchDownloadManager {
        selectedItems = new Set();
        processedItems = new Set();
adapter;
        batchButton = null;
        mutationObserver = null;
        constructor(adapter) {
          this.adapter = adapter;
        }
initializeUI() {
          batchLogger.debug("initializeUI called");
          if (!this.adapter.isListingPage()) {
            batchLogger.debug("Not a listing page");
            return;
          }
          const items = this.adapter.extractItems();
          batchLogger.info(`Found ${items.length} items`);
          if (items.length === 0) {
            batchLogger.warn("No items found, aborting");
            return;
          }
          this.addCheckboxes(items);
          this.createBatchPanel();
          this.observeNewItems();
          batchLogger.info("UI initialization complete");
        }
async addCheckboxes(items) {
          batchLogger.debug(`Adding checkboxes to ${items.length} items`);
          let successCount = 0;
          const { isDownloaded } = await __vitePreload(async () => {
            const { isDownloaded: isDownloaded2 } = await module.import('./download-history-W88f4QTw-DAx0nYVv.js');
            return { isDownloaded: isDownloaded2 };
          }, void 0 );
          const context = await this.adapter.getFilenameContext();
          const siteName = context.site || "unknown";
          for (const [index, item] of items.entries()) {
            if (this.processedItems.has(item.id)) {
              continue;
            }
            const linkElement = document.querySelector(`a[href*="${item.id}"]`);
            if (!linkElement) {
              batchLogger.warn(`Could not find link for item ${item.id}`);
              continue;
            }
            let container = null;
            if (this.adapter.getContainerSelectors) {
              const selectors = this.adapter.getContainerSelectors();
              for (const selector of selectors) {
                container = linkElement.closest(selector);
                if (container) break;
              }
            } else {
              container = linkElement.closest('[data-sentry-component="HomeThreadItem"]');
              if (!container) {
                container = linkElement.closest(".border-b");
              }
            }
            if (!container) {
              batchLogger.warn(`Could not find container for item ${item.id}`);
              continue;
            }
            container.style.position = "relative";
            const checkboxWrapper = document.createElement("div");
            checkboxWrapper.className = "markify-checkbox-wrapper";
            checkboxWrapper.style.cssText = `
                position: absolute;
                left: 8px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `markify-batch-${item.id}`;
            checkbox.className = "markify-batch-checkbox";
            checkbox.style.cssText = `
                width: 18px;
                height: 18px;
                cursor: pointer;
                margin: 0;
            `;
            checkbox.addEventListener("click", (e2) => {
              e2.stopPropagation();
            });
            checkbox.addEventListener("change", (e2) => {
              e2.stopPropagation();
              if (checkbox.checked) {
                this.selectedItems.add(item.id);
              } else {
                this.selectedItems.delete(item.id);
              }
              this.updateBatchButton();
            });
            checkboxWrapper.appendChild(checkbox);
            container.appendChild(checkboxWrapper);
            const downloaded = await isDownloaded(item.id, siteName);
            if (downloaded) {
              const indicator = document.createElement("span");
              indicator.textContent = ui?.ui?.indicators?.downloaded_icon?.trim() || "✓";
              indicator.title = ui?.ui?.indicators?.downloaded_tooltip || "Already downloaded";
              indicator.style.cssText = `
                    color: ${theme?.colors?.success || "#22c55e"};
                    font-size: ${ui?.ui?.indicators?.font_size || "16px"};
                    margin-left: 6px;
                    font-weight: bold;
                `;
              checkboxWrapper.appendChild(indicator);
            }
            const containerElement = container;
            const currentPadding = window.getComputedStyle(containerElement).paddingLeft;
            const currentPaddingValue = parseInt(currentPadding) || 0;
            containerElement.style.paddingLeft = `${currentPaddingValue + 32}px`;
            this.processedItems.add(item.id);
            successCount++;
            if (index === 0) {
              batchLogger.debug("Successfully added first checkbox");
            }
          }
          batchLogger.info(`Successfully added ${successCount}/${items.length} checkboxes`);
        }
observeNewItems() {
          batchLogger.debug("Setting up MutationObserver for dynamic content");
          this.mutationObserver = new MutationObserver((mutations) => {
            let hasNewItems = false;
            for (const mutation of mutations) {
              if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                for (const node of Array.from(mutation.addedNodes)) {
                  if (node instanceof HTMLElement) {
                    const hasThreadLink = node.querySelector('a[href*="/home/pins/"]') || node.matches('a[href*="/home/pins/"]');
                    if (hasThreadLink) {
                      hasNewItems = true;
                      break;
                    }
                  }
                }
                if (hasNewItems) break;
              }
            }
            if (hasNewItems) {
              batchLogger.debug("Detected new items in DOM, adding checkboxes");
              const newItems = this.adapter.extractItems();
              this.addCheckboxes(newItems);
            }
          });
          this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
          });
          batchLogger.info("MutationObserver started watching for new items");
        }
destroy() {
          if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
            batchLogger.debug("MutationObserver disconnected");
          }
        }
createBatchPanel() {
          const panel = document.createElement("div");
          panel.id = "markify-batch-panel";
          panel.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 10001;
            background: rgba(30, 30, 46, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex;
            gap: 12px;
            align-items: center;
            transition: all 0.3s ease;
        `;
          const selectAll = document.createElement("input");
          selectAll.type = "checkbox";
          selectAll.id = "markify-select-all";
          selectAll.style.cssText = `
            width: 18px;
            height: 18px;
            cursor: pointer;
        `;
          selectAll.addEventListener("change", () => {
            const checkboxes = document.querySelectorAll(".markify-batch-checkbox");
            checkboxes.forEach((cb) => {
              cb.checked = selectAll.checked;
              if (selectAll.checked) {
                const id = cb.id.replace("markify-batch-", "");
                this.selectedItems.add(id);
              } else {
                this.selectedItems.clear();
              }
            });
            this.updateBatchButton();
          });
          const selectAllLabel = document.createElement("label");
          selectAllLabel.htmlFor = "markify-select-all";
          selectAllLabel.textContent = "Select All";
          selectAllLabel.style.cssText = `
            color: #cdd6f4;
            font-size: 14px;
            cursor: pointer;
            user-select: none;
        `;
          this.batchButton = document.createElement("button");
          this.batchButton.textContent = "📥 Download Selected (0)";
          this.batchButton.disabled = true;
          this.batchButton.style.cssText = `
            padding: 10px 18px;
            background: ${theme?.colors?.primary || "#7c3aed"};
            color: white;
            border: none;
            border-radius: ${ui?.ui?.style?.border_radius || "8px"};
            font-size: ${ui?.ui?.style?.font_size || "14px"};
            font-weight: ${ui?.ui?.style?.font_weight || "600"};
            cursor: pointer;
            transition: ${ui?.ui?.animations?.transition || "all 0.2s ease"};
            opacity: 0.5;
        `;
          this.batchButton.addEventListener("click", () => {
            this.downloadSelected();
          });
          panel.appendChild(selectAll);
          panel.appendChild(selectAllLabel);
          panel.appendChild(this.batchButton);
          document.body.appendChild(panel);
        }
updateBatchButton() {
          if (!this.batchButton) return;
          const count = this.selectedItems.size;
          this.batchButton.textContent = `📥 Download Selected (${count})`;
          this.batchButton.disabled = count === 0;
          this.batchButton.style.opacity = count === 0 ? "0.5" : "1";
          this.batchButton.style.cursor = count === 0 ? "not-allowed" : "pointer";
        }
async downloadSelected() {
          const items = this.adapter.extractItems().filter((item) => this.selectedItems.has(item.id));
          if (items.length === 0) {
            return;
          }
          const total = items.length;
          let processed = 0;
          const errors = [];
          const files = [];
          for (const item of items) {
            processed++;
            if (this.batchButton) {
              this.batchButton.textContent = `📥 Processing ${processed}/${total}...`;
            }
            try {
              batchLogger.info(`Downloading ${processed}/${total}: ${item.title}`);
              const markdown = await this.adapter.fetchItem(item.id, (msg) => {
                if (this.batchButton) {
                  this.batchButton.textContent = `${msg} (${processed}/${total})`;
                }
              });
              if (markdown) {
                const filenameTemplate = templates.filename.single;
                const context = await this.adapter.getFilenameContext();
                const { applyFilenameTemplate } = await __vitePreload(async () => {
                  const { applyFilenameTemplate: applyFilenameTemplate2 } = await module.import('./main-JT_1PqFi-BEs5AMbq.js').then((n2) => n2.i);
                  return { applyFilenameTemplate: applyFilenameTemplate2 };
                }, true ? void 0 : void 0);
                const templateVars = {
                  ...context,
                  id: item.id,
                  title: item.title,
                  index: String(processed).padStart(3, "0")
};
                const filename = applyFilenameTemplate(filenameTemplate, templateVars) + ".md";
                files.push({ name: filename, input: markdown });
              } else {
                errors.push(item.title);
              }
            } catch (error) {
              errors.push(item.title);
              batchLogger.error(`Error downloading ${item.title}:`, error);
            }
            const { humanDelay } = await __vitePreload(async () => {
              const { humanDelay: humanDelay2 } = await module.import('./main-JT_1PqFi-BEs5AMbq.js').then((n2) => n2.h);
              return { humanDelay: humanDelay2 };
            }, void 0 );
            const delayConfig = notifications?.delays?.batch_item ?? { min_ms: 1e3, max_ms: 3e3, jitter: 0.25 };
            await humanDelay(delayConfig);
          }
          batchLogger.info(`Finished downloading. Got ${files.length} files`);
          if (files.length === 0) {
            batchLogger.warn("No files to zip, aborting");
            if (this.batchButton) {
              this.batchButton.textContent = "❌ No Files";
            }
            GM.notification({
              text: notifications?.messages?.no_files || "No files to download",
              title: pkg?.package?.strings?.app_title_batch || "Markify Batch Download",
              timeout: notifications?.timeouts?.medium || 3e3
            });
            return;
          }
          try {
            batchLogger.info(`Creating ZIP with ${files.length} files using client-zip...`);
            if (this.batchButton) {
              this.batchButton.textContent = "📦 Creating ZIP...";
            }
            const zipBlob = await A(files).blob();
            batchLogger.info(`ZIP created successfully (${(zipBlob.size / 1024 / 1024).toFixed(2)} MB)`);
            const batchFilenameTemplate = templates.filename.batch;
            const context = await this.adapter.getFilenameContext();
            const { applyFilenameTemplate } = await __vitePreload(async () => {
              const { applyFilenameTemplate: applyFilenameTemplate2 } = await module.import('./main-JT_1PqFi-BEs5AMbq.js').then((n2) => n2.i);
              return { applyFilenameTemplate: applyFilenameTemplate2 };
            }, true ? void 0 : void 0);
            const zipFilename = applyFilenameTemplate(batchFilenameTemplate, context) + ".zip";
            batchLogger.info(`Downloading as: ${zipFilename}`);
            const url = URL.createObjectURL(zipBlob);
            const a2 = document.createElement("a");
            a2.href = url;
            a2.download = zipFilename;
            a2.style.display = "none";
            document.body.appendChild(a2);
            a2.click();
            const { markAsDownloaded } = await __vitePreload(async () => {
              const { markAsDownloaded: markAsDownloaded2 } = await module.import('./download-history-W88f4QTw-DAx0nYVv.js');
              return { markAsDownloaded: markAsDownloaded2 };
            }, true ? void 0 : void 0);
            const siteName = context.site || "unknown";
            for (const item of items) {
              await markAsDownloaded(item.id, siteName, item.title, "batch");
            }
            batchLogger.info(`Marked ${items.length} items as downloaded`);
            setTimeout(() => {
              document.body.removeChild(a2);
              URL.revokeObjectURL(url);
              batchLogger.debug("Cleaned up download link");
            }, notifications?.delays?.cleanup || 100);
            batchLogger.info("ZIP download initiated");
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            batchLogger.error("Failed to generate or download ZIP:", error);
            if (this.batchButton) {
              this.batchButton.textContent = "❌ ZIP Failed";
            }
            GM.notification({
              text: `Failed to create ZIP: ${errorMessage}`,
              title: pkg?.package?.strings?.app_title_error || "Markify Batch Download Error",
              timeout: notifications?.timeouts?.long || 5e3
            });
            return;
          }
          this.selectedItems.clear();
          const checkboxes = document.querySelectorAll(".markify-batch-checkbox");
          checkboxes.forEach((cb) => cb.checked = false);
          this.updateBatchButton();
          if (errors.length > 0) {
            GM.notification({
              text: `Downloaded ${total - errors.length}/${total} items. ${errors.length} failed.`,
              title: pkg?.package?.strings?.app_title_batch || "Markify Batch Download",
              timeout: notifications?.timeouts?.long || 5e3
            });
          } else {
            GM.notification({
              text: `Successfully downloaded all ${total} items!`,
              title: pkg?.package?.strings?.app_title_batch || "Markify Batch Download",
              timeout: notifications?.timeouts?.medium || 3e3
            });
          }
        }
      } exports("BatchDownloadManager", BatchDownloadManager);

    })
  };
}));

System.register("./uscardforum-batch-z2trcuDT-DLRjjlxj.js", ['./main-JT_1PqFi-BEs5AMbq.js'], (function (exports, module) {
  'use strict';
  var adapterUSCardForum, batchLogger, fetchDiscourseRawContent;
  return {
    setters: [module => {
      adapterUSCardForum = module.b;
      batchLogger = module.c;
      fetchDiscourseRawContent = module.d;
    }],
    execute: (function () {

      class USCardForumBatchCapability {
        isListingPage() {
          const url = window.location.href;
          const config = adapterUSCardForum;
          const patterns = config?.batch?.listing_patterns || ["/c/", "/tag/", "/tags/", "/search"];
          const excludePattern = config?.batch?.exclude_pattern;
          return patterns.some((pattern) => url.includes(pattern)) && !url.includes(excludePattern);
        }
        extractItems() {
          batchLogger.debug("Extracting topic items from USCardForum page");
          const items = [];
          const config = adapterUSCardForum;
          const topicSelector = config?.batch?.selectors?.topic_links;
          const searchSelector = config?.batch?.selectors?.search_links;
          const titleSelector = config?.batch?.selectors?.search_title;
          const topicIdPattern = config?.batch?.patterns?.topic_id;
          const baseUrl = config?.site?.base_url;
          const combinedSelector = `${topicSelector}, ${searchSelector}`;
          const topicLinks = document.querySelectorAll(combinedSelector);
          batchLogger.debug(`Found ${topicLinks.length} topic link elements`);
          topicLinks.forEach((element) => {
            const anchor = element;
            const href = anchor.getAttribute("href");
            if (href) {
              const regex = new RegExp(topicIdPattern);
              const match = href.match(regex);
              if (match) {
                const topicId = match[1];
                let title = "";
                const titleSpan = anchor.querySelector(titleSelector);
                if (titleSpan) {
                  title = titleSpan.textContent?.trim() || "";
                }
                if (!title) {
                  title = anchor.textContent?.trim() || `Topic ${topicId}`;
                }
                items.push({
                  id: topicId,
                  title,
                  url: href.startsWith("http") ? href : `${baseUrl}${href}`
                });
              }
            }
          });
          batchLogger.info(`Extracted ${items.length} valid topic items`);
          return items;
        }
        async fetchItem(itemId, onProgress) {
          return fetchDiscourseRawContent(itemId);
        }
        getContainerSelectors() {
          const config = adapterUSCardForum;
          const containers = config?.batch?.selectors?.containers;
          if (containers) {
            return [
              containers.search_result,
              containers.topic_row,
              containers.generic
            ].filter(Boolean);
          }
          return [".fps-result", ".topic-list-item", ".ember-view"];
        }
        getFilenameContext() {
          const config = adapterUSCardForum;
          const siteName = config?.site?.name;
          const categoryPattern = config?.batch?.patterns?.category;
          const tagPattern = config?.batch?.patterns?.tag;
          const types = config?.batch?.types || { category: "category", tag: "tag", search: "search", listing: "listing" };
          const categoryMatch = window.location.pathname.match(new RegExp(categoryPattern));
          const tagMatch = window.location.pathname.match(new RegExp(tagPattern));
          const isSearchPage = window.location.pathname.includes("/search");
          if (categoryMatch) {
            return {
              site: siteName,
              type: types.category,
              id: categoryMatch[1]
            };
          } else if (tagMatch) {
            return {
              site: siteName,
              type: types.tag,
              id: tagMatch[1]
            };
          } else if (isSearchPage) {
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get("q") || "";
            const decodedQuery = decodeURIComponent(query);
            return {
              site: siteName,
              type: types.search,
              id: decodedQuery || "search"
            };
          } else {
            return {
              site: siteName,
              type: types.listing,
              id: ""
            };
          }
        }
      } exports("USCardForumBatchCapability", USCardForumBatchCapability);

    })
  };
}));

System.import("./__entry.js", "./");