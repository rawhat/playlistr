/* eslint-disable no-console */

var express = require('express');
var bodyParser = require('body-parser');
// var passport = require('passport');
var r = require('rethinkdb');
var async = require('async');
var _ = require('lodash');
// var fs = require('fs');

var Music = require('./music.js');
var Playlist = Music.Playlist;
var PlaylistManager = Music.PlaylistManager;
var Song = Music.Song;
var processUrl = Music.processUrl;
var processVideoUrl = Music.processVideoUrl;

var manager = new PlaylistManager();

var buildPlaylistManager = function(){
	console.log('building...');
	r.connect({host: 'localhost', port: 28015}, (err, conn) => {
		r.db('Playlistr').table('playlists').run(conn, (err, results) => {
			results.toArray((err, res) => {
				_.each(res, playlist => {
					manager.addExistingPlaylist(playlist);
				});
				console.log('finished!');
			});
		});
	});
};

var updateStreamUrls = function(callback) {
	r.connect({host: 'localhost', port: 28015}, (err, conn) => {
		var songObj = {};
		r.db('Playlistr').table('songs').run(conn, (err, res) => {
			res.toArray((err, arr) => {
				var processList = [];
				_.each(arr, song => {
					processList.push((cb) => {
						if(song.isVideo){
							processVideoUrl(song.url, response => {
								songObj[song.url] = response.streamUrl;
								cb(null, songObj);
							});

						}
						else{
							processUrl(song.url, response => {
								songObj[song.url] = response.streamUrl;
								cb(null, songObj);
							});
						}
					});
				});
				async.parallel(processList, (err, _) => {
					r.db('Playlistr').table('songs').getAll(..._.keys(songObj), {index: 'url'}).update(song => {
						return {
							streamUrl: r.expr(songObj).getField(song('url'))
						};
					}).run(conn, (err, res) => {
						if(err) throw err;
						console.log(res);
						callback(true);
					});
				});
			});
		});
	});
};

var app = express();

