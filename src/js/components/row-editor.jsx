"use strict";
const _ = require("lodash");
const React = require("react");
const DatePicker = require("./date-picker.jsx");
const SpreadsheetStore = require("../stores/spreadsheet");
const actions = require("../actions");
const {Input} = require("react-bootstrap");

const Fa = require("./fa.jsx");
const TooltipFa = require("./tooltip-fa.jsx");
const UrlOrImgurUpload = require("./url-or-imgur-upload.jsx");
const CategoryInput = require("./category-input.jsx");

/**
 * React component for a single row's editing form.
 */
const RowEditor = React.createClass({
  contextTypes: {
    getStore: React.PropTypes.func.isRequired,
    executeAction: React.PropTypes.func.isRequired
  },
  componentDidMount: function() {
    this.context.getStore(SpreadsheetStore).addChangeListener(this.onChange);
  },
  componentWillUnmount: function() {
    this.context.getStore(SpreadsheetStore).removeChangeListener(this.onChange);
  },

  getInitialState: function() {
    return {row: _.extend({}, this._getRowFromStore())};
  },

  _getRowFromStore: function() {
    return this.context.getStore(SpreadsheetStore).getRowById(this.props.rowId);
  },
  onChange: function(payload) {
    // If upstream data has changed, check whether our revision has changed.
    // If it has, clobber the current state. NOTE: This means unsaved changes
    // in the current state will be lost.
    if (payload && payload.data && payload.data.rows) {
      let row = _.find(payload.data.rows, function(r) {
        return r.id === this.props.rowId;
      }.bind(this));
      if (row) {
        if (row._version !== this.state.row._version) {
          this.setState({row: row});
        }
      } else {
        // This row has been deleted upstream... we should no longer be rendering.
        console.log("Row", this.state.row._meta.index, "deleted upstream and should disappear soon.");
      }
    }
    // Do on next tick so that if we just clobbered state, dirty check still works.
    setTimeout(function() {
      this.checkDirty();
    }.bind(this), 1);
  },
  checkDirty: function() {
    // Check if the current state differs from that stored in the
    // SpreadsheetStore.
    let storeRow = this._getRowFromStore();
    let dirty = this.context.getStore(SpreadsheetStore).rowsDiffer(storeRow, this.state.row);
    let update = {dirty: dirty};
    if (!dirty && this.state.saving) {
      update.saving = false;
    }
    this.setState(update);
  },
  getInputProps: function(attr) {
    // Return the properties for an input in our form, based on the given
    // column name.
    return {
      value: this.state.row[attr],
      name: attr,
      onChange: function(event) {
        // Handle change of an input: set the state, and check dirty.
        if (event.target.value !== this.state.row[attr]) {
          let newRow = _.extend({}, this.state.row);
          newRow[attr] = event.target.value;
          this.setState({row: newRow});
          // Trigger onChange to update dirty state.  Run on next tick to
          // ensure that the state update has finished.
          setTimeout(function() { this.checkDirty(); }.bind(this), 1);
        }
      }.bind(this),
      onFocus: function() {
        if (this.props.onFocus) {
          this.props.onFocus(this.props.rowId);
        }
      }.bind(this)
    };
  },
  // Title type is special cased so we can use checkbox semantics rather than
  // text input. That means that its body is partially duplicated from the
  // ``getInputProps`` used by everything else.
  handleTitleTypeChange: function(event) {
    let newRow = _.extend({}, this.state.row);
    newRow.type = event.target.checked ? "title" : "";
    this.setState({row: newRow});
    setTimeout(function() { this.checkDirty(); }.bind(this), 1);
    if (this.props.onFocus) {
      this.props.onFocus(this.props.rowId);
    }
  },
  handleSubmit: function(event) {
    event.preventDefault();
    // Fire action for EDIT_SPREADSHEET_ROW, sending changes in this.state.row.
    this.setState({saving: true});
    let payload = {action: "CHANGE_ROW", row: this.state.row};
    this.context.executeAction(actions.editSpreadsheet, payload);
    if (this.props.onSave) {
      this.props.onSave();
    }
  },
  handleDelete: function(event) {
    event.preventDefault();
    this.setState({deleting: true});
    /* eslint-disable no-alert */
    if (confirm("Are you sure you want to delete this entry?")) {
      let payload = {action: "DELETE_ROW", row: this.state.row};
      this.context.executeAction(actions.editSpreadsheet, payload);
      if (this.props.onDelete) {
        this.props.onDelete();
      }
    }
    /* eslint-enable no-alert */
  },
  render: function() {
    let disableSubmit = { disabled: (this.state.saving || !this.state.dirty) };
    let inputCols = {labelClassName: 'col-xs-3', wrapperClassName: 'col-xs-9'};
    return (
      <form className='edit-row-form form-horizontal'
            onSubmit={this.handleSubmit}
            data-row-id={this.props.rowId}>
        <div className='container'>
          { _.isNumber(this.props.rowIndex) ? <span className='row-number'>{this.props.rowIndex + 1}</span> : "" }
          <div className='form-group'>
            <label className={`control-label ${inputCols.labelClassName}`}>
              Dates
            </label>
            <div className={inputCols.wrapperClassName}>
              <div className='form-inline'>
                <label>Start</label>{' '}
                <DatePicker {...this.getInputProps("startdate")}
                  className='form-control pick-a-date'
                  value={this.state.row._meta.startdateObj && this.state.row._meta.startdateObj.format("MM/DD/YYYY")}
                  />{' '}
                <label>End</label>{' '}
                <DatePicker {...this.getInputProps("enddate")}
                  className='form-control pick-a-date'
                  value={this.state.row._meta.enddateObj && this.state.row._meta.enddateObj.format("MM/DD/YYYY")}
                  />
              </div>
            </div>
          </div>

          <Input type='text' label='Headline' {...this.getInputProps("headline")} {...inputCols} />
          <Input type='textarea' label='Text' {...this.getInputProps("text")} {...inputCols} />
          <div className='form-group'>
            <label className={`control-label ${inputCols.labelClassName}`}>Media URL</label>
            <div className={inputCols.wrapperClassName}>
              <div className='media-link-list'>
                Any link to:
                <TooltipFa type="fw image" title="Images, gifs, pngs, jpgs" />
                <TooltipFa type="fw flickr" title="Flickr" />
                <TooltipFa type="fw instagram" title="Instagram" />
                <TooltipFa type="fw twitter" title="Twitter" />
                <TooltipFa type="fw vine" title="Vine" />
                <TooltipFa type="fw youtube" title="Youtube" />
                <TooltipFa type="fw vimeo-square" title="Vimeo" />
                <TooltipFa type="fw map-marker" title="Google Maps" />
                <TooltipFa type="fw google-plus" title="Google+" />
                <TooltipFa type="fw file-excel-o" title="Google Docs" />
                <TooltipFa type="fw soundcloud" title="Soundcloud" />
                <TooltipFa type="fw globe" title="The Internets" />
              </div>
              <UrlOrImgurUpload {...this.getInputProps('media')} />
            </div>
          </div>
          <Input type='text' label='Media Caption' {...this.getInputProps("mediacredit")} {...inputCols} />
          <div className='form-group'>
            <label className={`control-label ${inputCols.labelClassName}`}>
              Thumbnail link
            </label>
            <div className={inputCols.wrapperClassName}>
              <UrlOrImgurUpload {...this.getInputProps('mediathumbnail')} />
            </div>
          </div>
          <div className='form-group'>
            <div className={inputCols.labelClassName}/>
            <div className={inputCols.wrapperClassName}>
              <div className='form-inline'>
                <label>
                  <input type='checkbox' checked={this.state.row.type === 'title'}
                         onChange={this.handleTitleTypeChange} />
                  Title slide
                </label>
                {' '}
                <div className='pull-right'>
                  <label>Category</label>{' '}
                  <CategoryInput {...this.getInputProps("tag")} />
                </div>
              </div>
            </div>
          </div>
          <div className='form-group'>
            <div className={inputCols.labelClassName}/>
            <div className={inputCols.wrapperClassName}>
              <button type='submit' className='btn btn-primary'
                      onSubmit={this.handleSubmit} {...disableSubmit}>
                {this.state.saving ? <Fa type='spinner fw spin' /> : ""}
                Save
              </button>
              <a className='pull-right btn delete-link' href='#' onClick={this.handleDelete}>
                {this.state.deleting ? <Fa type='spinner fw spin' /> : ""}
                Delete
              </a>
            </div>
          </div>
        </div>
      </form>
    );
  }
});

module.exports = RowEditor;
