import rethinkdb as r
import pafy
import sys
import json

# url = sys.argv[1]
# print(pafy.new(url).getbestaudio().url)

conn = r.connect('localhost', 28015)

# r.db('Playlistr').table('songs').for_each(
#     lambda song: r.db('Playlistr').table('songs').get(song['url']).update({'streamUrl': pafy.new(song['url']).getbestaudio().url})
# ).run(conn)

def setup_db():
    #print('running method')
    conn = r.connect('localhost', 28015)
    #print('got connection')
    # playlists = yield r.db('Playlistr').table('playlists').run(conn)
    # for playlist in playlists:
    #     print('in loop')
    #     playlistManager.addExistingPlaylist(playlist)
    songs = r.db('Playlistr').table('songs').run(conn)
    # songDict = {}
    # for song in songs:
    #     #print(song['url'])
    #     songDict[song['url']] = pafy.new(song['url']).getbestaudio().url
    # return json.dumps(songDict)
    r.db('Playlistr').table('songs').for_each(
        lambda song: update_url(song['url'])
    ).run(conn)
    print('done updating!')

def update_url(url):
    new_url = pafy.new(url).getbestaudio().url
    r.db('Playlistr').table('songs').get(song['url']).update({'streamUrl': new_url}).run(conn)

print(setup_db())