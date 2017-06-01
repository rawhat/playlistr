import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import Playlist from './playlist';
import PasswordPlaylist from './password-playlist';
import PlaylistCreator from './playlist-creator';

class PlaylistSidebar extends Component {
    static propTypes = {
        playlists: PropTypes.array,
        selectedPlaylistIndex: PropTypes.number,
        playlistSelector: PropTypes.func,
        selectProtectedPlaylist: PropTypes.func,
        passwordOverlay: PropTypes.element,
    };

    playlistSelector = name => {
        this.props.playlistSelector(name);
    };

    render = () => {
        var playlists = null;
        if (this.props.playlists.length != 0) {
            playlists = (
                <div className="playlist-list-group list-group">
                    {_.map(this.props.playlists, (playlist, index) => {
                        var selected =
                            index == this.props.selectedPlaylistIndex;
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
                                  selectProtectedPlaylist={
                                      this.props.selectProtectedPlaylist
                                  }
                                  hasPassword={playlist.hasPassword}
                                  passwordOverlay={this.props.passwordOverlay}
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
                <PlaylistCreator playlistSelector={this.playlistSelector} />
                {playlists}
            </div>
        );
    };
}

export default PlaylistSidebar;
