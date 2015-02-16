var createStore = require("fluxible/utils/createStore");
var options = require("../options");
var utils = require("../utils");
var _ = require("lodash");

var PageStore = createStore({
  initialize: function() {
    this.urlParams = utils.decodeParams(window.location.search.substring(1));
    this._setPageFromUrlParams();
  },
  storeName: 'PageStore',
  handlers: {'NAVIGATE': 'handleNavigate'},

  /**
   * Respond to navigate actions, updating the current PAGE and pushing URL
   * state, emitting change.
   *
   * @param {object} payload - Object requiring one of ``page`` or ``href``
   * keys.  ``page`` should be one of "UPDATE", "READ", or "CREATE"
   */
  handleNavigate: function handleNavigate(payload) {
    if (payload.page) {
      this.page = payload.page;
      this.urlParams[options.timelineParam] = payload.timelineId;
      if (this.page === "UPDATE") {
        this.urlParams[options.editParam] = 1;
      } else if (this.page === "READ") {
        delete this.urlParams[options.editParam];
      } else if (this.page === "CREATE") {
        delete this.urlParams[options.timelineParam];
        delete this.urlParams[options.editParam];
      }
      if (payload.push !== false) {
        this._pushState();
      }
      this.emitChange();
    } else if (payload.href) {
      this.urlParams = utils.decodeParams(payload.href);
      if (payload.push !== false) {
        this._pushState();
      }
      this._setPageFromUrlParams();
      this.emitChange();
    }
  },

  _setPageFromUrlParams: function() {
    if (this.urlParams.hasOwnProperty(options.redirectParam)) {
      this.page = "OAUTH2_CALLBACK";
    } else if (this.urlParams[options.timelineParam] &&
               this.urlParams.hasOwnProperty(options.editParam)) {
      this.page = "UPDATE";
    } else if (this.urlParams[options.timelineParam]) {
      this.page = "READ";
    } else {
      this.page = "CREATE";
    }
  },

  /** @return {string} Name of the current page */
  getPage: function() {
    return this.page;
  },

  /** @return {string} The current timeline ID (if any), or undefined */
  getTimelineId: function() {
    return this.urlParams[options.timelineParam];
  },

  /**
   * Format the link for the given action and timeline ID.
   *
   * @param {string} action - The name for the page to navigate to.
   * @param {string} timelineId - The destination timeline ID.
   * @return {string} URL for the given action and timeline ID.
   */
  getLink: function(action, timelineId) {
    var set = {};
    var remove = [];
    switch (action) {
      case "READ":
        set[options.timelineParam] = timelineId;
        remove.push(options.editParam);
        break
      case "UPDATE":
        set[options.timelineParam] = timelineId;
        set[options.editParam] = 1;
        break
      case "CREATE":
        remove = [options.timelineParam, options.editParam];
        break
      case "OAUTH_REDIRECT_BASE":
        remove = [options.timelineParam, options.editParam];
        break
      default:
        return undefined;
    }
    return this._buildUrl(set, remove);
  },

  /**
   * Build a URL based on removing or adding the given querystring params from
   * those in the current page.
   *
   * @param {object} set - key/value map to add/override on the current querystring
   * @param {Array} remove - keys to remove from the current querystring
   * @return {string} The url constructed from the given params.
   */
  _buildUrl: function(set, remove) {
    var params = _.extend({}, this.urlParams, set || {});
    _.each(remove || [], function(r) {
      delete params[r];
    });
    var querystr = utils.encodeParams(params);
    var url = window.location.pathname;
    if (querystr) {
      url += "?" + querystr;
    }
    return url;
  },

  /**
   * Encode the current value of {this.urlParams} into a querystring, and push
   * it to the browser's URL.
   */
  _pushState: function() {
    var url = this._buildUrl();
    if (window.history && window.history.pushState) {
      window.history.pushState(null, null, url);
    } else {
      window.location.href = url;
    }
  }
});

module.exports = PageStore;
