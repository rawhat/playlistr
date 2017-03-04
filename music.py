import random
import sys
import os
from multiprocessing import Process, Lock
import time, math
from functools import reduce
import rethinkdb as r
import tornado.gen

r.set_loop_type('tornado')

class Song:
    def __init__(self, info, url, length, streamUrl):
        self.info = info
        self.url = url
        self.length = length
        self.streamUrl = streamUrl

    def __str__(self):
        return "\"" + self.info + "\"" + " : " + str(self.length) + " -- " + self.url

    @tornado.gen.coroutine
    def create(self):
        try:
            conn = yield r.connect('localhost', 28015)
            yield r.db('Playlistr').table('songs').insert({
                "info": self.info,
                "url": self.url,
                "length": self.length,
                "streamUrl": self.streamUrl
            }).run(conn)
            return True
        except:
            return False

class Playlist:
    def __init__(self, title, category, password="", openSubmissions=True):
        self.title = title
        self.category = category
        self.password = password
        self.openSubmissions = openSubmissions
        self.length=0
        self.currentTime=0
        self.isPaused=True
        self.currentSongIndex = 0
        self.songs = []
        self.hasPlayed = False

    @tornado.gen.coroutine
    def addSong(self, song):
        conn = yield r.connect('localhost', 28015)
        yield r.db('Playlistr').table('playlists').filter({'title': self.title}).update({
            'songs': r.row['songs'].append(song.url)
        }).run(conn)
        conn.close()
        self.updateLength()

    @tornado.gen.coroutine
    def removeSong(self, song):
        conn = yield r.connect('localhost', 28015)
        songs = getSongs()
        index = 0
        while songs[index] != song.url:
            index = index + 1
        yield r.db('Playlistr').table('playlists').get(self.title, index='title').update(
            lambda playlist: { 'songs': playlist['songs'].delete_at(index) }
        ).run(conn)
        conn.close()

    @tornado.gen.coroutine
    def getSongs(self):
        conn = yield r.connect('localhost', 28015)
        playlists = yield r.db('Playlistr').table('playlists').get_all(self.title, index='title').run(conn)
        while (yield playlists.fetch_next()):
            playlist = yield playlists.next()
            break
        these_songs = playlist['songs']
        songs_from_db = yield r.db('Playlistr').table('songs').filter(
            lambda song: r.expr(these_songs).contains(song['url'])
        ).run(conn)
        songs = []
        while (yield songs_from_db.fetch_next()):
            song = yield songs_from_db.next()
            songs.append(song)
        conn.close()
        return songs

    @tornado.gen.coroutine
    def getCurrentSongAndTime(self):
        if self.currentTime == 0 and self.hasPlayed:
            return (None, -1)
        else:
            songs = yield self.getSongs()
            length = float(songs[0]['length'])
            if length >= self.currentTime:
                return (songs[0], self.currentTime)

            for song in songs:
                timeToCurrentSong = sum(float(song['length']) for song in songs[:songs.index(song)])
                if length >= self.currentTime and (timeToCurrentSong + song['length'] - self.currentTime) > 2:
                    self.currentSongIndex = songs.index(song)
                    return (songs[songs.index(song)], self.currentTime - timeToCurrentSong)
                length = length + song['length']           

    @tornado.gen.coroutine
    def getCurrentSongIndex(self):
        songs = yield self.getSongs()
        length = songs[0]['length']
        if length >= self.currentTime:
            return 0

        for song in songs:
            if length >= self.currentTime:
                return songs.index(song)
            length = length + song['length']

    @tornado.gen.coroutine
    def getNextSong(self):
        try:
            if not self.hasPlayed:
                songs = yield self.getSongs()
                index = 0
                nextSongIndex = 1
                sumTime = 0
                for song in songs:
                    if sumTime > self.currentTime:
                        return song
                    sumTime += song['length']
                return songs[len(songs)-1]
            else:
                return None
            '''
            index = 0
            songIndex = 0
            nextSongIndex = songIndex + 1
            songs = yield self.getSongs()
            for song in songs:
                if index == nextSongIndex:
                    return song
                index = index + 1
            return None
            '''
        except:
            print(sys.exc_info())
            print('error in next!')

    @tornado.gen.coroutine
    def updateLength(self):
        try:
            conn = r.connect('localhost', 28015)
            songs = yield self.getSongs()
            self.length = reduce(lambda song1, song2: song1 + song2, (song['length'] for song in songs))
        except:
            self.length = 0

    def playSong(self, song):
        length = 0
        songs = self.getSongs()

        songIndex = -1
        for s in songs:
            if s['url'] == song['url']:
                songIndex = songs.index(s)
                break

        for i in range(0, songIndex):
            length = length + int(songs[i]['length'])
        print(length)
        self.currentTime = length

    @tornado.gen.coroutine
    def playSongs(self):
        while True and not self.isPaused and self.currentTime <= self.length:
            yield tornado.gen.sleep(1)
            self.currentTime = self.currentTime + 1.0
            print(str(self.currentTime) + "/" + str(self.length))
        self.isPaused = True
        self.hasPlayed = True
        self.currentTime = 0

class PlaylistManager:
    def __init__(self):
        self.playlists = {}

    @tornado.gen.coroutine
    def addPlaylist(self, playlist):
        try:
            if playlist.title not in self.playlists.keys():
                print('playlist title doesnt exist?')
                self.playlists[playlist.title] = playlist
                conn = yield r.connect('localhost', 28015)
                yield r.db('Playlistr').table('playlists').insert({
                    'title': playlist.title,
                    'category': playlist.category,
                    'openSubmissions': playlist.openSubmissions,
                    'password': playlist.password,
                    'songs': []
                }).run(conn)
                return True
            else:
                print('playlist does exist!')
                return False
        except:
            return False

    def addExistingPlaylist(self, playlist):
        self.playlists[playlist['title']] = Playlist(playlist['title'], playlist['category'], playlist['password'], playlist['openSubmissions'])
        self.playlists[playlist['title']].updateLength()

    def startPlaylist(self, playlistTitle, song=None):
        if not song:
            self.togglePausePlaylist(playlistTitle)
            self.playlists[playlistTitle].playSongs()
        else:
            self.togglePausePlaylist(playlistTitle)
            self.playlists[playlistTitle].playSong(song)
            self.playlists[playlistTitle].playSongs()

    def togglePausePlaylist(self, playlistTitle):
        self.playlists[playlistTitle].isPaused = not self.playlists[playlistTitle].isPaused

    def getPlaylistCopy(self, playlistTitle):
        return self.playlists[playlistTitle].copy()

    def getPlaylist(self, playlistTitle):
        return self.playlists[playlistTitle]

if __name__ == '__main__':
    lock = Lock()
    playLists = {}

    playLists['test-playlist'] = Playlist('test-playlist')

    print("enter url: ", end="")
    song = input()

    while song is not '':
        playLists['test-playlist'].addSong(Song("test song", song, 5 * random.random()))
        print("enter url: ", end="")
        song = input()

    test = Process(target=playLists['test-playlist'].playSongs, args=(lock,))
    test.start()

    while 1:
        wait = input()
        print(str(playLists['test-playlist'].currentTime))
