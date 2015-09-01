"use strict";
const _ = require('lodash');
const React = require('react');
const connectToStores = require("fluxible-addons-react/connectToStores");

const PageStore = require('../stores/page');
const actions = require('../actions');
const Fa = require("./fa.jsx");

const urlLib = require("url");
const resolveScriptRelativePath = require("../resolve-script-relative-path.js");
const getEmbedBaseUrl = function() {
  let relative = resolveScriptRelativePath('timelinejs/embed/index.html');
  if (relative.indexOf("http") === 0) {
    return relative;
  }
  return urlLib.resolve(document.URL, relative);
};

/**
 * React component for a read-only view of timelines.
 */
let ReadTimeline = React.createClass({
  contextTypes: {
    getStore: React.PropTypes.func.isRequired,
    executeAction: React.PropTypes.func.isRequired
  },
  handleNavEdit: function() {
    this.context.executeAction(actions.navigate, {
      page: 'UPDATE',
      timelineId: this.props.timelineId
    });
  },
  handleFocusTextarea: function(event) {
    event.target.select();
  },
  toggleEmbed: function() {
    this.setState({showEmbed: !(this.state && this.state.showEmbed)});
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
    let embedCode = `<iframe src='${this.props.embedBaseUrl}?source=${_.escape(this.props.timelineId)}&font=Bevan-PotanoSans&maptype=toner&lang=en&height=650' width='100%' height='650' frameBorder='0'></iframe>`;
    let showEmbed = this.state && this.state.showEmbed;

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
          <Fa type={'fw ' + (showEmbed ? 'caret-down' : 'caret-right')}/>
          Embed
        </button>
      </div>
      <div className='text-center clearfix'>
        {
          showEmbed ? (
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

ReadTimeline = connectToStores(ReadTimeline, [PageStore], (context, props) => ({
  timelineId: context.getStore(PageStore).getTimelineId(),
  embedBaseUrl: getEmbedBaseUrl()
}));

module.exports = ReadTimeline;
