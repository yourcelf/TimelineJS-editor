module.exports = function setSpreadsheet(context, payload, done) {
  context.dispatch("SET_SPREADSHEET", payload);
};
