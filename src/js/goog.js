var utils = require("./utils");
var options = require("./options");
var request = require("superagent");
var _ = require("lodash");

var URLS = {
  'oauth': "https://accounts.google.com/o/oauth2/auth",
  'worksheetFeed': 'https://spreadsheets.google.com/feeds/worksheets/SPREADSHEET_ID/private/full',
  'rowsFeed': 'https://spreadsheets.google.com/feeds/list/SPREADSHEET_ID/WORKSHEET_ID/private/full'
}
var SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://spreadsheets.google.com/feeds"
];

var COLUMNS = [
  "startdate", "enddate", "headline", "text",
  "media", "mediacredit", "mediathumbnail",
  "type", "tag"
]

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
    "scope": SCOPES.join(" "),
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
  var oauthUrl = URLS.oauth +
      "?scope=" + e(SCOPES.join(" ")) +
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

module.exports.duplicateTemplate = function(title, callback) {
  gapi.client.load('drive', 'v2', function() {
    var req = gapi.client.drive.files.copy({
      fileId: options.templateId,
      resource: {
        "description": "Timeline JS template copy",
        "labels.restricted": false,
        "title": title,
        "writersCanShare": true
      }
    });
    req.execute(function(res) {
      console.log("Copy ID: ", res.id);
      console.log(res);
      module.exports.publishSpreadsheet(res.id, function() {
        callback(res);
      });
    });
  });
}

module.exports.publishSpreadsheet = function(spreadsheetId, callback) {
  gapi.client.load('drive', 'v2', function() {
    var req = gapi.client.drive.revisions.update({
      fileId: spreadsheetId,
      revisionId: "head",
      resource: {
        published: true,
        publishAuto: true
      }
    });
    req.execute(callback);
  });
};

module.exports.fetchSpreadsheet = function(spreadsheetId, callback) {
  var token = gapi.auth.getToken();
  var worksheetId = null;
  var fmtUrl = function(url) {
    return url
      .replace("SPREADSHEET_ID", spreadsheetId)
      .replace("WORKSHEET_ID", worksheetId) +
        "?access_token=" + token.access_token + "&alt=json";
  };
  request.get(fmtUrl(URLS.worksheetFeed), function(res) {
    var data = JSON.parse(res.text);
    var parts = data.feed.entry[0].id.$t.split("/");
    worksheetId = parts[parts.length - 1];
    request.get(fmtUrl(URLS.rowsFeed), function(res) {
      try {
        var data = JSON.parse(res.text);
        var rows = _.map(data.feed.entry, function(row) {
          return _.map(COLUMNS, function(col) { return row["gsx$" + col].$t; });
        });
      } catch (e) {
        return callback(e);
      }
      callback(null, rows);
    });
  });
}
