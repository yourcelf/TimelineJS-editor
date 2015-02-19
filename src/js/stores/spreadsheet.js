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
    if (this._pollInterval) { clearInterval(this._pollInterval); }
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
        goog.editSpreadsheetRow(
          this.spreadsheetId, this.data.worksheetId, payload.row 
        ).then(function(row) {
          for (var i = 0; i < this.data.rows.length; i++) {
            if (this.data.rows[i].id === row.id) {
              this.data.rows[i] = row;
              break;
            }
          }
          this.emitChange();
        }.bind(this)).catch(this.handleApiError.bind(this));
        break;
      default:
        throw new Error("Unknown action " + payload.action);
    }
    this.emitChange();
  },
  spreadsheetsDiffer: function(data1, data2) {
    if (!!data1.rows !== !!data2.rows ||data1.rows.length !== data2.rows.length) {
      return true;
    } else if (!data1.rows) {
      return false;
    }
    for (var i = 0; i < data1.rows.length; i++) {
      if (this.rowsDiffer(data1.rows[i], data2.rows[i])) {
        return true;
      }
    }
    return false;
  },
  rowsDiffer: function(row1, row2) {
    return _.some(row1, function(val, key) {
      // Skip the '_raw' key which will have timestamps and won't play nice
      // with "===".
      if (key === "_raw") {
        return false;
      }
      return val !== row2[key];
    });
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
module.exports = SpreadsheetStore;
