var ytdl = require('youtube-dl');
var _ = require('lodash');

var bestAudioURL = '';

ytdl.getInfo('https://www.youtube.com/watch?v=I3s6TfiA8c8', ['--dump-json'], (err, info) => {
	if(err) throw err;
	var formats = info.formats;
	var duration = convertTime(info.duration);
	let videoOnly = _.filter(formats, fmt => {
		return fmt.vcodec !== 'none' && fmt.resolution !== undefined;
	});
	console.log(_.map(_.orderBy(videoOnly, item => { return item.width * item.height; }, 'desc'), format => {
		return {
			resolution: format.resolution,
			note: format.format_note
		}
	}));
});

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

/*var r = require('rethinkdb');

r.connect({host: 'localhost', port: 28015}, (err, conn) => {
	r.db('Playlistr').table('playlists').getAll('test', {index: 'title'}).run(conn, (error, results) => {
		results.toArray((erro, res) => {
			var songs = res[0].songs;
			console.log(songs);
			r.db('Playlistr').table('songs').filter(song => {
				return r.expr(songs).contains(song('url'));
			}).run(conn, (err, results) => {
				results.each(console.log);
			});
		});
	})
});*/