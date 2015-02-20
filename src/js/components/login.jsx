var FluxibleMixin = require('fluxible').Mixin
var React = require("react");
var authorizeAction = require("../actions").authorize;
var PageStore = require("../stores/page");
var goog = require("../goog");

var Login = React.createClass({
  mixins: [FluxibleMixin],
  statics: {storeListeners: [PageStore]},
  handleClick: function() {
    var redirectUrl = document.location.protocol + "//" +
                      document.location.host +
                      this.getStore("PageStore").getLink("OAUTH_REDIRECT_BASE");
    goog.popupLogin(redirectUrl).then(function(token) {
      this.props.context.executeAction(authorizeAction, {token: token});  
    }.bind(this));
  },
  onChange: function() {},
  render: function() {
    return (
      <div>
        <h1>Login Required</h1>
        <p>To proceed, please log in with google, and authorize this application to access your timeline documents.</p>
        <button className='mht-login button-primary' onClick={this.handleClick}>Login with Google</button>
      </div>
    )
  }
});

module.exports = Login
