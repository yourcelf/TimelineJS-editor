var createStore = require("fluxible/utils/createStore");
var utils = require("../utils");

var UserStore = createStore({
  initialize: function() {
    this.token = null;
  },
  storeName: 'UserStore',
  handlers: {'AUTHORIZE': 'handleLogin'},
  handleLogin: function(params) {
    this.token = params.token;
    this.emitChange();
  },
  isLoggedIn: function() {
    return !!this.token;
  }
});
module.exports = UserStore;
