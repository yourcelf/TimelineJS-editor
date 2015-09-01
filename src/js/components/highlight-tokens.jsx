const _ = require("lodash");
const React = require("react");
const PureRenderMixin = require("react/addons").PureRenderMixin;
const utils = require("../utils");

const HighlightTokens = React.createClass({
  mixins: [PureRenderMixin],
  componentWillReceiveProps(newProps) {
    // split the given q into tokens.
    let tokens = newProps.q.trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^#a-z0-9 ]/g, '')
        .split(" ");
    // sort in descending length, so we highlight largest segment first.
    tokens = _.sortBy(tokens, (t) => -t.length);
    // Construct a regexp that or's each of the tokens.
    let regExp = new RegExp("(" + tokens.map((t) => utils.quoteRe(t)).join("|") + ")", "gi");
    // Split into parts.
    let parts = this.props.text.split(regExp);
    // regex.split with a single matching group always puts the matching
    // group in odd-numbered array elements.
    // "(group) stuff" will split as ["", "group", " stuff"].
    this.html = parts.map((part, i) => {
      if (i % 2 === 0) {
        // unmatched
        if (this.props.truncate && part.length > 50) {
          part = [part.substring(0, 20), "...", part.substring(part.length - 20)].join(" ")
        }
        return _.escape(part);
      } else {
        // matched. Highlight it.
        return `<strong>${_.escape(part)}</strong>`
      }
    }).join("");
  },
  render() {
    return <span dangerouslySetInnerHTML={{__html: this.html}} />
  }
});

module.exports = HighlightTokens;
