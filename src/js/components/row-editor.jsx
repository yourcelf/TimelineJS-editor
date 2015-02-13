var _ = require("lodash");
var React = require("react");
var DatePicker = require("./date-picker.jsx");

var actions = require("../actions");


var RowEditor = React.createClass({
  getInitialState: function() {
    return _.extend({dirty: false}, this.props.row);
  },
  inputProps: function(attr) {
    return {
      value: this.state[attr],
      name: attr,
      onChange: function(event) {
        if (event.target.value !== this.state[attr]) {
          var obj = {dirty: true};
          obj[attr] = event.target.value;
          console.log("state update", obj);
          this.setState(obj);
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
  },
  render: function() {
    var disableSubmit = this.state.dirty ? {} : {disabled: true};
    return (
      <form className='edit-row-form'>
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
        <button type='submit' className='button-primary' onSubmit={this.handleSubmit} {...disableSubmit}>Save</button>
      </form>
    );
  }
});

module.exports = RowEditor
