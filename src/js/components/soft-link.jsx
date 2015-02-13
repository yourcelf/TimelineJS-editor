var React = require('react');
var navigateAction = require("../actions").navigate;

var SoftLink = React.createClass({
  handleClick: function(event) {
    event.preventDefault();
    this.props.context.executeAction(navigateAction, {href: this.props.href});
  },
  render: function() {
    return <a href={this.props.href} onClick={this.handleClick} className={this.props.className}>{this.props.html}</a>
  }
});

module.exports = SoftLink;
