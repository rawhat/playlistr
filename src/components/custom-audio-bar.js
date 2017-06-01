import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Col } from 'react-bootstrap';
import { connect } from 'react-redux';

import {
    doTogglePause,
    doTogglePauseStatus,
    doUpdatePlaytime,
} from '../ducks/playlist';

class CustomAudioBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currTime: 0,
        };
    }

    static propTypes = {
        currentSong: PropTypes.string,
        totalTime: PropTypes.number,
        currentTime: PropTypes.number,
        timeRegistered: PropTypes.func,
        playOnLoad: PropTypes.bool,
        nextSongGetter: PropTypes.func,
        paused: PropTypes.func,
        togglePause: PropTypes.func,
        title: PropTypes.string,
        updatePlaytime: PropTypes.func,
    };

    static defaultProps = {
        currentSong: '',
        totalTime: 0,
    };

    pauseHandler = () => {
        // this.props.paused(true);
        // this.audioPlayer.pause();
        // this.props.togglePause();
        if (!this.props.paused) this.props.togglePause(this.props.title);
    };

    endedHandler = () => {
        this.props.nextSongGetter();
    };

    timeHandler = () => {
        if (this.audioPlayer)
            this.props.updatePlaytime(this.audioPlayer.currentTime);
    };

    componentDidMount = () => {
        this.audioPlayer.volume = 0.25;
        this.audioPlayer.addEventListener('timeupdate', this.timeHandler);
        // this.audioPlayer.addEventListener('pause', this.pauseHandler);
        this.audioPlayer.addEventListener('ended', this.endedHandler);
    };

    componentWillUnmount = () => {
        this.audioPlayer.removeEventListener('timeupdate', this.timeHandler);
        // this.audioPlayer.removeEventListener('pause', this.pauseHandler);
        this.audioPlayer.removeEventListener('ended', this.endedHandler);
    };

    componentWillReceiveProps = nextProps => {
        console.log('receiving', nextProps);
        // var playStatus = this.props.paused && this.audioPlayer.paused
        //     ? true
        //     : false;
        // if (playStatus) {
        //     this.audioPlayer.play();
        // }
        // if (this.props.currentTime !== null) {
        //     this.audioPlayer.currentTime = this.props.currentTime;

        //     // this.props.timeRegistered();
        // }

        if (nextProps.paused !== this.props.paused) {
            if (nextProps.paused) {
                console.log('pausing');
                this.audioPlayer.pause();
            } else {
                console.log('playing');
                this.audioPlayer.play();
            }
        }

        if (nextProps.currentTime) {
            console.log('updating time');
            this.audioPlayer.currentTime = nextProps.currentTime;
        }
    };

    togglePlay = () => {
        // var audioPlayer = this.audioPlayer;
        // if (audioPlayer.paused) audioPlayer.play();
        // else {
        //     this.innerDiv.style.transition = 'paused';
        //     audioPlayer.pause();
        // }
        if (this.props.username === this.props.creator)
            this.props.togglePause(this.props.title);
        else this.props.togglePauseStatus(this.props.title);
    };

    adjustVolume = () => {
        this.audioPlayer.volume = this.volumeSlider.value / 100;
    };

    render = () => {
        var glyphicon_class = 'glyphicon glyphicon-';
        var width = 0;
        if (this.audioPlayer) {
            glyphicon_class += this.audioPlayer.paused ? 'play' : 'pause';
            var button = (
                <button
                    className="btn btn-primary left"
                    onClick={this.togglePlay}
                >
                    <span className={glyphicon_class} />
                </button>
            );

            width = this.state.currTime / this.audioPlayer.duration * 100 + '%';

            var currMinutes = Math.floor(this.state.currTime / 60);
            var currSeconds = Math.floor(
                this.state.currTime - currMinutes * 60
            );
            var currTimeString = currSeconds < 10
                ? currMinutes + ':0' + currSeconds
                : currMinutes + ':' + currSeconds;

            //var totalMinutes = Math.floor(this.refs.audioPlayerHidden.duration / 60);
            //var totalSeconds = Math.floor(this.refs.audioPlayerHidden.duration - totalMinutes * 60);
            var totalMinutes = Math.floor(this.props.totalTime / 60);
            var totalSeconds = Math.floor(
                this.props.totalTime - totalMinutes * 60
            );
            var totalTimeString = totalSeconds < 10
                ? totalMinutes + ':0' + totalSeconds
                : totalMinutes + ':' + totalSeconds;

            var playbackBar = (
                <div
                    ref={outerDiv => this.outerDiv = outerDiv}
                    style={{
                        backgroundColor: 'lightgray',
                        borderRadius: '3px',
                        height: '45px',
                        position: 'relative',
                    }}
                >
                    <div
                        ref={innerDiv => this.innerDiv = innerDiv}
                        style={{
                            backgroundColor: '#375a7f',
                            borderRadius: '3px',
                            width: width,
                            height: '45px',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '5px',
                        }}
                    >
                        {currTimeString + ' / ' + totalTimeString}
                    </div>
                </div>
            );

            var volumeControl = (
                <input
                    type="range"
                    style={{ position: 'relative', top: '12px' }}
                    onInput={this.adjustVolume}
                    ref={volumeSlider => this.volumeSlider = volumeSlider}
                    min={0}
                    max={100}
                    defaultValue={25}
                />
            );
            if (this.innerDiv && this.state.currTime != 0 && width != '100%') {
                this.innerDiv.style.transition = 'width 1s linear 0s';
            }
        }

        return (
            <div>
                <Col md={1} mdOffset={1}>{button}</Col>
                <Col md={7}>{playbackBar}</Col>
                <Col md={2}>{volumeControl}</Col>
                <audio
                    ref={audioPlayer => this.audioPlayer = audioPlayer}
                    hidden
                    src={this.props.currentSong}
                />
            </div>
        );
    };
}

const mapStateToProps = state => {
    return {
        title: state.playlist.currentPlaylist.title,
        currentTime: state.playlist.currentPlaytime,
        currentSong: state.playlist.currentSong,
        paused: state.playlist.isPaused,
        username: state.auth.user.username,
        creator: state.playlist.currentPlaylist.creator,
        totalTime: state.playlist.totalTime,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        togglePause: title => dispatch(doTogglePause(title)),
        togglePauseStatus: title => dispatch(doTogglePauseStatus(title)),
        updatePlaytime: time => dispatch(doUpdatePlaytime(time)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(CustomAudioBar);
