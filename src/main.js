/* eslint-disable no-console */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import _ from 'lodash';
import {
	Navbar,
	Nav,
	MenuItem,
	NavDropdown,
	Row,
	Col,
	Form,
	Button,
	ButtonGroup,
	Modal,
	FormGroup,
	FormControl,
	InputGroup,
	Overlay,
	Popover
} from 'react-bootstrap';

const ModalHeader = Modal.Header;
const ModalBody = Modal.Body;
const ModalFooter = Modal.Footer;

class MainPage extends Component {
	constructor(props){
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
			playlistPasswordError: false
		};
	}

	componentDidMount = async () => {
		this.socket = io.connect();

		this.socket.on('new-playlist', (msg) => {
			this.setState({
				playlists: _.orderBy(_.uniq(_.concat(this.state.playlists, msg.playlist)), (playlist) => playlist.title, 'asc')
			});
		});

		this.socket.on('new-song', async (msg) => {
			console.log(msg);
			let response = await axios.get(`/playlist?playlist=${this.state.currentPlaylist.title}`);
			let playlist = response.data.playlist;
			this.setState({
				currentPlaylist: playlist
			});
		});

		let res = await axios.get('/playlist');
		let data = res.data;

		let playlists = _.uniq(_.castArray(data.playlists));
		this.setState({
			playlists: _.orderBy(playlists, (playlist) => playlist.title, 'asc')
		});
	}

	// componentDidUpdate = async (prevProps, prevState) => {
	// 	if(this.state.selectedPlaylist && prevState.selectedPlaylist !== this.state.selectedPlaylist){
	// 		let result = await axios.get(`/playlist?playlist=${this.state.selectedPlaylist}`);

	// 		if(this.state.selectedPlaylist){
	// 			// console.log('sending: ' + JSON.stringify({'old_playlist': prevState.selectedPlaylist, 'new_playlist': this.state.selectedPlaylist}));
	// 			this.socket.emit('change-playlist', { old_playlist: prevState.selectedPlaylist, new_playlist: this.state.selectedPlaylist});
	// 		}
	// 		this.setState({
	// 			currentPlaylist: result.data.playlist
	// 		}, () => {
	// 			this.goLiveOnPlaylist();
	// 		});
	// 	}
	// }

	selectPlaylist = async (name) => {
		let playlist = this.state.playlists.find(playlist => playlist.title === name);
		if(!playlist.hasPassword) {
			try {
				let res = await await axios.get(`/playlist?playlist=${name}`);
				this.socket.emit('change-playlist', { old_playlist: this.state.selectedPlaylist, new_playlist: name });
				this.setState({
					selectedPlaylist: res.data.playlist.title,
					currentPlaylist: res.data.playlist
				}, () => {
					this.goLiveOnPlaylist();
				});
			}
			catch(err) {
				console.error(err);
			}
		}
		else {
			this.setState({
				playlistPasswordAccess: name
			});
		}
	}

	selectProtectedPlaylist = async (title, password) => {
		try {
			let res = await axios.get(`/playlist?playlist=${title}&password=${password}`);
			this.setState({
				selectedPlaylist: res.data.playlist.title,
				currentPlaylist: res.data.playlist
			});
			return true;
		}
		catch(err) {
			return false;
		}
	}

	signoutCallback = async () => {
		await axios.get('/signout');
		this.props.history.push('/');
	}

	addSongCallback = async (url) => {
		if(url){
			console.log({ 'playlist': this.state.selectedPlaylist, 'songUrl': url });
			try {
				let res = await axios.put('/song', {
					playlist: this.state.selectedPlaylist,
					type: this.state.currentPlaylist.type,
					songUrl: url
				});
				if(res.status === 400) {
					console.log('Server error.  Check it out.');
				}
			}
			catch(err) {
				console.error(err);
			}
		}
	}

	timeRegistered = () => {
		this.setState({
			currentPlayTime: null
		});
	}

	getNextSong = async () => {
		try {
			let res = await axios.get('/song/next?playlist=' + this.state.currentPlaylist.title);
			let json = res.data;
			if(json.streamUrl !== null) {
				this.setState({
					currentSong: json.songUrl,
					currentPlayTime: json.time,
					paused: false
				});
			}
			else {
				this.setState({
					currentSong: '',
					paused: true
				});
			}
		}
		catch(err) {
			console.error(err);
		}
	}

	goLiveOnPlaylist = async (event) => {
		if(event) event.preventDefault();
		try {
			let res = await axios.get('/song?playlist=' + this.state.currentPlaylist.title);
			let json = res.data;

			if(json.songUrl != this.state.currentSong){
				this.setState({
					currentSong: json.songUrl,
					currentPlayTime: json.time,
					paused: false
				});
			}
			else if(json.songUrl === ''){
				this.setState({
					currentPlaytime: 0,
					paused: true
				});
			}
			else{
				this.setState({
					currentPlayTime: json.time,
					paused: false
				});
			}
		}
		catch(err) {
			console.error(err);
		}
	}

	setPaused = (paused) => {
		this.setState({
			paused: paused
		});
	}

	render = () => {
		var goLiveLink = null;
		var exportPlaylistLink = null;
		if(!_.isEqual(this.state.currentPlaylist, {}) && this.state.currentPlaylist.songs.length !== 0){
			goLiveLink = <a href='#' onClick={this.goLiveOnPlaylist.bind(this)}>Go Live</a>;
			var songList = _.map(_.map(this.state.currentPlaylist.songs, 'url'), song => {
				return song.split('?v=')[1];
			}).join(',');
			exportPlaylistLink = <a href={'http://youtube.com/watch_videos?video_ids=' + songList} target='_blank' rel='noopener noreferrer'>Export <span className='glyphicon glyphicon-export'></span></a>;
		}

		var totalTime = this.state.currentPlaylist.length;

		var audioBar = null;
		var contentSection = null;

		if(this.state.currentPlaylist.type === 'music'){
			audioBar = <CustomAudioBar 
							currentSong={this.state.currentSong}
							currentTime={this.state.currentPlayTime}
							paused={this.setPaused}
							playOnLoad={!this.state.paused}
							timeRegistered={this.timeRegistered}
							nextSongGetter={this.getNextSong}
							totalTime={totalTime}
						/>;
			contentSection = <SongArea songs={this.state.currentPlaylist.songs} currentSongIndex={currentSongIndex} title={this.state.currentPlaylist.title}/>;
		}
		else if(this.state.currentPlaylist.type === 'video'){
			contentSection = <div className='video-area'>
								<VideoPlayer 
									currentVideo={this.state.currentSong}
									currentTime={this.state.currentPlayTime}
									paused={this.setPaused}
									playOnLoad={!this.state.paused}
									timeRegistered={this.timeRegistered}
									nextSongGetter={this.getNextSong}
									totalTime={totalTime}
								/>
								<SongArea songs={this.state.currentPlaylist.songs} currentSongIndex={currentSongIndex} title={this.state.currentPlaylist.title}/>
							</div>;
		}

		var addSongArea = this.state.currentPlaylist.title === undefined ? null : <AddSongArea addSongCallback={this.addSongCallback} />;
		var selectedPlaylistIndex = _.findIndex(this.state.playlists, (playlist) => { return this.state.currentPlaylist && this.state.currentPlaylist.title === playlist.title; });
		var currentSongIndex = _.findIndex(this.state.currentPlaylist.songs, (song) => { return this.state.currentSong && this.state.currentSong === song.streamUrl; });

		/*let passwordOverlay = <Overlay title='Playlist password' id='playlist-password-overlay'>
			<FormGroup validationState={this.state.playlistPasswordError ? 'error' : null}>
				<InputGroup>
					<FormControl type='text' id='password-overlay' ref={(overlayPassword) => this.overlayPassword = overlayPassword}/>
					<InputGroup.Button>
						<Button bsStyle='success' onClick={this.selectProtectedPlaylist}>Access</Button>
					</InputGroup.Button>
				</InputGroup>
			</FormGroup>
		</Overlay>;*/

		return (
			<div>
				<Row className='middle-section'>
					<Col md={2} sm={12}>
						<Row>
							{addSongArea}
						</Row>
						<Row>
							<PlaylistSidebar
								playlistSelector={this.selectPlaylist} 
								playlists={this.state.playlists} 
								selectedPlaylistIndex={selectedPlaylistIndex} 
								selectProtectedPlaylist={this.selectProtectedPlaylist} />
						</Row>
					</Col>
					<Col md={10} sm={12}>
						<Row>
							{audioBar}
						</Row>
						<Row>
							<div id='playlist_area' style={{marginRight: 50}}>
								<div className='row' style={{marginLeft: 50, marginRight: 50, paddingBottom: 10}}>
									<div className='pull-left'>
										{goLiveLink}
									</div>
									<div className='pull-right'>
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
	}
}

