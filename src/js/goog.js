var utils = require("./utils");
var options = require("./options");
var superagent = require("superagent");
var moment = require("moment");
var _ = require("lodash");

var spreadsheetsBase = "https://spreadsheets.google.com";
var spreadsheetsProxyBase = options.spreadsheetsCorsProxy || spreadsheetBase;

var URLS = {
  'oauth': "https://accounts.google.com/o/oauth2/auth",
  'worksheetFeed': spreadsheetsProxyBase + '/feeds/worksheets/SPREADSHEET_ID/private/full',
  'rowsFeed': spreadsheetsProxyBase + '/feeds/list/SPREADSHEET_ID/WORKSHEET_ID/private/full',
  'profile': 'https://www.googleapis.com/plus/v1/people/me',
  'shortener': 'https://www.googleapis.com/urlshortener/v1/url'
};

/** Authorization scopes for Google */
var SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://spreadsheets.google.com/feeds",
  "https://www.googleapis.com/auth/plus.me",
  "https://www.googleapis.com/auth/urlshortener"
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
      var scripts = document.getElementsByTagName("script");
      var curScript = scripts[scripts.length - 1];
      var gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/client.js?onload=gapiBootstrapCallback";
      gapiScript.async = false;
      curScript.parentNode.insertBefore(gapiScript, curScript.nextSibling);
    } else {
      resolve();
    }
  });
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
          console.log("auth: error:", authResult.error);
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
};

module.exports.shortenUrl = function(longUrl) {
  return new Promise(function(resolve, reject) {
    var token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    superagent.post(URLS.shortener + "?access_token=" + token.access_token + "&alt=json")
      .send({longUrl: longUrl})
      .end(function(err, res) {
        console.log(err, res);
        if (err) {
          return reject(err);
        }
        try {
          var data = JSON.parse(res.text)
          return resolve(data.id);
        } catch (e) {
          return reject(e);
        }
      });
  });
};

module.exports.getUserProfile = function() {
  return new Promise(function(resolve, reject) {
    var token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    superagent.get(URLS.profile + "?access_token=" + token.access_token + "&alt=json")
      .end(function(err, res) {
        if (err) {
          return reject(err);
        }
        try {
          var profile = JSON.parse(res.text);
          return resolve(profile);
        } catch (e) {
          return reject(e);
        }
      });
  });
};

/**
 * Show a popup window which prompts the user to authorize their google account
 * for {@link SCOPES}. 
 *
 * @return {Promise} A promise which resolves with the auth token once the user
 * has logged in.
 */
