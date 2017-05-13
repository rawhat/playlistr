/* eslint-disable no-console */
import React, { Component } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import _ from 'lodash';
import {
	Row,
	Col,
} from 'react-bootstrap';


import AddSongArea from './add-song-area';
import CustomAudioBar from './custom-audio-bar';
import VideoPlayer from './video-player';
import PlaylistSidebar from './playlist-sidebar';
import SongArea from './song-area';

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

export default MainPage;