var _ = require('lodash');
var r = require('rethinkdb');
var ytdl = require('youtube-dl');

var databaseInsert = function(table, obj, callback) {
	r.connect({host: 'localhost', port: 28015}, (err, conn) => {
		if(err) throw err;
		r.db('Playlistr').table(table).insert(obj)
		 .run(conn, (err, results) => {
			if(err){
				//throw err;
				callback(false);
			}
			callback(true);
		});
	});
}

var Song = function(info, isVideo, url, length, streamUrl) {
	this.info = info;
	this.isVideo = isVideo;
	this.url = url;
	this.length = length;
	this.streamUrl = streamUrl;
}

Song.prototype.create = function(callback) {
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


var Playlist = function(title, category, password="", openSubmissions=true, type) {
    this.title = title;
    this.category = category;
    this.password = password;
    this.openSubmissions = openSubmissions;
    this.playlistType = type;
    this.length = 0;
    this.currentTime = 0;
    this.isPaused = true;
    this.currentSongIndex = 0;
    this.songs = [];
    this.hasPlayed = false;
}

Playlist.prototype.addSong = function(song, callback) {
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
			this.songs = _.concat(this.songs, song);
			this.updateLength();
			callback(true);
		});
	});
}

Playlist.prototype.removeSong = function(song, callback) {
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
};

Playlist.prototype.getSongs = function(callback) {
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
};

Playlist.prototype.getCurrentSongAndTime = function(callback) {
	if(this.currentTime === 0 && this.hasPlayed)
		callback({
			song: null,
			time: -1
		});
	else{
		this.getSongs(songs => {
			var length = 0;
			var index = 0;
			while(index < songs.length && length < this.currentTime){
				length += songs[index].length;
				index++;
			}
			if(index === songs.length + 1) {
				callback({
					song: null,
					time: -1
				});
			}
			else {
				index = index == 0 ? 1 : index;
				var prevSongs = songs.slice(0, index-1);
				var currTime = _.reduce(prevSongs, (sum, song) => {
					return sum + song.length;
				}, 0);
				currTime = this.currentTime - currTime;
				callback({
					song: songs[index-1],
					time: currTime
				});
			}
		});
	}
};

Playlist.prototype.getCurrentSongIndex = function(callback) {
	this.getSongs(songs => {
		var length = 0;
		index = 0;
		while(length < this.currentTime){
			length += songs[index].length;
			index++;
		}
		callback(index);
	});
};

Playlist.prototype.getNextSong = function(callback) {
	if(!this.hasPlayed && this.currentTime < this.length){
		this.getSongs(songs => {
			var length = 0;
			var index = 0;
			while(length <= this.currentTime){
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

};

Playlist.prototype.updateLength = function() {
	this.getSongs(songs => {
		this.length = _.reduce(songs, (sum, song) => {
			return sum + song.length;
		}, 0);
	});
};

Playlist.prototype.playSong = function(song) {
	this.getSongs(songs => {
		var length = 0;
		for(var i = 0; i < songs.length; i++){
			if(songs[i].url === song.url) break;
			length += songs[i].length;
		}
		this.currentTime = length;
	});
};

Playlist.prototype.playSongs = function() {
	var playback = setInterval(() => {
		this.currentTime += 1;
		console.log(this.currentTime + '/' + this.length);
		if(this.isPaused || this.currentTime >= this.length){
			this.hasPlayed = true;
			this.currentTime = 0;
			clearInterval(playback);
		}
	}, 1000);
};


var PlaylistManager = function() {
	this.playlists = {}
};

PlaylistManager.prototype.addPlaylist = function(playlist, callback) {
	if(!_.includes(_.keys(this.playlists), playlist.title)){
		this.playlists[playlist.title] = playlist;
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
		 	 	callback(true);
		 	 });
		 });
	}
	else{
		callback(false);
	}
};

PlaylistManager.prototype.addExistingPlaylist = function(playlist) {
	// title, category, password="", openSubmissions=true
	var title = playlist.title;
	var category = playlist.category;
	var password = playlist.password;
	var openSubmissions = playlist.openSubmissions;
	var type = playlist.type;

	this.playlists[playlist.title] = new Playlist(title, category, password, openSubmissions, type);
	this.playlists[playlist.title].updateLength();
};

PlaylistManager.prototype.startPlaylist = function(title, song=null) {
	if(song === null){
		this.togglePausePlaylist(title);
		this.playlists[title].playSongs();
	}
	else{
		this.togglePausePlaylist(title);
		this.playlists[title].playSong(song);
		this.playlists[title].playSongs();
	}
};

PlaylistManager.prototype.togglePausePlaylist = function(title) {
	this.playlists[title].isPaused = !this.playlists[title].isPaused;
};

PlaylistManager.prototype.getPlaylistCopy = function(title) {
	return _.cloneDeep(this.playlists[title]);
};

PlaylistManager.prototype.getPlaylist = function(title) {
	return this.playlists[title];
};

var processUrl = function(ytUrl, callback) {
	ytdl.getInfo(ytUrl, ['--dump-json'], (err, info) => {
		if(err) {
			throw err;
			callback(null);
		}
		var formats = info.formats;
		var audioOnly = _.filter(formats, fmt => {
			return fmt.acodec.trim() === 'opus' || fmt.acodec.trim() === 'mp3' || fmt.acodec.trim() === 'vorbis';
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
