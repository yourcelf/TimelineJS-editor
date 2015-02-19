var _ = require("lodash");
var React = require("react");
var FluxibleMixin = require('fluxible').Mixin
var DatePicker = require("./date-picker.jsx");
var SpreadsheetStore = require("../stores/spreadsheet");

var actions = require("../actions");


var RowEditor = React.createClass({
  mixins: [FluxibleMixin],
  statics: {
    storeListeners: [SpreadsheetStore]
  },

  getInitialState: function() {
    this.ss = this.getStore("SpreadsheetStore")
    return {row: _.extend({}, this._getRowFromStore())};
  },

  _getRowFromStore: function() {
    return this.ss.getData().rows[this.props.rowIndex];
  },
  onChange: function(payload) {
    // If upstream data has changed, check whether our revision has changed.
    // If it has, clobber the current state.
    if (payload && payload.data && payload.data.rows) {
      var row = _.find(payload.data.rows, function(r) {
        return r.id === this.state.row.id;
      }.bind(this));
      if (row) {
        if (row._version !== this.state.row._version) {
          this.setState({row: row});
        }
      } else {
        // This row has been deleted upstream... we should no longer be rendering.
        console.log("OH NOES Deleted upstream??");
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
    var storeRow = this._getRowFromStore();
    var dirty = this.ss.rowsDiffer(storeRow, this.state.row);
    var update = {dirty: dirty};
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
          var newRow = _.extend({}, this.state.row);
          newRow[attr] = event.target.value;
          this.setState({row: newRow});
          // Trigger onChange to update dirty state.  Run on next tick to
          // ensure that the state update has finished.
          setTimeout(function() { this.checkDirty(); }.bind(this), 1);
        }
      }.bind(this),
      onFocus: function() {
        this.props.onFocus && this.props.onFocus(this.props.rowIndex);
      }.bind(this)
    };
  },
  handleTitleTypeChange: function(event) {
    this.setState({type: event.target.checked ? "title" : ""})
    this.props.onFocus && this.props.onFocus(this.props.rowIndex);
  },
  handleSubmit: function(event) {
    event.preventDefault();
    // Fire action for EDIT_SPREADSHEET_ROW, sending changes in this.state.row.
    this.setState({saving: true});
    var payload = {action: "CHANGE_ROW", row: this.state.row};
    this.props.context.executeAction(actions.editSpreadsheet, payload);
  },
  handleDelete: function(event) {
    event.preventDefault();
    if (confirm("Are you sure you want to delete this entry?")) {
      var payload = {action: "DELETE_ROW", row: this.state.row};
      this.props.context.executeAction(actions.editSpreadsheet, payload);
    }
  },
  render: function() {
    var disableSubmit = {
      disabled: (this.state.saving || !this.state.dirty || !this.state.row.id)
    };
    return (
      <form className='edit-row-form'
            onSubmit={this.handleSubmit}
            data-row-id={this.state.row.id}>
        <span className='row-number'>{this.props.rowIndex + 1}</span>
        <div className='row'>
          <div className='six columns'>
            <label>Start Date</label>
            <DatePicker {...this.getInputProps("startdate")}
              value={this.state.row._meta.startdateObj && this.state.row._meta.startdateObj.format("YYYY-MM-DD")}
              />
          </div>
          <div className='six columns'>
            <label>End Date</label>
            <DatePicker {...this.getInputProps("enddate")}
              value={this.state.row._meta.enddateObj && this.state.row._meta.enddateObj.format("YYYY-MM-DD")}
              />
          </div>
        </div>
        <div>
          <label>Headline</label>
          <input {...this.getInputProps("headline")} type='text' className='u-full-width' />
        </div>
        <div>
          <label>Text</label>
          <textarea {...this.getInputProps("text")} rows='4' cols='40' className='u-full-width'/>
        </div>
        <div>
          <label>Media</label>
          <input {...this.getInputProps("media")} type='url' className='u-full-width' />
        </div>
        <div>
          <label>Media Credit</label>
          <input {...this.getInputProps("mediacredit")} type='text' className='u-full-width' />
        </div>
        <div>
          <label>Media Thumbnail URL</label>
          <input {...this.getInputProps("mediathumbnail")} type='url' className='u-full-width' />
        </div>
        <div className='row'>
          <div className='four columns'>
            <label>
              Title slide{' '}
              <input value='title' name='type' type='checkbox'
                checked={this.state.row.type === 'title'}
                onChange={this.handleTitleTypeChange} />
            </label>
          </div>
          <div className='eight columns'>
            <label>
                Tag{' '}
                <input {...this.getInputProps("tag")} type='text' />
            </label>
          </div>
        </div>
        <div className='row'>
          <div className='six columns'>
            <button type='submit' className='button-primary' onSubmit={this.handleSubmit} {...disableSubmit}>
              {this.state.saving ? <i className='fa fa-spinner fa-fw fa-spin' /> : ""}
              {this.state.saving}
              Save
            </button>
          </div>
          <div className='six columns'>
            <a className='u-pull-right button delete-link' href='#'
              onClick={this.handleDelete}>Delete</a>
          </div>
        </div>
      </form>
    );
  }
});

module.exports = RowEditor
