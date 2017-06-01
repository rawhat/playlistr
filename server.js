/* eslint-disable no-console */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var neo4j = require('neo4j-driver').v1;
var Neo4jConnector = require('./neo4j-connector').Neo4jConnector;
var _ = require('lodash');

var Music = require('./music.js');
var Playlist = Music.Playlist;
var PlaylistManager = Music.PlaylistManager;
var Song = Music.Song;
var processUrl = Music.processUrl;
var processVideoUrl = Music.processVideoUrl;

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
        results.records.forEach(record => {
            let playlist = record.get('playlist').properties;
            let username = record.get('user').properties.username;
            playlist.creator = username;
            manager.addExistingPlaylist(playlist);
        });
        session.close();
        console.log('finished!');
    } catch (err) {
        console.error('erroring in build');
        console.error(err);
        session.close();
    }
}

/* eslint-disable no-unused-vars */
async function updateStreamUrls() {
    let session = driver.session();

    let results = await session.run('MATCH (s:Song) RETURN s AS song');
    session.close();

    await Promise.all(
        results.records.map(async record => {
            let song = record.get('song').properties;
            let updatedObj;

            try {
                if (song.type === 'music') {
                    updatedObj = await processUrl(song.url);
                } else {
                    updatedObj = await processVideoUrl(song.url);
                }

                let session = driver.session();
                return session.run(
                    `
                MATCH (s:Song) WHERE s.url = {url}
                SET s.title = {title},
                    s.streamUrl = {streamUrl},
                    s.length = {length}
                RETURN s;
            `,
                    updatedObj
                );
            } catch (err) {
                console.error(err);
            }
        })
    );

    return true;
}
/* eslint-disable */
var app = express();

var session = require('express-session');
app.use(
    session({
        secret: 'this is a hook its catchy you like it',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
    })
);

app.use(express.static('static'));
app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var LocalStrategy = require('passport-local').Strategy;
passport.use(
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
        },
        (username, password, done) => {
            let session = driver.session();
            session
                .run(
                    'MATCH (u:User) WHERE u.username = {username} AND u.password = {password} RETURN u as user',
                    { username, password }
                )
                .then(results => {
                    try {
                        let user = results.records[0].get('user').properties;
                        done(null, user);
                    } catch (err) {
                        done(null, false);
                    } finally {
                        session.close();
                    }
                })
                .catch(err => {
                    session.close();
                    done(err);
                });
        }
    )
);

passport.serializeUser(function(user, done) {
    done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
    let session = driver.session();
    try {
        let results = await session.run(
            'MATCH (u:User) WHERE u.username = {username} RETURN u AS user;',
            { username }
        );
        let user = results.records[0].get('user').properties;
        done(null, user);
    } catch (err) {
        done(err, false);
    } finally {
        session.close();
    }
});

app.use(passport.initialize());
app.use(passport.session());

const auth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        res.sendStatus(401);
        res.end();
    } else {
        next();
    }
};

app.post('/login', passport.authenticate('local'), (req, res) => {
    res.send(_.omit(req.user, 'password'));
    res.end();
});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
});

app.get('/authenticated', auth, (req, res) => {
    res.send(_.omit(req.user, 'password'));
    res.end();
});

app.post('/signup', async (req, res) => {
    let { username, password, password_repeat, email } = req.body;
    if (password !== password_repeat) {
        res.sendStatus(409);
        res.end();
    } else {
        try {
            let session = driver.session();
            let results = await session.run(
                `
				CREATE (u:User { username: {username}, password: {password}, email: {email} })
				RETURN u AS user;
			`,
                { username, password, email }
            );

            let user = results.records[0].get('user').properties;
            req.login(user, err => {
                if (!err) {
                    res.send(_.omit(user, 'password'));
                    res.end();
                } else res.redirect('/login');
            });
        } catch (err) {
            console.error(err);
            res.status(400).send({ error: 'Username already exists.' });
            res.end();
        } finally {
            session.close();
        }
    }
});

// SongHandler
app.get('/song', auth, async (req, res) => {
    var title = req.query.playlist;
    var playlist = manager.getPlaylist(title);

    let obj = await playlist.getCurrentSongAndTime();
    const { song, time } = obj;

    if (!song) {
        res.json({ songUrl: '', time: time });
        res.end();
    } else {
        if (playlist.isPaused) manager.startPlaylist(title);
        res.json({ songUrl: song.streamUrl, time: time });
        res.end();
    }
});

app.put('/song', auth, async (req, res) => {
    var title = req.body.playlist;
    var type = req.body.type;
    var songUrl = req.body.songUrl;

    let response;
    if (type === 'music') {
        response = await processUrl(songUrl);
    } else {
        response = await processVideoUrl(songUrl);
    }

    if (!response) {
        res.sendStatus(400);
        res.end();
    } else {
        var playlist = manager.getPlaylist(title);

        var isVideo = playlist.type === 'video' ? true : false;

        var song = new Song(
            response.title,
            isVideo,
            response.url,
            response.length,
            response.streamUrl
        );
        song.driver = driver;

        try {
            await playlist.addSong(song);
            res.sendStatus(203);
            res.end();
        } catch (err) {
            console.error(err);
            res.sendStatus(400);
            res.end();
        }
    }
});

