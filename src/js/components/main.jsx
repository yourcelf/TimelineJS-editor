"use strict";
const FluxibleMixin = require('fluxible/addons/FluxibleMixin');
const React = require('react');
const PureRenderMixin = require("react/addons").PureRenderMixin;
// stores
const UserStore = require('../stores/user');
const SpreadsheetStore = require('../stores/spreadsheet');
const PageStore = require('../stores/page');
// components
const Login = require('./login.jsx');
const CreateTimeline = require('./create-timeline.jsx');
const ReadTimeline = require("./read-timeline.jsx");
const UpdateTimeline = require('./update-timeline.jsx');
const UrlTest = require('./urltest.jsx');

/**
 * Main container react component for the MHT Timeline Editor.
 */
const Main = React.createClass({
  mixins: [FluxibleMixin, PureRenderMixin],
  statics: {
    storeListeners: [UserStore, PageStore, SpreadsheetStore]
  },
  _getStateFromStores: function() {
    return {
      loggedIn: this.getStore('UserStore').isLoggedIn(),
      hasSpreadsheet: this.getStore('SpreadsheetStore').hasSpreadsheet(),
      page: this.getStore('PageStore').getPage()
    };
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

    // Set state from stores.
    return this._getStateFromStores();
  },
  render: function() {
    let main = null;
    // This is essentially a router -- we're using PageStore as the truth
    // source for the current page (it's also responsible for setting the URL).
    // Choose which main component to show based on the current page as
    // determined by the PageStore.
    if (this.state.page === 'OAUTH_CALLBACK') {
      // This is only temporarily shown by a popup that is currently logging
      // the user in. The URL is introspected by the authorization function to
      // set our auth state, and then the window is disposed.
      main = <em>Logging in...</em>;
    } else if (this.state.page === 'READ') {
      // Read-only view for publishing.
      main = <ReadTimeline context={this.props.context} />;
    } else if (this.state.page === 'URLTEST') {
      main = <UrlTest context={this.props.context} />;
    } else if (!this.state.loggedIn) {
      // All subsequent views require login. Regardless of page state, show the
      // login screen here if we aren't authed.
      main = <Login context={this.props.context} />;
    } else if (this.state.page === 'UPDATE') {
      // UI for editng spreadsheet rows.
      main = <UpdateTimeline context={this.props.context} />;
    } else if (this.state.page === 'CREATE') {
      // UI for creating new spreadsheets.
      main = <CreateTimeline context={this.props.context} />;
    } else {
      // Page not found! Ruh-roh.
      main = <div>Oops... An error happened! Code: woodchuck.</div>;
    }
    return (
      <div className='mht-timeline-editor container'>
        {main}
      </div>
    );
  }
});

module.exports = Main;