const NavBar = () => {
	<Navbar>
		<Navbar.Header>
			<Navbar.Brand>
				<Link to={'/'}>Playlistr</Link>
			</Navbar.Brand>
		</Navbar.Header>
		<Navbar.Collapse>
			<Nav pullRight>
				<NavDropdown title={this.props.username} id='basic-nav-dropdown'>
					<li role="presentation">
						<Link to="/profile/test" role="menuitem">Profile</Link>
					</li>
					<MenuItem divider />
					<MenuItem href='/signout'>Sign Out</MenuItem>
				</NavDropdown>
			</Nav>
		</Navbar.Collapse>
	</Navbar>;
};
NavBar.propTypes = {
	signoutCallback: React.PropTypes.func
};

class AddSongArea extends Component {
	constructor(props){
		super(props);
	}

	state = {
		url: ''
	}

	onChange = () => {
		this.setState({
			url: this.songUrl.value
		});
	}

	addSong = () => {
		this.props.addSongCallback(this.state.url);
		this.songUrl.value = '';
		this.setState({
			url: ''
		});
	}

	render = () => {
        return(
			// <div className='input-field' style={{width: '50%', margin: '10px auto'}}>
			<FormGroup>
				<InputGroup>
					<input className='form-control' ref={(songUrl) => this.songUrl = songUrl} type='text' placeholder='Add song to current playlist' onChange={this.onChange} />
					<InputGroup.Button>
						<button className='btn btn-default' onClick={this.addSong}>+</button>
					</InputGroup.Button>
				</InputGroup>
			</FormGroup>
			// </div>
		);
	}
}
AddSongArea.propTypes = {
	addSongCallback: React.PropTypes.func
};

