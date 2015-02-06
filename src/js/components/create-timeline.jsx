var React = require("react");
var goog = require("../goog");
var setSpreadsheet = require("../actions").setSpreadsheet

var CreateTimeline = React.createClass({
  handleSubmit: function(event) {
    event.preventDefault();
    this.setState({disableForm: true});
    goog.duplicateTemplate("Timeline: " + this.state.title, function(res) {
      this.props.context.executeAction(setSpreadsheet, res);
      this.setState({disableForm: false});
    }.bind(this));
  },
  getInitialState: function() {
    return {title: "", disableForm: false};
  },
  handleTitleChange: function(event) {
    this.setState({title: event.target.value});
  },
  render: function() {
    var disabled = this.state.disableForm ? "disabled" : "";
    return (
      <form onSubmit={this.handleSubmit} disabled={disabled}>
        <input type='text' name='title' placeholder='Timeline title'
          value={this.state.title} onChange={this.handleTitleChange} required />
        <button type='submit' className='mht-copy-template'>Create Timeline</button>
      </form>
    );
  }
});

module.exports = CreateTimeline
