var FluxibleMixin = require('fluxible').Mixin
var React = require('react');
var _ = require('lodash');
var PageStore = require('../stores/page');
var actions = require('../actions');

var ReadTimeline = React.createClass({
  mixins: [FluxibleMixin],
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
  render: function() {
    var encUrl = encodeURIComponent(document.URL);
    var icons = [
      ["Twitter", "twitter", `https://twitter.com/home?status=${encUrl}`],
      ["Facebook", "facebook", `https://www.facebook.com/sharer.php?u=${encUrl}`],
      ["Email", "envelope", `mailto:?subject=${encodeURIComponent("Check out my timeline")}&body=${encUrl}`],
      ["Tumblr", "tumblr", `https://www.tumblr.com/share/link?url=${encUrl}`],
      ["Google+", "google-plus", `https://plus.google.com/share?url=${encUrl}`]
    ];
    var embedCode = "<iframe src='https://s3.amazonaws.com/cdn.knightlab.com/libs/timeline/latest/embed/index.html?source=" + _.escape(this.state.timelineId) + "&font=Bevan-PotanoSans&maptype=toner&lang=en&height=650' width='100%' height='650' frameBorder='0'></iframe>"

    return <div>
      <div dangerouslySetInnerHTML={{__html: embedCode}} />
      <div className='social-links'>
        {
          icons.map(function(icon) {
            return <a href={icon[2]} title={"Share with " + icon[1]} target='_blank'>
              <i className={'fa fa-2x fa-' + icon[1]} />
              <span className='sr-only'>{icon[0]}</span>
            </a>;
          })
        }
      </div>
      <h2>Embed code</h2>
      <textarea rows='4' cols='60' value={embedCode} readOnly onFocus={this.handleFocusTextarea}/>
      <div>
        <button onClick={this.handleNavEdit}>Edit Timeline</button> 
      </div>
    </div>
  }
});
module.exports = ReadTimeline