class CustomAudioBar extends Component {
	constructor(props){
		super(props);
		this.state = {
			currTime: 0
		};
	}

	static defaultProps = {
		currentSong: '',
		totalTime: 0
	}

	pauseHandler = () => {
		this.props.paused(true);
		this.audioPlayer.pause();
	}

	endedHandler = () => {
		this.props.nextSongGetter();
	}

	timeHandler = () => {
		console.log(this.audioPlayer.currentTime);
		this.setState({
			currTime: this.audioPlayer.currentTime
		});
	}

	componentDidMount = () => {
		this.audioPlayer.volume = .25;
		this.audioPlayer.addEventListener('timeupdate', this.timeHandler);
		this.audioPlayer.addEventListener('pause', this.pauseHandler);
		this.audioPlayer.addEventListener('ended', this.endedHandler);
	}

	componentWillUnmount = () => {
		this.audioPlayer.removeEventListener('timeupdate', this.timeHandler);
		this.audioPlayer.removeEventListener('pause', this.pauseHandler);
		this.audioPlayer.removeEventListener('ended', this.endedHandler);
	}

	componentDidUpdate = () => {
		var playStatus = (this.props.playOnLoad && this.audioPlayer.paused) ? true : false;
		if(playStatus){
			this.audioPlayer.play();
		}
		if(this.props.currentTime !== null){
			this.audioPlayer.currentTime = this.props.currentTime;
			this.props.timeRegistered();
		}
	}

