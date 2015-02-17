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
    return _.extend({}, this._getRowFromStore());
  },

  _getRowFromStore: function() {
    var ss = this.getStore("SpreadsheetStore");
    return ss.getData().rows[this.props.rowIndex];
  },
  onChange: function(payload) {
    // mostly ignore onChange from SpreadsheetStore, except to use it as a
    // trigger to check dirty state.
    /*
    var dirty = _.some(this._getRowFromStore(), function(val, key) {
      if (val !== this.state[key]) {
        console.log(this.props.rowIndex, val, this.state[key]);
      }
      return val !== this.state[key];
    }.bind(this));
    var update = {dirty: dirty};
    if (!dirty && this.state.saving) {
      update.saving = false;
    }
    console.log("update", update);
    this.setState(update);
    */
  },
  inputProps: function(attr) {
    return {
      value: this.state[attr],
      name: attr,
      onChange: function(event) {
        if (event.target.value !== this.state[attr]) {
          var obj = {}
          obj[attr] = event.target.value;
          this.setState(obj);
          this.onChange();
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
    // Fire action for EDIT_SPREADSHEET_ROW. for this.props.row.
    this.setState({saving: true});
    var payload = {
      action: "CHANGE_ROW",
      row: this.state
    };
    this.props.context.executeAction(actions.editSpreadsheet, payload);
  },
  render: function() {
    var disableSubmit = {disabled: false}; //(this.state.saving || !this.state.dirty || !this.state.id)};
    return (
      <form className='edit-row-form' onSubmit={this.handleSubmit}>
        <span className='row-number'>{this.props.rowIndex + 1}</span>
        <div className='row'>
          <div className='six columns'>
            <label>Start Date</label>
            <DatePicker {...this.inputProps("startdate")}
              value={this.state.startdateObj && this.state.startdateObj.format("YYYY-MM-DD")}
              />
          </div>
          <div className='six columns'>
            <label>End Date</label>
            <DatePicker {...this.inputProps("enddate")}
              value={this.state.enddateObj && this.state.enddateObj.format("YYYY-MM-DD")}
              />
          </div>
        </div>
        <div>
          <label>Headline</label>
          <input {...this.inputProps("headline")} type='text' className='u-full-width' />
        </div>
        <div>
          <label>Text</label>
          <textarea {...this.inputProps("text")} rows='4' cols='40' className='u-full-width'/>
        </div>
        <div>
          <label>Media</label>
          <input {...this.inputProps("media")} type='url' className='u-full-width' />
        </div>
        <div>
          <label>Media Credit</label>
          <input {...this.inputProps("mediacredit")} type='text' className='u-full-width' />
        </div>
        <div>
          <label>Media Thumbnail URL</label>
          <input {...this.inputProps("mediathumbnail")} type='url' className='u-full-width' />
        </div>
        <div>
          <label>
            Title slide{' '}
            <input value='title' name='type' type='checkbox'
              checked={this.state.type === 'title'}
              onChange={this.handleTitleTypeChange} />
          </label>
        </div>
        <div>
          <label>Tag</label>
          <input {...this.inputProps("tag")} type='text' className='u-full-width' />
        </div>
        <button type='submit' className='button-primary' onSubmit={this.handleSubmit} {...disableSubmit}>
          {this.state.saving ? <i className='fa fa-spinner fa-fw fa-spin' /> : ""}
          {this.state.saving}
          Save
        </button>
      </form>
    );
  }
});

module.exports = RowEditor
