"use strict";
const _ = require("lodash");
const React = require("react");
const PureRenderMixin = require("react/addons").PureRenderMixin;
const options = require("../options");

console.log(options);

const CategoryInput = React.createClass({
  mixins: [PureRenderMixin],
  onSelect(event) {
    this.props.onChange({target: {value: event.currentTarget.value}});
  },
  render() {
    if (options.tags) {
      return (
        <select className='form-control'
                name={this.props.name}
                onChange={this.onSelect}
                defaultValue={this.props.value} >
          <option value=''>----</option>
          {_.map(options.tags, (tag) => (<option value={tag}>{tag}</option>))}
        </select>
      );
    } else {
      return <input className='form-control' {...this.props} />;
    }
  }
});

module.exports = CategoryInput;
