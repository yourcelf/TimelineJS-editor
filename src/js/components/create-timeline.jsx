"use strict";
const _ = require("lodash");
const React = require("react");
const PureRenderMixin = require("react/addons").PureRenderMixin;
const goog = require("../goog");
const actions = require("../actions");
const utils = require("../utils");
const options = require("../options");
const {Input, Col} = require("react-bootstrap");
const Fa = require("./fa.jsx");

/**
 * React component for a form for creating new timelines.
 */
const CreateTimeline = React.createClass({
  mixins: [PureRenderMixin],
  contextTypes: {
    executeAction: React.PropTypes.func.isRequired
  },
  TEMPLATE_URL_PATTERNS: [
    /docs.google.com\/spreadsheet\/.*\?.*key=([^&#]+)/i,
    /docs.google.com\/spreadsheets\/d\/([^\/]+)\/edit/i,
    /drive.google.com\/previewtemplate\/?\?.*id=([^&#]+)/i,
    new RegExp(
      utils.quoteRe(window.location.pathname) + "\?.*" +
      utils.quoteRe(options.timelineParam) + "=([^&#]+)"
    , "i")
  ],
  handleSubmit: function(event) {
    event.preventDefault();
    if (this.state.title && !this.state.templateUrlError) {
      this.setState({disableForm: true});
      let that = this;
      goog.createSpreadsheet("Timeline: " + this.state.title, this.state.templateId || options.templateId).then(function(spreadsheetId) {
        that.context.executeAction(actions.setSpreadsheetId, spreadsheetId);
        that.context.executeAction(actions.navigate, {page: "UPDATE", timelineId: spreadsheetId});
        that.setState({disableForm: false});
      }).catch(function(err) {
        console.log("duplicateTemplate error", err);
        that.setState({duplicateError: err, disableForm: false});
      });
    }
  },
  getInitialState: function() {
    return {
      title: "",
      templateUrl: "",
      templateId: null,
      templateUrlError: false,
      duplicateError: false,
      disableForm: false
    };
  },
  handleTitleChange: function(event) {
    this.setState({title: event.target.value});
  },
  handleTemplateUrlChange: function(event) {
    let val = event.target.value;
    if (!val) {
      this.setState({
        templateUrl: "",
        templateId: null,
        templateUrlError: false
      });
      return;
    }
    for (let i = 0; i < this.TEMPLATE_URL_PATTERNS.length; i++) {
      let match = this.TEMPLATE_URL_PATTERNS[i].exec(val);
      if (match) {
        this.setState({
          templateUrl: val, templateId: match[1], templateUrlError: false
        });
        return;
      }
    }

    this.setState({
      templateUrl: val,
      templateId: null,
      templateUrlError: true
    });
  },
  render: function() {
    if (this.state.disableForm) {
      return <div>Creating timeline... <Fa type='spinner spin' /></div>;
    } else {
      let templateUrlHelp = "";
      let hasError = false;
      if (this.state.duplicateError) {
        templateUrlHelp = "Error copying the template timeline.";
        if (this.state.duplicateError.message) {
          templateUrlHelp += ` Google says: ${_.escape(this.state.duplicateError.message)}`;
        }
        hasError = true;
      } else if (this.state.templateUrlError) {
        templateUrlHelp = "Please paste the URL to a google spreadsheet or a timeline hosted on this site.";
        hasError = true;
      } else if (this.state.templateUrl === "") {
        templateUrlHelp = <span>
          If blank, the {' '} <a href={`https://docs.google.com/spreadsheet/ccc?key=${options.templateId}&mode=public`} target='_blank'>default template</a> {' '} will be used.
        </span>
      }

      return (
        <Col sm={6}>
          <h1>Create Timeline</h1>
          <form onSubmit={this.handleSubmit}>
            <div>
              <Input type='text'
                     name='title'
                     placeholder='Timeline title'
                     value={this.state.title}
                     onChange={this.handleTitleChange}
                     required />
            </div>
            <div className={hasError ? "has-error" : ""}>
              <Input type='url'
                     name='templateUrl'
                     placeholder='Template to copy'
                     value={this.state.templateUrl}
                     onChange={this.handleTemplateUrlChange}
                     help={templateUrlHelp} />
            </div>
            <div>
              <button type='submit' className='mht-copy-template btn btn-primary'>Create New Timeline</button>
            </div>
          </form>
        </Col>
      );
    }
  }
});

module.exports = CreateTimeline;
