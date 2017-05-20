import React, { Component } from 'react';
import { Col } from 'react-bootstrap';

class CustomAudioBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currTime: 0,
        };
    }

    static defaultProps = {
        currentSong: '',
        totalTime: 0,
    };

    pauseHandler = () => {
        this.props.paused(true);
        this.audioPlayer.pause();
    };

    endedHandler = () => {
        this.props.nextSongGetter();
    };

    timeHandler = () => {
        console.log(this.audioPlayer.currentTime);
        this.setState({
            currTime: this.audioPlayer.currentTime,
        });
    };

    componentDidMount = () => {
        this.audioPlayer.volume = 0.25;
        this.audioPlayer.addEventListener('timeupdate', this.timeHandler);
        this.audioPlayer.addEventListener('pause', this.pauseHandler);
        this.audioPlayer.addEventListener('ended', this.endedHandler);
    };

    componentWillUnmount = () => {
        this.audioPlayer.removeEventListener('timeupdate', this.timeHandler);
        this.audioPlayer.removeEventListener('pause', this.pauseHandler);
        this.audioPlayer.removeEventListener('ended', this.endedHandler);
    };

    componentDidUpdate = () => {
        var playStatus = this.props.playOnLoad && this.audioPlayer.paused
            ? true
            : false;
        if (playStatus) {
            this.audioPlayer.play();
        }
        if (this.props.currentTime !== null) {
            this.audioPlayer.currentTime = this.props.currentTime;
            this.props.timeRegistered();
        }
    };

    togglePlay = () => {
        var audioPlayer = this.audioPlayer;
        if (audioPlayer.paused) audioPlayer.play();
        else {
            this.innerDiv.style.transition = 'paused';
            audioPlayer.pause();
        }
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
CustomAudioBar.propTypes = {
    currentSong: React.PropTypes.string,
    totalTime: React.PropTypes.number,
    currentTime: React.PropTypes.number,
    timeRegistered: React.PropTypes.func,
    playOnLoad: React.PropTypes.bool,
    nextSongGetter: React.PropTypes.func,
    paused: React.PropTypes.func,
};

export default CustomAudioBar;