	togglePlay = () => {
		var audioPlayer = this.audioPlayer;
		if(audioPlayer.paused) audioPlayer.play();
		else{
			this.innerDiv.style.transition = 'paused';
			audioPlayer.pause();
		}
	}

	adjustVolume = () => {
		this.audioPlayer.volume = this.volumeSlider.value / 100;
	}

	render = () => {
		var glyphicon_class = "glyphicon glyphicon-";
		var width = 0;
		if(this.audioPlayer){
			glyphicon_class += this.audioPlayer.paused ? "play" : "pause";
			var button = <button className='btn btn-primary left' onClick={this.togglePlay}>
							<span className={glyphicon_class}></span>
						</button>;

			width = (this.state.currTime / this.audioPlayer.duration * 100) + '%';

			var currMinutes = Math.floor(this.state.currTime / 60);
			var currSeconds = Math.floor(this.state.currTime - currMinutes * 60);
			var currTimeString = currSeconds < 10 ? (currMinutes + ':0' + currSeconds) : (currMinutes + ':' + currSeconds);

			//var totalMinutes = Math.floor(this.refs.audioPlayerHidden.duration / 60);
			//var totalSeconds = Math.floor(this.refs.audioPlayerHidden.duration - totalMinutes * 60);
			var totalMinutes = Math.floor(this.props.totalTime / 60);
			var totalSeconds = Math.floor(this.props.totalTime - totalMinutes * 60);
			var totalTimeString = totalSeconds < 10 ? (totalMinutes + ':0' + totalSeconds) : (totalMinutes + ':' + totalSeconds);

			var playbackBar = <div ref={(outerDiv) => this.outerDiv = outerDiv} style={{backgroundColor: 'lightgray', borderRadius: '3px', height: '45px', position: 'relative'}}>
								<div ref={(innerDiv) => this.innerDiv = innerDiv} style={{backgroundColor: '#375a7f', borderRadius: '3px', width: width, height: '45px'}}>
								</div>
								<div style={{position: 'absolute', top: '12px', right: '5px'}}>
									{currTimeString + ' / ' + totalTimeString}
								</div>
							</div>;

			var volumeControl = <input type="range" style={{ position: 'relative', top: '12px' }} onInput={this.adjustVolume} ref={(volumeSlider) => this.volumeSlider = volumeSlider} min={0} max={100} defaultValue={25}/>;
			if(this.innerDiv && this.state.currTime != 0 && width != '100%'){
				this.innerDiv.style.transition = 'width 1s linear 0s';
			}
		}

		return (
			<div>
				<Col md={1} mdOffset={1}>{button}</Col>
				<Col md={7}>{playbackBar}</Col>
				<Col md={2}>{volumeControl}</Col>
				<audio ref={(audioPlayer) => this.audioPlayer = audioPlayer} hidden src={this.props.currentSong}></audio>
			</div>
		);
	}
}
CustomAudioBar.propTypes = {
	currentSong: React.PropTypes.string,
	totalTime: React.PropTypes.number,
	currentTime: React.PropTypes.number,
	timeRegistered: React.PropTypes.func,
	playOnLoad: React.PropTypes.bool,
	nextSongGetter: React.PropTypes.func,
	paused: React.PropTypes.func
};

class VideoPlayer extends React.Component {
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

class ProgressBar extends React.Component {
	constructor(props){
		super(props);
	}

	static defaultProps = {
		currentTime: 0,
		totalTime: 0
	}

