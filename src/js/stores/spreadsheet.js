var createStore = require("fluxible/utils/createStore");
var goog = require("../goog");
var _ = require("lodash");
var moment = require("moment");
var utils = require("../utils");
var options = require("../options");

var SpreadsheetStore = createStore({
  storeName: "SpreadsheetStore",
  initialize: function() {
    this.data = {};
  },
  // State info
  getData: function() {
    return this.data;
  },
  hasSpreadsheet: function() {
    return !!this.data.id;
  },
  hasError: function() {
    return !!this.error;
  },
  beginPolling: function() {
    console.log("beginPolling");
    this._fetchRows(); //XXX
    //this._pollInterval = setInterval(this._fetchRows.bind(this), 10000);
  },
  stopPolling: function() {
    this._pollInterval && clearInterval(this._pollInterval);
  },

  // Handlers
  handlers: {
    "EDIT_SPREADSHEET": "handleEditSpreadsheet",
    "SET_SPREADSHEET_ID": "handleSetSpreadsheetId",
  },

  handleApiError: function(err) {
    console.log("ERROR", err);
    this.error = err;
    this.emitChange();
  },
  handleSetSpreadsheetId: function(spreadsheetId) {
    if (spreadsheetId !== this.data.id) {
      if (spreadsheetId) {
        this._setData({id: spreadsheetId});
        this._fetchRows();
      } else {
        this._setData({});
      }
      this.emitChange();
    }
  },
  handleEditSpreadsheet: function(payload) {
    switch (payload.action) {
      case "ADD_ROW":
        this.data.rows.push(payload.row);
        this.emitChange();
        goog.addSpreadsheetRow(
          this.spreadsheetId, payload.row
        ).catch(this.handleApiError.bind(this));
        break;
      case "DELETE_ROW":
        this.data.rows.splice(payload.rowNum, 1);
        goog.removeSpreadsheetRow(
          this.spreadsheetId, payload.rowNum
        ).catch(this.handleApiError.bind(this));
        break;
      case "CHANGE_ROW":
        this.data.rows.splice(payload.rowNum, 1, payload.row);
        goog.editSpreadsheetRow(
          this.spreadsheetId, this.data.worksheetId, payload.row 
        ).catch(this.handleApiError.bind(this));
        break;
      default:
        throw new Error("Unknown action " + payload.action);
    }
    this.emitChange();
  },
  _setData: function(data) {
    this.data = data;
    _.each(this.data.rows || [], function(row) {
      row.startdateObj = this._parseDate(row.startdate);
      row.enddateObj = this._parseDate(row.enddate);
    }.bind(this));
    return this.data;
  },
  _parseDate: function(str) {
    if (!(str && str.trim && str.trim())) {
      return null;
    }
    var formats = [undefined, "MM-DD-YYY", "M-D-YYYY"];
    for (var i = 0; i < formats.length; i++) {
      var d = moment(str, formats[i]);
      if (d.isValid()) {
        return d;
      }
    }
    return null;
  },
  _fetchRows: function() {
    this.error = null;
    if (this.data.id) {
      goog.fetchSpreadsheet(this.data.id)
        .then(function(data) {
          _.extend(this.data, data);
          this._setData(this.data);
          this.emitChange();
        }.bind(this))
        .catch(this.handleApiError.bind(this));
    } else {
      this.data = {};
    }
  },
});
module.exports = SpreadsheetStore
