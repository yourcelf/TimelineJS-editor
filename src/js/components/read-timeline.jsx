var FluxibleMixin = require('fluxible').Mixin
var React = require('react');
var _ = require('lodash');
var PageStore = require('../stores/page');
var actions = require('../actions');
var ShowEmbed = require('./show-embed.jsx');

var ReadTimeline = React.createClass({
  mixins: [FluxibleMixin],
  statics: {storeListeners: [PageStore]},
  _getStateFromStores: function() {
    var ps = this.getStore('PageStore');
    return {
      timelineId: ps.getTimelineId(),
    }
  },
  getInitialState: function() {
    return this._getStateFromStores();
  },
  onChange: function() {
    this.setState(this._getStateFromStores());
  },
  handleNavEdit: function() {
    this.props.context.executeAction(actions.navigate, {
      page: 'UPDATE',
      timelineId: this.state.timelineId
    });
  },
  render: function() {
    return <div>
      <button onClick={this.handleNavEdit}>Edit Timeline</button> 
      <ShowEmbed context={this.props.context} />
    </div>
  }
});
module.exports = ReadTimeline
