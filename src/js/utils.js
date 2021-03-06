"use strict";
const _ = require("lodash");
/**
 * Parse url params from the given querystring or URL.
 *
 * @param {string} query - The URL or querystring to parse.
 * @return {object} A hash containing key/value pairs for the querystring.
 * Duplicated parameter keys and values are discarded; the last one wins (e.g.
 * ``a=1&a=2`` will return ``{a: 2}``.
 */
module.exports.decodeParams = function(query) {
  if (query.indexOf("?") !== -1) {
    query = query.split("?")[1];
  }
  query = query.split("#")[0];
  let match,
      search = /([^&=]+)(=?)([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); };

  let params = {};
  /* eslint-disable no-cond-assign */
  while (match = search.exec(query)) {
    if (match[2]) {
      // If we have an '=' sign, assign the value.
      params[decode(match[1])] = decode(match[3]);
    } else {
      // No '=' sign (e.g. a bare param)? call it undefined.
      params[decode(match[1])] = undefined;
    }
  }
  /* eslint-enable no-cond-assign */
  return params;
};

/**
 * Build a url querystring from the given key/value map.
 *
 * @param {object} mapping - key/value map from which to build querystring
 * @return {string} The mapping formatted as a querystring
 */
module.exports.encodeParams = function(mapping) {
  return _.map(mapping, function(val, key) {
    if (typeof val === 'undefined') {
      return key;
    }
    return key + "=" + encodeURIComponent(val);
  }).join("&");
};

/**
 * Get a JSON object from localStorage, if available.
 *
 * @param {string} key - The key to look up in local storage.
 * @param {string} defaultValue - the value to return if the browser does not
 * support localStorage or if the given key is not present.
 * @return {object|undefined} JSON decoded object from local storage; the given
 * defaultValue or undefined if not present.
 */
module.exports.lsGet = function(key, defaultValue) {
  let val = window.localStorage && localStorage.getItem(key);
  if (typeof val === "undefined" || val === null) {
    return defaultValue;
  }
  return JSON.parse(val);
};

/**
 * Set a JSON object to localStorage, if available.
 *
 * @param {string} key - The key to set the value to in local storage.
 * @param {string} val - The value to stringify and place in local storage.
 * @return {object|undefined} The given value parameter (for chaining).
 */
module.exports.lsSet = function(key, val) {
  if (window.localStorage) {
    localStorage.setItem(key, JSON.stringify(val));
  }
  return val;
};

/**
 * Escape all regular expression special characters in the given string, making
 * it suitable to interpolate into regular expressions.
 *
 * @param {string} str - The string to interpolate
 * @return {string} The quoted string
 */
module.exports.quoteRe = function(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

