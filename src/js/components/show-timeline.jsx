var FluxibleMixin = require('fluxible').Mixin
var React = require("react");
var SpreadsheetStore = require("../stores/spreadsheet");
var actions = require("../actions");

var ShowTimeline = React.createClass({
  mixins: [FluxibleMixin],
  statics: {
    storeListeners: [SpreadsheetStore]
  },
  _getStateFromStores: function() {
    var ss = this.getStore("SpreadsheetStore");
    return {
      spreadsheetId: ss.spreadsheetId,
      rows: ss.rows
    }
  },
  getInitialState: function() {
    return this._getStateFromStores();
  },
  onChange: function() {
    this.setState(this._getStateFromStores());
  },
  handleUnsetSpreadsheet: function() {
    this.props.context.executeAction(actions.unsetSpreadsheet);
  },
  render: function() {
    var rows = JSON.stringify(this.state.rows, null, 2);
    var sheetHref = "https://docs.google.com/spreadsheet/ccc?key=" + this.state.spreadsheetId;
    return (
      <div>
        <div>
          <button onClick={this.handleUnsetSpreadsheet}>Unset</button>
        </div>
        <div>Spreadsheet:
          <a href={'https://docs.google.com/spreadsheet/ccc?key=' + this.state.spreadsheetId}>{this.state.spreadsheetId}</a>
        </div>
        <div>
          <span>Spreadsheet Rows:</span>
          <pre>{rows}</pre>
        </div>
      </div>
    );
  }
});
module.exports = ShowTimeline