	render = () => {
		var width = '0%';
		if(this.props.totalTime !== 0) 
			width = (this.props.currentTime / this.props.totalTime * 100) + '%';

		var currMinutes = 0;
		var currSeconds = 0;
		
		if(this.props.currentTime){
			currMinutes = Math.floor(this.props.currentTime / 60);
			currSeconds = Math.floor(this.props.currentTime - currMinutes * 60);
		}

		var currTimeString = currSeconds < 10 ? (currMinutes + ':0' + currSeconds) : (currMinutes + ':' + currSeconds);

		//var totalMinutes = Math.floor(this.refs.audioPlayerHidden.duration / 60);
		//var totalSeconds = Math.floor(this.refs.audioPlayerHidden.duration - totalMinutes * 60);
		var totalMinutes = 0;
		var totalSeconds = 0;
		
		if(this.props.totalTime){
			totalMinutes = Math.floor(this.props.totalTime / 60);
			totalSeconds = Math.floor(this.props.totalTime - totalMinutes * 60);
		}

		var totalTimeString = totalSeconds < 10 ? (totalMinutes + ':0' + totalSeconds) : (totalMinutes + ':' + totalSeconds);

		if(this.innerDiv !== undefined && this.props.isPaused) this.innerDiv.style.transition = 'paused';

		return (
			<div ref={(outerDiv) => this.outerDiv = outerDiv} style={{backgroundColor: 'darkgray', borderRadius: '3px', top: 3, width: '100%', height: '45px'}}>
				<div ref={(innerDiv) => this.innerDiv = innerDiv} style={{backgroundColor: '#375a7f', borderRadius: '3px', width: width, height: '45px'}}>
				</div>
				<div style={{position: 'absolute', top: '12px', right: '20px'}}>
					{currTimeString + ' / ' + totalTimeString}
				</div>
			</div>
		);		
	}
}
ProgressBar.propTypes = {
	totalTime: React.PropTypes.number,
	isPaused: React.PropTypes.bool,
	currentTime: React.PropTypes.number
};

class PlaylistCreator extends React.Component {
	constructor(props){
		super(props);

		this.state = {
			isShown: false,
			playlistName: '',
			playlistCategory: '',
			playlistPassword: '',
			playlistOpenSubmissions: true,
			playlistType: 'music',
			hasError: false,
			nameTaken: false
		};
	}

	showModal = () => {
		this.setState({
			isShown: true
		});
	}

	hideModal = () => {
		this.setState({
			isShown: false
		});
	}

	createPlaylist = async (ev) => {
		ev.preventDefault();
		this.makePlaylist = axios.put('/playlist', {
			playlist: this.state.playlistName,
			category: this.state.playlistCategory,
			password: this.state.playlistPassword,
			openSubmissions: this.state.playlistOpenSubmissions,
			type: this.state.playlistType
		});

		try {
			let res = await this.makePlaylist;
			if(res.status === 409) {
				this.setState({
					nameTaken: true
				});
			}
			else if(res.status === 400) {
				this.setState({
					hasError: true
				});
			}
			else {
				this.props.playlistSelector(this.state.playlistName);
				this.hideModal();
			}
		}
		catch(err) {
			console.error(err);
		}
	}

	componentWillUnmount = () => {
		if(this.makePlaylist) this.makePlaylist.cancel();
	}

	onUserInput = (name, category, password, open, type) => {
		this.setState({
			playlistName: name,
			playlistCategory: category,
			playlistPassword: password,
			playlistOpenSubmissions: open,
			playlistType: type
		});
	}

