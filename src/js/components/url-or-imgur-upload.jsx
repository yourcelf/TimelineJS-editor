"use strict";

const _ = require("lodash");
const React = require("react");
const PureRenderMixin = require("react/addons").PureRenderMixin;
const {ProgressBar} = require("react-bootstrap");
const imgur = require("../imgur");
const Fa = require("./fa.jsx");

const UrlOrImgurUpload = React.createClass({
  mixins: [PureRenderMixin],
  getInitialState() {
    let r = Math.random();
    return {
      url: this.props.value,
      error: null,
      loading: false,
      progress: 0,
      fileInputId: `fileinput-${r}`,
      urlInputId: `urlinput-${r}`,
      canUpload: window.File && window.FileReader && window.FileList && window.Blob
    };
  },
  componentWillReceiveProps(newProps) {
    if (newProps.value !== this.state.url) {
      this.setState({url: newProps.value});
    }
  },
  triggerFileChooser(event) {
    event.preventDefault();
    if (!this.state.canUpload) {
      return;
    }
    let input = document.getElementById(this.state.fileInputId);
    if (document.createEvent) {
      let evt = document.createEvent("MouseEvents");
      evt.initEvent("click", true, false);
      input.dispatchEvent(evt);
    } else if (document.createEventObject) {
      input.fireEvent("onclick", document.createEventObject());
    } else {
      input.click();
    }
  },
  onDragEnter(event) {
    this.setState({lastDragEnter: event.target});
    if (event.currentTarget.className.indexOf(" dragging") === -1) {
      event.currentTarget.className += ' dragging';
    }
  },
  onDragLeave(event) {
    if (this.state.lastDragEnter === event.target) {
      event.currentTarget.className = event.currentTarget.className.replace(' dragging', '');
    }
  },
  onDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
  },
  onDrop(event) {
    event.stopPropagation();
    event.preventDefault();
    if (event.dataTransfer.files[0]) {
      this.ingestFile(event.dataTransfer.files[0]);
    }
  },
  onChangeFile(event) {
    event.stopPropagation();
    event.preventDefault();
    if (event.target.files[0]) {
      this.ingestFile(event.target.files[0]);
    }
  },
  ingestFile(file) {
    if (!file.type.match('image.*')) {
      this.setState({
        error: "That doesn't seem to be an image file.",
        loading: false
      });
      return;
    }
    this.setState({
      error: null,
      loading: true
    });

    let reader = new FileReader();
    reader.onload = (fileEvent) => {
      console.log(fileEvent.target.result);
      imgur.uploadImage(
        fileEvent.target.result,
        (p) => this.setState({progress: (p.position / p.total) * 100})
      ).then((url) => {
        this.setState({url: url, error: null, loading: false, progress: 0});
        this.props.onChange({target: {value: url}});
      }).catch((err) => {
        console.log(err);
        let msg;
        try {
          msg = _.escape(JSON.parse(err.response.text).data.error);
        } catch (e) {
          msg = err.message;
        }
        this.setState({
          url: null,
          error: `Error uploading image - server said "${msg}"`,
          loading: false
        });
      });
    };
    reader.readAsDataURL(file);
  },
  render() {
    if (this.state.loading) {
      return (
        <div>
          <Fa type='spinner spin' /> Uploading...
          <ProgressBar now={this.state.progress} />
        </div>
      );
    } else {
      let helpBlock;
      if (this.state.canUpload) {
        helpBlock = <span>Enter URL, drag and drop image, or{' '}
              <a href='#' onClick={this.triggerFileChooser}>choose image file</a>
            </span>;
      } else {
        helpBlock = <span>Enter URL to anything</span>;
      }

      return (
        <div className={`drop-target ${this.state.error ? ' has-error' : ''}`}
            onDragEnter={this.onDragEnter}
            onDragOver={this.onDragOver}
            onDragLeave={this.onDragLeave}
            onDrop={this.onDrop}>
          <input type='file'
                 className='hide'
                 id={this.state.fileInputId}
                 onChange={this.onChangeFile} />
          <input className='form-control'
                 type='url' {...this.props}
                 id={this.state.urlInputId}
                 value={this.state.url} />
          <span className='help-block'>
            {this.state.error ? <div>{this.state.error}</div> : '' }
            {helpBlock}
          </span>
        </div>
      );
    }
  }
});
module.exports = UrlOrImgurUpload;
