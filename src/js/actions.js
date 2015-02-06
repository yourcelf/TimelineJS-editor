var goog = require("./goog");

module.exports.authorize = function(context, payload, done) {
  var finish = function(token) {
    context.dispatch("AUTHORIZE", {token: token});
    done && done();
  }

  if (payload.token) {
    finish(payload.token);
  } else {
    goog.bootstrap(function() {
      goog.authorize(function(err, token) {
        if (err) { return done(err); }
        finish(token);
      });
    });
  }
};
module.exports.editSpreadsheet = function(context, payload, done) {
  context.dispatch("EDIT_SPREADSHEET", payload);
  done && done();
};
module.exports.setSpreadsheet = function(context, payload, done) {
  context.dispatch("SET_SPREADSHEET", payload);
  done && done();
};
module.exports.unsetSpreadsheet = function(context, payload, done) {
  context.dispatch("UNSET_SPREADSHEET", payload);
  done && done();
};
