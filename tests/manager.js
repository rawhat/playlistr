const Promise = require('bluebird');
const assert = require('chai').assert;

var neo4j = require('neo4j-driver').v1;
var Neo4jConnector = require('../neo4j-connector').Neo4jConnector;

var Music = require('../music.js');
var PlaylistManager = Music.PlaylistManager;

const db = {
    address: 'bolt://localhost',
    username: 'neo4j',
    password: 'neo4j',
};
var driver = new neo4j.driver(
    db.address,
    neo4j.auth.basic(db.username, db.password)
);
var conn = new Neo4jConnector(driver);
var manager = new PlaylistManager(driver, conn);

async function buildPlaylistManager() {
    console.log('building...');

    let session = driver.session();
    try {
        await session.run(
            'CREATE CONSTRAINT on (u:User) ASSERT u.username IS UNIQUE;'
        );
        await session.run(
            'CREATE CONSTRAINT on (p:Playlist) ASSERT p.title IS UNIQUE;'
        );
        await session.run(
            'CREATE CONSTRAINT on (s:Song) ASSERT s.url IS UNIQUE;'
        );
        let results = await session.run(
            'MATCH (u:User)-[:CREATED]-(p:Playlist) RETURN p AS playlist, u AS user'
        );
        await Promise.all(
            results.records.map(record => {
                let playlist = record.get('playlist').properties;
                let username = record.get('user').properties.username;
                playlist.creator = username;
                return manager.addExistingPlaylist(playlist);
            })
        );
        session.close();
        console.log('finished!');
    } catch (err) {
        console.error('erroring in build');
        console.error(err);
        session.close();
    }
}

async function main() {
    await buildPlaylistManager();
    let playlist = manager.getPlaylist('tester');
    let secondSong = playlist.songs[1];
    assert.equal(playlist.getCurrentPlaytime(), 0);
    manager.startPlaylist(playlist.title);
    await Promise.delay(23000);
    // assert.equal(playlist.getCurrentSongAndTime().song.url, secondSong.url);
    let info = await playlist.getCurrentSongAndTime();
    console.log(info);
}

module.exports = {
    main,
};
