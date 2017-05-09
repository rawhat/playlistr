#!/usr/bin/python3

import rethinkdb as r

conn = r.connect('localhost', 28015)

if "Playlistr" not in r.db_list().run(conn):
    r.db_create("Playlistr").run(conn)

r.db('Playlistr').table_create('playlists', primary_key='title').run(conn)
r.db('Playlistr').table_create('songs', primary_key='url').run(conn)
r.db('Playlistr').table_create('users', primary_key='username').run(conn)