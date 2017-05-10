var Promise = require('bluebird');
var _ = require('lodash');
var ytdl = Promise.promisifyAll(require('youtube-dl'));

class Song {
	constructor(info, isVideo, url, length, streamUrl) {
		this.info = info;
		this.isVideo = isVideo;
		this.url = url;
		this.length = length;
		this.streamUrl = streamUrl;
		this.driver = null;
	}
}

class Playlist {
	constructor(title, category, password="", openSubmissions=true, type) {
		this.title = title;
		this.category = category;
		this.password = password;
		this.openSubmissions = openSubmissions;
		this.type = type;
		this.length = 0;
		this.isPaused = true;
		this.startDate = null; // last time it was played
		this.currentTime = 0;  // time elapsed at last play
		this.currentSongIndex = 0;
		this.songs = [];
		this.hasPlayed = false;
		this.driver = null;
		this.conn = null;
	}

	getCurrentPlaytime() {
		return this.isPaused ? this.currentTime : this.currentTime + ((Date.now() - this.startDate) / 1000);
	}

	async addSong(song) {
		if(this.driver && this.conn) {
			try {
				let params = Object.assign({}, _.omit(song, 'driver'), { addedAt: Date.now(), title: this.title });
				await this.conn.makeQuery(`MATCH (p:Playlist) WHERE p.title = {title}
				CREATE UNIQUE (p)-[:HAS { addedAt: {addedAt} }]->(:Song {
					info: {info},
					isVideo: {isVideo},
					url: {url},
					length: {length},
					streamUrl: {streamUrl}
				}) RETURN p as playlist`, params);

				this.songs = this.songs.concat(song);
				this.updateLength();
				return true;
			}
			catch(err) {
				throw Error(err);
			}
		}
		else {
			throw Error('Driver not initialized');
		}
	}

	async removeSong(song) {
		if(this.driver) {
			let session = this.driver.session();
			try {
				await session.run('MATCH (p:Playlist)-[r:HAS]-(s:Song) WHERE p.title = {title} AND s.url = {url} DELETE r, s;', 
					{ title: this.title, url: song.url }
				);

				return true;
			}
			catch(err) {
				throw Error(err);
			}
		}
		else {
			throw Error('Driver not initialized');
		}
	}

	async getSongs() {
		if(this.driver) {
			let session = this.driver.session();
			try {
				let results = await session.run('MATCH (p:Playlist)-[:HAS]-(s:Song) WHERE p.title = {title} RETURN s as song;', { title: this.title });
				let songs = results.records.map(record => record.get('song').properties);
				return songs;
			}
			catch(err) {
				throw Error(err);
			}
		}
		else {
			throw Error('Driver not initialized');
		}
	}

	async getCurrentSongAndTime() {
		if(this.hasPlayed) {
			return {
				song: null,
				time: -1
			};
		}
		else{
			let songs = await this.getSongs();
			var length = 0;
			var index = 0;
			for(let song of songs) {
				length += song.length;
				if(length >= this.getCurrentPlaytime()) {
					index = index === 0 ? 1 : index;
					let prevLength = songs.slice(0, index-1).reduce((sum, song) => sum + song.length, 0);
					return {
						song: songs[index-1],
						time: this.getCurrentPlaytime() - prevLength
					};
				}
				index++;
			}
			return {
				song: null,
				time: -1
			};
		}
	}

	async getCurrentSongIndex() {
		let songs = await this.getSongs();
		var length = 0;
		let index = 0;
		while(length < this.getCurrentPlaytime()){
			length += songs[index].length;
			index++;
		}
		return index;
	}

	async getNextSong() {
		if(!this.hasPlayed && this.getCurrentPlaytime() < this.length){
			let songs = await this.getSongs();
			var length = 0;
			var index = 0;
			while(length <= this.getCurrentPlaytime()){
				length += songs[index].length;
				index++;
			}
			if(index > songs.length)
				return null;
			else{
				return songs[index-1];
			}
		}
		else{
			return null;
		}

	}

	async updateLength() {
		let songs = await this.getSongs();
		this.length = _.reduce(songs, (sum, song) => {
			return sum + song.length;
		}, 0);
	}

	async playSong(song) {
		let songs = await this.getSongs();
		var length = 0;
		for(var i = 0; i < songs.length; i++){
			if(songs[i].url === song.url) break;
			length += songs[i].length;
		}
		this.currentTime = length;
		// update start date
		this.startDate = Date.now();
	}

