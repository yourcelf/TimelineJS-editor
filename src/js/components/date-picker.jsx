var _ = require("lodash");
var React = require("react");
var PureRenderMixin = require("react/addons").PureRenderMixin;
var Pikaday = require("pikaday");

var DatePicker = React.createClass({
  mixins: [React.addons.PureRenderMixin],
  _buildPicker: function(el) {
    new Pikaday({
      field: el,
      // onChange doesn't fire with mouse selection; so bind onClose.
      onClose: function() { this.handleOnChange({target: el}); }.bind(this),
      onOpen: function() { this.props.onFocus(); }.bind(this)
    });
  },
  getInitialState: function() {
    return {value: this.props.value}
  },
  componentDidMount: function() {
    this._buildPicker(this.getDOMNode());
  },
  handleOnChange: function(event) {
    this.setState({value: event.target.value});
    this.props.onChange && this.props.onChange(event);
  },
  render: function() {
    var disableSubmit = this.state.dirty ? {} : {disabled: true};
    return <input
        type='text'
        value={this.state.value}
        onChange={this.handleOnChange}
        className={this.props.className}
        name={this.props.name}
      />
  }
});

module.exports = DatePicker
