import React, { Component } from 'react';
import {
    ButtonGroup,
    Button,
    Row, 
    Col 
} from 'react-bootstrap';
import ProgressBar from './progress-bar';

class VideoPlayer extends Component {
	constructor(props){
		super(props);
		this.state = {
			currTime: 0,
			isPaused: true,
			isFullscreen: false
		};

		this.fullscreenStyle = {
			position: 'fixed',
			width: '100vw',
			height: '100vh',
			left: 0,
			top: 0,
			zIndex: 999,
			backgroundColor: 'rgba(0, 0, 0, 0.75)'
		};
	}

	static defaultProps = {
		currentVideo: '',
		totalTime: 0
	}

	componentDidMount = () => {
		this.videoPlayer.volume = .25;

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
	}

	componentDidUpdate = () => {
		if(this.props.currentVideo){
			var playStatus = this.props.playOnLoad && this.videoPlayer.paused ? true : false;
			if(this.props.currentTime){
				this.videoPlayer.currentTime = this.props.currentTime;
				this.props.timeRegistered();
			}
			if(playStatus){
				this.videoPlayer.play();
			}
		}
		else {
			this.videoPlayer.src = '';
			this.videoPlayer.pause();
		}
	}

	componentWillUnmount = () => {
		this.videoPlayer.removeEventListener('timeupdate', this.timeHandler);
		this.videoPlayer.removeEventListener('pause', this.pauseHandler);
		this.videoPlayer.removeEventListener('ended', this.nextSongGetter);
		this.videoPlayer.removeEventListener('dblclick', this.toggleFullscreen);
	}

	toggleFullscreen = () => {
		if(!this.state.isFullscreen) {
			if (this.videoPlayer.mozRequestFullScreen) {
				this.videoPlayer.mozRequestFullScreen();
			} else if (this.videoPlayer.webkitRequestFullScreen) {
				this.videoPlayer.webkitRequestFullScreen();
			}
			this.setState({
				isFullscreen: true
			});
		}
		else {
			if(document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
			else if(document.exitFullscreen) {
				document.exitFullscreen();
			}
			this.setState({
				isFullscreen: false
			});
		}
	}

	rewindVideo = (time) => {
		this.videoPlayer.currentTime -= time;
	}

	timeHandler = () => {
		if(this.videoPlayer) {
			var currTime = this.videoPlayer.currentTime;
			this.setState({
				currTime: currTime
			});
		}
	}

	nextSongGetter = () => {
		this.props.nextSongGetter();
	}

	togglePause = () => {
		var paused = this.videoPlayer.paused;
		if(paused) {
			this.videoPlayer.play();
		}
		else{
			this.videoPlayer.pause();
		}
	}

	pauseHandler = () => {
		this.props.paused(true);
		this.videoPlayer.pause();
	}

	adjustVolume = () => {
		var volumeLevel = this.volumeSlider.value / 100;
		this.videoPlayer.volume = volumeLevel;		
	}

	render = () => {
		var volumeControl = <input type="range" style={{ position: 'relative', top: 12 }} onInput={this.adjustVolume} ref={(volumeSlider) => this.volumeSlider = volumeSlider} min={0} max={100} defaultValue={25}/>;

		var glyphicon = 'play';
		// var currentTime = 0;

		var paused = true;
		if(this.videoPlayer !== undefined){
			glyphicon = this.videoPlayer.paused ? 'play' : 'pause';
			// currentTime = this.videoPlayer.currentTime;
			paused = this.videoPlayer.paused;
		}

		var progressBar = <ProgressBar currentTime={this.state.currTime} totalTime={this.props.totalTime} isPaused={paused} />;

		return(
			<div>
				<Row style={{ textAlign: 'center' }}>
					<video
						controls={false}
						onClick={this.togglePause}
						ref={(videoPlayer) => this.videoPlayer = videoPlayer} 
						src={this.props.currentVideo}
						hidden={this.props.currentVideo === '' ? 'hidden' : ''} 
						width={'85%'}
					/>
				</Row>
				<Row style={{ margin: '20px auto' }}>
					<Col md={3}>
						<ButtonGroup>
							<Button onClick={this.rewindVideo.bind(null, 30)} bsStyle='primary'>{'<<'}</Button>
							<Button onClick={this.rewindVideo.bind(null, 15)} bsStyle='primary'>{'<'}</Button>
							<Button onClick={this.togglePause} bsStyle='primary'>
								<span className={'glyphicon glyphicon-' + glyphicon}></span>
							</Button>
						</ButtonGroup>
					</Col>
					<Col md={7}>
						{progressBar}
					</Col>
					<Col md={2}>
						{volumeControl}
					</Col>
				</Row>
			</div>
		);
	}
}
VideoPlayer.propTypes = {
	currentVideo: React.PropTypes.string,
	totalTime: React.PropTypes.number,
	currentTime: React.PropTypes.number,
	timeRegistered: React.PropTypes.func,
	playOnLoad: React.PropTypes.bool,
	nextSongGetter: React.PropTypes.func,
	paused: React.PropTypes.func
};

export default VideoPlayer;