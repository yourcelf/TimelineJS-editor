"use strict";
const React = require('react');
const FluxibleMixin = require('fluxible/addons/FluxibleMixin');
const PureRenderMixin = require("react/addons").PureRenderMixin;
const _ = require('lodash');
const PageStore = require('../stores/page');
const actions = require('../actions');
const Fa = require("./fa.jsx");

/**
 * React component for a read-only view of timelines.
 */
const ReadTimeline = React.createClass({
  mixins: [FluxibleMixin, PureRenderMixin],
  statics: {storeListeners: [PageStore]},
  _getStateFromStores: function() {
    let ps = this.getStore('PageStore');
    return {timelineId: ps.getTimelineId()};
  },
  getInitialState: function() {
    return this._getStateFromStores();
  },
  onChange: function() {
    this.setState(this._getStateFromStores());
  },
  handleNavEdit: function() {
    this.props.context.executeAction(actions.navigate, {
      page: 'UPDATE',
      timelineId: this.state.timelineId
    });
  },
  handleFocusTextarea: function(event) {
    event.target.select();
  },
  toggleEmbed: function() {
    this.setState({showEmbed: !this.state.showEmbed});
  },
  render: function() {
    let encUrl = encodeURIComponent(document.URL);
    let icons = [
      // [ Service name, icon class, URL ]
      ["Twitter", "twitter", `https://twitter.com/home?status=${encUrl}`],
      ["Facebook", "facebook", `https://www.facebook.com/sharer.php?u=${encUrl}`],
      ["Email", "envelope", `mailto:?subject=${encodeURIComponent("Check out my timeline")}&body=${encUrl}`],
      ["Tumblr", "tumblr", `https://www.tumblr.com/share/link?url=${encUrl}`],
      ["Google+", "google-plus", `https://plus.google.com/share?url=${encUrl}`]
    ];

    // We're dangerously-set-inner-html-ifying this so that we can use it both
    // as a TextArea value and as the embed.  So be careful to escape any user
    // input in it (e.g. the timeline ID).
    let embedCode = "<iframe src='https://s3.amazonaws.com/cdn.knightlab.com/libs/timeline/latest/embed/index.html?source=" + _.escape(this.state.timelineId) + "&font=Bevan-PotanoSans&maptype=toner&lang=en&height=650' width='100%' height='650' frameBorder='0'></iframe>";

    return <div>
      <div dangerouslySetInnerHTML={{__html: embedCode}} />
      <h2 className='text-center'>Share</h2>
      <div className='social-links text-center'>
        {
          icons.map((icon, i) => (
              <a href={icon[2]}
                 title={"Share with " + icon[0]}
                 key={'sharing-icon-' + i}
                 target='_blank'
                 className='btn btn-default btn-lg'>
                <Fa type={'2x ' + icon[1]} />
                <span className='sr-only'>{icon[0]}</span>
              </a>
          ))
        }
      </div>
      <div className='text-center'>
        <button onClick={this.toggleEmbed} className='btn btn-default'>
          <Fa type={'fw ' + (this.state.showEmbed ? 'caret-down' : 'caret-right')}/>
          Embed
        </button>
      </div>
      <div className='text-center clearfix'>
        {
          this.state.showEmbed ? (
            <span>
              <p>Paste this code into your blog or website to embed this timeline there.</p>
              <textarea className='form-control' rows='4' cols='60' value={embedCode}
                  onFocus={this.handleFocusTextarea} readOnly/>
            </span>
          ) : ""
        }
      </div>
      <div className='text-center'>
        <button onClick={this.handleNavEdit} className='btn btn-default'>Edit Timeline</button>
      </div>
    </div>;
  }
});
module.exports = ReadTimeline;
