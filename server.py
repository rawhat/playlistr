import tornado.web
import tornado.ioloop
import tornado.websocket
from tornado import gen
import json
import os, sys
import base64

from grabber import processUrl
from music import PlaylistManager, Playlist, Song
from user import User
import rethinkdb as r
import pafy

playlistSubscribers = {}
allSubscribers = set()
playlistManager = PlaylistManager()

#r.set_loop_type('tornado')

'''
def buildPlaylists():
    print('building...')
    conn = yield r.connect('localhost', 28015)
    print('building playlists')
    playlists = yield r.db('Playlistr').table('playlists').run(conn)
    while (yield playlists.fetch_next()):
        playlist = yield playlists.next()
        print(playlist['title'])
        playlistManager.addExistingPlaylist(playlists)
'''

def setup_db():
    print('running method')
    conn = yield r.connect('localhost', 28015)
    print('got connection')
    playlists = yield r.db('Playlistr').table('playlists').run(conn)
    for playlist in playlists:
        print('in loop')
        playlistManager.addExistingPlaylist(playlist)
    yield r.table('songs').update({
        {'streamUrl': pafy.new(r.row['url']).getbestaudio().url }
    }).run(conn)
    print('done updating!')

'''
# update stream URLs
def updateStreamUrls():
    yield r.table('songs').update({
        {'streamUrl': pafy.new(r.row['url']).getbestaudio().url }
    }).run(conn)

# comment out when not in use
updateStreamUrls()
buildPlaylists()

print('done updating!')
'''
class BaseHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        user = self.get_secure_cookie('user')
        if not user: return None
        return user.decode('ascii')

class MainHandler(BaseHandler):
    @tornado.web.authenticated
    def get(self):
        self.render("./templates/index.html", username=self.current_user)

class LoginHandler(tornado.web.RequestHandler):
    def get(self):
        if self.get_secure_cookie('user'):
            self.redirect('/')
            return
        self.render("./templates/login.html", title="Login")

    def put(self):
        # create new user
        username = self.get_body_argument('username')
        password = self.get_body_argument('password')
        if username and password:
            try:
                user = User(username, password)
                user.create()
            except:
                raise tornado.web.HTTPError(409)
        else:
            raise tornado.web.HTTPError(403)

    @tornado.gen.coroutine
    def post(self):
        # login existing user
        username = self.get_body_argument('username')
        password = self.get_body_argument('password')
        if username and password:
            conn = yield r.connect('localhost', 28015)
            users = yield r.db('Playlistr').table('users').filter((r.row['username'] == username) & (r.row['password'] == password)).run(conn)
            while(yield users.fetch_next()):
                user = yield users.next()
                if user is None:
                    raise tornado.web.HTTPError(401)
                else:
                    self.set_secure_cookie("user", user['username'])
                break
        else:
            raise tornado.web.HTTPError(403)


    def delete(self):
        # delete existing user
        print("delete")

class LogoutHandler(tornado.web.RequestHandler):
    def post(self):
        self.clear_cookie('user')
        self.redirect(self.get_argument('next', '/'))
        return

class TestHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("./static/tester.html")

class PlaylistHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        if len(playlistManager.playlists.keys()) == 0:
            try:
                conn = yield r.connect('localhost', 28015)
                playlists = yield r.db('Playlistr').table('playlists').run(conn)
                while (playlists.fetch_next()):
                    playlist = yield playlists.next()
                    playlistManager.addExistingPlaylist(playlist)
                yield r.db('Playlistr').table('songs').update({
                    {'streamUrl': pafy.new(r.row['url']).getbestaudio().url }
                }).run(conn)
            except:
                pass
        playlistName = self.get_argument('playlist', None, True)

        if playlistName:
            playlists = yield playlistManager.getPlaylist(playlistName).getSongs()
            self.render('./templates/songs.html', playlist=playlists)

        else:
            conn = yield r.connect('localhost', 28015)
            cursor = yield r.db('Playlistr').table('playlists').run(conn)
            playlists = []
            while (yield cursor.fetch_next()):
                playlist = yield cursor.next()
                playlists.append(playlist['title'])
            playlists.sort() #sorted(playlists, key = lambda playlist: playlist['title'])
            self.render('./templates/playlists.html', playlists=playlists)

    @tornado.gen.coroutine
    def put(self):
        playlistName = self.get_body_argument('playlist')
        category = self.get_body_argument('category')
        password = self.get_body_argument('password')
        openSubmissions = self.get_body_argument('openSubmissions')
        if playlistName:
            try:
                playlist = Playlist(playlistName, category, password, openSubmissions)
                playlistManager.addPlaylist(playlist)
            except:
                raise tornado.web.HTTPError(409)
        else:
            raise tornado.web.HTTPError(400)