	playSongs() {		
		if(this.playbackTimer) clearTimeout(this.playbackTimer);

		this.playbackTimer = setTimeout(() => {
			this.hasPlayed = true;
		}, (this.length - this.getCurrentPlaytime()) * 1000);
	}
}

class PlaylistManager {
	constructor(driver, conn) {
		this.playlists = {};
		this.driver = driver;
		this.conn = conn;
	}

	async addPlaylist(playlist) {
		if(!this.playlists.hasOwnProperty(playlist.title)) {
			let { data, error } = await this.conn.makeQuery(`
				CREATE (p:Playlist { 
					title: {title},
					category: {category},
					password: {password},
					openSubmissions: {openSubmissions},
					type: {type},
					length: {length},
					isPaused: {isPaused},
					startDate: {startDate},
					currentTime: {currentTime},
					currentSongIndex: {currentSongIndex},
					hasPlayed: {hasPlayed}
				}) RETURN p AS playlist
			`, Object.assign({}, playlist));

			if(!error) {
				this.playlists[playlist.title] = playlist;
				this.playlists[playlist.title].driver = this.driver;
				this.playlists[playlist.title].conn = this.conn;
				return data;
			}
			else {
				console.error(error);
				throw Error(error);
			}
		}
		else{
			return null;
			// callback(false);
		}
	}

	addExistingPlaylist(playlist) {
		const { title, category, password, openSubmissions, type } = playlist;

		this.playlists[playlist.title] = new Playlist(title, category, password, openSubmissions, type);
		for(let key in playlist) {
			if(playlist.hasOwnProperty(key)) {
				this.playlists[playlist.title][key] = playlist[key];
			}
		}
		this.playlists[playlist.title].driver = this.driver;
		this.playlists[playlist.title].conn = this.conn;
		this.playlists[playlist.title].updateLength();
	}

	startPlaylist(title, song=null) {
		if(song === null){
			this.togglePausePlaylist(title);
			this.playlists[title].playSongs();
		}
		else{
			this.togglePausePlaylist(title);
			this.playlists[title].playSong(song);
			this.playlists[title].playSongs();
		}
	}

	togglePausePlaylist(title) {
		if(this.playlists[title].isPaused) {
			this.playlists[title].startDate = Date.now();
			this.playlists[title].isPaused = false;
		}
		else {
			this.playlists[title].currentTime = this.playlists[title].currentTime + (Date.now() - this.playlists[title].startDate);
			this.playlists[title].isPaused = true;
		}
	}

	getPlaylistCopy(title) {
		return _.cloneDeep(this.playlists[title]);
	}

	getPlaylist(title) {
		return this.playlists[title];
	}
}

var processUrl = async function(ytUrl) {
	try {
		let info = await ytdl.getInfoAsync(ytUrl, ['--dump-json']);
		var formats = info.formats;
		var audioOnly = _.filter(formats, fmt => {
			return ['opus', 'mp3', 'vorbis'].includes(fmt.acodec.trim());
		});
		var streamUrl = _.orderBy(audioOnly, 'abr', 'desc')[0].url;
		var duration = convertTime(info.duration);
		return {
			title: info.fulltitle,
			url: ytUrl,
			length: duration,
			streamUrl: streamUrl
		};
	}
	catch (err) {
		console.error(err);
		return null;
	}
};

var processVideoUrl = async function(ytUrl){
	try {
		let info = await ytdl.getInfoAsync(ytUrl, ['--dump-json']);
		var formats = info.formats;
		var videoOnly = _.filter(formats, fmt => {
			return fmt.vcodec !== 'none' && fmt.resolution !== undefined;
		});
		var streamUrl = _.orderBy(videoOnly, item => { return item.width * item.height; }, 'desc')[0].url;
		var duration = convertTime(info.duration);
		return {
			title: info.fulltitle,
			url: ytUrl,
			length: duration,
			streamUrl: streamUrl
		};
	}
	catch (err) {
		console.error(err);
		return null;
	}
};

var convertTime = function(timeString) {
	var seconds = 0;

	var segments = timeString.split(':');
	var segmentInts = _.map(segments, function(segment){ return parseInt(segment); });

	switch(segments.length){
		case 1: {
			seconds += segmentInts[0];
			break;
		}
		case 2: {
			seconds += segmentInts[0] * 60;
			seconds += segmentInts[1];
			break;
		}
		case 3: {
			seconds += segmentInts[0] * 3600;
			seconds += segmentInts[1] * 60;
			seconds += segmentInts[2];
			break;
		}
	}

	return seconds;
};

module.exports = {
	Song,
	Playlist,
	PlaylistManager,
	processUrl,
	processVideoUrl
};