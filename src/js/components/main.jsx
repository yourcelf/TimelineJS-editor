/** @jsx React.DOM */
var FluxibleMixin = require('fluxible').Mixin;
var React = require("react");
// stores
var UserStore = require("../stores/user");
var SpreadsheetStore = require("../stores/spreadsheet");
// components
var Login = require("./login.jsx");
var CreateTimeline = require("./create-timeline.jsx");
var ShowTimeline = require("./show-timeline.jsx");

var TimelineEditorMain = React.createClass({
  mixins: [FluxibleMixin],
  statics: {
    storeListeners: [UserStore, SpreadsheetStore]
  },
  _getStateFromStores: function() {
    return {
      loggedIn: this.getStore("UserStore").isLoggedIn(),
      hasSpreadsheet: this.getStore("SpreadsheetStore").hasSpreadsheet()
    }
  },
  onChange: function() {
    this.setState(this._getStateFromStores());
  },
  getInitialState: function() {
    return this._getStateFromStores();
  },
  render: function() {
    console.log("MAIN");
    var main;
    if (!this.state.loggedIn) {
      console.log("Doing Login");
      main = <Login context={this.props.context} />;
    } else if (this.state.hasSpreadsheet) {
      console.log("Doing ShowTimeline");
      main = <ShowTimeline context={this.props.context} />;
    } else {
      console.log("Doing CreateTimeline");
      main = <CreateTimeline context={this.props.context} />;
    }
    return (
      <div className='mht-timeline-editor'>
        {main}
      </div>
    );
  }
});

module.exports = TimelineEditorMain
