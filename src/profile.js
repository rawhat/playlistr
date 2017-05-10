import React, { Component } from 'react';

export default class Profile extends Component {
    render = () => {
        return (
            <div>
                <h2>{this.props.match.params.username} Profile</h2>
                <p>This is a test.</p>
            </div>
        );
    }
}