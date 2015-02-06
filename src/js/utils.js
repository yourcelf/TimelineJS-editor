// Parse url query params from the given querystring.
module.exports.decodeParams = function(query) {
  var match,
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); };

  var params = {};
  while (match = search.exec(query)) {
     params[decode(match[1])] = decode(match[2]);
  }
  return params;
}
// Hash of the current page's query params.
module.exports.urlParams = module.exports.decodeParams(window.location.search.substring(1));

module.exports.lsGet = function(key, defaultValue, opts) {
  var val = window.localStorage && localStorage.getItem(key);
  if (typeof val === "undefined") {
    return defaultValue;
  }
  if (opts && opts.json) {
    return JSON.parse(val);
  }
  return val;
};
module.exports.lsSet = function(key, val) {
  var str = typeof val === "string" ? val : JSON.stringify(val);
  window.localStorage && localStorage.setItem(key, str);
  return val;
};
