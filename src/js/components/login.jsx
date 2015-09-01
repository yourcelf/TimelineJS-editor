"use strict";
const React = require("react");
const PureRenderMixin = require("react/addons").PureRenderMixin;
const authorizeAction = require("../actions").authorize;
const PageStore = require("../stores/page");
const goog = require("../goog");
const {Col} = require("react-bootstrap");

/**
 * React component for a "login with google" button.
 */
const Login = React.createClass({
  mixins: [PureRenderMixin],
  contextTypes: {
    getStore: React.PropTypes.func.isRequired,
    executeAction: React.PropTypes.func.isRequired
  },
  handleClick: function() {
    let redirectUrl = document.location.protocol + "//" +
                      document.location.host +
                      this.context.getStore(PageStore).getLink("OAUTH_REDIRECT_BASE");

    // It would be cleaner to let the action handle ``goog.popupLogin`` rather
    // than implementing it here in the view code, but doing so introduces an
    // indirection that causes popup blockers to get triggered.  To avoid popup
    // blockers, we need the action requesting the login to be on the same
    // stack frame as the onClick handler.
    goog.popupLogin(redirectUrl).then((token) => {
      this.context.executeAction(authorizeAction, {token: token});
    });
  },
  // Function must be present or fluxible throws an error
  onChange: function() {},
  render: function() {
    return (
      <Col sm={6}>
        <h1>Login Required</h1>
        <p>To proceed, please log in with google, and authorize this application to access your timeline documents.</p>
        <button className='mht-login btn btn-primary' onClick={this.handleClick}>Login with Google</button>
      </Col>
    );
  }
});

module.exports = Login;
