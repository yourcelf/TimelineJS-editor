var React = require("react");
var goog = require("../goog");
var actions = require("../actions");
var utils = require("../utils");
var options = require("../options");

var CreateTimeline = React.createClass({
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
      goog.duplicateTemplate("Timeline: " + this.state.title, this.state.templateId).then(function(res) {
        this.props.context.executeAction(actions.setSpreadsheet, res);
        this.props.context.executeAction(actions.navigate, {page: "UPDATE"});
        this.setState({disableForm: false});
      }.bind(this));
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
      return <div>Creating timeline... <img src='https://s3.amazonaws.com/cdn.knightlab.com/libs/timeline/latest/css/loading.gif?v3.4' /></div>
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
        <div>
          <h1>Create Timeline</h1>
          <form onSubmit={this.handleSubmit}>
            <div>
              <input type='text'
                     name='title'
                     placeholder='Timeline title'
                     value={this.state.title}
                     onChange={this.handleTitleChange}
                     required />
            </div>
            <div>
              <input type='url'
                     name='templateUrl'
                     placeholder='Template to copy'
                     value={this.state.templateUrl}
                     onChange={this.handleTemplateUrlChange}
                     className={this.state.templateUrlError ? "error" : ""} />
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