	render = () => {
		var alertArea = this.state.nameTaken ? <div className='alert-danger'>Playlist name already taken.</div> : null;
		return(
			<div>
				<Button
					bsStyle="primary"
					onClick={this.showModal}
					style={{width: '80%', left: '10%', position: 'relative', marginBottom: '10px'}}>
					Create Playlist
				</Button>

				<Modal show={this.state.isShown} onHide={this.hideModal}>
					<ModalHeader closeButton>Create New Playlist</ModalHeader>
					<ModalBody>
						<PlaylistForm 
							hasError={this.state.hasError} 
							createPlaylist={this.createPlaylist} 
							onUserInput={this.onUserInput} 
							playlistName={this.state.playlistName} 
							playlistCategory={this.state.playlistCategory} 
							playlistPassword={this.state.playlistPassword} 
							playlistOpenSubmissions={this.state.playlistOpenSubmissions} 
							playlistType={this.state.playlistType}
						/>
					</ModalBody>
					<ModalFooter>
						{alertArea}
					</ModalFooter>
				</Modal>
			</div>
		);
	}
}
PlaylistCreator.propTypes = {
	playlistSelector: React.PropTypes.func
};

class PlaylistForm extends React.Component {
	constructor(props){
		super(props);
	}

	handleChange = () => {
		this.props.onUserInput(
			this.playlistName.value,
			this.playlistCategory.value,
			this.playlistPassword.value,
			this.playlistOpenSubmissions.checked,
			this.musicPlaylist.checked ? 'music' : 'video'
		);
	}

	render = () => {
		var classname = this.props.hasError ? 'has-error' : '';
		return(
			<Form horizontal>
				<FormGroup className={classname}>
					<Col md={2}>
						Title
					</Col>
					<Col md={10}>
						<input 
							type="text" 
							ref={(playlistName) => this.playlistName = playlistName}
							className="form-control" 
							placeholder="Playlist title" 
							required 
							value={this.props.playlistName} 
							onChange={this.handleChange} />
					</Col>
				</FormGroup>
				<FormGroup>
					<Col md={2}>
						Category
					</Col>
					<Col md={10}>
						<input 
							type="text" 
							ref={(playlistCategory) => this.playlistCategory = playlistCategory}
							className="form-control" 
							placeholder="Playlist category" 
							required 
							value={this.props.playlistCategory} 
							onChange={this.handleChange} />
					</Col>
				</FormGroup>
				<FormGroup>
					<Col md={2}>
						Password
					</Col>
					<Col md={10}>
						<input 
							type="text" 
							className="form-control" 
							placeholder="Password (leave blank for none)" 
							ref={(playlistPassword) => this.playlistPassword = playlistPassword}
							value={this.props.playlistPassword} 
							onChange={this.handleChange} />
					</Col>
				</FormGroup>
				<div className="checkbox">
					<FormGroup>
						<Col md={6}>
							Public Submissions
						</Col>
						<Col md={6}>
							<input 
								type="checkbox" 
								ref={(playlistOpenSubmissions) => this.playlistOpenSubmissions = playlistOpenSubmissions}
								checked={this.props.playlistOpenSubmissions} 
								onChange={this.handleChange} />
						</Col>
					</FormGroup>
				</div>
				<div className="typeRadio">
					<FormGroup>
						<Col md={2}>
							Music 
						</Col>
						<Col md={2}>
							<input 
								type='radio' 
								name="type" 
								ref={(musicPlaylist) => this.musicPlaylist = musicPlaylist}
								onChange={this.handleChange} 
								checked={this.props.playlistType === 'music' ? 'checked' : ''} />
						</Col>
						<Col md={2}>
							Video 
						</Col>
						<Col md={2}>
							<input 
								type='radio' 
								name="type" 
								ref={(videoPlaylist) => this.videoPlaylist = videoPlaylist}
								onChange={this.handleChange} 
								checked={this.props.playlistType === 'video' ? 'checked' : ''} />
						</Col>
					</FormGroup>
				</div>
				<button type="submit" className="btn btn-primary pull-right" id="create_playlist" onClick={this.props.createPlaylist}>Create</button>
				<div className="clearfix"></div>
			</Form>
		);
	}
}
PlaylistForm.propTypes = {
	createPlaylist: React.PropTypes.func,
	playlistType: React.PropTypes.string,
	playlistOpenSubmissions: React.PropTypes.bool,
	playlistPassword: React.PropTypes.string,
	playlistCategory: React.PropTypes.string,
	playlistName: React.PropTypes.string,
	onUserInput: React.PropTypes.func,
	hasError: React.PropTypes.bool
};

class PlaylistSidebar extends React.Component {
	playlistSelector = (name) => {
		this.props.playlistSelector(name);
	}

