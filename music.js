var _ = require('lodash');
var r = require('rethinkdb');
var ytdl = require('youtube-dl');

var databaseInsert = function(table, obj, callback) {
	r.connect({host: 'localhost', port: 28015}, (err, conn) => {
		if(err) throw err;
		r.db('Playlistr').table(table).insert(obj)
		 .run(conn, (err, results) => {
			if(err){
				throw err;
				callback(false);
			}
			callback(true)
		});
	});
}

class Song {
	constructor(info, isVideo, url, length, streamUrl) {
		this.info = info;
		this.isVideo = isVideo;
		this.url = url;
		this.length = length;
		this.streamUrl = streamUrl;
	}

	create(callback) {
		databaseInsert('songs', {
			info: this.info,
			isVideo: this.isVideo,
			url: this.url,
			length: this.length,
			streamUrl: this.streamUrl
		}, function(data){
			callback(data);
		});
	}
}

class Playlist {
	constructor(title, category, password="", openSubmissions=true, type) {
		this.title = title;
		this.category = category;
		this.password = password;
		this.openSubmissions = openSubmissions;
		this.type = type
		this.length = 0;
		this.isPaused = true;
		this.startDate = null; // last time it was played
		this.currentTime = 0;  // time elapsed at last play
		this.currentSongIndex = 0;
		this.songs = [];
		this.hasPlayed = false;
	}

	getCurrentPlaytime() {
		return this.isPaused ? this.currentTime : this.currentTime + ((Date.now() - this.startDate) / 1000);
	}

	addSong(song, callback) {
		r.connect({host: 'localhost', port: 28015}, (err, conn) => {
			if(err) throw err;
			r.db('Playlistr').table('playlists')
			.filter({title: this.title})
			.update({
				songs: r.row('songs').append(song.url)
			})
			.run(conn, (err, results) => {
				if(err){
					throw err;
					callback(false);
				}
				this.songs = this.songs.concat(song);
				this.updateLength();
				callback(true);
			});
		});
	}

	removeSong(song, callback) {
		r.connect({host: 'localhost', port: 28015}, (err, conn) => {
			if(err) throw err;
			r.db('Playlistr').table('playlists')
			.filter({title: this.title})
			.update({
				songs: r.row('songs').without(song.url)
			})
			.run(conn, (err, results) => {
				if(err){
					throw err;
					callback(false);
				}
				callback(true);
			});
		});
	}

	getSongs(callback) {
		r.connect({host: 'localhost', port: 28015}, (err, conn) => {
			if(err) throw err;
			r.db('Playlistr').table('playlists').getAll(this.title, {index: 'title'}).run(conn, (err, results) => {
				results.toArray((err, res) => {
					var songs = res[0].songs;
					r.db('Playlistr').table('songs').filter(song => {
						return r.expr(songs).contains(song('url'));
					}).run(conn, (err, results) => {
						results.toArray((err, res) => {
							if(res.length === 0) callback([]);
							else callback(res);
						});
					});
				});
			});
		});
	}

	getCurrentSongAndTime(callback) {
		if(this.hasPlayed) {
			// console.log('has played');
			callback({
				song: null,
				time: -1
			});
		}
		else{
			this.getSongs(songs => {
				var length = 0;
				var index = 0;
				// while(index < songs.length && length < this.currentTime){
				// 	length += songs[index].length;
				// 	index++;
				// }
				// if(index >= songs.length) {
				// 	callback({
				// 		song: null,
				// 		time: -1
				// 	});
				// }
				// else {
				// 	index = index == 0 ? 1 : index;
				// 	var prevSongs = songs.slice(0, index-1);
				// 	var currTime = _.reduce(prevSongs, (sum, song) => {
				// 		return sum + song.length;
				// 	}, 0);
				// 	currTime = this.currentTime - currTime;
				// 	callback({
				// 		song: songs[index-1],
				// 		time: currTime
				// 	});
				// }
				for(let song of songs) {
					// console.log(`checking at: ${this.getCurrentPlaytime()}`)
					length += song.length;
					if(length >= this.getCurrentPlaytime()) {
						index = index === 0 ? 1 : index;
						let prevLength = songs.slice(0, index-1).reduce((sum, song) => sum + song.length, 0);
						callback({
							song: songs[index-1],
							time: this.getCurrentPlaytime() - prevLength
						});
						return;
					}
					index++;
				}
				// console.log('through loop');
				callback({
					song: null,
					time: -1
				});
				return;
			});
		}
	}

	getCurrentSongIndex(callback) {
		this.getSongs(songs => {
			var length = 0;
			index = 0;
			while(length < this.getCurrentPlaytime()){
				length += songs[index].length;
				index++;
			}
			callback(index);
		});
	}

