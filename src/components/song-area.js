import React, { Component } from 'react';
import _ from 'lodash';

import PlaylistSong from './playlist-song';

class SongArea extends Component {
    constructor() {
        super();
    }

    static defaultProps = {
        title: undefined,
        songs: [],
        currentSongIndex: -1,
    };

    render = () => {
        if (this.props.title === undefined) return <div />;

        var songs = [];
        _.each(this.props.songs, (song, index) => {
            var selected = false;
            if (index == this.props.currentSongIndex) selected = true;
            songs.push(
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
SongArea.propTypes = {
    title: React.PropTypes.string,
    songs: React.PropTypes.array,
    currentSongIndex: React.PropTypes.number,
};

export default SongArea;