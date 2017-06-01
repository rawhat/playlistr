/* eslint-disable no-console */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Row, Col } from 'react-bootstrap';

import AddSongArea from './add-song-area';
import CustomAudioBar from './custom-audio-bar';
import VideoPlayer from './video-player';
import PlaylistSidebar from './playlist-sidebar';
import SongArea from './song-area';

import {
    doFetchPlaylists,
    doFetchPlaylistByTitle,
    doGoLiveOnCurrentPlaylist,
} from '../ducks/playlist';
import {
    doSocketConnect,
    doSocketDisconnect,
    doSocketChangePlaylist,
} from '../ducks/push-socket';
import { doSignOut } from '../ducks/authentication';

class MainPage extends Component {
    constructor(props) {
        super(props);

        this.socket = null;

        this.state = {
            playlists: [],
            selectedPlaylist: '',
            currentPlaylist: {},
            currentPlayTime: null,
            paused: true,
            currentSong: '',
            playlistPasswordOverlay: false,
            playlistPasswordAccess: null,
            playlistPasswordError: false,
        };
    }

    static propTypes = {
        fetchPlaylists: PropTypes.func,
        fetchPlaylistByTitle: PropTypes.func,
        socketConnect: PropTypes.func,
        socketDisconnect: PropTypes.func,
        playlists: PropTypes.array,
        currentPlaylist: PropTypes.object,
    };

    componentDidMount = () => {
        this.props.socketConnect();
        this.props.fetchPlaylists();
    };

    componentWillUnmount = () => {
        this.props.socketDisconnect();
    };

    selectPlaylist = async name => {
        let playlist = this.props.playlists.find(
            playlist => playlist.title === name
        );

        if (!playlist.hasPassword) {
            this.props.fetchPlaylistByTitle(name);
        }
    };

    timeRegistered = () => {
        this.setState({
            currentPlayTime: null,
        });
    };

    render = () => {
        var goLiveLink = null;
        var exportPlaylistLink = null;
        if (
            this.props.currentPlaylist &&
            this.props.currentPlaylist.hasOwnProperty('songs') &&
            this.props.currentPlaylist.songs.length !== 0
        ) {
            goLiveLink = (
                <a href="#" onClick={() => this.props.goLive()}>
                    Go Live
                </a>
            );
            var songList = _.map(
                _.map(this.props.currentPlaylist.songs, 'url'),
                song => {
                    return song.split('?v=')[1];
                }
            ).join(',');
            exportPlaylistLink = (
                <a
                    href={
                        'http://youtube.com/watch_videos?video_ids=' + songList
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Export <span className="glyphicon glyphicon-export" />
                </a>
            );
        }

        var audioBar = null;
        var contentSection = null;

        if (
            this.props.currentPlaylist &&
            this.props.currentPlaylist.type === 'music'
        ) {
            audioBar = <CustomAudioBar />;
            contentSection = (
                <SongArea
                    songs={this.props.currentPlaylist.songs}
                    currentSongIndex={currentSongIndex}
                    title={this.props.currentPlaylist.title}
                />
            );
        } else if (
            this.props.currentPlaylist &&
            this.props.currentPlaylist.type === 'video'
        ) {
            contentSection = (
                <div className="video-area">
                    <VideoPlayer />
                    <SongArea
                        songs={this.props.currentPlaylist.songs}
                        currentSongIndex={currentSongIndex}
                        title={this.props.currentPlaylist.title}
                    />
                </div>
            );
        }

        var addSongArea = _.isEqual({}, this.props.currentPlaylist) ||
            !this.props.currentPlaylist ||
            this.props.currentPlaylist.title === undefined
            ? null
            : <AddSongArea addSongCallback={this.addSongCallback} />;
        var selectedPlaylistIndex = _.findIndex(
            this.props.playlists,
            playlist => {
                return (
                    this.props.currentPlaylist &&
                    this.props.currentPlaylist.title === playlist.title
                );
            }
        );
        var currentSongIndex =
            this.props.currentPlaylist &&
            _.findIndex(this.props.currentPlaylist.songs, song => {
                return (
                    this.props.currentSong &&
                    this.props.currentSong === song.streamUrl
                );
            });

        return (
            <div style={{ marginTop: 60 }}>
                <Row className="middle-section">
                    <Col md={2} sm={12}>
                        <Row>
                            {addSongArea}
                        </Row>
                        <Row>
                            <PlaylistSidebar
                                playlistSelector={this.selectPlaylist}
                                playlists={this.props.playlists}
                                selectedPlaylistIndex={selectedPlaylistIndex}
                                selectProtectedPlaylist={
                                    this.selectProtectedPlaylist
                                }
                            />
                        </Row>
                    </Col>
                    <Col md={10} sm={12}>
                        <Row>
                            {audioBar}
                        </Row>
                        <Row>
                            <div id="playlist_area" style={{ marginRight: 50 }}>
                                <div
                                    className="row"
                                    style={{
                                        marginLeft: 50,
                                        marginRight: 50,
                                        paddingBottom: 10,
                                    }}
                                >
                                    <div className="pull-left">
                                        {goLiveLink}
                                    </div>
                                    <div className="pull-right">
                                        {exportPlaylistLink}
                                    </div>
                                </div>
                                {contentSection}
                            </div>
                        </Row>
                    </Col>
                </Row>
            </div>
        );
    };
}

const mapStateToProps = state => {
    return {
        // playlists: state.playlist.playlists,
        // currentPlaylist: state.playlist.currentPlaylist,
        ...state.playlist,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        fetchPlaylists: () => dispatch(doFetchPlaylists()),
        fetchPlaylistByTitle: title => dispatch(doFetchPlaylistByTitle(title)),
        goLive: () => dispatch(doGoLiveOnCurrentPlaylist()),
        socketConnect: () => dispatch(doSocketConnect()),
        socketDisconnect: () => dispatch(doSocketDisconnect()),
        socketChange: (newPlaylist, oldPlaylist) =>
            dispatch(doSocketChangePlaylist(newPlaylist, oldPlaylist)),
        signOut: () => dispatch(doSignOut()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(MainPage);
