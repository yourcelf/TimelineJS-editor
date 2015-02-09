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
    var embedCode = "<iframe src='https://s3.amazonaws.com/cdn.knightlab.com/libs/timeline/latest/embed/index.html?source=" + this.state.spreadsheetId + "&font=Bevan-PotanoSans&maptype=toner&lang=en&height=650' width='100%' height='650' frameBorder='0'></iframe>"

    return (
      <div>
        <div>
          <button onClick={this.handleUnsetSpreadsheet}>Unset</button>
        </div>
        <div>Spreadsheet:
          <a href={'https://docs.google.com/spreadsheet/ccc?key=' + this.state.spreadsheetId}>Edit Spreadsheet</a>
        </div>
        <div dangerouslySetInnerHTML={{__html: embedCode}} />
        <div>
          <h2>Embed code</h2>
          <textarea rows='4' cols='60' readOnly value={embedCode} />
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