@tornado.gen.coroutine
def update_playlist_listeners():
    while True:
        try:
            conn = yield r.connect('localhost', 28015)
            playlist_feed = yield r.db('Playlistr').table('playlists').changes().run(conn)
            while (yield playlist_feed.fetch_next()):
                change_made = yield playlist_feed.next()
                new_playlist = False

                playlist = change_made['new_val']['title']
                song = ''
                if change_made['old_val'] is not None and change_made['old_val']['title'] == playlist:
                    song_added = yield r.db('Playlistr').table('songs').filter(r.row['url'] == change_made['new_val']['songs'][-1]).run(conn)
                    while (yield song_added.fetch_next()):
                        song = yield song_added.next()
                        break
                    print('song added!')
                else:
                    new_playlist = True

                for playlist, subscribers in playlistSubscribers.items():
                    for subscriber in subscribers:
                        subscriber.write_message(tornado.escape.json_encode({'song_added': song}))

                if new_playlist:
                    for subscriber in allSubscribers:
                        subscriber.write_message(tornado.escape.json_encode({'playlist': change_made['new_val']}))
        except:
            print('websocket error')
            print(sys.exc_info())

class PlaylistSocketHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def open(self):
        allSubscribers.add(self)

    def close(self):
        if self in allSubscribers:
            allSubscribers.remove(self)

    def on_message(self, message):
        msg = tornado.escape.json_decode(message)
        if msg['new_playlist'] not in playlistSubscribers.keys():
            playlistSubscribers[msg['new_playlist']] = set()

        if msg['new_playlist'] and self not in playlistSubscribers[msg['new_playlist']]:
            try:
                if self in playlistSubscribers[msg['old_playlist']]:
                    playlistSubscribers[msg['old_playlist']].remove(self)
            except:
                pass

            playlistSubscribers[msg['new_playlist']].add(self)

class SongHandler(tornado.web.RequestHandler):
    # go live on playlist
    @tornado.gen.coroutine
    def get(self):
        playlistName = self.get_argument('playlist', None, True)
        playlist = playlistManager.getPlaylist(playlistName)
        song, time = yield playlist.getCurrentSongAndTime()
        if playlist.isPaused:
            playlistManager.startPlaylist(playlistName)
        self.write(tornado.escape.json_encode({'songUrl': song['streamUrl'], 'time': time}))

    def put(self):
        try:
            playlistName = self.get_body_argument('playlist')
            link = processUrl(self.get_body_argument('songUrl'))
            playlist = playlistManager.getPlaylist(playlistName)
            song = Song(link['title'], self.get_body_argument('songUrl'), link['length'], link['url'])
            song.create()
            playlist.addSong(song)
        except:
            print(sys.exc_info())
            raise tornado.web.HTTPError(400)

    # play individual song
    @tornado.gen.coroutine
    def post(self):
        try:
            playlistName = self.get_body_argument('playlist')
            url = self.get_body_argument('url')
            conn = yield r.connect('localhost', 28015)
            song = yield r.db('Playlistr').table('songs').get(url, index='url').run(conn)
            playlistManager.startPlaylist(playlistName, song)
            self.write(tornado.escape.json_encode({'songUrl': song['streamUrl']}))
        except:
            print(sys.exc_info())
            raise tornado.web.HTTPError(409)

class SongNextHandler(tornado.web.RequestHandler):
    # get next song
    def get(self):
        playlistName = self.get_argument('playlist', None, True)
        playlist = playlistManager.getPlaylist(playlistName)
        yield playlist.getCurrentSongAndTime()
        if playlist.isPaused:
            playlistManager.startPlaylist(playlistName)
        self.write(tornado.escape.json_encode({'songUrl': 'localhost'}))#song['streamUrl']}))

class UpdateHandler(tornado.web.RequestHandler):
    def get(self):
        print("updating playlist")
        '''
        playlistName = self.get_argument('playlist')
        if playlistName in playlists.keys():
            self.write(json.dumps({'songs': [song.songUrl for song in playlists[playlistName].songs]}))
        else:
            raise tornado.web.HTTPError(404)
        '''

def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
        (r"/login", LoginHandler),
        (r"/logout", LogoutHandler),
        (r"/update", UpdateHandler),
        (r"/song", SongHandler),
        (r"/song/next", SongNextHandler),
        (r"/playlist", PlaylistHandler),
        (r"/playlist/socket", PlaylistSocketHandler),
        (r"/test", TestHandler),
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": "./static"}),
    ], {
        'template_path': "./templates",
    },  cookie_secret='DimjG2ZcmheiEZ8/UxtS4qtWFTXWEIk4fwRBqvryJKdzHgszofHPfaC7lrgAgkbRmsI=',
        login_url="/login",
        debug=True,
    )

@tornado.gen.coroutine
def main():
    setup_db()
    r.set_loop_type('tornado')
    app = make_app()
    app.listen(8888)

if __name__ == "__main__":
    tornado.ioloop.IOLoop.current().run_sync(main)
    tornado.ioloop.IOLoop.current().add_callback(update_playlist_listeners)
    tornado.ioloop.IOLoop.current().start()
