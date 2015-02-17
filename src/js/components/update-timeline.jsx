var _ = require("lodash");
var FluxibleMixin = require('fluxible').Mixin
var React = require("react");
var SpreadsheetStore = require("../stores/spreadsheet");
var PageStore = require("../stores/page");
var actions = require("../actions");

var ShowEmbed = require("./show-embed.jsx");
var SoftLink = require("./soft-link.jsx");
var RowEditor = require("./row-editor.jsx");

var UpdateTimeline = React.createClass({
  mixins: [FluxibleMixin],
  statics: {
    storeListeners: [SpreadsheetStore, PageStore]
  },
  _getStateFromStores: function() {
    var ps = this.getStore("PageStore");
    var ss = this.getStore("SpreadsheetStore");
    // FIXME: Doesn't feel right to update the state of SpreadsheetStore here..
    // is there a better way?  Can a Store obtain a reference to another Store?
    if (ss.getData().id !== ps.getTimelineId()) {
      this.props.context.executeAction(actions.setSpreadsheetId, ps.getTimelineId());
    }
    return {
      timelineId: ps.getTimelineId(),
      data: ss.getData()
    }
  },
  getLink: function(dest) {
    switch (dest) {
      case "UPDATE":
        return ps.getUpdateLink(this.state.timelineId);
      case "READ":
        return ps.getReadLink(this.state.timelineId);
      case "CREATE":
        return ps.getCreateLink(this.state.timelineId);
    }
  },
  getInitialState: function() {
    return this._getStateFromStores();
  },
  onChange: function(payload) {
    // TODO: Reload iframe if payload is from spreadsheet store.
    this.setState(this._getStateFromStores());
  },
  componentWillMount: function() {
    this.getStore("SpreadsheetStore").beginPolling();
  },
  componentWillUnmount: function() {
    this.getStore("SpreadsheetStore").stopPolling();
  },
  handleFocusRow: function(rowIndex) {
    // row index is in spreadsheet row order; but focus indices for the iframe
    // are in time order.  Sort the rows by date, and find the new index for
    // focusing.
    var entry = this.state.data.rows[rowIndex];
    var sortedRows = _.sortBy(this.state.data.rows, "startdateObj");
    for (var i = 0; i < sortedRows.length; i++) {
      if (sortedRows[i] === entry) {
        break;
      }
    }
    this.setState({focus: i});
  },
  handleAddRow: function() {

  },
  render: function() {
    var ps = this.getStore("PageStore");
    var rows = _.map(this.state.data.rows, function(row, i) {
      return <RowEditor
                {...this.props}
                rowIndex={i}
                key={"roweditor-" + i}
                onFocus={this.handleFocusRow}
              />;
    }.bind(this));

    return (
      <div className='row'>
        <div className='six columns'>
          <h1>Edit Timeline</h1>
          <p>
            Spreadsheet:{' '}
            <a href={'https://docs.google.com/spreadsheet/ccc?key=' + this.state.timelineId}
               className='nav-link'
               target='_blank'>
                {this.state.data.title} <i className='fa fa-external-link' />
            </a>
          </p>
          <div>
            <SoftLink {...this.props}
              href={ps.getLink("READ", this.state.timelineId)}
              className='button'
              html={<span><i className='fa fa-link fa-fw' /> Share Timeline</span>} />
            <button className='button-primary pull-right' onClick={this.handleAddRow}>
              Add Entry
            </button>
            <div className='u-cf'></div>
          </div>

          <div className='spreadsheet-rows'>
            {rows}
          </div>

        </div>
        <div className='six columns preview-iframe-container'>
          <iframe src={'https://s3.amazonaws.com/cdn.knightlab.com/libs/timeline/latest/embed/index.html?source=' + this.state.timelineId + '&font=Bevan-PotanoSans&maptype=osm&lang=en&height=650#' + (this.state.focus ? this.state.focus : 0)} height='650' width='40%' frameBorder='0'></iframe>
        </div>
      </div>
    );
  }
});
module.exports = UpdateTimeline
