var React = require("react");
var VMM = require("../media");

var MediaPreview = React.createClass({
  render: function() {
    if (this.props.media.headline !== "Google Map") {
      var html = VMM.MediaElement.create(this.props.media, this.props.uid );
      return <div dangerouslySetInnerHTML={{__html: html}} />
    }
    return <span/>;
  }
});

module.exports = MediaPreview
