"use strict";
/*global gapi*/
const utils = require("./utils");
const options = require("./options");
const superagent = require("superagent");
const moment = require("moment");
const _ = require("lodash");

const spreadsheetsBase = "https://spreadsheets.google.com";
const spreadsheetsProxyBase = options.spreadsheetsCorsProxy || spreadsheetsBase;

/** URLs endpoints for API requests. */
const URLS = {
  'oauth': "https://accounts.google.com/o/oauth2/auth",
  'worksheetFeed': spreadsheetsProxyBase + '/feeds/worksheets/SPREADSHEET_ID/private/full',
  'cellsFeed': spreadsheetsProxyBase + '/feeds/cells/SPREADSHEET_ID/WORKSHEET_ID/private/full',
  'rowsFeed': spreadsheetsProxyBase + '/feeds/list/SPREADSHEET_ID/WORKSHEET_ID/private/full',
  'profile': 'https://www.googleapis.com/plus/v1/people/me',
  'shortener': 'https://www.googleapis.com/urlshortener/v1/url'
};

/** Authorization scopes for Google */
const SCOPES = [
  // For the creation and permission setting of spreadsheets
  "https://www.googleapis.com/auth/drive",
  // For row read, update and delete operations
  "https://spreadsheets.google.com/feeds",
  // For getting users' names, used in new row creation
  "https://www.googleapis.com/auth/plus.me",
  // For creating short URLs for spreadsheet editing screens
  "https://www.googleapis.com/auth/urlshortener"
];

/** Spreadsheet column names and order */
const COLUMNS = [
  "startdate", "enddate", "headline", "text",
  "media", "mediacredit", "mediathumbnail",
  "type", "tag"
];

// Convert the given row object from what the Google Spreadsheets API gives us
// to something a little more readable.
function _spreadsheetRowToObj(row) {
  let rowObj = {};
  COLUMNS.forEach(function(col) {
    rowObj[col] = row["gsx$" + col].$t;
  });
  rowObj.id = row.id.$t;
  let editLink = _.find(row.link, function(l) { return l.rel === "edit"; });
  rowObj._version = editLink ? editLink.href : undefined;
  return rowObj;
}

// Generate inner <entry> XML for the columns in the given row object.
function _columnXml(rowObj) {
  return _.map(COLUMNS, function(column) {
    return "<gsx:" + column + ">" + _.escape(rowObj[column] || "") + "</gsx:" + column + ">";
  }).join("\n");
}

// Wrap the given contents in the namespaced <entry> tags used by the spreadsheet API.
function _entryXml(contents) {
  return "<entry xmlns='http://www.w3.org/2005/Atom' xmlns:gsx='http://schemas.google.com/spreadsheets/2006/extended'>" + contents + "</entry>";
}

// Return the batch XML for setting a spreadsheet's header. Reference: https://developers.google.com/google-apps/spreadsheets/data#update_multiple_cells_with_a_batch_request
function _headerRowBatchXML(url) {
  url = url.replace(spreadsheetsProxyBase, spreadsheetsBase);
  let entries = _.map(COLUMNS, function(column, i) {
    return `<entry>
      <batch:id>A${i + 1}</batch:id>
      <batch:operation type="update" />
      <id>${url}/R1C${i + 1}</id>
      <link rel="edit" type="application/atom+xml" href="${url}/R1C${i + 1}" />
      <gs:cell row="1" col="${i + 1}" inputValue="${column}" />
    </entry>`;
  });

  return `<feed xmlns="http://www.w3.org/2005/Atom"
        xmlns:batch="http://schemas.google.com/gdata/batch"
        xmlns:gs="http://schemas.google.com/spreadsheets/2006">
    <id>${url}</id>
    ${entries.join("\n")}
  </feed>`;
}



/**
 * Load the google api script by inserting a script tag into the DOM.
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
      let scripts = document.getElementsByTagName("script");
      let curScript = scripts[scripts.length - 1];
      let gapiScript = document.createElement("script");
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
      "client_id": options.googleClientId,
      "scope": SCOPES.join(" "),
      "immediate": true
    }, function(authResult) {
      if (authResult) {
        if (authResult.error) {
          console.log("auth: error:", authResult.error);
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

/**
 * Given a long URL, create a short URL.
 *
 * @param {string} longUrl - the long URL to shorten
 * @return {Promise} A promise which resolves with the shortened URL as a string.
 */
module.exports.shortenUrl = function(longUrl) {
  return new Promise(function(resolve, reject) {
    let token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    superagent.post(URLS.shortener + "?access_token=" + token.access_token + "&alt=json")
      .send({longUrl: longUrl})
      .end(function(err, res) {
        if (err) {
          return reject(err);
        }
        try {
          let data = JSON.parse(res.text);
          return resolve(data.id);
        } catch (e) {
          return reject(e);
        }
      });
  });
};

/**
 * Fetch the user profile info for the currently authorized Google user.
 *
 * @return {Promise} A promise which resolves with an object containing the
 * user profile.
 */
