const { Playlist, Song, PlaylistManager } = require('./music');

let s = new Song(
    'rando',
    false,
    'http://www.google.com',
    100,
    'http://www.google.com/1'
);
let p = new Playlist('test', 'rap', null, null, 'audio');
p.songs.push(s);
let pm = new PlaylistManager();

module.exports = {
    p,
    pm,
};
