/* eslint-disable no-console */

"use strict";

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as $ from 'jquery';
import * as _ from 'lodash';
import * as ReactBootstrap from 'react-bootstrap';
var Button = ReactBootstrap.Button;
var Modal = ReactBootstrap.Modal;

class MainPage extends React.Component {
	constructor(props){
		super(props);

		this.ws = null;

		this.state = {
			playlists:  [],
			selectedPlaylist: '',
			currentPlaylist: {},
			currentPlayTime: null,
			paused: true,
			currentSong: '',
			ws: null
		};
	}

	receivePlaylist = (message) => {
		var data = $.parseJSON(message.data);
		var new_playlist = data.playlist;
		var new_song = data.song_added;
		if(new_playlist !== undefined){
			this.setState({
				playlists: _.uniq(_.concat(this.state.playlists, new_playlist))
			});
		}
		else if (new_song !== undefined){
			var playlistCopy = _.cloneDeep(this.state.currentPlaylist);
			playlistCopy.songs = _.concat(playlistCopy.songs, new_song);
			this.setState({
				currentPlaylist: playlistCopy
			});
		}
	}

	componentWillMount = () => {
		this.ws = new WebSocket("ws://" + window.location.host + "/playlist/socket");
		this.ws.onopen = () => {
			this.setState({
				ws: this.ws
			});
			console.log('socket opened');
		};

		this.ws.onmessage = (message) => {
			console.log(message);
			this.receivePlaylist(message);
		};
	}

	componentDidMount = () => {
		$.get('/playlist')
		.done(res => {
			//let playlists = $.parseJSON(res);
			let playlists = res;
			playlists = _.uniq(_.castArray(playlists.playlists));
			this.setState({
				playlists: playlists
			});
		});
	}

	componentWillUnmount = () => {
		this.fetchPlaylist.abort();
		this.fetchPlaylists.abort();
	}

	componentDidUpdate = (prevProps, prevState) => {
		if(this.state.selectedPlaylist != '' && prevState.selectedPlaylist != this.state.selectedPlaylist){
			this.fetchPlaylist = $.get('/playlist', {'playlist': this.state.selectedPlaylist}, (result) => {
				if(this.state.selectedPlaylist != ''){
					console.log('sending: ' + JSON.stringify({'old_playlist': prevState.selectedPlaylist, 'new_playlist': this.state.selectedPlaylist}));
					this.ws.send(JSON.stringify({'old_playlist': prevState.selectedPlaylist, 'new_playlist': this.state.selectedPlaylist}));
				}
				this.setState({
					currentPlaylist: result.playlist
				});
			});
		}
	}

	selectPlaylist = (name) => {
		this.setState({
			selectedPlaylist: name
		});
	}

	signoutCallback = () => {

	}

	addSongCallback = (url) => {
		if(url != ''){
			console.log({
					'playlist': this.state.selectedPlaylist,
					'songUrl': url
				});
			$.ajax({
				method: "PUT",
				url: '/song',
				data: {
					playlist: this.state.selectedPlaylist,
					type: this.state.currentPlaylist.type,
					songUrl: url
				},
				statusCode: {
					400: () => {
						console.log('some kind of error.  check server log');
					}
				}
			});
		}
	}

	timeRegistered = () => {
		this.setState({
			currentPlayTime: null
		});
	}

	getNextSong = () => {
		$.get('/song/next?playlist=' + this.state.currentPlaylist.title)
		.done(res => {
			let json = res;
			if(json.streamUrl !== null)
				this.setState({
					currentSong: json.songUrl,
					currentPlayTime: json.time,
					paused: false
				});
			else
				this.setState({
					currentSong: '',
					paused: true
				});
		});
	}

	goLiveOnPlaylist = (event) => {
		event.preventDefault();
		$.get('/song?playlist=' + this.state.currentPlaylist.title)
		.done(res => {
			let json = res;

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
		});
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
			exportPlaylistLink = <a href={'http://youtube.com/watch_videos?video_ids=' + songList} target='_blank'><span className='glyphicon glyphicon-export'></span></a>;
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
		var selectedPlaylistIndex = _.findIndex(this.state.playlists, (playlist) => { return this.state.currentPlaylist.title == playlist.title; });
		var currentSongIndex = _.findIndex(this.state.currentPlaylist.songs, (song) => { return this.state.currentSong == song.streamUrl; });
		return (
			<div>
				<div id='top-section'>
					<NavBar signoutCallback={this.signoutCallback} />
					<div className='row'>
						<div className='col m3'>
							{addSongArea}
						</div>
						<div className='col m6'>
							{audioBar}
						</div>
					</div>
					<div className='row'>
						<div className='col m3' style={{paddingLeft: 50}}>
							<PlaylistSidebar playlistSelector={this.selectPlaylist} playlists={this.state.playlists} selectedPlaylistIndex={selectedPlaylistIndex} />
						</div>
						<div className='col m9'>
							<div id='playlist_area' style={{marginRight: 50}}>
								<div className='row' style={{marginLeft: 0, marginRight: 0, paddingBottom: 10}}>
									<div className='left'>
										{goLiveLink}
									</div>
									<div className='right'>
										{exportPlaylistLink}
									</div>
								</div>
								{contentSection}
							</div>
						</div>
					</div>
				</div>

			</div>
		);
	}
}

