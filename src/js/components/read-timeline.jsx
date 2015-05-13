var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var PureRenderMixin = require("react/addons").PureRenderMixin;
var _ = require('lodash');
var PageStore = require('../stores/page');
var actions = require('../actions');

/**
 * React component for a read-only view of timelines.
 */
var ReadTimeline = React.createClass({
  mixins: [FluxibleMixin, PureRenderMixin],
  statics: {storeListeners: [PageStore]},
  _getStateFromStores: function() {
    var ps = this.getStore('PageStore');
    return {
      timelineId: ps.getTimelineId(),
    }
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
    var encUrl = encodeURIComponent(document.URL);
    var icons = [
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
    var embedCode = "<iframe src='https://s3.amazonaws.com/cdn.knightlab.com/libs/timeline/latest/embed/index.html?source=" + _.escape(this.state.timelineId) + "&font=Bevan-PotanoSans&maptype=toner&lang=en&height=650' width='100%' height='650' frameBorder='0'></iframe>"

    return <div>
      <div dangerouslySetInnerHTML={{__html: embedCode}} />
      <h2 className='center-text'>Share</h2>
      <div className='social-links'>
        {
          icons.map(function(icon, i) {
            return <a href={icon[2]}
                      title={"Share with " + icon[0]}
                      key={'sharing-icon-' + i}
                      target='_blank'>
              <i className={'fa fa-2x fa-' + icon[1]} />
              <span className='sr-only'>{icon[0]}</span>
            </a>;
          })
        }
      </div>
      <div className='center-text'>
        <button onClick={this.toggleEmbed}>
          <i className={'fa fa-fw fa-'+(this.state.showEmbed ? 'caret-down' : 'caret-right')}/>
          Embed
        </button>
      </div>
      <div className='center-text'>
        {
          this.state.showEmbed ? (
            <span>
              Paste this code into your blog or website to embed this timeline there.
              <textarea rows='4' cols='60' value={embedCode}
                  onFocus={this.handleFocusTextarea} readOnly/>
            </span>
          ) : ""
        }
      </div>
      <div className='center-text'>
        <button onClick={this.handleNavEdit}>Edit Timeline</button> 
      </div>
    </div>
  }
});
module.exports = ReadTimeline
