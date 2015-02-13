var utils = require("./utils");
var options = require("./options");
var request = require("superagent");
var _ = require("lodash");

var URLS = {
  'oauth': "https://accounts.google.com/o/oauth2/auth",
  'worksheetFeed': 'https://spreadsheets.google.com/feeds/worksheets/SPREADSHEET_ID/private/full',
  'rowsFeed': 'https://spreadsheets.google.com/feeds/list/SPREADSHEET_ID/WORKSHEET_ID/private/full'
}
 

/** Authorization scopes for Google */
var SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://spreadsheets.google.com/feeds"
];

/** Spreadsheet column names and order */
var COLUMNS = [
  "startdate", "enddate", "headline", "text",
  "media", "mediacredit", "mediathumbnail",
  "type", "tag"
];


/**
 * Load the google api script by inserting a script tag into the DOM.  Returns
 *
 * @return {Promise} A promise which resolves when ``window.gapi`` is fully
 * loaded and available.
 */
module.exports.bootstrap = function() {
  return new Promise(function(resolve, reject) {
    if (typeof gapi === "undefined") {
      window.gapiBootstrapCallback = function() {
        window.gapiBootstrapCallback = null;
        resolve();
      };
      var scripts = document.getElementsByTagName("script")
      var curScript = scripts[scripts.length - 1];
      var gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/client.js?onload=gapiBootstrapCallback";
      gapiScript.async = false;
      curScript.parentNode.insertBefore(gapiScript, curScript.nextSibling);
    } else {
      resolve();
    }
  })
};

/**
 * Attempt to authorize the current session for {@link SCOPES}. Returns a
 * promise which resolves with the auth token, if any, or false
 * if the user is not authenticated.
 *
 * @return {Promise} A promise which resolves with the auth token, if any, or
 * false if the user is not authenticated.
 */
