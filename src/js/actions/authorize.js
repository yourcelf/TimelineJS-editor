var goog = require("../goog");

module.exports = function authorize (context, payload, done) {
  var finish = function(token) {
    context.dispatch("AUTHORIZE", {token: token});
    done();
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
