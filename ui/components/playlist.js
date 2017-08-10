import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Playlist extends Component {
    static propTypes = {
        name: PropTypes.string,
        type: PropTypes.string,
        selected: PropTypes.bool,
        playlistSelector: PropTypes.func,
        hasPassword: PropTypes.bool,
        playlistPasswordError: PropTypes.bool,
        selectProtectedPlaylist: PropTypes.func,
    };

    static defaultProps = {
        name: '',
        selected: false,
        type: '',
    };

    render = () => {
        var style = this.props.selected ? { backgroundColor: '#375a7f' } : {};
        var glyphicon = this.props.type === 'music'
            ? 'glyphicon-music'
            : 'glyphicon-film';

        return (
            <button
                onClick={this.props.playlistSelector.bind(
                    null,
                    this.props.name
                )}
                style={style}
                type="button"
                className="list-group-item playlist-selector"
                id={this.props.name}
            >
                {this.props.name}
                <div className="pull-right">
                    {this.props.hasPassword
                        ? <span
                              className="glyphicon glyphicon-lock"
                              style={{ paddingRight: 5 }}
                          />
                        : null}
                    <span className={'glyphicon ' + glyphicon} />
                </div>
            </button>
        );
    };
}

export default Playlist;
