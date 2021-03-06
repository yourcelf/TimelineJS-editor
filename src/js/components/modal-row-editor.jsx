"use strict";
const _ = require("lodash");
const moment = require("moment");
const React = require("react");
const {Modal, Button} = require("react-bootstrap");
const Fa = require("./fa.jsx");
const RowEditor = require("./row-editor.jsx");

const ModalRowEditor = React.createClass({
  getInitialState() {
    return {
      isModalOpen: !!this.props.rowId
    };
  },

  componentWillReceiveProps(nextProps) {
    if (!this.state.isModalOpen && !!nextProps.rowId) {
      this.setState({isModalOpen: true});
    }
  },

  onClick(event) {
    if (this.props.onClick) {
      this.props.onClick(event);
    }
    this.handleToggle(event);
  },

  handleToggle(event) {
    let open = this.state.isModalOpen;
    this.setState({isModalOpen: !open});
    if (open) {
      if (this.props.onClose) {
        this.props.onClose(event);
      }
    } else {
      if (this.props.onOpen) {
        this.props.onOpen(event);
      }
    }
  },

  render() {
    return (
      <span>
        <Button onClick={this.onClick} bsStyle='primary' disabled={this.props.disabled}>
          {this.props.children}
        </Button>
        <Modal show={this.state.isModalOpen} onHide={this.handleToggle} animation>
          <div className='modal-body'>
            {
              this.props.rowId ?
              <RowEditor
                rowId={this.props.rowId}
                onSave={this.handleToggle}
                onDelete={this.handleToggle} /> :
              <span>Loading ... <Fa type='spinner spin'/></span>
            }
          </div>
        </Modal>
      </span>
    );
  }
});

module.exports = ModalRowEditor;
