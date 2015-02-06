var urlParams = require("./utils").urlParams;
var options = require("./options");
var _ = require("lodash");

window.mhtEditor = function(opts) {
  _.extend(options, opts);
  if (urlParams.hasOwnProperty(options.redirectParam || "oauth2callback")) {
    // This is a redirect callback.  No-op; the parent will introspect our URL
    // and grab the auth token, and then close this window.
    return;
  }
  if (typeof options.div === "string") {
    options.div = document.getElementById(options.div);
  }

  var React = require('react');
  var Fluxible = require('fluxible');
  var goog = require("./goog");
  var Main = require('./components/main.jsx');
  var authorizeAction = require("./actions").authorize;

  var app = new Fluxible({appComponent: Main});
  app.registerStore(require("./stores/user"));
  app.registerStore(require("./stores/spreadsheet"));
  var context = app.createContext();

  // Initialize authorization state with google.
  context.executeAction(authorizeAction, {}, function() {
    React.render(
      React.createElement(Main, {context: context.getComponentContext()}),
      options.div
    );
  });
};