class NavBar extends React.Component {
	render = () => {
		return(
			<nav>
				<div className="nav-wrapper">
					<div className="navbar-header navbar-left">
						<a className="navbar-brand" href="#">Playlistr</a>
					</div>
					<div id="navbar" className="navbar-collapse collapse">
						<ul className="nav navbar-nav navbar-right">
							<li className="dropdown">
								<a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">username<span className="caret"></span></a>
								<ul className="dropdown-menu">
									<li><a href="/user">Profile</a></li>
									<li role="separator" className="divider"></li>
									<li><a onClick={this.props.signoutCallback}>Sign Out</a></li>
								</ul>
							</li>
						</ul>
					</div>
				</div>
			</nav>
		);
	}
}
NavBar.propTypes = {
	signoutCallback: React.PropTypes.func
};

class AddSongArea extends React.Component {
	constructor(){
		super();
	}

	state = {
		url: ''
	}

	onChange = () => {
		this.setState({
			url: this.refs.songUrl.value
		});
	}

	addSong = () => {
		this.props.addSongCallback(this.state.url);
		this.refs.songUrl.value = '';
		this.setState({
			url: ''
		});
	}

	render = () => {
        return(
			<div className='input-field' style={{width: '50%', margin: '10px auto'}}>
				<input className='form-control' ref='songUrl' type='text' placeholder='Add song to current playlist' onChange={this.onChange} />
				<span className='input-group-btn'>
					<button className='btn btn-default' ref='addSong' onClick={this.addSong}>+</button>
				</span>
			</div>);
	}
}
AddSongArea.propTypes = {
	addSongCallback: React.PropTypes.func
};

