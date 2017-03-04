import random
import sys
import os
from multiprocessing import Process, Lock
import time, math
from functools import reduce
from py2neo import Node, Relationship, Graph
import tornado.gen

db = Graph("https://neo4j:password@localhost:7473/db/data")

class Song:
    def __init__(self, info, url, length, streamUrl):
        self.song = Node('Song', info=info, url=url, length=length, streamUrl=streamUrl)

    def __str__(self):
        return "\"" + self.song.properties['info'] + "\"" + " : " + str(self.song.properties['length']) + " -- " + self.song.properties['url']

class Playlist:
    def __init__(self, title, category, password="", openSubmissions=True):
        self.playlist = Node('Playlist', title=title, category=category, password=password, openSubmissions=openSubmissions)
        self.length=0
        self.currentTime=0
        self.isPaused=True
        self.currentSongIndex = 1

    def addSong(self, song):
        db.merge_one(song)
        numSongs = sum(1 for _ in db.match(start_node=self.playlist, rel_type='HAS'))
        db.create_unique(Relationship.cast(self.playlist, 'HAS', song, index=numSongs+1))
        self.updateLength()

    def removeSong(self, song):
        db.delete(db.match_one(start_node=self.playlist, rel_type="HAS", end_node=song), song)

    def getSongs(self):
        sortedSongs = sorted([(song_rel.properties['index'], song_rel.end_node) for song_rel in db.match(start_node=self.playlist, rel_type='HAS')], key=lambda item: int(item[0]))
        return [song[1] for song in sortedSongs]

    def getCurrentSongAndTime(self):
        songs = self.getSongs()
        length = songs[0].properties['length']
        if length >= self.currentTime:
            return (songs[0], self.currentTime)

        for song in songs:
            if length >= self.currentTime:
                timeToCurrentSong = sum(song.properties['length'] for song in songs[:songs.index(song)])
                self.currentSongIndex = songs.index(song)
                return (songs[songs.index(song)], self.currentTime - timeToCurrentSong)
            length = length + song.properties['length']

    def getNextSong(self):
        songs = db.match(start_node=self.playlist, rel_type='HAS')
        for rel in songs:
            if rel.properties['index'] == self.currentSongIndex + 1:
                self.currentSongIndex = self.currentSongIndex + 1
                return rel.end_node

    def updateLength(self):
        try:
            self.length = reduce(lambda song1, song2: song1 + song2, (song.end_node.properties['length'] for song in db.match(start_node=self.playlist, rel_type="HAS")))
        except:
            self.length = 0

    def playSong(self, song):
        length = 0
        songs = self.getSongs()

        songIndex = -1
        for s in songs:
            if s.properties['url'] == song.properties['url']:
                songIndex = songs.index(s)
                break

        for i in range(0, songIndex):
            length = length + int(songs[i].properties['length'])
        print(length)
        self.currentTime = length

    @tornado.gen.coroutine
    def playSongs(self):
        while True and not self.isPaused and self.currentTime <= self.length:
            yield tornado.gen.sleep(1)
            self.currentTime = self.currentTime + 1.0
            print(str(self.currentTime) + "/" + str(self.length))
        self.isPaused = True
        self.currentTime = 0

class PlaylistManager:
    def __init__(self):
        self.playlists = {}

    def addPlaylist(self, playlist):
        self.playlists[playlist.playlist.properties['title']] = playlist
        db.create(playlist.playlist)
        db.push()

    def addExistingPlaylist(self, playlist):
        self.playlists[playlist.properties['title']] = Playlist(playlist.properties['title'], playlist.properties['category'], playlist.properties['password'], playlist.properties['openSubmissions'])
        self.playlists[playlist.properties['title']].playlist = playlist
        self.playlists[playlist.properties['title']].updateLength()

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
