import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import PlaylistSong from './playlist-song';

class SongArea extends Component {
    static propTypes = {
        title: PropTypes.string,
        songs: PropTypes.array,
        currentSong: PropTypes.string,
    };

    render = () => {
        if (this.props.title === undefined) return <div />;

        let songs = this.props.songs.map((song, index) => {
            let selected = song.streamUrl === this.props.currentSong;
            return (
                <PlaylistSong
                    key={index}
                    info={song.info}
                    length={song.length}
                    selected={selected}
                />
            );
        });

        if (songs.length === 0) {
            return (
                <div>
                    <h2>{this.props.title}</h2>
                    <div className="well well-sm">
                        <h4>
                            {
                                "There's nothing here.  Add songs to this playlist at the top left."
                            }
                        </h4>
                    </div>
                </div>
            );
        }
        return (
            <div>
                {songs}
            </div>
        );
    };
}

const mapStateToProps = state => {
    return {
        songs: state.playlist.currentPlaylist.songs,
        title: state.playlist.currentPlaylist.title,
        currentSong: state.playlist.currentSong,
    };
};

export default connect(mapStateToProps)(SongArea);
