"use strict";
/** @module */
require("es6-promise").polyfill();
var options = require("./options");
var _ = require("lodash");

/**
 * Main entrypoint for bootstrapping the Media History Timeline editor.
 * Attaches a react component to the specified div, which will contain the full
 * editor within the context of the current page.
 *
 * @param {object} opts - Options for the editor. Available options are:
 *  - ``div``: {string|DOM element} (required). The DOM element or ID of a DOM
 *    element to which to attach the editor.
 *  - ``googleClientId``: {string} (required). The Google Developer Account client ID
 *    which authorizes this application to interact with Google APIs. Must be
 *    authorized to use all scopes listed in ``goog.SCOPES``.
 *  - ``imgurClientId``: {string} (optional). The Imgur application client ID
 *    which authorizes this application to access the Imgur API. If not
 *    present, uploading images from within the timeline will not be possible.
 *  - ``templateId``: {string} (optional). The ID of the Google Spreadsheet to use as a
 *    template for new timelines. Default:
 *    "0AppSVxABhnltdEhzQjQ4MlpOaldjTmZLclQxQWFTOUE"
 *  - ``redirectParam``: {string} (optional) The URL parameter to use for OAUTH
 *    redirects from Google. Should be chosen to avoid conflict with the URL
 *    scheme of the page in which the editor is embedded. Must match the URLs
 *    configured for the ``googleClientId``.  Default: "oauth2callback"
 *  - ``timelineParam``: {string} (optional). The URL parameter to use for
 *    timeline IDs. Should be chosen to avoid conflict with the URL scheme of
 *    the page in which the editor is embedded. Default: "timeline"
 *  - ``editParam``: {string} (optional). The URL parameter to use for indicating
 *    edit mode. Should be chosen to avoid conflict with the URL scheme of the
 *    page in which the editor is embedded. Default: "edit".
 *  - ``spreadsheetCorsProxy``: {string} (optional). The URL for a proxy server
 *    which adds needed CORS headers to Google Spreadsheets API responses. As of
 *    2015-02-20, this proxy is needed in order to allow client-side updates to
 *    Google Spreadsheets. Source for an appropriate proxy is available at
 *    https://github.com/yourcelf/gspreadsheets-cors-proxy.
 *    Default: "https://gspreadsheetscorsproxy.herokuapp.com"
 */
window.mhtEditor = function(opts) {
  _.extend(options, opts);
  if (typeof options.div === "string") {
    options.div = document.getElementById(options.div);
  }

  var React = require('react');
  var Fluxible = require('fluxible');
  var Main = require('./components/main.jsx');
  var actions = require("./actions");

  var app = new Fluxible({appComponent: Main});
  app.registerStore(require("./stores/user"));
  app.registerStore(require("./stores/spreadsheet"));
  app.registerStore(require("./stores/page"));
  var context = app.createContext();


  // Initialize authorization state with google.
  context.executeAction(actions.authorize, {}, function() {
    React.render(
      React.createElement(Main, {context: context.getComponentContext()}),
      options.div
    );
  });

  window.onpopstate = function() {
    context.executeAction(actions.navigate, {href: window.location.href, push: false});
  };
};
