// ==UserScript==
// @name         Markify — Local Development
// @namespace    https://github.com/isandrel/Markify
// @version      0.0.5
// @description  Load the local Markify build from disk
// @author       isandrel
// @license      AGPL-3.0-or-later
// @match        https://www.1point3acres.com/home/*
// @match        https://www.1point3acres.com/bbs/thread-*
// @match        https://instant.1point3acres.com/thread/*
// @match        https://www.uscardforum.com/*
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/system.min.js
// @require      https://cdn.jsdelivr.net/npm/systemjs@6.15.1/dist/extras/named-register.min.js
// @require      data:application/javascript,%3B(typeof%20System!%3D'undefined')%26%26(System%3Dnew%20System.constructor())%3B
// @require      file:///Users/neo/Documents/Git/Markify/packages/userscript/dist/markify-v0.0.5.user.js
// @grant        GM.deleteValue
// @grant        GM.getValue
// @grant        GM.listValues
// @grant        GM.notification
// @grant        GM.openInTab
// @grant        GM.registerMenuCommand
// @grant        GM.setClipboard
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @connect      api.1point3acres.com
// @connect      self
// @run-at       document-idle
// @noframes
// ==/UserScript==
