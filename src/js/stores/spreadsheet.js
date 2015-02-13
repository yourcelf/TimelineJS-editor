var createStore = require("fluxible/utils/createStore");
var goog = require("../goog");
var _ = require("lodash");
var moment = require("moment");
var utils = require("../utils");
var options = require("../options");

var SpreadsheetStore = createStore({
  storeName: "SpreadsheetStore",
  initialize: function() {
    this._setData(utils.lsGet("mhtSpreadsheetData", {}));
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
    console.log("beginPolling"); //XXX
    //this._fetchRows();
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
  handleEditSpreadsheet: function(props) {
    switch (props.action) {
      case "ADD_ROW":
        this.data.rows.push(props.row);
        this.emitChange();
        goog.addSpreadsheetRow(
          this.spreadsheetId, props.row
        ).catch(this.handleApiError.bind(this));
        break;
      case "DELETE_ROW":
        this.data.rows.splice(props.rowNum, 1);
        goog.removeSpreadsheetRow(
          this.spreadsheetId, props.rowNum
        ).catch(this.handleApiError.bind(this));
        break;
      case "CHANGE_ROW":
        this.data.rows.splice(props.rowNum, 1, props.row);
        goog.editSpreadsheetRow(
          this.spreadsheetId, props.rowNum, props.row
        ).catch(this.handleApiError.bind(this));
        break;
      default:
        throw new Error("Unknown action " + props.action);
    }
    this.emitChange();
    utils.lsSet("mhtSpreadsheetData", this.data);
  },
  _setData: function(data) {
    this.data = utils.lsSet("mhtSpreadsheetData", data || {});
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
      goog.fetchSpreadsheet(this.data.id).then(
        function(data) {
          _.extend(this.data, data);
          this._setData(this.data);
          this.emitChange();
        }.bind(this)
      ).catch(this.handleApiError.bind(this));
    } else {
      utils.lsSet("mhtSpreadsheetData", {});
    }
  },
});
module.exports = SpreadsheetStore
