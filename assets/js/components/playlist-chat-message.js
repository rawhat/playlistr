import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getLongestUsernameLength } from '../ducks/chat';

const PlaylistMessage = ({ message, user, date, usernameLength }) => {
    let time = new Date(date);
    let hours = time.getHours() % 12;
    let minutes = time.getMinutes();
    let seconds = time.getSeconds();
    return (
        <p className="playlist-chat-message" key={`${user}: ${message}`}>
            {user}
            <span>
                {' '
                    .repeat(usernameLength - user.length)
                    .replace(/ /g, '\u00a0')}
            </span>
            {` (${hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds <
            10
                ? '0' + seconds
                : seconds}): ${message}`}
        </p>
    );
};

PlaylistMessage.propTypes = {
    message: PropTypes.string,
    user: PropTypes.string,
    date: PropTypes.number,
    usernameLength: PropTypes.number,
};

const mapStateToProps = state => ({
    usernameLength: getLongestUsernameLength(state),
});

export default connect(mapStateToProps)(PlaylistMessage);
