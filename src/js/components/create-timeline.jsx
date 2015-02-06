var React = require("react");

var CreateTimeline = React.createClass({
  handleClick: function() {


  },
  render: function() {
    return (
      <button className='mht-copy-template' onClick={this.handleClick}>Copy Template</button>
    );
  }
});

module.exports = CreateTimeline
