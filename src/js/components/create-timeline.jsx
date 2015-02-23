var React = require("react");
var PureRenderMixin = require("react/addons").PureRenderMixin;
var goog = require("../goog");
var actions = require("../actions");
var utils = require("../utils");
var options = require("../options");

/**
 * React component for a form for creating new timelines.
 */
var CreateTimeline = React.createClass({
  mixins: [PureRenderMixin],
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
      var that = this;
      goog.duplicateTemplate("Timeline: " + this.state.title, this.state.templateId).then(function(res) {
        that.props.context.executeAction(actions.setSpreadsheetId, res.id);
        that.props.context.executeAction(actions.navigate, {page: "UPDATE", timelineId: res.id});
        that.setState({disableForm: false});
      });
    }
  },
  getInitialState: function() {
    return {
      title: "",
      templateUrl: "",
      templateId: null,
      templateUrlError: false,
      disableForm: false
    };
  },
  handleTitleChange: function(event) {
    this.setState({title: event.target.value});
  },
  handleTemplateUrlChange: function(event) {
    var val = event.target.value;
    if (!val) {
      this.setState({
        templateUrl: "",
        templateId: null,
        templateUrlError: false
      });
      return
    }
    for (var i = 0; i < this.TEMPLATE_URL_PATTERNS.length; i++) {
      var match = this.TEMPLATE_URL_PATTERNS[i].exec(val);
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
      return <div>Creating timeline... <i className='fa fa-spinner fa-spin' /></div>
    } else {
      var templateUrlHelp = "";
      if (this.state.templateUrl === "") {
        templateUrlHelp = <span>
          If blank, the {' '}
          <a href={'https://drive.google.com/previewtemplate?id=' + options.templateId + '&mode=public'} target='_blank'>default template</a>
          {' '} will be used.
        </span>;
      } else if (this.state.templateUrlError) {
        templateUrlHelp = "Please paste the URL to a google spreadsheet or a timeline hosted on this site.";
      }
      return (
        <div className="six columns">
          <h1>Create Timeline</h1>
          <form onSubmit={this.handleSubmit}>
            <div>
              <input type='text'
                     name='title'
                     placeholder='Timeline title'
                     value={this.state.title}
                     onChange={this.handleTitleChange}
                     className="u-full-width"
                     required />
            </div>
            <div>
              <input type='url'
                     name='templateUrl'
                     placeholder='Template to copy'
                     value={this.state.templateUrl}
                     onChange={this.handleTemplateUrlChange}
                     className={"u-full-width" + (this.state.templateUrlError ? " error" : "")} />
              <span className={'help-block' + (this.state.templateUrlError ? " error" : "")}>
                {templateUrlHelp}
              </span>
            </div>
            <div>
              <button type='submit' className='mht-copy-template button-primary'>Create New Timeline</button>
            </div>
          </form>
        </div>
      );
    }
  }
});

module.exports = CreateTimeline
