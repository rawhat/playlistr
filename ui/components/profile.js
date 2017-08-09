import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Profile extends Component {
    static propTypes = {
        match: PropTypes.object,
    };

    render = () => {
        return (
            <div>
                <h2>
                    {this.props.match.params.username} Profile
                </h2>
                <p>This is a test.</p>
            </div>
        );
    };
}
