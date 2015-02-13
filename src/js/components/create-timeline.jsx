var React = require("react");
var goog = require("../goog");
var setSpreadsheet = require("../actions").setSpreadsheet
var utils = require("../utils");
var options = require("../options");

var CreateTimeline = React.createClass({
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
    // Match google URLs type 1.
    var match = /docs.google.com\/spreadsheet\/.*\?.*key=([^&#]+)/i.test(val);
    if (match) {
      var params = utils.decodeParams(val);
      this.setState({templateUrl: val, templateId: params.key, templateUrlError: false});
      return
    }
    // Match google URLs type 2.
    var match = /docs.google.com\/spreadsheets\/d\/([^\/]+)\/edit/i.exec(val);
    if (match) {
      this.setState({templateUrl: val, templateId: match[1], templateUrlError: false});
      return
    }
    // Match our own timeline URLs.
    var timelineRe =  new RegExp(
      utils.quoteRe(window.location.pathname) +
        "?.*" +
        utils.quoteRe(options.timelineParam) +
        "=[^&#]+"
      , "i");
    match = timelineRe.test(val);
    if (match) {
      var params = utils.decodeParams(val);
      this.setState({
        templateUrl: val,
        templateId: params[options.timelineParam],
        templateUrlError: false
      });
      return;
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
      return (
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
                   onChange={this.handleTemplateUrlChange} />
            <span className={'help-text' + (this.state.templateUrlError ? " error" : "")}>
              {this.state.templateUrl ? "" : "If blank, the default template will be used."}
              {this.state.templateUrlError ? "Please paste the URL to a google spreadsheet or a timeline hosted on this site." : "" }
            </span>
          </div>
          <div>
            <button type='submit' className='mht-copy-template'>Create Timeline</button>
          </div>
        </form>
      );
    }
  }
});

module.exports = CreateTimeline