	render = () => {
		var playlists = null;
		if(this.props.playlists.length != 0){
			playlists = <div className='playlist-list-group list-group'>
					{_.map(this.props.playlists, (playlist, index) => {
						var selected = index == this.props.selectedPlaylistIndex;
						return <Playlist 
									playlistSelector={this.playlistSelector.bind(null, playlist.title)}
									selectProtectedPlaylist={this.props.selectProtectedPlaylist}
									hasPassword={playlist.hasPassword}
									passwordOverlay={this.props.passwordOverlay}
									name={playlist.title}
									key={index}
									selected={selected}
									type={playlist.type}
								/>;
					})}
				</div>;
		}
		else{
			playlists = <div className='panel panel-default'>
							<div className='panel-body'>
								{"There's nothing here yet"}
							</div>
						</div>;
		}
		return (
			<div>
				<PlaylistCreator playlistSelector={this.playlistSelector}/>
				{playlists}
			</div>
		);
	}
}
PlaylistSidebar.propTypes = {
	playlists: React.PropTypes.array,
	selectedPlaylistIndex: React.PropTypes.number,
	playlistSelector: React.PropTypes.func,
	selectProtectedPlaylist: React.PropTypes.func,
	passwordOverlay: React.PropTypes.element
};

class Playlist extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			overlayShown: false,
			playlistPasswordError: false,
			password: null
		};
	}

	static defaultProps = {
		name: '',
		selected: false,
		type: ''
	}

	toggleOverlay = () => {
		this.setState({
			overlayShown: !this.state.overlayShown
		});
	}

	onChange = (ev) => {
		if(this.state.playlistPasswordError) {
			this.setState({ playlistPasswordError: false });
		}
		let password = ev.target.value;
		this.setState({
			password
		});
	}

	submitPassword = (ev) => {
		ev.preventDefault();
		this.setState({
			playlistPasswordError: false
		}, async () => {
			let status = await this.props.selectProtectedPlaylist(this.props.name, this.state.password);
			if(status) {
				this.setState({
					overlayShown: false,
					password: null
				});
			}
			else {
				this.setState({
					playlistPasswordError: true
				});
			}
		});
	}

	render = () => {
		var style = this.props.selected ? {backgroundColor: '#375a7f'} : {};
		var glyphicon = this.props.type === 'music' ? 'glyphicon-music' : 'glyphicon-film';
		if(this.props.hasPassword) {
			return <div ref={(overlayTarget) => this.overlayTarget = overlayTarget}>
				<button 
					onClick={this.toggleOverlay} 
					style={style} 
					type='button' 
					className='list-group-item playlist-selector' 
					id={this.props.name}
					ref={(playlistButton) => this.playlistButton = playlistButton}
				>
					{this.props.name}
					<div className='pull-right'>
						{this.props.hasPassword ? <span className='glyphicon glyphicon-lock' style={{ paddingRight: 5 }}></span> : null}
						<span className={'glyphicon ' + glyphicon}></span>
					</div>
				</button>
				<Overlay
					rootClose
					show={this.state.overlayShown}
					onHide={() => this.setState({ overlayShown: false })}
					placement='right'
					containerPadding={20}
					target={this.playlistButton}
					ref={(overlay) => this.overlay = overlay}>
						<Popover id='playlist-password-overlay' title='Playlist password'>
							<FormGroup validationState={this.state.playlistPasswordError ? 'error' : null} onSubmit={this.submitPassword}>
								<InputGroup>
									<FormControl type='text' id='password-overlay' onChange={this.onChange}/>
									<InputGroup.Button>
										<Button type='submit' bsStyle='success' onClick={this.submitPassword}>Access</Button>
									</InputGroup.Button>
								</InputGroup>
							</FormGroup>
						</Popover>
				</Overlay>
			</div>;
		}
		else {
			return <button 
				onClick={this.props.playlistSelector.bind(null, this.props.name)} 
				style={style} 
				type='button' 
				className='list-group-item playlist-selector' 
				id={this.props.name}
			>
				{this.props.name}
				<div className='pull-right'>
					{this.props.hasPassword ? <span className='glyphicon glyphicon-lock' style={{ paddingRight: 5 }}></span> : null}
					<span className={'glyphicon ' + glyphicon}></span>
				</div>
			</button>;
		}
	}
}
Playlist.propTypes = {
	name: React.PropTypes.string,
	type: React.PropTypes.string,
	selected: React.PropTypes.bool,
	playlistSelector: React.PropTypes.func,
	hasPassword: React.PropTypes.bool,
	playlistPasswordError: React.PropTypes.bool,
	selectProtectedPlaylist: React.PropTypes.func
};

