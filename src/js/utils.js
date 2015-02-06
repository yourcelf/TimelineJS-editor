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
