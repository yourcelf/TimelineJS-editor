var FluxibleMixin = require('fluxible').Mixin
var React = require('react');
var _ = require('lodash');
var PageStore = require('../stores/page');
var actions = require('../actions');

var ShowEmbed = React.createClass({
  mixins: [FluxibleMixin],
  statics: { storeListeners: [PageStore] },
  _getStateFromStores: function() {
    return {
      timelineId: this.getStore('PageStore').getTimelineId(),
    }
  },
  getInitialState: function() { return this._getStateFromStores(); },
  onChange: function() { this.setState(this._getStateFromStores()); },
  handleFocusTextarea: function(event) {
    event.target.select();
  },
  render: function() {
    var embedCode = "<iframe src='https://s3.amazonaws.com/cdn.knightlab.com/libs/timeline/latest/embed/index.html?source=" + _.escape(this.state.timelineId) + "&font=Bevan-PotanoSans&maptype=toner&lang=en&height=650' width='100%' height='650' frameBorder='0'></iframe>"

    return <div>
      <div dangerouslySetInnerHTML={{__html: embedCode}}></div>
      <h2>Embed code</h2>
      <textarea rows='4' cols='60' value={embedCode} readOnly onFocus={this.handleFocusTextarea}/>
    </div>
  }
});
module.exports = ShowEmbed
