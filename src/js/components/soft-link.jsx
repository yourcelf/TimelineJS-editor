var React = require('react');
var PureRenderMixin = require("react/addons").PureRenderMixin;
var navigateAction = require("../actions").navigate;

/**
 * React component for a link that fires a navigate action rather than
 * reloading the browser, for snappy ajax navigation.
 */
var SoftLink = React.createClass({
  mixins: [PureRenderMixin],
  handleClick: function(event) {
    event.preventDefault();
    this.props.context.executeAction(navigateAction, {href: this.props.href});
  },
  render: function() {
    return <a href={this.props.href} onClick={this.handleClick} className={this.props.className}>{this.props.html}</a>
  }
});

module.exports = SoftLink;
