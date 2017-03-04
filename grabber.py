import pafy
from music import Song

def processUrl(url):
    video = pafy.new(url)
    return {'title': video.title, 'url': video.getbestaudio(preftype='ogg').url, 'length': video.length}
