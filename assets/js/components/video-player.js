import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, Button, Row, Col } from 'react-bootstrap';
import ProgressBar from './progress-bar';
import { connect } from 'react-redux';
import _ from 'lodash';

import { doTogglePauseStatus, doGetNextSong } from '../ducks/playlist';

class VideoPlayer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentTime: 0,
        };

        this.fullscreenStyle = {
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            left: 0,
            top: 0,
            zIndex: 999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
        };
    }

    static propTypes = {
        currentSong: PropTypes.string,
        totalTime: PropTypes.number,
        currentTime: PropTypes.number,
        playOnLoad: PropTypes.bool,
        nextSong: PropTypes.func,
        nextSongGetter: PropTypes.func,
        paused: PropTypes.bool,
        togglePause: PropTypes.func,
        title: PropTypes.string,
        updatePlaytime: PropTypes.func,
    };

    static defaultProps = {
        totalTime: 0,
    };

    componentDidMount = () => {
        this.videoPlayer.volume = 0.25;

        this.videoPlayer.addEventListener('pause', () => {
            this.pauseHandler();
        });

        this.videoPlayer.addEventListener('ended', () => {
            this.nextSongGetter();
        });

        this.videoPlayer.addEventListener('timeupdate', () => {
            this.timeHandler();
        });

        this.videoPlayer.addEventListener('dblclick', () => {
            this.toggleFullscreen();
        });
    };

    componentWillReceiveProps(nextProps) {
        if (
            nextProps.currentTime !== this.props.currentTime &&
            this.videoPlayer.src
        ) {
            this.videoPlayer.currentTime = nextProps.currentTime;
        }

        if (nextProps.currentSong !== this.videoPlayer.src) {
            this.videoPlayer.src = nextProps.currentSong;
        }
    }

    componentDidUpdate() {
        if (this.videoPlayer.src) {
            if (this.props.paused && !this.videoPlayer.paused) {
                this.videoPlayer.pause();
            } else if (!this.props.paused && this.videoPlayer.paused) {
                this.videoPlayer.play();
            }
        }
    }

    componentWillUnmount = () => {
        this.videoPlayer.removeEventListener('timeupdate', this.timeHandler);
        this.videoPlayer.removeEventListener('pause', this.pauseHandler);
        this.videoPlayer.removeEventListener('ended', this.nextSongGetter);
        this.videoPlayer.removeEventListener('dblclick', this.toggleFullscreen);
    };

    toggleFullscreen = () => {
        if (!this.state.isFullscreen) {
            if (this.videoPlayer.mozRequestFullScreen) {
                this.videoPlayer.mozRequestFullScreen();
            } else if (this.videoPlayer.webkitRequestFullScreen) {
                this.videoPlayer.webkitRequestFullScreen();
            }
            this.setState({
                isFullscreen: true,
            });
        } else {
            if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            this.setState({
                isFullscreen: false,
            });
        }
    };

    rewindVideo = time => {
        this.videoPlayer.currentTime -= time;
    };

    timeHandler = () => {
        if (this.videoPlayer) {
            this.setState({
                currentTime: this.videoPlayer.currentTime,
            });
        }
    };

    nextSongGetter = () => {
        // this.videoPlayer.src = '';
        this.props.nextSong();
    };

    togglePause = () => {
        this.props.togglePause(this.props.title);
    };

    pauseHandler = () => {
        if (!this.props.paused) this.props.togglePause(this.props.title);
    };

    adjustVolume = () => {
        var volumeLevel = this.volumeSlider.value / 100;
        this.videoPlayer.volume = volumeLevel;
    };

    render = () => {
        var volumeControl = (
            <input
                type="range"
                style={{ position: 'relative', top: 12 }}
                onInput={this.adjustVolume}
                ref={volumeSlider => (this.volumeSlider = volumeSlider)}
                min={0}
                max={100}
                defaultValue={25}
            />
        );

        let glyphicon = 'play';
        if (this.videoPlayer)
            glyphicon = this.videoPlayer.paused ? 'play' : 'pause';

        return (
            <div>
                <Row style={{ textAlign: 'center' }}>
                    <video
                        controls={false}
                        onClick={this.togglePause}
                        ref={videoPlayer => (this.videoPlayer = videoPlayer)}
                        src={this.props.currentSong}
                        hidden={!this.props.currentSong ? 'hidden' : ''}
                        width={'85%'}
                    />
                </Row>
                <Row style={{ margin: '20px auto' }}>
                    <Col md={3}>
                        <ButtonGroup>
                            <Button
                                onClick={this.rewindVideo.bind(null, 30)}
                                bsStyle="primary"
                            >
                                {'<<'}
                            </Button>
                            <Button
                                onClick={this.rewindVideo.bind(null, 15)}
                                bsStyle="primary"
                            >
                                {'<'}
                            </Button>
                            <Button
                                onClick={this.togglePause}
                                bsStyle="primary"
                            >
                                <span
                                    className={
                                        'glyphicon glyphicon-' + glyphicon
                                    }
                                />
                            </Button>
                        </ButtonGroup>
                    </Col>
                    <Col md={7}>
                        <ProgressBar currentTime={this.state.currentTime} />
                    </Col>
                    <Col md={2}>
                        {volumeControl}
                    </Col>
                </Row>
            </div>
        );
    };
}

const mapStateToProps = state => {
    return {
        title: state.playlist.currentPlaylist.title,
        currentTime: state.playlist.currentPlaytime,
        currentSong: state.playlist.currentSong,
        paused: state.playlist.paused,
        username: _.get(state, 'auth.user.username', null),
        creator: state.playlist.currentPlaylist.creator,
        totalTime: state.playlist.totalTime,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        togglePause: title => dispatch(doTogglePauseStatus(title)),
        nextSong: () => dispatch(doGetNextSong()),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(VideoPlayer);
