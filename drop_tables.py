#!/usr/bin/python3

import rethinkdb as r

conn = r.connect('localhost', 28015)
r.db('Playlistr').table_drop('playlists').run(conn)
r.db('Playlistr').table_drop('songs').run(conn)