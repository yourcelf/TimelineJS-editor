var goog = require("./goog");

module.exports.authorize = function(context, payload, done) {
  var finish = function(token) {
    context.dispatch("AUTHORIZE", {token: token});
    if (done) { done(); }
  };

  if (payload.token) {
    finish(payload.token);
  } else {
    goog.bootstrap().then(function() {
      return goog.authorize();
    }).then(function(token) {
      finish(token);
    }).catch(function(err) {
      console.log("actions.authorize", err);
      if (done) { done(err); }
    });
  }
};
module.exports.editSpreadsheet = function(context, payload, done) {
  context.dispatch("EDIT_SPREADSHEET", payload);
  if (done) { done(); }
};
module.exports.setSpreadsheetId = function(context, payload, done) {
  context.dispatch("SET_SPREADSHEET_ID", payload);
  if (done) { done(); }
};

module.exports.navigate = function(context, payload, done) {
  context.dispatch("NAVIGATE", payload);
  if (done) { done(); }
};
