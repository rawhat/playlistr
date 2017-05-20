import React, { Component } from 'react';

class PlaylistSong extends Component {
    constructor() {
        super();
        this.state = {
            hidden: true,
        };
    }

    toggleHidden = () => {
        this.setState({
            hidden: !this.state.hidden,
        });
    };

    render = () => {
        var mins = Math.floor(this.props.length / 60);
        var secs = this.props.length - mins * 60;
        if (secs < 10) secs = '0' + secs;
        var time = mins + ':' + secs;
        var playingIcon = this.props.selected
            ? <span className="glyphicon glyphicon-headphones pull-right" />
            : null;
        return (
            <div className="panel panel-default">
                <div className="panel-heading" onClick={this.toggleHidden}>
                    <h4 className="panel-title pull-left">
                        {this.props.info}
                    </h4>
                    {playingIcon}
                    <div className="clearfix" />
                </div>
                {this.state.hidden
                    ? null
                    : <ul className="list-group">
                          <li className="list-group-item">
                              <span className="pull-right">{time}</span>
                              <div className="clearfix" />
                          </li>
                      </ul>}
            </div>
        );
    };
}
PlaylistSong.propTypes = {
    length: React.PropTypes.number,
    info: React.PropTypes.string,
    selected: React.PropTypes.bool,
};

export default PlaylistSong;
