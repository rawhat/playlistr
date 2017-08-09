import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import _ from 'lodash';

import Playlist from './playlist';
import PasswordPlaylist from './password-playlist';
import PlaylistCreator from './playlist-creator';
import { doFetchPlaylistByTitle, doFetchPlaylists } from '../ducks/playlist';

class PlaylistSidebar extends Component {
    static propTypes = {
        fetchPlaylists: PropTypes.func,
        fetchPlaylistByTitle: PropTypes.func,
        playlists: PropTypes.array,
        currentPlaylist: PropTypes.object,
        playlistSelector: PropTypes.func,
    };

    componentDidMount() {
        this.props.fetchPlaylists();
    }

    playlistSelector = name => {
        if (name !== this.props.currentPlaylist.title)
            this.props.fetchPlaylistByTitle(name);
    };

    render = () => {
        let playlists = null;

        if (this.props.playlists.length != 0) {
            playlists = (
                <div className="playlist-list-group list-group">
                    {_.map(this.props.playlists, (playlist, index) => {
                        let selected =
                            playlist.title === this.props.currentPlaylist.title;
                        return playlist.hasPassword
                            ? <PasswordPlaylist
                                  name={playlist.title}
                                  key={index}
                                  selected={selected}
                                  type={playlist.type}
                              />
                            : <Playlist
                                  playlistSelector={this.playlistSelector.bind(
                                      null,
                                      playlist.title
                                  )}
                                  name={playlist.title}
                                  key={index}
                                  selected={selected}
                                  type={playlist.type}
                              />;
                    })}
                </div>
            );
        } else {
            playlists = (
                <div className="panel panel-default">
                    <div className="panel-body">
                        {"There's nothing here yet"}
                    </div>
                </div>
            );
        }
        return (
            <div>
                <PlaylistCreator />
                {playlists}
            </div>
        );
    };
}

const mapStateToProps = state => ({
    playlists: state.playlist.playlists,
    currentPlaylist: state.playlist.currentPlaylist,
});

export default connect(mapStateToProps, {
    fetchPlaylists: doFetchPlaylists,
    fetchPlaylistByTitle: doFetchPlaylistByTitle,
})(PlaylistSidebar);
