/** @jsx React.DOM */
var FluxibleMixin = require('fluxible').Mixin;
var React = require("react");
var UserStore = require("../stores/user");
var Login = require("./login.jsx");
var CreateTimeline = require("./create-timeline.jsx");

var TimelineEditorMain = React.createClass({
  mixins: [FluxibleMixin],
  statics: { storeListeners: [UserStore] },
  _getStateFromStores: function() {
    return {
      loggedIn: this.getStore("UserStore").isLoggedIn()
    }
  },
  onChange: function() {
    this.setState(this._getStateFromStores());
  },
  getInitialState: function() {
    return this._getStateFromStores();
  },
  render: function() {
    var main;
    if (this.state.loggedIn) {
      main = <CreateTimeline context={this.props.context} />;
    } else {
      main = <Login context={this.props.context} />;
    }
    return (
      <div className='mht-timeline-editor'>
        {main}
      </div>
    );
  }
});

module.exports = TimelineEditorMain
