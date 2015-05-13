var createStore = require("fluxible/addons/createStore");
var goog = require("../goog");

var UserStore = createStore({
  initialize: function() {
    this.token = null;
  },
  storeName: 'UserStore',
  handlers: {'AUTHORIZE': 'handleLogin'},
  handleLogin: function(params) {
    this.token = params.token;
    goog.getUserProfile().then(function(res) {
      this.profile = res;
      this.emitChange();
    }.bind(this)).catch(function(err) {
      console.log(err);
      this.emitChange();
    }.bind(this));
  },
  isLoggedIn: function() {
    return !!this.token;
  },
  getName: function() {
    return this.profile.displayName;
  }
});
module.exports = UserStore;
