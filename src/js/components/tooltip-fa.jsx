"use strict";
const React = require("react");
const PureRenderMixin = require("react/addons").PureRenderMixin;
const {OverlayTrigger, Tooltip} = require("react-bootstrap");
const Fa = require("./fa.jsx");

const TooltipFa = React.createClass({
  mixins: [PureRenderMixin],
  render: function() {
    return (
      <OverlayTrigger placement="top"
                      overlay={<Tooltip id={'id-' + Math.random()}>{this.props.title}</Tooltip>}>
        <a><Fa type={this.props.type} /></a>
      </OverlayTrigger>
    );
  }
});

module.exports = TooltipFa;
