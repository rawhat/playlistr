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
import PlaylistChat from './playlist-chat';

import {
    doGoLiveOnCurrentPlaylist,
    doRefreshPlaylist,
} from '../ducks/playlist';
import {
    doSocketConnect,
    doSocketDisconnect,
    doSocketChangePlaylist,
} from '../ducks/push-socket';
import { doSignOut } from '../ducks/authentication';

class MainPage extends Component {
    static propTypes = {
        fetchPlaylists: PropTypes.func,
        fetchPlaylistByTitle: PropTypes.func,
        socketConnect: PropTypes.func,
        socketDisconnect: PropTypes.func,
        playlists: PropTypes.array,
        currentPlaylist: PropTypes.object,
        goLive: PropTypes.func,
        currentSong: PropTypes.string,
        refresh: PropTypes.func,
    };

    componentDidMount = () => {
        this.props.socketConnect();
    };

    componentWillUnmount = () => {
        this.props.socketDisconnect();
    };

    render = () => {
        let goLiveLink = null;
        let exportPlaylistLink = null;
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

        let refresh = null;
        if (
            this.props.currentPlaylist &&
            this.props.currentPlaylist.hasPlayed
        ) {
            refresh = (
                <div className="container-fluid">
                    <div className="row">Playlist has played, replay it?</div>
                    <div className="row">
                        <span
                            className="glyphicon glyphicon-refresh"
                            style={{ cursor: 'pointer' }}
                            onClick={() => this.props.refresh()}
                        />
                    </div>
                </div>
            );
        }

        let audioBar = null;
        let contentSection = null;

        if (
            this.props.currentPlaylist &&
            this.props.currentPlaylist.type === 'music'
        ) {
            audioBar = <CustomAudioBar />;
            contentSection = <SongArea />;
        } else if (
            this.props.currentPlaylist &&
            this.props.currentPlaylist.type === 'video'
        ) {
            contentSection = (
                <div className="video-area">
                    <VideoPlayer />
                    <SongArea />
                </div>
            );
        }

        let addSongArea =
            _.isEqual({}, this.props.currentPlaylist) ||
            !this.props.currentPlaylist ||
            this.props.currentPlaylist.title === undefined
                ? null
                : <AddSongArea addSongCallback={this.addSongCallback} />;

        let playlistChat = _.isEmpty(this.props.currentPlaylist)
            ? null
            : <PlaylistChat />;

        return (
            <div style={{ marginTop: 60 }}>
                <Row className="middle-section">
                    <Col md={2} sm={2}>
                        <Row>
                            {addSongArea}
                        </Row>
                        <Row>
                            <PlaylistSidebar />
                        </Row>
                    </Col>
                    <Col md={7} sm={7}>
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
                                    <div style={{ textAlign: 'center' }}>
                                        {refresh}
                                    </div>
                                    <div className="pull-right">
                                        {exportPlaylistLink}
                                    </div>
                                </div>
                                {contentSection}
                            </div>
                        </Row>
                    </Col>
                    <Col md={3} sm={3}>
                        {playlistChat}
                    </Col>
                </Row>
            </div>
        );
    };
}

const mapStateToProps = state => {
    return {
        currentPlaylist: state.playlist.currentPlaylist,
    };
};

const dispatchObject = {
    goLive: doGoLiveOnCurrentPlaylist,
    refresh: doRefreshPlaylist,
    socketConnect: doSocketConnect,
    socketDisconnect: doSocketDisconnect,
    socketChange: doSocketChangePlaylist,
    signOut: doSignOut,
};

export default connect(mapStateToProps, dispatchObject)(MainPage);