// const PasswordOverlay = ({ style, inputChange, playlistPasswordError, selectProtectedPlaylist }) => {
// 	/*<div style={{
// 			...style,
// 			position: 'absolute',
// 			marginLeft: -5,
// 			marginTop: 5,
// 			padding: 10,
// 			border: '1px solid lightgray',
// 			borderRadius: 3
// 		}}>*/
// 	return (
		
// 	);
// };
// PasswordOverlay.propTypes = {
// 	style: React.PropTypes.object,
// 	inputChange: React.PropTypes.func,
// 	playlistPasswordError: React.PropTypes.bool,
// 	selectProtectedPlaylist: React.PropTypes.func
// };

class SongArea extends React.Component {
	constructor(){
		super();
	}

	static defaultProps = {
		title: undefined,
		songs: [],
		currentSongIndex: -1
	}

	render = () => {
		if(this.props.title === undefined) return <div />;

		var songs = [];
		_.each(this.props.songs, (song, index) => {
			var selected = false;
			if(index == this.props.currentSongIndex) selected = true;
			songs.push(<PlaylistSong key={index} info={song.info} length={song.length} selected={selected} />);
		});
		if(songs.length === 0){
			return (
				<div>
					<h2>{this.props.title}</h2>
					<div className="well well-sm">
						<h4>{"There's nothing here.  Add songs to this playlist at the top left."}</h4>
					</div>
				</div>
			);
		}
		return(
			<div>
				{songs}
			</div>
		);
	}
}
SongArea.propTypes = {
	title: React.PropTypes.string,
	songs: React.PropTypes.array,
	currentSongIndex: React.PropTypes.number
};

class PlaylistSong extends React.Component {
	constructor(){
		super();
		this.state = {
			hidden: true
		};
	}

	toggleHidden = () => {
		this.setState({
			hidden: !this.state.hidden
		});
	}

	render = () => {
		var mins = Math.floor(this.props.length / 60);
		var secs = this.props.length - mins * 60;
		if(secs < 10) secs = '0' + secs;
		var time = mins + ':' + secs;
		var playingIcon = this.props.selected ? <span className='glyphicon glyphicon-headphones pull-right'></span> : null;
		return(
			<div className="panel panel-default">
				<div className="panel-heading" onClick={this.toggleHidden}>
					<h4 className="panel-title pull-left">
						{this.props.info}
					</h4>
					{playingIcon}
					<div className='clearfix'></div>
				</div>
				{this.state.hidden ? null : 
					<ul className="list-group">
						<li className="list-group-item">
							<span className="pull-right">{time}</span>
							<div className="clearfix"></div>
						</li>
					</ul>
				}
			</div>
		);
	}
}
PlaylistSong.propTypes = {
	length: React.PropTypes.number,
	info: React.PropTypes.string,
	selected: React.PropTypes.bool
};

export default MainPage;