app.use(express.static('static'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var expressWs = require('express-ws')(app);
app = expressWs.app;

/*
// LoginHandler
app.use('/login', (req, res) => {

});

// LogoutHandler
app.use('/logout', (req, res) => {

});

// UpdateHandler
app.use('/update', (req, res) => {

});
*/

// SongHandler
app.get('/song', (req, res) => {
	var title = req.query.playlist;
	var playlist = manager.getPlaylist(title);
	playlist.getCurrentSongAndTime(obj => {
		var song = obj.song;
		var time = obj.time;
		if(song === null){
			res.json({songUrl: '', time: time});
			res.end();
		}
		else{
			if(playlist.isPaused) manager.startPlaylist(title);
			res.json({songUrl: song.streamUrl, time: time});
			res.end();
		}
	});
});

app.put('/song', (req, res) => {
	var title = req.body.playlist;
	var type = req.body.type;
	var songUrl = req.body.songUrl;
	var callback = response => {
		if(response === null){
			res.sendStatus(400);
			res.end();
		}
		else{
			var playlist = manager.getPlaylist(title);

			var isVideo = playlist.type === 'video' ? true : false;

			var song = new Song(response.title, isVideo, response.url, response.length, response.streamUrl);
			song.create(status => {
				if(status){
					playlist.addSong(song, (_res) => {
						if(_res){
							res.sendStatus(203);
							res.end();
						}
						else{
							res.sendStatus(400);
							res.end();
						}
					});
				}
				else{
					res.sendStatus(400);
					res.end();
				}
			});
		}
	};
	if(type === 'music')
		processUrl(songUrl, callback);
	else
		processVideoUrl(songUrl, callback);
});

app.post('/song', (req, res) => {
	var title = req.body.playlist;
	var link = req.body.url;
	r.connect({host: 'localhost', port: 28015}, (err, conn) => {
		r.db('Playlistr').table('songs').filter({url: link})
		.run(conn, (err, result) => {
			if(err){
				// throw err;
				res.sendStatus(409);
				res.end();
			}
			manager.startPlaylist(title, result);
			res.json({songUrl: result.streamUrl});
		});
	});
});

// SongNextHandler
app.get('/song/next', (req, res) => {
	var title = req.query.playlist;
	var playlist = manager.getPlaylist(title);
	playlist.getNextSong(song => {
		if(song === null){
			res.json({
				songUrl: null,
				time: -1
			});
			res.end();
		}
		else{
			res.json({
				songUrl: song.streamUrl,
				time: 0
			});
			res.end();
		}
	});
});

// PlaylistHandler
app.get('/playlist', (req, res) => {
	var title = req.query.playlist;
	if(title !== undefined){
		var playlist = manager.getPlaylist(title);
		playlist.getSongs(songs => {
			playlist.songs = songs;
			res.json({playlist: playlist});
			res.end();
		});
	}
	else {
		r.connect({host: 'localhost', port: 28015}, (err, conn) => {
			if(err){
				// throw err;
				res.sendStatus(500);
				res.end();
			}
			r.db('Playlistr').table('playlists').run(conn, (err, results) => {
				if(err){
					// throw err;
					res.sendStatus(403);
					res.end();
				}
				results.toArray((err, playlists) => {
					if(playlists.length !== 0)
						playlists = _.orderBy(playlists, playlist => { return playlist.title; }, 'desc');
					res.json({'playlists': playlists});
				});
			});
		});
	}
});
app.put('/playlist', (req, res) => {
	var title = req.body.playlist;
	var category = req.body.category;
	var password = req.body.password;
	var openSubmissions = req.body.openSubmissions;
	var type = req.body.type;

	if(title !== undefined){
		var playlist = new Playlist(title, category, password, openSubmissions, type);
		manager.addPlaylist(playlist, response => {
			if(response){
				res.sendStatus(201);
				res.end();
			}
			else{
				res.sendStatus(409);
				res.end();
			}
		});
	}
	else{
		res.sendStatus(400);
		res.end();
	}
});

var allSubscribers = [];
var playlistSubscribers = {};

// PlaylistSocketHandler
app.ws('/playlist/socket', function(ws) {
	ws.on('connection', function() {
		allSubscribers = _.uniq(_.concat(allSubscribers, this));
		//console.log(allSubscribers);
	});

	ws.on('message', function(message) {
		//console.log(message);
		var msg = JSON.parse(message);
		if(msg.new_playlist){
			playlistSubscribers[msg.new_playlist] = playlistSubscribers[msg.new_playlist] === undefined ? [ws] : _.concat(playlistSubscribers[msg.new_playlist], ws);
			if(msg.old_playlist)
				playlistSubscribers[msg.old_playlist] = _.without(playlistSubscribers[msg.old_playlist], ws);
			//console.log(playlistSubscribers);
		}
	});

	ws.on('close', function() {
		allSubscribers = _.without(allSubscribers, ws);
		//console.log(allSubscribers);
	});
	
	allSubscribers = _.uniq(_.concat(allSubscribers, ws));
});

app.use('/random', (req, res) => {
	console.log(req.body);
	console.log(req.params);
	res.end();
});

app.use('/', (req, res) => {
	res.render('index');
});

buildPlaylistManager();

r.connect({host: 'localhost', port: 28015}, (err, conn) => {
	r.db('Playlistr').table('playlists').changes().run(conn, (err, cursor) => {
		cursor.each((err,change) => {
			var new_playlist = change.new_val.title;
			if(change.old_val !== null && change.old_val.title === new_playlist){
				r.db('Playlistr').table('songs').getAll(change.new_val.songs[change.new_val.songs.length-1], {index: 'url'}).run(conn, (err, song) => {
					song.toArray((err, res) => {
						song = res[0];
						_.each(playlistSubscribers[new_playlist], subscriber => {
							subscriber.send(JSON.stringify({song_added: song}));
						});
					});
				});
			}
			else{
				_.each(allSubscribers, subscriber => {
					subscriber.send(JSON.stringify({playlist: change.new_val}));
				});
			}
		});
	});
});

// updateStreamUrls((status) => {
// 	if(status)
// 		app.listen(8880);
// 	else
// 		console.log('error :(');
// });
app.listen(8880);