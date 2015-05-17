"use strict";
const React = require("react");
const PureRenderMixin = require("react/addons").PureRenderMixin;
const Pikaday = require("pikaday");

/**
 * React comnponent for a pikaday date picker.
 */
const DatePicker = React.createClass({
  mixins: [PureRenderMixin],
  _buildPicker: function(el) {
    return new Pikaday({
      field: el,
      // onChange doesn't fire with mouse selection; so bind onClose.
      onClose: function() { this.handleOnChange({target: el}); }.bind(this),
      onOpen: function() { this.props.onFocus(); }.bind(this)
    });
  },
  getInitialState: function() {
    return {value: this.props.value};
  },
  componentDidMount: function() {
    this._buildPicker(this.getDOMNode());
  },
  handleOnChange: function(event) {
    this.setState({value: event.target.value});
    if (this.props.onChange) {
      this.props.onChange(event);
    }
  },
  render: function() {
    let disableSubmit = this.state.dirty ? {} : {disabled: true};
    return <input
        type='text'
        value={this.state.value}
        onChange={this.handleOnChange}
        className={this.props.className}
        name={this.props.name} />;
  }
});

module.exports = DatePicker;
