import tornado.web
import tornado.ioloop
from tornado import gen
import json
import os, sys
import base64

from grabber import processUrl
from music import PlaylistManager, Playlist, Song
from user import User
from py2neo import Graph, Relationship, GraphError
import pafy

db = Graph("https://neo4j:password@localhost:7473/db/data")

#db.schema.create_uniqueness_constraint("Playlist", "title")
#db.schema.create_uniqueness_constraint("User", "username")
#db.schema.create_uniqueness_constraint("Song", "url")

playlistManager = PlaylistManager()

for playlist in db.find('Playlist'):
    playlistManager.addExistingPlaylist(playlist)

# update stream URLs
def updateStreamUrls():
    for song in db.find('Song'):
        song.properties['streamUrl'] = pafy.new(song.properties['url']).getbestaudio().url
        song.push()
        print('updating: ' + song.properties['info'])

# comment out when not in use
#updateStreamUrls()

print('done updating!')

class BaseHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        user = self.get_secure_cookie('user')
        if not user: return None
        return db.cypher.execute('MATCH (u:User {username: {username}}) RETURN u', username=user.decode('utf-8')).one['username']

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
                user = User(username, password).user
                db.create(user)
                user.push()
            except:
                raise tornado.web.HTTPError(409)
        else:
            raise tornado.web.HTTPError(403)

    def post(self):
        # login existing user
        username = self.get_body_argument('username')
        password = self.get_body_argument('password')
        if username and password:
            user = db.cypher.execute("MATCH (u:User {username: {username}, password: {password}}) RETURN u", username=username, password=password).one
            if user is None:
                raise tornado.web.HTTPError(401)
            else:
                self.set_secure_cookie("user", user['username'])
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
    def get(self):
        playlistName = self.get_argument('playlist', None, True)
        if playlistName:
            playlist = playlistManager.getPlaylist(playlistName).getSongs()
            #print(playlist)
            self.render('./templates/songs.html', playlist=playlist)
        else:
            playlists = [playlistTitle['title'] for playlistTitle in db.cypher.execute('MATCH (p:Playlist) RETURN p.title as title')]
            self.render('./templates/playlists.html', playlists=playlists)

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


class SongHandler(tornado.web.RequestHandler):
    # go live on playlist
    def get(self):
        playlistName = self.get_argument('playlist', None, True)
        playlist = playlistManager.getPlaylist(playlistName)
        song, time = playlist.getCurrentSongAndTime()
        if playlist.isPaused:
            playlistManager.startPlaylist(playlistName)
        self.write(tornado.escape.json_encode({'songUrl': song.properties['streamUrl'], 'time': time}))

    def put(self):
        try:
            playlistName = self.get_body_argument('playlist')
            link = processUrl(self.get_body_argument('songUrl'))

            playlist = playlistManager.getPlaylist(playlistName)
            song = Song(link['title'], self.get_body_argument('songUrl'), link['length'], link['url']).song
            playlist.addSong(song)
            db.merge_one(song)
            db.create_unique(Relationship.cast(playlist.playlist, 'HAS', song))
            db.push()
        except:
            print(sys.exc_info())
            raise tornado.web.HTTPError(400)

    # play individual song
    def post(self):
        try:
            playlistName = self.get_body_argument('playlist')
            url = self.get_body_argument('url')
            song = db.find_one('Song', 'url', url)
            songUrl = song.properties['streamUrl']
            playlistManager.startPlaylist(playlistName, song)
            self.write(tornado.escape.json_encode({'songUrl': songUrl}))
        except:
            print(sys.exc_info())
            raise tornado.web.HTTPError(409)

class SongNextHandler(tornado.web.RequestHandler):
    # get next song
    def get(self):
        playlistName = self.get_argument('playlist', None, True)
        playlist = playlistManager.getPlaylist(playlistName)
        song = playlist.getNextSong()
        if playlist.isPaused:
            playlistManager.startPlaylist(playlistName)
        self.write(tornado.escape.json_encode({'songUrl': song.properties['streamUrl']}))

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
        (r"/test", TestHandler),
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": "./static"}),
    ], {
        'template_path': "./templates",
    },  cookie_secret='DimjG2ZcmheiEZ8/UxtS4qtWFTXWEIk4fwRBqvryJKdzHgszofHPfaC7lrgAgkbRmsI=',
        login_url="/login",
        debug=True,
    )

if __name__ == "__main__":
    app = make_app()
    app.listen(8080)
    tornado.ioloop.IOLoop.current().start()
