/** @jsx React.DOM */
var FluxibleMixin = require('fluxible').Mixin;
var React = require('react');
// stores
var UserStore = require('../stores/user');
var SpreadsheetStore = require('../stores/spreadsheet');
var PageStore = require('../stores/page');
// components
var Login = require('./login.jsx');
var CreateTimeline = require('./create-timeline.jsx');
var ReadTimeline = require("./read-timeline.jsx");
var UpdateTimeline = require('./update-timeline.jsx');

var Main = React.createClass({
  mixins: [FluxibleMixin],
  statics: {
    storeListeners: [UserStore, PageStore, SpreadsheetStore]
  },
  _getStateFromStores: function() {
    return {
      loggedIn: this.getStore('UserStore').isLoggedIn(),
      hasSpreadsheet: this.getStore('SpreadsheetStore').hasSpreadsheet(),
      page: this.getStore('PageStore').getPage(),
    }
  },
  onChange: function(payload) {
    this.setState(this._getStateFromStores());
  },
  getInitialState: function() {
    //XXX This shouldn't be necessary, but UserStore changes don't seem to
    //propagate here otherwise???  Something weird going on with ``context``
    //and registrations.
    this.getStore("UserStore").on("change", function(payload) {
      this.onChange(payload);
    }.bind(this));
    return this._getStateFromStores();
  },
  render: function() {
    console.log("Render main");
    var main;
    if (this.state.page === 'OAUTH_CALLBACK') {
      main = <em>Logging in...</em>;
    } else if (this.state.page === 'READ') {
      main = <ReadTimeline context={this.props.context} />;
    } else if (!this.state.loggedIn) {
      // All subsequent views require login.
      main = <Login context={this.props.context} />;
    } else if (this.state.page === 'UPDATE') {
      main = <UpdateTimeline context={this.props.context} />;
    } else if (this.state.page === 'CREATE') {
      main = <CreateTimeline context={this.props.context} />;
    } else {
      main = <div>Oops... An error happened! Code: woodchuck.</div>
    }
    return (
      <div className='mht-timeline-editor container'>
        {main}
      </div>
    );
  }
});

module.exports = Main
