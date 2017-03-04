import pafy
from music import Song

def processUrl(url):
    video = pafy.new(url)
    return {'title': video.title, 'url': video.getbestaudio().url, 'length': video.length}
