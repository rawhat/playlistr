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
	}

	state = {
			playlists:  [],
			selectedPlaylist: '',
			currentPlaylist: {},
			currentPlayTime: null,
			paused: true,
			currentSong: ''
	};

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
			console.log('socket opened');
		};

		this.ws.onmessage = (message) => {
			console.log(message);
			this.receivePlaylist(message);
		};
	}

	componentDidMount = () => {
		var that = this;
/*		fetch('/playlist')
		.then((playlists) => { return playlists.json(); })
		.then((playlists) => {*/
		$.get('/playlist')
		.done(res => {
			let playlists = $.parseJSON(res);
			playlists = _.uniq(_.castArray(playlists.playlists));
			console.log(playlists);
			that.setState({
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
					console.log('sending: ' + {'old_playlist': prevState.selectedPlaylist, 'new_playlist': this.state.selectedPlaylist});
					this.ws.send(JSON.stringify({'old_playlist': prevState.selectedPlaylist, 'new_playlist': this.state.selectedPlaylist}));
				}
				this.setState({
					currentPlaylist: $.parseJSON(result).playlist
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
					'playlist': this.state.selectedPlaylist,
					'songUrl': url
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
/*		fetch('/song/next?playlist=' + this.state.currentPlaylist.title)
		.then((response) => { return response.json(); })
		.then((json) => {*/
		$.get('/song/next?playlist=' + this.state.currentPlaylist.title)
		.done(res => {
			let json = $.parseJSON(res);
			if(json.songUrl !== null)
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
/*		fetch('/song?playlist=' + this.state.currentPlaylist.title)
		.then((results) => { return results.json(); })
		.then((json) => {*/
		$.get('/song?playlist=' + this.state.currentPlaylist.title)
		.done(res => {
			let json = $.parseJSON(res);
			if(json.songUrl != this.state.currentSong)
				this.setState({
					currentSong: json.songUrl,
					currentPlayTime: json.time,
					paused: false
				});
			else
				this.setState({
					currentPlayTime: json.time,
					paused: false
				});
		});
	}

	setPaused = (paused) => {
		this.setState({
			paused: paused
		});
	}

	render = () => {
		var goLiveLink = null;
		if(!_.isEqual(this.state.currentPlaylist, {}) && this.state.currentPlaylist.songs.length){
			goLiveLink = <a href='#' onClick={this.goLiveOnPlaylist.bind(this)}>Go Live</a>;
		}
		// var audioBar = <AudioBar playOnLoad={!this.state.paused} paused={this.setPaused} timeRegistered={this.timeRegistered} nextSongGetter={this.getNextSong} currentSong={this.state.currentSong} currentTime={this.state.currentPlayTime} />;
		var totalTime = _.reduce(this.state.currentPlaylist.songs, (sum, song) => {
			return sum + song.length;
		}, 0);
		var audioBar = this.state.currentPlaylist.title === undefined ? null : 
						<CustomAudioBar 
							currentSong={this.state.currentSong}
							currentTime={this.state.currentPlayTime}
							paused={this.setPaused}
							playOnLoad={!this.state.paused}
							timeRegistered={this.timeRegistered}
							nextSongGetter={this.getNextSong}
							totalTime={totalTime}
						/>;

		var addSongArea = this.state.currentPlaylist.title === undefined ? null : <AddSongArea addSongCallback={this.addSongCallback} />;
		var selectedPlaylistIndex = _.findIndex(this.state.playlists, (playlist) => { return this.state.currentPlaylist.title == playlist.title; });
		var currentSongIndex = _.findIndex(this.state.currentPlaylist.songs, (song) => { return this.state.currentSong == song.streamUrl; });
		return (
			<div>
				<div id='top-section'>
					<NavBar signoutCallback={this.signoutCallback} />
					<div className='row'>
						<div className='col-md-3'>
							{addSongArea}
						</div>
						<div className='col-md-6'>
							{audioBar}
						</div>
					</div>
					<div className='row'>
						<div className='col-md-3'>
							<PlaylistSidebar playlistSelector={this.selectPlaylist} playlists={this.state.playlists} selectedPlaylistIndex={selectedPlaylistIndex} />
						</div>
						<div className='col-md-9'>
							<div id='playlist_area'>
								{goLiveLink}
								<SongArea songs={this.state.currentPlaylist.songs} currentSongIndex={currentSongIndex} />
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
			<navbar className="navbar navbar-default navbar-fixed-top">
				<div className="container-fluid">
					<div className="navbar-header navbar-left">
						<a className="navbar-brand" href="#">Playlistr</a>
					</div>
					<div id="navbar" className="navbar-collapse collapse">
						<ul className="nav navbar-nav navbar-right">
							<li className="dropdown">
								<a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">username<span class="caret"></span></a>
								<ul className="dropdown-menu">
									<li><a href="/user">Profile</a></li>
									<li role="separator" className="divider"></li>
									<li><a onClick={this.props.signoutCallback}>Sign Out</a></li>
								</ul>
							</li>
						</ul>
					</div>
				</div>
			</navbar>
		);
	}
}

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

	render = () => {
        return(
			<div className='input-group' style={{width: '50%', margin: '0 auto'}}>
				<input className='form-control' ref='songUrl' type='text' placeholder='Add song to current playlist' onChange={this.onChange} />
				<span className='input-group-btn'>
					<button className='btn btn-default' ref='addSong' onClick={this.props.addSongCallback.bind(null, this.state.url)}>+</button>
				</span>
			</div>);
	}
}

/*class AudioBar extends React.Component {
	constructor(props){
		super(props);
	}

	state = {
		currTime: 0
	}

	static defaultProps = {
		currentSong: ''
	}

	componentDidMount = () => {
		var that = this;
		this.audioPlayer = ReactDOM.findDOMNode(this.refs.audioPlayer);

		this.audioPlayer.addEventListener('timeupdate', () => {
			that.setState({
				currTime: that.refs.audioPlayer.currentTime
			});
		});

		this.audioPlayer.addEventListener('pause', () => {
			that.props.paused(true);
			that.audioPlayer.pause();
		});

		this.audioPlayer.addEventListener('ended', () => {
			that.props.nextSongGetter();
		});
	}

	componentDidUpdate = () => {
		var playStatus = this.props.playOnLoad && this.audioPlayer.paused ? true : false;
		if(playStatus){
			this.audioPlayer.play();
		}
		if(this.props.currentTime != null){
			this.audioPlayer.currentTime = this.props.currentTime;
			this.props.timeRegistered();
		}
	}

	render = () => {
		return (
			<div>
				<audio controls ref='audioPlayer' id='audio_player' style={{width: '100%'}} src={this.props.currentSong} />
			</div>
		);
	}
}*/

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

	componentDidMount = () => {
		this.audioPlayer = ReactDOM.findDOMNode(this.refs.audioPlayerHidden);


		this.audioPlayer.addEventListener('timeupdate', () => {
			console.log(this.refs.audioPlayerHidden.currentTime);
			this.setState({
				currTime: this.refs.audioPlayerHidden.currentTime
			});
		});

		/*
		this.refs.audioPlayer.addEventListener('playing', function(){
			var currTime = that.refs.audioPlayer.currentTime;
			that.props.timeUpdater(currTime);
		}.bind(this));*/

		this.audioPlayer.addEventListener('pause', () => {
			this.props.paused(true);
			this.audioPlayer.pause();
		});

		this.audioPlayer.addEventListener('ended', () => {
			this.props.nextSongGetter();
		});
	}

	componentDidUpdate = () => {
		var playStatus = this.props.playOnLoad && this.audioPlayer.paused ? true : false;
		if(playStatus){
			this.audioPlayer.play();
		}
		if(this.props.currentTime != null){
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
			var button = <button className='btn btn-default pull-left' onClick={this.togglePlay}>
							<span className={glyphicon_class}></span>
						</button>;
			width = (this.state.currTime / this.refs.audioPlayerHidden.duration * 100) + '%';
			var currMinutes = Math.floor(this.state.currTime / 60);
			var currSeconds = Math.floor(this.state.currTime - currMinutes * 60);
			var currTimeString = currSeconds < 10 ? (currMinutes + ':0' + currSeconds) : (currMinutes + ':' + currSeconds);
			var totalMinutes = Math.floor(this.refs.audioPlayerHidden.duration / 60);
			var totalSeconds = Math.floor(this.refs.audioPlayerHidden.duration - totalMinutes * 60);
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
				<audio ref='audioPlayerHidden' controls hidden src={this.props.currentSong}></audio>
			</div>
		);
	}
}

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
		var that = this;
		this.makePlaylist = $.ajax({
			method: 'PUT',
			url: '/playlist',
			data: {
				'playlist': that.state.playlistName,
				'category': that.state.playlistCategory,
				'password': that.state.playlistPassword,
				'openSubmissions': that.state.playlistOpenSubmissions
			},
			statusCode: {
				409: () => {
					that.setState({
						nameTaken: true
					});
				},
				400: () => {
					that.setState({
						hasError: true
					});
				}
			}
		}).success(() => {
			this.props.playlistSelector(that.state.playlistName);
			this.hidePlaylistCreator();
		});
	}

	componentWillUnmount = () => {
		this.makePlaylist.abort();
	}

	onUserInput = (name, category, password, open) => {
		this.setState({
			playlistName: name,
			playlistCategory: category,
			playlistPassword: password,
			playlistOpenSubmissions: open
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
						<PlaylistForm hasError={this.state.hasError} createPlaylist={this.createPlaylist} onUserInput={this.onUserInput} playlistName={this.state.playlistName} playlistCategory={this.state.playlistCategory} playlistPassword={this.state.playlistPassword} playlistOpenSubmissions={this.state.playlistOpenSubmissions} />
					</Modal.Body>
					<Modal.Footer>
						{alertArea}
					</Modal.Footer>
				</Modal>
			</div>
		);
	}
}

class PlaylistForm extends React.Component {
	constructor(props){
		super(props);
	}

	handleChange = () => {
		this.props.onUserInput(
			this.refs.playlistName.value,
			this.refs.playlistCategory.value,
			this.refs.playlistPassword.value,
			this.refs.playlistOpenSubmissions.checked
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
				<button type="submit" className="btn btn-primary pull-right" id="create_playlist" onClick={this.props.createPlaylist}>Create</button>
				<div class="clearfix"></div>
			</div>
		);
	}

}

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
						return <Playlist playlistSelector={this.playlistSelector.bind(null, playlist.title)} name={playlist.title} key={index} selected={selected} />;
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

class Playlist extends React.Component {
	constructor(props){
		super(props);
	}

	static defaultProps = {
		name: '',
		selected: false
	}

	render = () => {
		var style = this.props.selected ? {backgroundColor: 'cornflowerblue'} : {};
		return(<button onClick={this.props.playlistSelector.bind(null, this.props.name)} style={style} type='button' className='list-group-item playlist-selector pull-left' id={this.props.name}>{this.props.name}</button>);
	}
}

class SongArea extends React.Component {
	constructor(){
		super();
	}

	static defaultProps = {
		songs: [],
		currentSongIndex: -1
	}

	render = () => {
		var songs = [];
		_.each(this.props.songs, (song, index) => {
			var selected = false;
			if(index == this.props.currentSongIndex) selected = true;
			songs.push(<PlaylistSong key={index} info={song.info} length={song.length} selected={selected} />);
		});
		return(
			<div>
				{songs}
			</div>
		);
	}
}

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
							<span className="pull-right">{mins + ':' + secs}</span>
							<div className="clearfix"></div>
						</li>
					</ul>
				}
			</div>
		);
	}
}
ReactDOM.render(<MainPage />, document.getElementById('main-panel'));
