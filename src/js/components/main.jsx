"use strict";
const React = require('react');
const connectToStores = require("fluxible-addons-react/connectToStores");
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
let Main = React.createClass({
  render() {
    let main = null;
    // This is essentially a router -- we're using PageStore as the truth
    // source for the current page (it's also responsible for setting the URL).
    // Choose which main component to show based on the current page as
    // determined by the PageStore.
    if (this.props.page === 'OAUTH_CALLBACK') {
      // This is only temporarily shown by a popup that is currently logging
      // the user in. The URL is introspected by the authorization function to
      // set our auth state, and then the window is disposed.
      main = <em>Logging in...</em>;
    } else if (this.props.page === 'READ') {
      // Read-only view for publishing.
      main = <ReadTimeline />;
    } else if (this.props.page === 'URLTEST') {
      main = <UrlTest />;
    } else if (!this.props.loggedIn) {
      // All subsequent views require login. Regardless of page state, show the
      // login screen here if we aren't authed.
      main = <Login />;
    } else if (this.props.page === 'UPDATE') {
      // UI for editng spreadsheet rows.
      main = <UpdateTimeline />;
    } else if (this.props.page === 'CREATE') {
      // UI for creating new spreadsheets.
      main = <CreateTimeline />;
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
Main = connectToStores(Main, [UserStore, SpreadsheetStore, PageStore], (context, props) => ({
  loggedIn: context.getStore(UserStore).isLoggedIn(),
  hasSpreadsheet: context.getStore(SpreadsheetStore).hasSpreadsheet(),
  page: context.getStore(PageStore).getPage()
}));

export default Main;