app.post('/song', auth, async (req, res) => {
    var title = req.body.playlist;
    var link = req.body.url;

    let session = driver.session();
    try {
        let results = await session.run(
            'MATCH (p:Playlist)-[:HAS]-(s:Song) WHERE p.title = {title} AND s.url = {link} RETURN s as song',
            { title, link }
        );
        let song = results.records[0].get('song').properties;
        manager.startPlaylist(title, song);
        res.json({ songUrl: song.streamUrl });
        res.end();
    } catch (err) {
        console.error(err);
        res.send(err);
        res.sendStatus(409);
        res.end();
    } finally {
        session.close();
    }
});

// SongNextHandler
app.get('/song/next', auth, async (req, res) => {
    var title = req.query.playlist;
    var playlist = manager.getPlaylist(title);
    let song = await playlist.getNextSong();
    if (!song) {
        res.json({
            songUrl: null,
            time: -1,
        });
        res.end();
    } else {
        res.json({
            songUrl: song.streamUrl,
            time: 0,
        });
        res.end();
    }
});

// PlaylistHandler
app.get('/playlist', auth, async (req, res) => {
    var title = req.query.playlist;
    let password = req.query.password;
    if (title) {
        // console.log(`getting: ${title}`);
        var playlist = manager.getPlaylist(title);
        // console.log(manager);
        playlist.playbackTimer = null;
        let songs = await playlist.getSongs();
        playlist.songs = songs;
        playlist = _.omit(playlist, ['driver', 'conn']);

        if (playlist.password) {
            if (!password) {
                res.sendStatus(401).end();
            } else if (password !== playlist.password) {
                res.sendStatus(401).end();
            } else {
                playlist.hasPassword = !!playlist.password;
                playlist = _.omit(playlist, 'password');
                res.json({ playlist });
                res.end();
            }
        } else {
            playlist.hasPassword = !!playlist.password;
            playlist = _.omit(playlist, 'password');
            res.json({ playlist });
            res.end();
        }
    } else {
        let session = driver.session();
        try {
            let results = await session.run(
                'MATCH (u:User)-[:CREATED]-(p:Playlist) RETURN p AS playlist, u AS user;'
            );
            let playlists = results.records.map(record => {
                let playlistObject = record.get('playlist').properties;
                let username = record.get('user').properties.username;
                playlistObject.hasPassword = !!playlistObject.password;
                playlistObject.creator = username;
                return _.omit(playlistObject, 'password');
            });
            res.json({
                playlists: _.orderBy(
                    playlists,
                    playlist => playlist.title,
                    'desc'
                ),
            });
        } catch (err) {
            res.send(err);
            res.sendStatus(403);
            res.end();
        } finally {
            session.close();
        }
    }
});
app.put('/playlist', auth, async (req, res) => {
    var title = req.body.playlist;
    var category = req.body.category;
    var password = req.body.password;
    var openSubmissions = req.body.openSubmissions;
    var type = req.body.type;
    let creator = req.user.username;

    if (title) {
        var playlist = new Playlist(
            title,
            category,
            password,
            openSubmissions,
            type,
            creator
        );
        await manager.addPlaylist(playlist);
        res
            .status(201)
            .send(
                _.omit(playlist, [
                    'password',
                    'hasPlayed',
                    'driver',
                    'conn',
                    'playbackTimer',
                ])
            );
        res.end();
    } else {
        res.sendStatus(400);
        res.end();
    }
});

// toggle playlist
app.post('/playlist', async (req, res) => {
    const { username } = req.user;
    const { title } = req.body;
    const playlist = manager.getPlaylist(title);
    const status = playlist.isPaused;

    if (title && playlist && username === playlist.creator) {
        manager.togglePausePlaylist(title);

        if (playlist.isPaused !== status) {
            // successfully paused
            res.sendStatus(200).end();
        } else {
            // error attempting to pause
            res.sendStatus(500).end();
        }
    } else {
        // invalid request (title not provided, or no playlist of title)
        res.sendStatus(400).end();
    }
});

const server = require('http').Server(app);
const io = require('socket.io')(server);

io.on('connection', socket => {
    let listeningPlaylist = null;

    conn.addNewPlaylistListener(socket, playlist => {
        socket.emit('new-playlist', { playlist });
    });

    socket.on('change-playlist', ({ old_playlist, new_playlist }) => {
        if (!old_playlist) conn.removePlaylistListener(old_playlist, socket);
        listeningPlaylist = new_playlist;
        conn.addPlaylistListener(socket, new_playlist, song => {
            socket.emit('new-song', { song });
        });
    });

    socket.on('disconnect', function() {
        conn.removeNewPlaylistListener(socket);
        if (listeningPlaylist)
            conn.removePlaylistListener(socket, listeningPlaylist);
    });
});

app.use('/random', (req, res) => {
    console.log(req.body);
    console.log(req.params);
    res.end();
});

app.get('*', (req, res) => {
    res.render('index');
});

(async () => {
    // await updateStreamUrls();
    await buildPlaylistManager();
    server.listen(8880);
})();
