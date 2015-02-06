var utils = require("./utils");
var options = require("./options");

// Google config:
var GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/auth";
var GOOGLE_VALIDATION_URL = "https://www.googleapis.com/oauth2/v1/tokeninfo";
var GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://spreadsheets.google.com/feeds"
];

module.exports.bootstrap = function(callback) {
  // Load the gapi script.
  if (typeof gapi === "undefined") {
    if (callback) {
      window.gapiBootstrapCallback = function() {
        window.gapiBootstrapCallback = null;
        callback();
      };
    }
    var scripts = document.getElementsByTagName("script")
    var curScript = scripts[scripts.length - 1];
    var gapiScript = document.createElement("script");
    gapiScript.src = "https://apis.google.com/js/client.js?onload=gapiBootstrapCallback";
    gapiScript.async = false;
    curScript.parentNode.insertBefore(gapiScript, curScript.nextSibling);
  } else {
    callback && callback();
  }
};

module.exports.authorize = function(callback) {
  gapi.auth.authorize({
    "client_id": options.clientId,
    "scope": GOOGLE_SCOPES.join(" "),
    "immediate": true
  }, function(authResult) {
    console.log(authResult && authResult.error);
    if (authResult && !authResult.error) {
      // We are logged in.
      callback(null, gapi.auth.getToken());
    } else {
      callback(null, false);
    }
  });
}

module.exports.popupLogin = function(callback) {
  var e = encodeURIComponent
  var redirectUri = document.URL +
    (document.URL.indexOf("?") === -1 ? "?" : "&") + options.redirectParam;
  var oauthUrl = GOOGLE_OAUTH_URL +
      "?scope=" + e(GOOGLE_SCOPES.join(" ")) +
      "&redirect_uri=" + e(redirectUri) +
      "&client_id=" + e(options.clientId) +
      "&response_type=token";
  var win = window.open(oauthUrl);
  var pollTimer = setInterval(function() {
    try {
      var popupUrl = win.document.URL;
    } catch (e) {
      // will throw error as long as the URL is on Google's domain.
      return;
    }

    if (popupUrl.indexOf(redirectUri) !== -1) {
      clearInterval(pollTimer);
      var url = win.document.URL;
      var hash = url.split("#")[1] || "";
      var params = utils.decodeParams(hash);

      var token = {
        access_token: params.access_token,
        token_type: params.token_type,
        expires_in: params.expires_in
      };
      if (!(token.access_token && token.token_type && token.expires_in)) {
        return callback(new Error("Missing token parameters: " + url));
      }
      gapi.auth.setToken(token);
      callback(null, token);
      win.close();
    }
  }, 100);
};

module.exports.duplicateTemplate = function() {
  gapi.client.load('drive', 'v2', function() {
    var req = gapi.client.drive.files.copy({
      fileId: TIMELINE_JS_TEMPLATE_ID,
      resource: {
        "description": "Timeline JS template copy",
        "labels.restricted": false,
        "parents": ["timelines"],
        "title": "Timeline JS template copy " + new Date(),
        "writersCanShare": true
      }
    });
    req.execute(function(res) {
      console.log("Copy ID: ", res.id);
      console.log(res);
    });
  });
}
