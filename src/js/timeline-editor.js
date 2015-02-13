require("es6-promise").polyfill();
var options = require("./options");
var _ = require("lodash");

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
