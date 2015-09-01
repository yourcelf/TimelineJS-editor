"use strict";
const _ = require("lodash");
const React = require("react");
const Fa = require("./fa.jsx");
const HighlightTokens = require("./highlight-tokens.jsx");
const SpreadsheetStore = require("../stores/spreadsheet");
const {NavDropdown, MenuItem, Input, Button} = require("react-bootstrap");

const SearchTimeline = React.createClass({
  contextTypes: {
    getStore: React.PropTypes.func.isRequired,
    executeAction: React.PropTypes.func.isRequired
  },
  componentDidMount: function() {
    this.context.getStore(SpreadsheetStore).addChangeListener(this.onChange);
  },
  componentWillUnmount: function() {
    this.context.getStore(SpreadsheetStore).removeChangeListener(this.onChange);
  },
  getInitialState: function() {
    return {q: "", results: [], open: false};
  },
  onChange: function(payload) {
    if (this.state.q) {
      let results = this.executeSearch(this.state.q);
      this.setState({results: results});
    }
  },
  handleQueryChange: function(event) {
    let q = event.target.value;
    let results = this.executeSearch(q);
    this.setState({q: q, results: results});
  },
  executeSearch: function(q) {
    let results;
    if (!q) {
      results = [];
    } else {
      let tokens = q.trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^#a-z0-9 ]/g, '')
        .split(" ");
      let fields = ["text", "headline", "tag"];
      results = _.filter(this.context.getStore(SpreadsheetStore).getData().rows, (row) => {
        return _.all(tokens, (token) => {
          return _.any(fields, (field) => {
            return row[field] && row[field].toLowerCase().indexOf(token) !== -1;
          });
        });
      });
    }
    return results;
  },
  selectResult: function(resultId) {
    this.props.onFocus(resultId);
    // close dropdown?
  },
  onToggle: function(isOpen) {
    if (isOpen) {
      // hack...
      setTimeout(() => {
        let container = React.findDOMNode(this.refs["search-input"]);
        let input = container.getElementsByTagName("input")[0];
        input.focus()
      }, 10)
    }
  },
  noAction: function(event) {
    event.preventDefault();
    event.stopPropagation();
  },
  render: function() {
    let rows = _.map(this.state.results, (result, i) => (
      <MenuItem key={`result-${i}`} onSelect={() => this.selectResult(result.id)}>
        <h4><HighlightTokens text={result.headline} q={this.state.q} /></h4>
        { result.text ?
          <HighlightTokens text={result.text} q={this.state.q} truncate={true} />
          : "" }
      </MenuItem>
    ));
    return (
      <NavDropdown title={<Fa type='search'/>}
                   eventKey={1}
                   noCaret={true}
                   onToggle={this.onToggle}
                   id='search' pullRight
                 >

        <MenuItem disabled>
          <Input
            ref='search-input'
            placeholder='Search'
            type='text'
            value={this.state.q}
            onChange={this.handleQueryChange}
          />
        </MenuItem>
        {(rows.length === 0 && this.state.q) ? <MenuItem disabled>No results</MenuItem> : rows}
      </NavDropdown>
    );
  }
});

module.exports = SearchTimeline;
