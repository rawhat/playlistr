var r = require('rethinkdb');
var pyshell = require('python-shell');

pyshell.run('update_urls.py', {pythonPath: '/usr/bin/python3', mode: 'json'}, (err, results) =>{
	var songData = results[0];
	r.connect({
		db: 'Playlistr'
	}, (err, conn) => {
		r.table('songs').forEach((song) => {
			// var new_url = songData[song.url];
			// console.log(r.row['streamUrl']);
			//return .update({'streamUrl': new_url});
			return r.table('songs').get(song('url')).delete();
		}).run(conn);
	});
});