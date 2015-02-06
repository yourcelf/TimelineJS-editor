var createStore = require("fluxible/utils/createStore");
var goog = require("../goog");
var _ = require("lodash");

var lsGet = function(key, defaultValue) {
  var val = window.localStorage && localStorage.getItem(key);
  return typeof val === "undefined" ? defaultValue : val;
};
var lsSet = function(key, val) {
  window.localStorage && localStorage.setItem(key, val);
  return val;
};
var SpreadsheetStore = createStore({
  storeName: "SpreadsheetStore",
  initialize: function() {
    this.spreadsheetId = lsGet("mhtSpreadsheetId", null);
    this.rows = lsGet("mhtSpreadsheetRows", []);
    if (this.hasSpreadsheet()) {
      this._fetchRows();
    }
  },
  _fetchRows: function() {
    goog.fetchSpreadsheet(this.spreadsheetId, function(err, rows) {
      if (err) {
        this.error = err;
        this.emitChange();
      } else {
        this.rows = rows;
        lsSet("mhtSpreadsheetRows", rows);
        this.emitChange();
      }
    }.bind(this));
  },
  hasSpreadsheet: function() {
    return !!this.spreadsheetId;
  },
  handlers: {
    "EDIT_SPREADSHEET": "handleEditSpreadsheet",
    "SET_SPREADSHEET": "handleSetId"
  },
  handleSetId: function(id) {
    this.spreadsheetId = lsSet("mhtSpreadsheetId", id);
    this.rows = lsSet("mhtSpreadsheetRows", []);
    this.emitChange();
    this._fetchRows();
  },
  handleEditSpreadsheet: function(props) {
    switch (props.action) {
      case "ADD_ROW":
        this.rows.push(props.row);
        lsSet("mhtSpreadsheetRows", rows);
        this.emitChange();
        goog.addSpreadsheetRow(this.spreadsheetId, props.row, function(err) {
          if (err) {
            this.error = err;
            this.emitChange();
          }
        }.bind(this));
        break;
      case "DELETE_ROW":
        this.rows.splice(props.rowNum, 1);
        lsSet("mhtSpreadsheetRows", rows);
        this.emitChange();
        goog.removeSpreadsheetRow(this.spreadsheetId, props.rowNum, function(err) {
          if (err) {
            this.error = err;
            this.emitChange();
          }
        }.bind(this));
        break;
      case "CHANGE_ROW":
        this.rows.splice(props.rowNum, 1, props.row);
        lsSet("mhtSpreadsheetRows", rows);
        this.emitChange();
        goog.editSpreadsheetRow(this.spreadsheetId, props.rowNum, props.row, function(err) {
          if (err) {
            this.error = err;
            this.emitChange();
          }
        }.bind(this));
        break;
      default:
        throw new Error("Unknown action " + props.action);
    }
  },
  getJSON: function() {
    // Return JSON for the current rows in the format that TimelineJS wants.
    // TODO
  }
});
module.exports = SpreadsheetStore