class CustomAudioBar extends React.Component {
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
		console.log(this.refs.audioPlayerHidden.currentTime);
		this.setState({
			currTime: this.refs.audioPlayerHidden.currentTime
		});
	}

	componentDidMount = () => {
		this.audioPlayer = ReactDOM.findDOMNode(this.refs.audioPlayerHidden);

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
		var audioPlayer = this.refs.audioPlayerHidden;
		if(audioPlayer.paused) audioPlayer.play();
		else{
			this.refs.innerDiv.style.transition = 'paused';
			audioPlayer.pause();
		}
	}

	adjustVolume = () => {
		this.refs.audioPlayerHidden.volume = this.refs.volumeSlider.value / 100;
	}

	render = () => {
		var glyphicon_class = "glyphicon glyphicon-";
		var width = 0;
		if(this.refs.audioPlayerHidden !== undefined){
			glyphicon_class += this.refs.audioPlayerHidden.paused ? "play" : "pause";
			var button = <button className='btn left' onClick={this.togglePlay}>
							<span className={glyphicon_class}></span>
						</button>;

			width = (this.state.currTime / this.refs.audioPlayerHidden.duration * 100) + '%';

			var currMinutes = Math.floor(this.state.currTime / 60);
			var currSeconds = Math.floor(this.state.currTime - currMinutes * 60);
			var currTimeString = currSeconds < 10 ? (currMinutes + ':0' + currSeconds) : (currMinutes + ':' + currSeconds);

			//var totalMinutes = Math.floor(this.refs.audioPlayerHidden.duration / 60);
			//var totalSeconds = Math.floor(this.refs.audioPlayerHidden.duration - totalMinutes * 60);
			var totalMinutes = Math.floor(this.props.totalTime / 60);
			var totalSeconds = Math.floor(this.props.totalTime - totalMinutes * 60);
			var totalTimeString = totalSeconds < 10 ? (totalMinutes + ':0' + totalSeconds) : (totalMinutes + ':' + totalSeconds);

			var playbackBar = <div ref='outerDiv' style={{backgroundColor: 'lightgray', borderRadius: '3px', width: '85%', height: '25px', position: 'relative', top: '3px', left: '5%'}}>
								<div ref='innerDiv' style={{backgroundColor: 'cornflowerblue', borderRadius: '3px', width: width, height: '25px'}}>
								</div>
								<div style={{position: 'absolute', top: '2px', right: '5px'}}>
									{currTimeString + ' / ' + totalTimeString}
								</div>
							</div>;
			var volumeControl = <input style={{position: 'absolute', top: '28px', right: '-50px', width: '15%'}} className='pull-right' type="range" onInput={this.adjustVolume} ref="volumeSlider" min={0} max={100} />;
			if(this.refs.innerDiv !== undefined && this.state.currTime != 0 && width != '100%'){
				this.refs.innerDiv.style.transition = 'width 1s linear 0s';
			}
		}

		return (
			<div className='row' style={{display: 'inline'}}>
				{button}
				{playbackBar}
				{volumeControl}
				<div className='clearfix'></div>
				<audio ref='audioPlayerHidden' hidden src={this.props.currentSong}></audio>
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
			isPaused: true
		};
	}

	static defaultProps = {
		currentVideo: '',
		totalTime: 0
	}

	componentDidMount = () => {
		this.videoPlayer = ReactDOM.findDOMNode(this.refs.videoPlayer);

		this.videoPlayer.addEventListener('pause', () => {
			this.pauseHandler();
		});

		this.videoPlayer.addEventListener('ended', () => {
			this.nextSongGetter();
		});

		this.videoPlayer.addEventListener('timeupdate', () => {
			this.timeHandler();			
		});

	}

	componentDidUpdate = () => {
		if(this.props.currentVideo !== null){
			var playStatus = this.props.playOnLoad && this.videoPlayer.paused ? true : false;
			if(this.props.currentTime !== null){
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
		this.audioPlayer.removeEventListener('timeupdate', this.timeHandler);
		this.audioPlayer.removeEventListener('pause', this.pauseHandler);
		this.audioPlayer.removeEventListener('ended', this.nextSongGetter);
	}

	rewindVideo = (time) => {
		this.videoPlayer.currentTime -= time;
	}

	timeHandler = () => {
		var currTime = this.videoPlayer.currentTime;
		this.setState({
			currTime: currTime
		});
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
		var volumeLevel = this.refs.volumeSlider.value / 100;
		this.videoPlayer.volume = volumeLevel;		
	}

	render = () => {
		var volumeControl = <input type="range" onInput={this.adjustVolume} ref="volumeSlider" min={0} max={100} />;

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
				<video
					onClick={this.togglePause}
					ref='videoPlayer' 
					src={this.props.currentVideo}
					hidden={this.props.currentVideo === '' ? 'hidden' : ''} 
				>
				</video>
				<div className='row' style={{marginBottom: 10}}>
					<div className='col s1' style={{display: 'inline', width: '10%'}}>
						<button onClick={this.rewindVideo.bind(null, 30)}className='btn'>{'<<'}</button>
						<button onClick={this.rewindVideo.bind(null, 15)} className='btn'>{'<'}</button>
						<button onClick={this.togglePause} className='btn'><span className={'glyphicon glyphicon-' + glyphicon}></span></button>
					</div>
					<div className='col-xs-8'>
						{progressBar}
					</div>
					<div className='col-xs-2'>
						{volumeControl}
					</div>
				</div>
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

		if(this.refs.innerDiv !== undefined && this.props.isPaused) this.refs.innerDiv.style.transition = 'paused';

		return (
			<div ref='outerDiv' style={{backgroundColor: 'lightgray', borderRadius: '3px', top: 3, width: '100%', height: '25px', position: 'relative'}}>
				<div ref='innerDiv' style={{backgroundColor: 'cornflowerblue', borderRadius: '3px', width: width, height: '25px'}}>
				</div>
				<div style={{position: 'absolute', top: '2px', right: '5px'}}>
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
	constructor(){
		super();
	}

	state = {
		isShown: false,
		playlistName: '',
		playlistCategory: '',
		playlistPassword: '',
		playlistOpenSubmissions: true,
		playlistType: 'music',
		hasError: false,
		nameTaken: false
	}

	showPlaylistCreator = () => {
		this.setState({
			isShown: true
		});
	}

	hidePlaylistCreator = () => {
		this.setState({
			isShown: false
		});
	}

	createPlaylist = () => {
		this.makePlaylist = $.ajax({
			method: 'PUT',
			url: '/playlist',
			data: {
				playlist: this.state.playlistName,
				category: this.state.playlistCategory,
				password: this.state.playlistPassword,
				openSubmissions: this.state.playlistOpenSubmissions,
				type: this.state.playlistType
			},
			statusCode: {
				409: () => {
					this.setState({
						nameTaken: true
					});
				},
				400: () => {
					this.setState({
						hasError: true
					});
				}
			}
		}).success(() => {
			this.props.playlistSelector(this.state.playlistName);
			this.hidePlaylistCreator();
		});
	}

	componentWillUnmount = () => {
		this.makePlaylist.abort();
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
		var alertArea = this.state.nameTaken ? <div className=''>Playlist name already taken.</div> : null;
		return(
			<div>
				<Button
					bsStyle="primary"
					onClick={this.showPlaylistCreator}
					style={{width: '80%', left: '10%', position: 'relative', marginBottom: '10px'}}
				>
					Create Playlist
				</Button>

				<Modal show={this.state.isShown} onHide={this.hidePlaylistCreator}>
					<Modal.Header closeButton>
						<Modal.Title>Create New Playlist</Modal.Title>
					</Modal.Header>
					<Modal.Body>
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
					</Modal.Body>
					<Modal.Footer>
						{alertArea}
					</Modal.Footer>
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
			this.refs.playlistName.value,
			this.refs.playlistCategory.value,
			this.refs.playlistPassword.value,
			this.refs.playlistOpenSubmissions.checked,
			this.refs.musicPlaylist.checked ? 'music' : 'video'
		);
	}

	render = () => {
		var classname = this.props.hasError ? 'form-group has-error' : 'form-group';
		return(
			<div>
				<div className={classname}>
					<input type="text" ref="playlistName" className="form-control" placeholder="Playlist title" required value={this.props.playlistName} onChange={this.handleChange} />
					<input type="text" ref="playlistCategory" className="form-control" placeholder="Playlist category" required value={this.props.playlistCategory} onChange={this.handleChange} />
				</div>
				<input type="text" className="form-control" placeholder="Password (leave blank for none)" ref="playlistPassword" value={this.props.playlistPassword} onChange={this.handleChange} />
				<div className="checkbox">
					<label>
						Public submissions
						<input type="checkbox" ref="playlistOpenSubmissions" checked={this.props.playlistOpenSubmissions} onChange={this.handleChange} ></input>
					</label>
				</div>
				<div className="typeRadio">
					<input type='radio' name="type" ref='musicPlaylist' onChange={this.handleChange} checked={this.props.playlistType === 'music' ? 'checked' : ''} /> Music
					<input type='radio' name="type" ref='videoPlaylist' onChange={this.handleChange} checked={this.props.playlistType === 'video' ? 'checked' : ''} /> Video
				</div>
				<button type="submit" className="btn btn-primary pull-right" id="create_playlist" onClick={this.props.createPlaylist}>Create</button>
				<div className="clearfix"></div>
			</div>
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
	constructor(){
		super();
	}

	static defaultProps = {
		playlists: [],
		selectedPlaylistIndex: -1
	}

	playlistSelector = (name) => {
		this.props.playlistSelector(name);
	}

	render = () => {
		var playlists = null;
		if(this.props.playlists.length != 0){
			playlists = <div className='list-group'>
					{_.map(this.props.playlists, (playlist, index) => {
						var selected = index == this.props.selectedPlaylistIndex;
						return <Playlist 
									playlistSelector={this.playlistSelector.bind(null, playlist.title)} 
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
	playlists: React.PropTypes.arr,
	selectedPlaylistIndex: React.PropTypes.number,
	playlistSelector: React.PropTypes.func
};

class Playlist extends React.Component {
	constructor(props){
		super(props);
	}

	static defaultProps = {
		name: '',
		selected: false,
		type: ''
	}

	render = () => {
		var style = this.props.selected ? {backgroundColor: 'cornflowerblue'} : {};
		var glyphicon = this.props.type === 'music' ? 'glyphicon-music' : 'glyphicon-film';
		return(
			<button 
				onClick={this.props.playlistSelector.bind(null, this.props.name)} 
				style={style} 
				type='button' 
				className='list-group-item playlist-selector pull-left' 
				id={this.props.name}
			>
				{this.props.name}
				<span className={'pull-right glyphicon ' + glyphicon}></span>
			</button>
		);
	}
}
Playlist.propTypes = {
	name: React.PropTypes.string,
	type: React.PropTypes.string,
	selected: React.PropTypes.bool,
	playlistSelector: React.PropTypes.func
};

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
						<h4>There's nothing here.  Add songs to this playlist at the top left.</h4>
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
	songs: React.PropTypes.arr,
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

ReactDOM.render(<MainPage />, document.getElementById('main-panel'));
