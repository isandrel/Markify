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
// @match        https://www.uscardforum.com/t/*/*
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
// ==/UserScript==


System.register("./__entry.js", [], (function (exports, module) {
  'use strict';
  return {
    execute: (function () {

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
          let allSettled2 = function(promises$2) {
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
          promise = allSettled2(deps.map((dep) => {
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
            var index = Array.prototype.indexOf.call(parent.children, node);
            prefix = (start ? Number(start) + index : index + 1) + ".  ";
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
          var match;
          while (match = fenceInCodeRegex.exec(code)) {
            if (match[0].length >= fenceSize) {
              fenceSize = match[0].length + 1;
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
          var output = process.call(this, new RootNode(input, this.options));
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
      function process(parentNode) {
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
        var content = process.call(this, node);
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
      function sanitizeFilename(filename) {
        return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 200);
      }
      function formatDate(date = new Date()) {
        return date.toISOString().split("T")[0];
      }
      function extractMainContent() {
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
          const element = document.querySelector(selector);
          if (element) {
            return element;
          }
        }
        return document.body;
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
            author: authorMeta?.content,
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
            author,
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
            title,
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
        extractMetadata: (doc) => {
          const repoName = doc.querySelector('h1[itemprop="name"] a')?.textContent?.trim();
          const author = window.location.pathname.split("/")[1];
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
        extractMetadata: (doc) => {
          const subreddit = window.location.pathname.split("/")[2];
          const author = doc.querySelector('[data-testid="post_author_link"]')?.textContent?.trim();
          return {
            author,
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
            author,
            tags: ["dev.to", ...tags]
          };
        }
      };
      const usCardForumAdapter = {
        name: "US Card Forum",
        urlPatterns: [
          "https://www.uscardforum.com/t/*/*"
        ],
        extractMetadata: (doc) => {
          const title = doc.title.replace(/\s-\s(美国信用卡指南|US Card Forum)$/, "").trim();
          const match = window.location.pathname.match(/\/t\/[^\/]+\/(\d+)/);
          const topicId = match ? match[1] : null;
          return {
            title,
            tags: ["uscardforum", "forum", "credit-cards"],
            source: topicId ? `https://www.uscardforum.com/t/${topicId}` : window.location.href
          };
        }
      };
      async function fetchUSCardForumContent(topicId) {
        const pages = [];
        let page = 1;
        console.log("[Markify] Fetching US Card Forum topic (all pages)...");
        while (true) {
          const url = `https://www.uscardforum.com/raw/${topicId}?page=${page}`;
          try {
            const response = await fetch(url, { credentials: "include" });
            if (!response.ok) {
              if (page === 1) {
                throw new Error(`Failed to fetch content: ${response.status}`);
              }
              break;
            }
            const text = await response.text();
            if (!text || text.trim().length === 0) {
              break;
            }
            pages.push(text);
            console.log(`[Markify] Fetched page ${page} (${text.length} characters)`);
            await new Promise((resolve) => setTimeout(resolve, 100));
            page++;
          } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
            if (page === 1) {
              return null;
            }
            break;
          }
        }
        console.log(`[Markify] Complete! Downloaded ${pages.length} pages, total ${pages.join("").length} characters`);
        return pages.join("\n\n---\n\n");
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
        defaultAdapter
];
      const defaultSettings = {
buttonPosition: "bottom-right",
        buttonText: "📥 Markify",
        buttonColor: "#7c3aed",
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
          text: "Settings saved successfully!",
          title: "Markify",
          timeout: 2e3
        });
      }
      async function resetSettings() {
        await GM.deleteValue("markify_settings");
        GM.notification({
          text: "Settings reset to defaults",
          title: "Markify",
          timeout: 2e3
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
        color: #7c3aed;
      }
      
      .markify-setting-group {
        margin-bottom: 24px;
      }
      
      .markify-setting-group h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 12px 0;
        color: #a78bfa;
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
        color: #e5e7eb;
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
        background: #7c3aed;
        color: white;
      }
      
      .markify-btn-primary:hover {
        background: #6d28d9;
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
        const ui = createSettingsUI();
        document.body.appendChild(ui);
        const btnPos = ui.querySelector("#button-position");
        const btnText = ui.querySelector("#button-text");
        const includeTitle = ui.querySelector("#include-title");
        const includeUrl = ui.querySelector("#include-url");
        const includeDate = ui.querySelector("#include-date");
        const includeAuthor = ui.querySelector("#include-author");
        const includeTags = ui.querySelector("#include-tags");
        const includeImages = ui.querySelector("#include-images");
        const includeTables = ui.querySelector("#include-tables");
        const includeCode = ui.querySelector("#include-code");
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
        ui.querySelector("#markify-close")?.addEventListener("click", () => {
          ui.remove();
        });
        ui.querySelector("#markify-reset")?.addEventListener("click", async () => {
          await resetSettings();
          ui.remove();
          window.location.reload();
        });
        ui.querySelector("#markify-save")?.addEventListener("click", async () => {
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
          ui.remove();
          window.location.reload();
        });
        ui.querySelector("#markify-settings-overlay")?.addEventListener("click", (e) => {
          if (e.target === ui.querySelector("#markify-settings-overlay")) {
            ui.remove();
          }
        });
      }
      var define_MARKIFY_TEMPLATES_default = { document: { enabled: true, template: "{frontmatter}\n\n{content}\n" }, frontmatter: { enabled: true, fields: ["author", "date", "description", "downloaded", "source", "tags", "title"] }, content: { separator: "\n\n---\n\n" }, comment: { enabled: true, template: "## Comment {index} - {author}\n**Posted:** {date}\n\n{content}\n" } };
      const turndownService = new TurndownService({
        headingStyle: "atx",
codeBlockStyle: "fenced",
emDelimiter: "*",
strongDelimiter: "**",
linkStyle: "inlined"
});
      turndownService.addRule("strikethrough", {
        filter: ["del", "s", "strike"],
        replacement: (content) => `~~${content}~~`
      });
      turndownService.remove(["script", "style", "nav", "header", "footer", "aside", "iframe"]);
      function extractMetadata(adapter) {
        const url = window.location.href;
        const date = formatDate();
        let metadata = {
          title: document.title || "Untitled",
          url,
          date,
          downloaded: formatDate()
};
        if (adapter?.extractMetadata) {
          const customMetadata = adapter.extractMetadata(document);
          metadata = { ...metadata, ...customMetadata };
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
          metadata = { ...metadata, ...adapter.frontmatterFields };
        }
        return metadata;
      }
      function extractContent(adapter) {
        if (adapter?.contentSelectors) {
          for (const selector of adapter.contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              return element;
            }
          }
        }
        return extractMainContent();
      }
      async function convertToMarkdown() {
        const adapter = findSiteAdapter(window.location.href, builtInAdapters);
        console.log(`[Markify] Using adapter: ${adapter?.name || "None"}`);
        let markdown;
        if (adapter?.name === "US Card Forum") {
          const match = window.location.pathname.match(/\/t\/[^\/]+\/(\d+)/);
          const topicId = match ? match[1] : null;
          if (!topicId) {
            throw new Error("Could not extract topic ID from URL");
          }
          GM.notification({
            text: "Fetching forum content via API...",
            title: "Markify",
            timeout: 2e3
          });
          const rawMarkdown = await fetchUSCardForumContent(topicId);
          if (!rawMarkdown) {
            throw new Error("Failed to fetch forum content");
          }
          markdown = rawMarkdown;
        } else {
          let contentElement = extractContent(adapter);
          let contentClone = contentElement.cloneNode(true);
          if (adapter?.removeSelectors) {
            for (const selector of adapter.removeSelectors) {
              contentClone.querySelectorAll(selector).forEach((el) => el.remove());
            }
          }
          if (adapter?.preProcess) {
            contentClone = adapter.preProcess(contentClone);
          }
          markdown = turndownService.turndown(contentClone);
          if (adapter?.postProcess) {
            markdown = adapter.postProcess(markdown);
          }
        }
        const metadata = extractMetadata(adapter);
        const frontmatter = generateFrontmatter(metadata);
        const templates = await GM.getValue("markify_templates", null);
        let finalContent = markdown;
        if (templates?.content?.header) {
          finalContent = templates.content.header + finalContent;
        }
        if (templates?.content?.footer) {
          finalContent = finalContent + templates.content.footer;
        }
        if (templates?.document?.enabled && templates?.document?.template) {
          const { applyDocumentTemplate } = await __vitePreload(async () => {
            const { applyDocumentTemplate: applyDocumentTemplate2 } = await module.import('./templates-BIW0KtzE-DEO8nlMJ.js');
            return { applyDocumentTemplate: applyDocumentTemplate2 };
          }, void 0 );
          return applyDocumentTemplate(templates.document.template, {
            frontmatter,
            content: finalContent,
            ...metadata
});
        }
        return `${frontmatter}
${finalContent}`;
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
        }, 100);
      }
      async function handleDownload(mode = "download") {
        try {
          GM.notification({
            text: "Converting page to Markdown...",
            title: "Markify",
            timeout: 2e3
          });
          const markdown = await convertToMarkdown();
          const title = document.title || "untitled";
          const filename = sanitizeFilename(title) + ".md";
          if (mode === "clipboard") {
            await GM.setClipboard(markdown, "text");
            GM.notification({
              text: "Copied to clipboard!",
              title: "Markify",
              timeout: 2e3
            });
          } else {
            downloadMarkdown(markdown, filename);
            GM.notification({
              text: `Downloaded as ${filename}`,
              title: "Markify",
              timeout: 3e3
            });
          }
          const stats = await GM.getValue("markify_stats", 0);
          await GM.setValue("markify_stats", stats + 1);
        } catch (error) {
          console.error("Failed to convert page:", error);
          GM.notification({
            text: "Failed to convert page. Check console for details.",
            title: "Markify",
            timeout: 5e3
          });
        }
      }
      async function createDownloadButton() {
        await loadSettings();
        const container = document.createElement("div");
        container.id = "markify-container";
        Object.assign(container.style, {
          position: "fixed",
          top: "25%",
          right: "20px",
          zIndex: "10000",
          display: "flex",
          gap: "10px",
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
          padding: "12px 20px",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s ease",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: "white"
        };
        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "📥 Download";
        downloadBtn.id = "markify-download-btn";
        Object.assign(downloadBtn.style, {
          ...baseButtonStyle,
          backgroundColor: "#7c3aed",
          boxShadow: "0 4px 12px rgba(124, 58, 237, 0.4)"
        });
        downloadBtn.addEventListener("mouseenter", () => {
          downloadBtn.style.backgroundColor = "#6d28d9";
          downloadBtn.style.transform = "translateY(-2px)";
          downloadBtn.style.boxShadow = "0 6px 16px rgba(124, 58, 237, 0.5)";
        });
        downloadBtn.addEventListener("mouseleave", () => {
          downloadBtn.style.backgroundColor = "#7c3aed";
          downloadBtn.style.transform = "translateY(0)";
          downloadBtn.style.boxShadow = "0 4px 12px rgba(124, 58, 237, 0.4)";
        });
        downloadBtn.addEventListener("click", () => handleDownload("download"));
        const copyBtn = document.createElement("button");
        copyBtn.textContent = "📋 Copy";
        copyBtn.id = "markify-copy-btn";
        Object.assign(copyBtn.style, {
          ...baseButtonStyle,
          backgroundColor: "#059669",
          boxShadow: "0 4px 12px rgba(5, 150, 105, 0.4)"
        });
        copyBtn.addEventListener("mouseenter", () => {
          copyBtn.style.backgroundColor = "#047857";
          copyBtn.style.transform = "translateY(-2px)";
          copyBtn.style.boxShadow = "0 6px 16px rgba(5, 150, 105, 0.5)";
        });
        copyBtn.addEventListener("mouseleave", () => {
          copyBtn.style.backgroundColor = "#059669";
          copyBtn.style.transform = "translateY(0)";
          copyBtn.style.boxShadow = "0 4px 12px rgba(5, 150, 105, 0.4)";
        });
        copyBtn.addEventListener("click", () => handleDownload("clipboard"));
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
        GM.registerMenuCommand("⚙️ Settings", () => {
          showSettings();
        });
        GM.registerMenuCommand("📊 View Stats", async () => {
          const count = await GM.getValue("markify_stats", 0);
          GM.notification({
            text: `You've converted ${count} ${count === 1 ? "page" : "pages"}!`,
            title: "Markify Stats",
            timeout: 4e3
          });
        });
        GM.registerMenuCommand("🔄 Reset Stats", async () => {
          await GM.setValue("markify_stats", 0);
          GM.notification({
            text: "Stats reset successfully",
            title: "Markify",
            timeout: 2e3
          });
        });
        await createDownloadButton();
        console.log("[Markify] Ready! Click the button to download this page as Markdown.");
        console.log("[Markify] Right-click the button to copy to clipboard instead.");
      })();

    })
  };
}));

System.register("./templates-BIW0KtzE-DEO8nlMJ.js", [], (function (exports, module) {
  'use strict';
  return {
    execute: (function () {

      exports({
        applyDocumentTemplate: applyDocumentTemplate,
        replacePlaceholders: replacePlaceholders
      });

      function replacePlaceholders(template, data) {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
          const placeholder = new RegExp(`\\{${key}\\}`, "g");
          result = result.replace(placeholder, String(value || ""));
        }
        return result;
      }
      function applyDocumentTemplate(template, data) {
        return replacePlaceholders(template, data);
      }

    })
  };
}));

System.import("./__entry.js", "./");