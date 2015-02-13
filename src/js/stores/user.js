var createStore = require("fluxible/utils/createStore");
var utils = require("../utils");

var UserStore = createStore({
  initialize: function() {
    this.token = utils.lsGet("mhtAuthToken", null);
  },
  storeName: 'UserStore',
  handlers: {'AUTHORIZE': 'handleLogin'},
  handleLogin: function(params) {
    this.token = params.token;
    utils.lsSet("mhtAuthToken", this.token);
    this.emitChange();
  },
  isLoggedIn: function() {
    return !!this.token;
  }
});
module.exports = UserStore;
