module.exports = function editSpreadsheet(context, payload, done) {
  context.dispatch("EDIT_SPREADSHEET", payload);
};
