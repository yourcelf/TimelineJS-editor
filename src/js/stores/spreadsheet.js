var createStore = require("fluxible/utils/createStore");
var goog = require("../goog");
var _ = require("lodash");
var utils = require("../utils")

var SpreadsheetStore = createStore({
  storeName: "SpreadsheetStore",
  initialize: function() {
    this.spreadsheetId = utils.lsGet("mhtSpreadsheetId", null);
    this.rows = utils.lsGet("mhtSpreadsheetRows", [], {json: true});
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
        utils.lsSet("mhtSpreadsheetRows", rows, {json: true});
        this.emitChange();
      }
    }.bind(this));
  },
  hasSpreadsheet: function() {
    return !!this.spreadsheetId;
  },
  handlers: {
    "EDIT_SPREADSHEET": "handleEditSpreadsheet",
    "SET_SPREADSHEET": "handleSetId",
    "UNSET_SPREADSHEET": "handleUnsetSpreadsheet"
  },
  handleUnsetSpreadsheet: function(data) {
    this.spreadsheetId = utils.lsSet("mhtSpreadsheetId", "");
    this.rows = utils.lsSet("mhtSpreadsheetRows", []);
    this.emitChange();
  },
  handleSetId: function(data) {
    console.log(data);
    this.spreadsheetId = utils.lsSet("mhtSpreadsheetId", data.id);
    this.rows = utils.lsSet("mhtSpreadsheetRows", this.rows);
    this.emitChange();
    this._fetchRows();
  },
  handleEditSpreadsheet: function(props) {
    switch (props.action) {
      case "ADD_ROW":
        this.rows.push(props.row);
        utils.lsSet("mhtSpreadsheetRows", rows);
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
        utils.lsSet("mhtSpreadsheetRows", rows);
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
        utils.lsSet("mhtSpreadsheetRows", rows);
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
