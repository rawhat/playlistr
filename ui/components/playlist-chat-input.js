import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { doSendChatMessage } from '../ducks/chat';

class PlaylistChatInput extends Component {
    state = {
        message: '',
    };

    static propTypes = {
        send: PropTypes.func,
    };

    onTextInput = event => {
        this.setState({
            message: event.target.value,
        });
    };

    send = ev => {
        if (ev) ev.preventDefault();
        let message = this.state.message;
        this.setState({ message: '' }, () => {
            this.props.send(message);
        });
    };

    render() {
        return (
            <div className="playlist-chat-input">
                <div className="row">
                    <div
                        className="col-md-12 col-sm-12"
                        style={{ paddingLeft: 0, paddingRight: 0 }}
                    >
                        <form className="input-group" onSubmit={this.send}>
                            <input
                                className="form-control"
                                type="text"
                                value={this.state.message}
                                onChange={this.onTextInput}
                            />
                            <span className="input-group-btn">
                                <button
                                    className="btn btn-default"
                                    onClick={this.send}
                                >
                                    Send
                                </button>
                            </span>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(null, { send: doSendChatMessage })(PlaylistChatInput);
