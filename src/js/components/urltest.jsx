"use strict";
const React = require("react");
const FluxibleMixin = require('fluxible/addons/FluxibleMixin');
const PureRenderMixin = require("react/addons").PureRenderMixin;
const PageStore = require("../stores/page");
const options = require("../options");

const UrlTest = React.createClass({
  mixins: [FluxibleMixin, PureRenderMixin],
  statics: {storeListeners: [PageStore]},
  onChange: function(){},
  render: function() {
    let ps = this.getStore("PageStore");
    let redirectUriBase = document.location.protocol + "//" +
                      document.location.host +
                      this.getStore("PageStore").getLink("OAUTH_REDIRECT_BASE");
    let joiner = redirectUriBase.indexOf("?") === -1 ? "?" : "&";
    let redirectUri = redirectUriBase + joiner + options.redirectParam;

    return (
      <table>
        <tr><th>document.location.protocol</th><td>{document.location.protocol}</td></tr>
        <tr><th>document.location.host</th><td>{document.location.host}</td></tr>
        <tr><th>document.location.hostname</th><td>{document.location.hostname}</td></tr>
        <tr><th>document.URL</th><td>{document.URL}</td></tr>
        <tr><th>PageStore.urlParams</th><td><pre>{JSON.stringify(ps.urlParams, null, 2)}</pre></td></tr>
        <tr><th>UPDATE</th><td>{ps.getLink("UPDATE", '_timelineid_')}</td></tr>
        <tr><th>READ</th><td>{ps.getLink("READ", '_timelineid_')}</td></tr>
        <tr><th>CREATE</th><td>{ps.getLink("CREATE", '_timelineid_')}</td></tr>
        <tr><th>OAUTH_REDIRECT_BASE</th><td>{ps.getLink("OAUTH_REDIRECT_BASE")}</td></tr>
        <tr><th>redirectUriBase</th><td>{redirectUriBase}</td></tr>
        <tr><th>redirectUri</th><td>{redirectUri}</td></tr>
        <tr><th>userAgnet</th><td>{navigator.userAgent}</td></tr>
      </table>
    );
  }
});

module.exports = UrlTest;