module.exports.popupLogin = function(redirectUriBase) {
  return new Promise(function(resolve, reject) {
    var e = encodeURIComponent;
    redirectUriBase = redirectUriBase || document.URL;
    var redirectUri = redirectUriBase +
      (redirectUriBase.indexOf("?") === -1 ? "?" : "&") + options.redirectParam;
    
    var oauthUrl = URLS.oauth +
        "?scope=" + e(SCOPES.join(" ")) +
        "&redirect_uri=" + e(redirectUri) +
        "&client_id=" + e(options.clientId) +
        "&response_type=token";
    var win = window.open(oauthUrl);
    var pollTimer = setInterval(function() {
      var popupUrl;
      try {
        popupUrl = win.document.URL;
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
};

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
};
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
};

// Attempt to parse a date of whatever format seen in a google spreadsheet.
// Note that this will raise a warning from moment as it falls back to ``new
// Date`` as a constructor.  This is OK.
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
 * ``{rows: {Array}, worksheetId: {string}, title: {string}, permissions: {object}``
 */
module.exports.fetchSpreadsheet = function(spreadsheetId) {
  var data = {};
  return module.exports.getFilePermissions(spreadsheetId).then(function(perms) {
    return module.exports.getWorksheetInfo(spreadsheetId);
  }).then(function(worksheetInfo) {
    _.extend(data, worksheetInfo);
    return module.exports.getWorksheetRows(spreadsheetId, data.worksheetId);
  }).then(function(rowInfo) {
    _.extend(data, rowInfo); 
    return data;
  });
};

/**
 * Get the list of permissions for the given drive file.
 *
 * @param {string} fileId - The ID of the file for which to retrieve permissions.
 * @return {Promise} A promise which resolves with an object containing:
 * ``{permissions: {Object}}``
 */
module.exports.getFilePermissions = function(fileId) {
  return new Promise(function(resolve, reject) {
    gapi.client.load("drive", "v2", function() {
      var req = gapi.client.drive.permissions.list({'fileId': fileId});
      req.execute(function(res) {
        return resolve({permissions: res.items});
      });
    });
  });
};

/**
 * Fetch the first worksheet ID and spreadsheet title for the given spreadsheet.
 * @param {string} spreadsheetId - The ID of the spreadsheet to retrieve.
 * @return {Promise} A promise which resolves with an object containing:
 * ``{worksheetId: {string}, title: {string}}``
 */
module.exports.getWorksheetInfo = function(spreadsheetId) {
  return new Promise(function(resolve, reject) {
    var token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    var url = URLS.worksheetFeed.replace("SPREADSHEET_ID", spreadsheetId) +
        "?access_token=" + token.access_token + "&alt=json";

    superagent.get(url, function(res) {
      if (res.status !== 200) {
        return reject(res);
      }
      var data;
      try {
        data = JSON.parse(res.text);
      } catch (e) {
        return reject(e);
      }
      var parts = data.feed.entry[0].id.$t.split("/");
      resolve({
        worksheetId: parts[parts.length - 1],
        title: data.feed.title.$t
      });
    });
  });
};

/**
 * Fetch the row data for the given worksheet.
 * @param {string} spreadsheetId - the ID of the spreadsheet to retrieve.
 * @param {string} worksheetId - the ID of the worksheet within that spreadsheet.
 * @return {Promise} A promise which resolves with an object containing:
 * ``{rows: {Array}}``
 */
module.exports.getWorksheetRows = function(spreadsheetId, worksheetId) {
  return new Promise(function(resolve, reject) {
    var token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    var url = URLS.rowsFeed
        .replace("SPREADSHEET_ID", spreadsheetId)
        .replace("WORKSHEET_ID", worksheetId) +
        "?access_token=" + token.access_token + "&alt=json";
    superagent.get(url, function(res) {
      try {
        var data = JSON.parse(res.text);
        return resolve({rows: _.map(data.feed.entry, _spreadsheetRowToObj)});
      } catch (e) {
        return reject(e);
      }
    });
  });
};

function _spreadsheetRowToObj(row) {
  var rowObj = {};
  COLUMNS.forEach(function(col) {
    rowObj[col] = row["gsx$" + col].$t;
  });
  rowObj.id = row.id.$t;
  rowObj._version = _.find(row.link, function(l) { return l.rel === "edit"; }).href;
  return rowObj;
}

function _columnXml(rowObj) {
  return _.map(COLUMNS, function(column) {
    return "<gsx:" + column + ">" + (rowObj[column] || "") + "</gsx:" + column + ">";
  }).join("\n");
}

function _entryXml(contents) {
  return "<entry xmlns='http://www.w3.org/2005/Atom' xmlns:gsx='http://schemas.google.com/spreadsheets/2006/extended'>" + contents + "</entry>";
}

module.exports.editSpreadsheetRow = function(spreadsheetId, worksheetId, rowObj) {
  return new Promise(function(resolve, reject) {
    var token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    // Build XML resource.
    var columns = _columnXml(rowObj);
    var xmlResource = _entryXml("<id>" + rowObj.id + "</id>" + columns);

    // Find the edit URL.
    // ... but we need to run it through our CORS proxy.
    var url = rowObj._version.replace(spreadsheetsBase, spreadsheetsProxyBase);
    url += "?alt=json";


    superagent.put(url)
      .set("content-type", "application/atom+xml")
      .set("Authorization", "Bearer " + token.access_token)
      .send(xmlResource)
      .end(function(err, res) {
        if (err) {
          return reject(err);
        }
        return resolve(_spreadsheetRowToObj(res.body.entry));
      });
  });
};

module.exports.addSpreadsheetRow = function(spreadsheetId, worksheetId, rowObj) {
  return new Promise(function(resolve, reject) {
    var token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    // We need at least one property to be non-blank.
    if (!rowObj.startdate) {
      rowObj.startdate = moment().format('YYYY-MM-DD');
    }
    var columns = _columnXml(rowObj);
    var xmlResource = _entryXml(columns);
    var url = URLS.rowsFeed
        .replace("SPREADSHEET_ID", spreadsheetId)
        .replace("WORKSHEET_ID", worksheetId)
        .replace(spreadsheetsBase, spreadsheetsProxyBase) +
        "?alt=json";

    superagent.post(url)
      .set("content-type", "application/atom+xml")
      .set("Authorization", "Bearer " + token.access_token)
      .send(xmlResource)
      .end(function(err, res) {
        if (err) {
          return reject(err);
        }
        return resolve(_spreadsheetRowToObj(res.body.entry));
      });
  });
};

module.exports.deleteSpreadsheetRow = function(spreadsheetId, worksheetId, rowObj) {
  return new Promise(function(resolve, reject) {
    var token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    var url = rowObj._version
      .replace(spreadsheetsBase, spreadsheetsProxyBase) + "?&alt=json";
    superagent.del(url)
        .set("Authorization", "Bearer " + token.access_token)
        .end(function(err, res) {
          if (err) {
            return reject(err);
          }
          return resolve(res);
        });

  });
};
