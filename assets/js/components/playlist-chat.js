import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { getChatMessages } from '../ducks/chat';

import PlaylistChatInput from './playlist-chat-input';
import PlaylistChatMessage from './playlist-chat-message';

class PlaylistChat extends Component {
    static propTypes = {
        messages: PropTypes.array,
    };

    state = {
        shouldScrollDown: false,
    };

    // componentDidMount = () => {
    //     this.messageArea.addEventListener('scroll', () => {
    //         console.log(this.messageArea.scrollTop);
    //     });
    // };

    componentWillReceiveProps = () => {
        let element = this.messageArea;
        if (element.scrollHeight - element.scrollTop === element.clientHeight)
            this.setState({
                shouldScrollDown: true,
            });
    };

    componentDidUpdate = () => {
        if (this.state.shouldScrollDown) {
            this.chatArea
                .querySelectorAll('.playlist-chat-message:last-of-type')[0]
                .scrollIntoView();
            this.setState({
                shouldScrollDown: false,
            });
        }
    };

    render() {
        return (
            <div
                className="playlist-chat-area"
                ref={chatArea => (this.chatArea = chatArea)}
            >
                <div
                    className="playlist-chat-messages"
                    ref={messageArea => (this.messageArea = messageArea)}
                >
                    {this.props.messages.map((message, index) =>
                        <PlaylistChatMessage key={index} {...message} />
                    )}
                </div>
                <PlaylistChatInput />
            </div>
        );
    }
}

const mapStateToProps = state => ({
    messages: getChatMessages(state),
});

export default connect(mapStateToProps)(PlaylistChat);
