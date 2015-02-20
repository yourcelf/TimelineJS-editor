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

/**
 * React component for the main spreadsheet editor for timelines.
 */
var UpdateTimeline = React.createClass({
  mixins: [FluxibleMixin],
  statics: {
    storeListeners: [SpreadsheetStore, PageStore, UserStore]
  },
  _getStateFromStores: function() {
    var ps = this.getStore("PageStore");
    var ss = this.getStore("SpreadsheetStore");
    var us = this.getStore("UserStore");
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
      data: data,
      anyoneCanEdit: ss.anyoneCanEdit()
    }



  },
  getInitialState: function() {
    // Just return the standard state-from-stores.
    return this._getStateFromStores();
  },
  onChange: function(payload) {
    // Detect whether we've changed, and should reload the iframe.
    var ss = this.getStore("SpreadsheetStore");
    if (ss.error) {
      this.setState({error: ss.error});
    }
    var dirty = false;
    if (this.state.data && payload.data && this.state.data.rows && payload.data.rows) {
      dirty = ss.spreadsheetsDiffer(this.state.data, payload.data);
    }
    this.setState(this._getStateFromStores());
    if (dirty) {
      this.reloadIframe();
    }

    // Check if we've updated the ``anyoneCanEdit`` status in response to a
    // request to do so.
    if (this.state._anyoneCanEditChange) {
      if (ss.anyoneCanEdit() === this.state._anyoneCanEditTarget) {
        this.setState({
          anyoneCanEdit: this.state._anyoneCanEditTarget,
          _anyoneCanEditTarget: undefined,
          _anyoneCanEditChange: undefined
        });
      }
    }

    // Check if this update contains a row that we requested be created.  If
    // so, scroll that row into view and remove our state requesting that row.
    if (this.state._requestId && payload.data && payload.data.rows) {
      for (var i = 0; i < payload.data.rows.length; i++) {
        if (payload.data.rows[i]._requestId === this.state._requestId) {
          this.setState({_requestId: undefined});
          // Break closure for the row, and set timeout so we can wait till
          // the dom has repainted.
          (function(row) {
            setTimeout(function() {
              var el = document.querySelector("[data-row-id='" + row.id + "'] [name=headline]");
              el.scrollIntoView();
              el.focus();
            }, 1);
          })(payload.data.rows[i])
          break;
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
    // Start polling for remote spreadsheet updates.
    this.getStore("SpreadsheetStore").beginPolling();
    // Get the short URL.
    this.getStore("PageStore").getShortUrl().then(function(shortUrl) {
      this.setState({shortUrl: shortUrl});
    }.bind(this));
  },
  componentWillUnmount: function() {
    // Stop polling for remote spreadsheet updates.
    this.getStore("SpreadsheetStore").stopPolling();
  },
  handleFocusRow: function(rowId) {
    // Given a rowId, find the date-sorted index to pass as the url hash to
    // the iframe.
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
    // Set a random ``request ID`` which the SpreadsheetStore will include with
    // the new row, so that we know it is the one we requested and can update
    // UI to scroll to it.  This is necessary due to the one-way rule in flux:
    // we don't get any direct callback from an action, just a general
    // ``onChange`` from the store.
    var reqId = "" + Math.random();
    this.setState({_requestId: reqId});

    // Set the user's name and current date as defaults for the new row.
    var us = this.getStore("UserStore");
    this.props.context.executeAction(actions.editSpreadsheet, {
      action: "ADD_ROW",
      _requestId: reqId,
      row: {
        startdate: moment().format("YYYY-MM-DD"),
        headline: us.getName() + "'s story"
      }
    });
  },
  toggleAnyoneCanEdit: function(event) {
    event.preventDefault();
    var ss = this.getStore("SpreadsheetStore");
    var target = !ss.anyoneCanEdit();
    this.props.context.executeAction(actions.editSpreadsheet, {
      action: "SET_ANYONE_CAN_EDIT",
      anyoneCanEdit: target
    });
    // Update state to include our goals for what we'd like ``anyoneCanEdit``
    // to be; which will be cleared when we get an update from the store.
    this.setState({
      _anyoneCanEditTarget: target,
      _anyoneCanEditChange: true
    });
  },
  render: function() {
    if (this.state.error) {
      return (
        <div>
          <h1>Error</h1>
          <p>Sorry, I tripped over myself there. Please refresh the page to try again.</p>
          <div>
            Technical details:<br />
            <small><pre>{this.state.error.toString()}</pre></small>
          </div>
        </div>
      )
    }

    // Editor rows
    var rows = _.map(this.state.data.rows, function(row, i) {
      return <RowEditor
                {...this.props}
                rowId={row.id}
                rowIndex={row._meta.index}
                key={"roweditor-" + i}
                onFocus={this.handleFocusRow}
              />;
    }.bind(this));

    // Permissions display.
    var permsDisplayText, permsButtonText;
    if (this.state.anyoneCanEdit === null) {
      permsDisplayText = "";
      permsButtonText = <i className='fa fa-spinner fa-spin' />
    } else if (this.state.anyoneCanEdit === true) {
      permsDisplayText = <span><i className='fa fa-unlock fa-fw' />Anyone can edit this.</span>;
      permsButtonText = "Lock it down";
    } else if (this.state.anyoneCanEdit === false) {
      permsDisplayText = <span><i className='fa fa-lock fa-fw' />Only select users can edit this.</span>;
      permsButtonText = "Let anyone edit";
    }
    if (this.state._anyoneCanEditChange) {
      permsButtonText = <i className='fa fa-spinner fa-spin' />
    }

    // Disabled state for "Add" button.
    var addDisabled = {disabled: !!this.state._requestId};

    // Source for the preview iframe
    var iframeSrc = this.state.previewUrlBase + '&source=' + this.state.timelineId + '#' + (this.state.focus ? this.state.focus : 0);

    // Page store for getting links.
    var ps = this.getStore("PageStore");

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
        <div className='six columns'>
          <p className='perms-control'>
            { permsDisplayText }{' '}
            <button onClick={this.toggleAnyoneCanEdit}>{ permsButtonText }</button>
          </p>
          <div className='preview-iframe-container'>
            <iframe id='timeline-preview' src={iframeSrc} height='650' width='40%' frameBorder='0'></iframe>
          </div>
        </div>
      </div>
    );
  }
});
module.exports = UpdateTimeline
