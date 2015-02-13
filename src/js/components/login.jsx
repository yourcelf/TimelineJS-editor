var React = require("react");
var authorizeAction = require("../actions").authorize;
var goog = require("../goog");

var Login = React.createClass({
  handleClick: function() {
    goog.popupLogin().then(function(token) {
      this.props.context.executeAction(authorizeAction, {token: token});  
    }.bind(this));
  },
  render: function() {
    return (
      <button className='mht-login' onClick={this.handleClick}>Login with Google</button>
    )
  }
});

module.exports = Login
