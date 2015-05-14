"use strict";
/* eslint-disable no-undef */
if (typeof console === "undefined") { console = {}; }
if (console.log === undefined) { console.log = function(){}; }
if (console.info === undefined) { console.info = function(){}; }
if (console.debug === undefined) { console.debug = console.log; }
if (console.error === undefined) { console.error = console.log; }
/* eslint-enable no-undef */

module.exports = {
  debug: function() {
    console.debug.apply(console, arguments);
  },
  info: function() {
    console.info.apply(console, arguments);
  },
  log: function() {
    console.log.apply(console, arguments);
  },
  error: function() {
    console.error.apply(console, arguments);
  }
};
