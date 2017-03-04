var app = Elm.Main.embed(document.getElementById('app'));

// console.log(app);

function mediaMessage(msg) {
  // console.log(msg);
  var mediaPlayer = document.getElementById('media-player');
  // console.log(mediaPlayer);
  var message = JSON.parse(msg);
  switch(message.action) {
    case 'play': {
      if(mediaPlayer.paused || mediaPlayer.currentTime === 0.0) {
        mediaPlayer.play();
        app.ports.sendMessage.send(JSON.stringify({ action: 'playing' }));
      }
      break;
    }
    case 'pause': {
      if(!mediaPlayer.paused) {
        mediaPlayer.pause();
        app.ports.sendMessage.send(JSON.stringify({ action: 'paused' }));
      }
      break;
    }
    case 'volume-up': {
      if(mediaPlayer.volume <= 0.9) {
        mediaPlayer.volume += 0.1;
        app.ports.sendMessage.send(JSON.stringify({ action: 'volume-up' }));
      }
      break;
    }
    case 'volume-down': {
      if(mediaPlayer.volume >= 0.1) {
        mediaPlayer.volume -= 0.1;
        app.ports.sendMessage.send(JSON.stringify({ action: 'volume-down' }));
      }
      break;
    }
    case 'seek': {
      if(mediaPlayer.currentTime + message.time < 0)
        mediaPlayer.currentTime = 0;
      else if(mediaPlayer.currentTime + message.time < mediaPlayer.length)
        mediaPlayer.currentTime += message.time;
      app.ports.send.send(JSON.stringify({ action: 'seeked', time: mediaPlayer.currentTime }));
      break;
    }
    case 'live': {
      mediaPlayer.currentTime = message.time;
      app.ports.sendMessage.send(JSON.stringify({ action: 'live' }));
      break;
    }
    default: {
      break;
    }
  }
}

app.ports.mediaMessage.subscribe(mediaMessage);
// app.ports.sendMessage.subscribe()