module.exports.getUserProfile = function() {
  return new Promise(function(resolve, reject) {
    let token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    superagent.get(URLS.profile + "?access_token=" + token.access_token + "&alt=json")
      .end(function(err, res) {
        if (err) {
          return reject(err);
        }
        try {
          let profile = JSON.parse(res.text);
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
    let e = encodeURIComponent;
    redirectUriBase = redirectUriBase || document.URL;
    let redirectUri = redirectUriBase +
      (redirectUriBase.indexOf("?") === -1 ? "?" : "&") + options.redirectParam;

    let oauthUrl = URLS.oauth +
        "?scope=" + e(SCOPES.join(" ")) +
        "&redirect_uri=" + e(redirectUri) +
        "&client_id=" + e(options.googleClientId) +
        "&response_type=token";
    let win = window.open(oauthUrl);
    let pollTimer = setInterval(function() {
      let popupUrl;
      try {
        popupUrl = win.document.URL;
      } catch (e) {
        // will throw error as long as the URL is on Google's domain.
        return;
      }

      if (popupUrl.indexOf(redirectUri) !== -1) {
        clearInterval(pollTimer);
        let url = win.document.URL;
        let hash = url.split("#")[1] || "";
        let params = utils.decodeParams(hash);

        /* eslint-disable camelcase */
        // Better to consistently use the external API's convention than to
        // appease strictness of eslint.
        let token = {
          access_token: params.access_token,
          token_type: params.token_type,
          expires_in: params.expires_in
        };
        /* eslint-enable camelcase */
        if (!(token.access_token && token.token_type && token.expires_in)) {
          reject(new Error("Missing token parameters: " + url));
          return;
        }
        gapi.auth.setToken(token);
        resolve(token);
        win.close();
      }
    }, 100);
  });
};

/**
 * Write the header row to a spreadsheet with TimelineJS column values.
 * @param {String} spreadsheetId - The ID of the spreadshet to write to
 * @param {String} worksheetId - The ID of the worksheet in the spreadsheet to
 * write to
 * @return {Promise} A promise resolving to the HTTP response for the header
 * write operation.
 */
module.exports.writeWorksheetHeader = function(spreadsheetId, worksheetId) {
  let url = URLS.cellsFeed.replace("SPREADSHEET_ID", spreadsheetId)
                          .replace("WORKSHEET_ID", worksheetId);
  let token = gapi.auth.getToken();
  return new Promise(function(resolve, reject) {
    let xml = _headerRowBatchXML(url);
    // Must add the "If-Match: *" header to avoid version complaints from the
    // API.  We can't get versions for not-yet-existent cells; this seems to be
    // the easiest way to relax that constraint.
    // Ref: http://stackoverflow.com/q/22719170/85461
    superagent.post(`${url}/batch`)
      .set("content-type", "application/atom+xml")
      .set("Authorization", "Bearer " + token.access_token)
      .set("If-Match", "*")
      .send(xml)
      .end(function(err, res) {
        if (err) {
          return reject(err);
        } else if (res.text.indexOf("Error") !== -1) {
          console.log(res);
          return reject(res);
        }
        return resolve(res);
      });
  });
};

/**
 * Create a new spreadsheet for timelines.
 * @param {String} title - The title to give to the new spreadsheet.
 * @param {String} templateId - (optional) If given, will copy the contents of
 * templateId into the new spreadsheet.
 */
module.exports.createSpreadsheet = function(title, templateId) {
  let newFileId;
  let worksheetId;
  return new Promise(function(resolve, reject) {
    // Create a new empty file.
    console.log("Creating new empty file");
    gapi.client.load('drive', 'v2', function() {
      let req = gapi.client.drive.files.insert({
        'mimeType': 'application/vnd.google-apps.spreadsheet',
        'title': title
      });
      req.execute(function(res) {
        newFileId = res.id;
        console.log("New file ID", newFileId);
        if (res.code === 500) {
          reject(res);
        } else {
          resolve(res);
        }
      });
    });
  }).then(function(res) {
    console.log("Created:", res);
    // Fetch the worksheet info.
    return module.exports.getWorksheetInfo(newFileId);
  }).then(function(res) {
    console.log("Worksheet info:", res);
    worksheetId = res.worksheetId;
    // Write the header to that file.
    return module.exports.writeWorksheetHeader(newFileId, worksheetId);
  }).then(function(res) {
    console.log("Header written:", res);
    if (templateId) {
      // Copy in the rows.
      return module.exports.fetchSpreadsheet(templateId).then(function(data) {
        let promises = data.rows.map(function(row) {
          return module.exports.addSpreadsheetRow(newFileId, worksheetId, row);
        });
        return Promise.all(promises);
      });
    } else {
      // Write an example row.
      return module.exports.addSpreadsheetRow(newFileId, worksheetId, {
        startdate: moment().format('MM/DD/YYYY'),
        headline: "Example entry",
        text: "Delete this entry when you've added more.",
        media: "https://i.imgur.com/PEH4mJW.jpg"
      });
    }
  }).then(function(res) {
    console.log("Rows added:", res);
    // Publish it.
    return module.exports.publishSpreadsheet(newFileId);
  }).then(function(res) {
    console.log("Published:", res);
    // Liberalize perms.
    return module.exports.addAnyoneCanEdit(newFileId);
  }).then(function(res) {
    console.log("Permissioned:", res);
    return newFileId;
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
      let req = gapi.client.drive.revisions.update({
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
      let req = gapi.client.drive.permissions.insert({
        fileId: spreadsheetId,
        resource: {
          id: "anyone",
          type: "anyone",
          role: "writer"
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
    console.log(spreadsheetId);
    gapi.client.load('drive', 'v2', function() {
      try {
        let req = gapi.client.drive.permissions.update({
          fileId: spreadsheetId,
          permissionId: "anyone",
          type: "anyone",
          role: "reader"
        });
        req.execute(function(res) {
          if (!(res.role === "reader" && res.id === "anyone")) {
            return reject(res);
          }
          return resolve(res);
        });
      } catch (e) {
        reject(e);
      }
    });
  });
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
  let data = {};
  return module.exports.getFilePermissions(spreadsheetId).then(function(perms) {
    _.extend(data, perms);
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
      let req = gapi.client.drive.permissions.list({'fileId': fileId});
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
    let token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    let url = URLS.worksheetFeed.replace("SPREADSHEET_ID", spreadsheetId) +
        "?access_token=" + token.access_token + "&alt=json";

    superagent.get(url, function(err, res) {
      if (err) {
        return reject(err);
      }
      if (res.status !== 200) {
        return reject(res);
      }
      let data;
      //console.log(res.text);
      try {
        data = JSON.parse(res.text);
      } catch (e) {
        return reject(e);
      }
      let parts = data.feed.entry[0].id.$t.split("/");
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
    let token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    let url = URLS.rowsFeed
        .replace("SPREADSHEET_ID", spreadsheetId)
        .replace("WORKSHEET_ID", worksheetId) +
        "?access_token=" + token.access_token + "&alt=json";
    superagent.get(url, function(err, res) {
      if (err) {
        return reject(err);
      }
      try {
        let data = JSON.parse(res.text);
        return resolve({rows: _.map(data.feed.entry, _spreadsheetRowToObj)});
      } catch (e) {
        return reject(e);
      }
    });
  });
};

/**
 * Update the spreadsheet with the given changed row.
 *
 * @param {object} rowObj - Row with the updates to be published.
 * @return {Promise} A promise which when fulfilled contains the new row object
 * saved by the server.
 */
module.exports.editSpreadsheetRow = function(rowObj) {
  return new Promise(function(resolve, reject) {
    let token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    // Build XML resource.
    let columns = _columnXml(rowObj);
    let xmlResource = _entryXml("<id>" + rowObj.id + "</id>" + columns);

    // Find the edit URL.
    // ... but we need to run it through our CORS proxy.
    let url = rowObj._version.replace(spreadsheetsBase, spreadsheetsProxyBase);
    url += "?alt=json";


    superagent.put(url)
      .set("content-type", "application/atom+xml")
      .set("Authorization", "Bearer " + token.access_token)
      .send(xmlResource)
      .end(function(err, res) {
        if (err) {
          return reject(err);
        }
        try {
          return resolve(_spreadsheetRowToObj(res.body.entry));
        } catch (e) {
          console.log(res);
          return reject(e);
        }
      });
  });
};

/**
 * Add a row to the given spreadsheet in the given workshet.
 *
 * @param {string} spreadsheetId - the ID of the spreadsheet to modify
 * @param {string} worksheetId - the ID of the worksheet within the spreadsheet
 * @param {object} rowObj - values for the new row
 * @return {Promise} A promise which, when fulfilled, contains the new row as
 * confirmed by the server.
 */
module.exports.addSpreadsheetRow = function(spreadsheetId, worksheetId, rowObj) {
  return new Promise(function(resolve, reject) {
    let token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    // We need at least one property to be non-blank.
    if (!rowObj.startdate) {
      rowObj.startdate = moment().format('MM/DD/YYYY');
    }
    let columns = _columnXml(rowObj);
    let xmlResource = _entryXml(columns);
    let url = URLS.rowsFeed
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
        try {
          return resolve(_spreadsheetRowToObj(res.body.entry));
        } catch(e) {
          console.log(res);
          return reject(e);
        }
      });
  });
};

/**
 * Delete the given row from its spreadsheet.
 *
 * @param {object} rowObj - the row object to remove.
 * @return {Promise} A promise which when fulfilled confirms that the row has
 * been deleted.
 */
module.exports.deleteSpreadsheetRow = function(rowObj) {
  return new Promise(function(resolve, reject) {
    let token = gapi.auth.getToken();
    if (!token) { return reject(new Error("Not authenticated")); }

    let url = rowObj._version
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
