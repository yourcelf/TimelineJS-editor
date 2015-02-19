var _ = require("lodash");
var moment = require("moment");
var FluxibleMixin = require('fluxible').Mixin
var React = require("react");
var ReactCSSTransitionGroup = require("react/addons").addons.CSSTransitionGroup;

var SpreadsheetStore = require("../stores/spreadsheet");
var PageStore = require("../stores/page");
var UserStore = require("../stores/user");
var actions = require("../actions");

var SoftLink = require("./soft-link.jsx");
var RowEditor = require("./row-editor.jsx");

var UpdateTimeline = React.createClass({
  mixins: [FluxibleMixin],
  statics: {
    storeListeners: [SpreadsheetStore, PageStore, UserStore]
  },
  _getStateFromStores: function() {
    var ps = this.getStore("PageStore");
    var ss = this.getStore("SpreadsheetStore");
    // FIXME: Doesn't feel right to update the state of SpreadsheetStore here..
    // is there a better way?  Can a Store obtain a reference to another Store?
    if (ss.getData().id !== ps.getTimelineId()) {
      this.props.context.executeAction(actions.setSpreadsheetId, ps.getTimelineId());
    }
    // Shallow copy the data/rows so we can do change comparison.
    var data = _.clone(ss.getData());
    data.rows = _.clone(data.rows);
    return {
      timelineId: ps.getTimelineId(),
      // URL for preview iframe without ``source=`` param or hash.
      previewUrlBase: 'https://s3.amazonaws.com/cdn.knightlab.com/libs/timeline/latest/embed/index.html?font=Bevan-PotanoSans&maptype=osm&lang=en&height=650',
      data: data 
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
    console.log("Shortening url");
    this.getStore("PageStore").getShortUrl().then(function(shortUrl) {
      console.log("Url shortened:", shortUrl);
      this.setState({shortUrl: shortUrl});
    }.bind(this));
    return this._getStateFromStores();
  },
  onChange: function(payload) {
    // Detect whether we've changed, and should reload the iframe.
    // TODO: handle ss error state.
    var ss = this.getStore("SpreadsheetStore");
    var dirty = false;
    if (this.state.data && payload.data && this.state.data.rows && payload.data.rows) {
      dirty = ss.spreadsheetsDiffer(this.state.data, payload.data);
    }
    this.setState(this._getStateFromStores());
    if (dirty) {
      this.reloadIframe();
    }
    // Check if this update contains a row that we requested be created.  If
    // so, scroll that row into view and remove our state requesting that row.
    if (this.state._requestId) {
      if (payload.data && payload.data.rows) {
        for (var i = 0; i < payload.data.rows.length; i++) {
          if (payload.data.rows[i]._requestId === this.state._requestId) {
            this.setState({_requestId: undefined});
            // Break closure for the row, and set timeout so we can wait till
            // the dom has repainted.
            (function(row) {
              setTimeout(function() {
                document.querySelector("[data-row-id='" + row.id + "']").scrollIntoView();
              }, 1);
            })(payload.data.rows[i])
          }
        }
      }
    }
  },
  reloadIframe: function() {
    // Add an arbitrary query param to force reload.
    var newUrl = this.state.previewUrlBase + '&_v';
    console.log("Reload iframe!", newUrl);
    this.setState({previewUrlBase: newUrl});
  },
  componentWillMount: function() {
    this.getStore("SpreadsheetStore").beginPolling();
  },
  componentWillUnmount: function() {
    this.getStore("SpreadsheetStore").stopPolling();
  },
  handleFocusRow: function(rowId) {
    // row index is in spreadsheet row order; but focus indices for the iframe
    // are in time order.  Sort the rows by date, and find the new index for
    // focusing.
    var sortedRows = _.sortBy(this.state.data.rows, function(r) {
      return r._meta.startdateObj;
    });
    for (var i = 0; i < sortedRows.length; i++) {
      if (sortedRows[i].id === rowId) {
        break;
      }
    }
    this.setState({focus: i});
  },
  handleFocusShortUrl: function(event) {
    event.target.select();
  },
  handleAddRow: function(event) {
    event.preventDefault();
    var reqId = "" + Math.random();
    var us = this.getStore("UserStore");
    this.setState({_requestId: reqId});
    this.props.context.executeAction(actions.editSpreadsheet, {
      action: "ADD_ROW",
      _requestId: reqId,
      row: {
        startdate: moment().format("YYYY-MM-DD"),
        headline: us.getName() + "'s story"
      }
    });
  },
  render: function() {
    var ps = this.getStore("PageStore");
    var rows = _.map(this.state.data.rows, function(row, i) {
      return <RowEditor
                {...this.props}
                rowId={row.id}
                rowIndex={row._meta.index}
                key={"roweditor-" + i}
                onFocus={this.handleFocusRow}
              />;
    }.bind(this));

    var iframeSrc = this.state.previewUrlBase + '&source=' + this.state.timelineId + '#' + (this.state.focus ? this.state.focus : 0);
    var addDisabled = {disabled: !!this.state._requestId};
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
            {
              this.state.shortUrl ?
              <input value={this.state.shortUrl} className='u-pull-right' type='text' readOnly onFocus={this.handleFocusShortUrl} />
              : '' }
          </div>
          <div className='center-text'>
            <button className='button-primary button-huge button-block' onClick={this.handleAddRow} {...addDisabled}>
              { this.state._requestId ? <i className='fa fa-spinner fa-spin'></i> : '' }
              Add My Story
            </button>
            <div className='u-cf'></div>
          </div>

          <ReactCSSTransitionGroup transitionName="edit-row-forms">
            {rows}
          </ReactCSSTransitionGroup>

        </div>
        <div className='six columns preview-iframe-container'>
          <iframe id='timeline-preview' src={iframeSrc} height='650' width='40%' frameBorder='0'></iframe>
        </div>
      </div>
    );
  }
});
module.exports = UpdateTimeline
