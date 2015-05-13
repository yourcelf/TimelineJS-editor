"use strict";
const React = require("react");
const PureRenderMixin = require("react/addons").PureRenderMixin;

const Fa = React.createClass({
  mixins: [PureRenderMixin],
  render: function() {
    let className = "fa " + this.props.type.split(" ").map((i) => "fa-" + i).join(" ");
    return <i className={className} />;
  }
});

module.exports = Fa;