module.exports.authorize = function() {
  return new Promise(function(resolve, reject) {
    gapi.auth.authorize({
      "client_id": options.clientId,
      "scope": SCOPES.join(" "),
      "immediate": true,
    }, function(authResult) {
      if (authResult) {
        if (authResult.error) {
          console.log("auth: error:", authResult.error)
        } else {
          console.log("auth: authenticated");
        }
      } else {
        console.log("auth: none");
      }
      if (authResult && !authResult.error) {
        // We are logged in.
        resolve(gapi.auth.getToken());
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Show a popup window which prompts the user to authorize their google account
 * for {@link SCOPES}. 
 *
 * @return {Promise} A promise which resolves with the auth token once the user
 * has logged in.
 */
module.exports.popupLogin = function() {
  return new Promise(function(resolve, reject) {
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
          return reject(new Error("Missing token parameters: " + url));
        }
        gapi.auth.setToken(token);
        resolve(token);
        win.close();
      }
    }, 100);
  });
};

/**
 * Create a copy of the given spreadsheet, publish it, and set its permissions
 * to allow anyone to edit it.
 *
 * @param {string} title - The titel to give to the copied spreadsheet.
 * @param {string} link - A google spreadsheet link or standalone timeline link
 * which identifies the source spreadsheet to duplicate. If ommitted, the default
 * spreadsheet defined in options will be used.
 */
module.exports.duplicateTemplate = function(title, templateId) {
  var spreadsheetRes;
  return new Promise(function(resolve, reject) {
    gapi.client.load('drive', 'v2', function() {
      var req = gapi.client.drive.files.copy({
        fileId: templateId || options.templateId,
        resource: {
          "description": "Timeline JS template copy",
          "labels.restricted": false,
          "title": title,
          "writersCanShare": true
        }
      });
      req.execute(function(res) {
        console.log("spreadsheet", res);
        spreadsheetRes = res;
        resolve(res);
      });
    });
  }).then(function(res) {
    return module.exports.publishSpreadsheet(spreadsheetRes.id);
  }).then(function(res) {
    return module.exports.addAnyoneCanEdit(spreadsheetRes.id);
  }).then(function() {
    return spreadsheetRes;
  });
}

/**
 * Set a given spreadsheet to be "Published to the web", so that it can be
 * retrieved by unauthenticated users for use as the data source for a timeline. 
 *
 * @param {string} spreadsheetId - The google file ID for the spreadsheet to
 * publish.
 * @returns {Promise} A promise which is resolved when the spreadsheet's permissions
 * have been updated.
 */
module.exports.publishSpreadsheet = function(spreadsheetId) {
  return new Promise(function(resolve, reject) {
    gapi.client.load('drive', 'v2', function() {
      var req = gapi.client.drive.revisions.update({
        fileId: spreadsheetId,
        revisionId: "head",
        resource: {
          published: true,
          publishAuto: true
        }
      });
      req.execute(resolve);
    });
  });
};

/**
 * Set a given spreadsheet's permissions such that anyone can edit it.
 *
 * @param {string} spreadsheetId - The ID of the spreadsheet to set permissions for.
 * @returns {Promise} A promise which is resolved when the spreadsheet's permissions
 * have been updated.
 */
module.exports.addAnyoneCanEdit = function(spreadsheetId) {
  return new Promise(function(resolve, reject) {
    gapi.client.load('drive', 'v2', function() {
      var req = gapi.client.drive.permissions.insert({
        fileId: spreadsheetId,
        resource: {
          id: "anyone",
          type: "anyone",
          role: "writer",
        }
      });
      req.execute(resolve);
    });
  });
}
/**
 * Remove "anyone can edit" permissions for the given spreadsheet by altering
 * the "anyone" role to "reader" status.
 *
 * @param {string} spreadsheetId - The ID of the spreadsheet to set permissions for.
 * @returns {Promise} A promise which is resolved when the spreadsheet's permissions
 * have been updated.
 */
module.exports.removeAnyoneCanEdit = function(spreadsheetId) {
  return new Promise(function(resolve, reject) {
    gapi.client.load('drive', 'v2', function() {
      var req = gapi.client.drive.permissions.update({
        fileId: spreadsheetId,
        id: "anyone",
        type: "anyone",
        role: "reader",
      });
      req.execute(resolve);
    });
  });
}

// Attempt to parse a date of whatever format seen in a google spreadsheet.
var parseDate = function(str) {
  if (!(str.trim && str.trim())) {
    return null;
  }
  var formats = [undefined, "MM-DD-YYY"];
  for (var i = 0; i < formats.length; i++) {
    var d = moment(str, formats[i]);
    if (d.isValid()) {
      return d;
    }
  }
  return null;
};

/**
 * Fetch data including rows, worksheets, and permissions for the given
 * spreadsheet.
 *
 * @param {string} spreadsheetId - The ID of the spreadsheet to retrieve.
 * @return {Promise} A promise which resolves with an object containing:
 * ``{rows: {Array}, worksheetId: {string}, permissions: {object}``
 */
module.exports.fetchSpreadsheet = function(spreadsheetId) {
  return new Promise(function(resolve, reject) {
    var token = gapi.auth.getToken();
    if (!token) {
      return reject(new Error("Not authenticated"))
    }
    var worksheetId = null;
    var title = null;
    var fmtUrl = function(url) {
      return url
        .replace("SPREADSHEET_ID", spreadsheetId)
        .replace("WORKSHEET_ID", worksheetId) +
          "?access_token=" + token.access_token + "&alt=json";
    };
    request.get(fmtUrl(URLS.worksheetFeed), function(res) {
      var data = JSON.parse(res.text);
      // This is strange -- the value in "feed.entry[0].content" looks like the
      // worksheet ID, but doesn't appear to function as it. (Is it the worksheet
      // title?) The actual ID of the worksheet appears to only offered as a URL,
      // with the id part the last componnet of the path.  Parse out the ID.
      console.log("worksheetFeed:", data);
      var parts = data.feed.entry[0].id.$t.split("/");
      worksheetId = parts[parts.length - 1];
      title = data.feed.title.$t;

      // Now that we have the worksheet ID, fetch the rows in the spreadsheet.
      request.get(fmtUrl(URLS.rowsFeed), function(res) {
        try {
          var data = JSON.parse(res.text);
          console.log("rowsFeed:", data);
          var rows = _.map(data.feed.entry, function(row) {
            var rowObj = {};
            _.each(COLUMNS, function(col) {
              rowObj[col] = row["gsx$" + col].$t;
            });
            return rowObj;
          });
        } catch (e) {
          return reject(e);
        }
        return resolve({rows: rows, worksheetId: worksheetId, title: title});
      });
    });
  });
}
