"use strict";
/**
 * These options can be overridden by passing an object to the ``mhtEditor``
 * function, e.g.:
 *
 *     mhtEditor({
 *       div: 'myDivId',
 *       googleClientId: '<google-client-id>',
 *       spreadsheetsCorsProxy: "https://localhost:5000",
 *       imgurClientId: '<imgur-client-id>'
 *     })
 */
module.exports = {
  /** Default template ID to use for creating new spreadsheets */
  templateId: "1BBVcQmmNoxsPoEHrJZJOomorOIdaSDN-09nTZtEknyk",
  /** URL parameter for oauth popups */
  redirectParam: "oauth2callback",
  /** URL parameter for timeline IDs */
  timelineParam: "timeline",
  /** URL parameter for edit mode */
  editParam: "edit",
  /** Proxy to use for adding CORS headers to Google Spreadsheets API responses. */
  spreadsheetsCorsProxy: "https://gspreadsheetscorsproxy2.herokuapp.com"
};
