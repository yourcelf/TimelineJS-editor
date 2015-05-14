"use strict";
const _ = require("lodash");
const moment = require("moment");
const FluxibleMixin = require('fluxible/addons/FluxibleMixin');
const React = require("react");
const ReactCSSTransitionGroup = require("react/addons").addons.CSSTransitionGroup;
const {Button, Col, Row, CollapsibleNav, DropdownButton, Navbar, Nav, NavItem,
  OverlayTrigger, MenuItem, Modal, ModalTrigger, Tooltip} = require("react-bootstrap");

const SpreadsheetStore = require("../stores/spreadsheet");
const PageStore = require("../stores/page");
const UserStore = require("../stores/user");
const actions = require("../actions");
const logger = require("../logger");

const SoftLink = require("./soft-link.jsx");
const RowEditor = require("./row-editor.jsx");
const Fa = require("./fa.jsx");

/**
 * React component for the main spreadsheet editor for timelines.
 */
const UpdateTimeline = React.createClass({
  mixins: [FluxibleMixin],
  statics: {
    storeListeners: [SpreadsheetStore, PageStore, UserStore]
  },
  _getStateFromStores: function() {
    let ps = this.getStore("PageStore");
    let ss = this.getStore("SpreadsheetStore");
    let us = this.getStore("UserStore");
    // FIXME: Doesn't feel right to update the state of SpreadsheetStore here..
    // is there a better way?  Can a Store obtain a reference to another Store?
    if (ss.getData().id !== ps.getTimelineId()) {
      this.props.context.executeAction(actions.setSpreadsheetId, ps.getTimelineId());
    }
    // Shallow copy the data/rows so we can do change comparison.
    let data = _.clone(ss.getData());
    data.rows = _.clone(data.rows);
    return {
      timelineId: ps.getTimelineId(),
      // URL for preview iframe without ``source=`` param or hash.
      previewUrlBase: 'https://s3.amazonaws.com/cdn.knightlab.com/libs/timeline/latest/embed/index.html?font=Bevan-PotanoSans&maptype=osm&lang=en',
      data: data,
      anyoneCanEdit: ss.anyoneCanEdit()
    };
  },
  getInitialState: function() {
    // Just return the standard state-from-stores.
    var state = this._getStateFromStores();
    state.iframeHeight = 650;
    return state;
  },
  onChange: function(payload) {
    // Detect whether we've changed, and should reload the iframe.
    let ss = this.getStore("SpreadsheetStore");
    if (ss.error) {
      this.setState({error: ss.error});
    }
    let dirty = false;
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
    // XXX open the modal instead
    if (this.state._requestId && payload.data && payload.data.rows) {
      for (let i = 0; i < payload.data.rows.length; i++) {
        if (payload.data.rows[i]._requestId === this.state._requestId) {
          this.setState({_requestId: undefined});
          // Break closure for the row, and set timeout so we can wait till
          // the dom has repainted.
          /* eslint-disable no-loop-func */
          (function(row) {
            setTimeout(function() {
              let el = document.querySelector("[data-row-id='" + row.id + "'] [name=headline]");
              el.scrollIntoView();
              el.focus();
            }, 1);
          })(payload.data.rows[i]);
          /* eslint-enable no-loop-func */
          break;
        }
      }
    }
  },
  reloadIframe: function() {
    // Add an arbitrary query param to force reload.
    let newUrl = this.state.previewUrlBase + '&_v';
    logger.debug("Reload iframe!", newUrl);
    this.setState({previewUrlBase: newUrl});
  },
  resizeIframe: _.debounce(function() {
    let container = document.querySelector('.mht-timeline-editor');
    let iframe = document.getElementById("timeline-preview");
    let containerRect = container.getBoundingClientRect();
    let iframeRect = iframe.getBoundingClientRect();
    this.setState({iframeHeight: containerRect.bottom - iframeRect.top - 5});
  }),
  componentDidMount: function() {
    this.resizeIframe();
    window.addEventListener("resize", this.resizeIframe);
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
    window.removeEventListener("resize", this.resizeIframe);
  },
  handleFocusRow: function(rowId) {
    // Given a rowId, find the date-sorted index to pass as the url hash to
    // the iframe.
    logger.debug("handleFocusRow", rowId);
    let sortedRows = _.sortBy(this.state.data.rows, function(r) {
      return r._meta.startdateObj;
    });
    for (let i = 0; i < sortedRows.length; i++) {
      if (sortedRows[i].id === rowId) {
        this.setState({focus: i});
        break;
      }
    }
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
    let reqId = "" + Math.random();
    this.setState({_requestId: reqId});

    // Set the user's name and current date as defaults for the new row.
    let us = this.getStore("UserStore");
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
    let ss = this.getStore("SpreadsheetStore");
    let target = !ss.anyoneCanEdit();
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
  toggleSidebar: function(event) {
    this.setState({showSidebar: !this.state.showSidebar});
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
      );
    }

    // Editor rows
    let rows = _.map(this.state.data.rows, function(row, i) {
      return <RowEditor
                {...this.props}
                rowId={row.id}
                rowIndex={row._meta.index}
                key={"roweditor-" + i}
                onFocus={this.handleFocusRow}
              />;
    }.bind(this));

    // Permissions display.
    let permsDisplayText, permsButtonText;
    if (this.state.anyoneCanEdit === null) {
      permsDisplayText = "";
      permsButtonText = <Fa type='spinner spin' />;
    } else if (this.state.anyoneCanEdit === true) {
      permsDisplayText = <span><Fa type='unlock fw' />Anyone can edit</span>;
      permsButtonText = "Lock it down";
    } else if (this.state.anyoneCanEdit === false) {
      permsDisplayText = <span><Fa type='lock fw' />Only some users can edit</span>;
      permsButtonText = "Let anyone edit";
    }
    if (this.state._anyoneCanEditChange) {
      permsButtonText = <Fa type='spinner spin' />;
    }

    // Disabled state for "Add" button.
    let addDisabled = {disabled: !!this.state._requestId};

    // Source for the preview iframe
    let iframeSrc = `${this.state.previewUrlBase}&source=${this.state.timelineId}&height=${this.state.iframeHeight}#${this.state.focus ? this.state.focus : 0}`;

    // Page store for getting links.
    let ps = this.getStore("PageStore");

    return (
      <div>
        <Navbar brand='Edit Timeline'>
          <Nav>
            <li>
              <span className='linkless-nav-item'>
                <button className='btn btn-primary btn-block' onClick={this.handleAddRow} {...addDisabled}>
                  { this.state._requestId ? <Fa type='spinner spin' /> : '' }
                  Add My Story
                </button>
              </span>
            </li>
            <li>
              <OverlayTrigger placement='bottom'
                              overlay={<Tooltip><b>Invite others to edit</b></Tooltip>}>
                <span className='linkless-nav-item'>
                  { this.state.shortUrl ? <input value={this.state.shortUrl} type='text' className='form-control' readOnly onFocus={this.handleFocusShortUrl} /> : '' }
                </span>
              </OverlayTrigger>
            </li>

            <DropdownButton title={<span><Fa type='cog'/> More</span>} eventKey={3}>
              <MenuItem eventKey='1' href={'https://docs.google.com/spreadsheet/ccc?key=' + this.state.timelineId} target='_blank'>
                View spreadsheet: <b>{this.state.data.title}</b> <Fa type='external-link' />
              </MenuItem>
              <MenuItem eventKey='2' onSelect={this.toggleAnyoneCanEdit}>
                { permsDisplayText }: { permsButtonText }
              </MenuItem>
              <MenuItem eventKey='3' onClick={this.toggleSidebar} href='#'>
                Edit all rows
              </MenuItem>
            </DropdownButton>
          </Nav>
          <Nav right>
            <li>
              <SoftLink {...this.props}
                href={ps.getLink("READ", this.state.timelineId)}
                html={<span><Fa type='link fw'/> Share result</span>} />
            </li>
          </Nav>
        </Navbar>

        <div className='hidden-xs timeline-preview-holder'>
          <iframe id='timeline-preview' src={iframeSrc} height={this.state.iframeHeight + "px"} width='100%' frameBorder='0'></iframe>
        </div>
        <div className={'sidebar-overlay' + (this.state.showSidebar ? '' : ' stow')}>
          <div className='container'>
            <Row>
              <a className='close' onClick={this.toggleSidebar}>close <Fa type='times' /></a>
            </Row>
            {rows}
          </div>
        </div>
      </div>
    );
  }
});
module.exports = UpdateTimeline;