	getNextSong(callback) {
		if(!this.hasPlayed && this.getCurrentPlaytime() < this.length){
			this.getSongs(songs => {
				var length = 0;
				var index = 0;
				while(length <= this.getCurrentPlaytime()){
					length += songs[index].length;
					index++;
				}
				if(index > songs.length)
					callback(null);
				else{
					callback(songs[index-1]);
				}
			});
		}
		else{
			callback(null);
		}

	}

	updateLength() {
		this.getSongs(songs => {
			// console.log(songs);
			this.length = _.reduce(songs, (sum, song) => {
				return sum + song.length;
			}, 0);
		});
	}

	playSong(song) {
		this.getSongs(songs => {
			var length = 0;
			for(var i = 0; i < songs.length; i++){
				if(songs[i].url === song.url) break;
				length += songs[i].length;
			}
			this.currentTime = length;
			// update start date
			this.startDate = Date.now();
		});
	}

	playSongs() {
		// var playback = setInterval(() => {
		// 	this.currentTime += 1;
		// 	console.log(this.currentTime + '/' + this.length);
		// 	if(this.isPaused || this.currentTime >= this.length){
		// 		this.hasPlayed = true;
		// 		this.currentTime = 0;
		// 		clearInterval(playback);
		// 	}
		// }, 1000);

		// not totally sure if i need this
		// but now it sort of seems like i might
		
		if(this.playbackTimer) clearTimeout(this.playbackTimer);

		// console.log(`setting timeout to: ${this.length} - ${this.getCurrentPlaytime()}`);

		this.playbackTimer = setTimeout(() => {
			// console.log('playback finished');
			this.hasPlayed = true;
		}, (this.length - this.getCurrentPlaytime()) * 1000);
	}
}

class PlaylistManager {
	constructor() {
		this.playlists = {};
	}

	addPlaylist(playlist, callback) {
		// if(!_.includes(_.keys(this.playlists), playlist.title)){
		if(!this.playlists.hasOwnProperty(playlist.title)) {
			r.connect({host: 'localhost', port: 28015}, (err, conn) =>{
				if(err){
					throw err;
					return false;
				}
				r.db('Playlistr').table('playlists')
				.insert(playlist).run(conn, (err, res) => {
					if(err){
						throw err;
						callback(false);
					}
					this.playlists[playlist.title] = playlist;
					callback(true);
				});
			});
		}
		else{
			callback(false);
		}
	}

	addExistingPlaylist(playlist) {
		// title, category, password="", openSubmissions=true
		const { title, category, password, openSubmissions, type } = playlist;

		this.playlists[playlist.title] = new Playlist(title, category, password, openSubmissions, type);
		for(let key in playlist) {
			if(playlist.hasOwnProperty(key)) {
				this.playlists[playlist.title][key] = playlist[key];
			}
		}
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
		// if paused
		// then set start date to now
		// else
		//   update current time to
		//   currentTime + (Date.now() - startDate)
		if(this.playlists[title].isPaused) {
			this.playlists[title].startDate = Date.now();
			this.playlists[title].isPaused = false;
		}
		else {
			this.playlists[title].currentTime = this.playlists[title].currentTime + (Date.now() - this.playlists[title].startDate);
			this.playlists[title].isPaused = true;
		}
		// console.log(this.playlists[title]);
	}

	getPlaylistCopy(title) {
		return _.cloneDeep(this.playlists[title]);
	}

	getPlaylist(title) {
		return this.playlists[title];
	}
}

var processUrl = function(ytUrl, callback) {
	ytdl.getInfo(ytUrl, ['--dump-json'], (err, info) => {
		if(err) {
			throw err;
			callback(null);
		}
		var formats = info.formats;
		var audioOnly = _.filter(formats, fmt => {
			return ['opus', 'mp3', 'vorbis'].includes(fmt.acodec.trim());
		});
		var streamUrl = _.orderBy(audioOnly, 'abr', 'desc')[0].url;
		var duration = convertTime(info.duration);
		callback({
			title: info.fulltitle,
			url: ytUrl,
			length: duration,
			streamUrl: streamUrl
		});
	});
};

var processVideoUrl = function(ytUrl, callback){
	ytdl.getInfo(ytUrl, ['--dump-json'], (err, info) => {
		if(err) {
			throw err;
			callback(null);
		}
		var formats = info.formats;
		var videoOnly = _.filter(formats, fmt => {
			return fmt.vcodec !== 'none' && fmt.resolution !== undefined;
		});
		var streamUrl = _.orderBy(videoOnly, item => { return item.width * item.height; }, 'desc')[0].url;
		var duration = convertTime(info.duration);
		callback({
			title: info.fulltitle,
			url: ytUrl,
			length: duration,
			streamUrl: streamUrl
		});
	});
}

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
}

module.exports = {
	Song,
	Playlist,
	PlaylistManager,
	processUrl,
	processVideoUrl
}