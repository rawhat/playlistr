// import io from 'socket.io-client';
// import { Socket } from 'phoenix';
import { Socket } from 'phoenix';
// const Socket = {};

import {
    doSocketConnected,
    doSocketDisconnected,

    // doSocketChangePlaylist,

    // doSocketNewSong,
    PUSH_SOCKET_CONNECT,
    PUSH_SOCKET_DISCONNECT,
    PUSH_SOCKET_CHANGE,
} from '../ducks/push-socket';

import {
    doAddNewPlaylist,
    doAddNewSongToCurrentPlaylist,
} from '../ducks/playlist';

function socketMiddleware() {
    let socket = null;
    let playlistsLobby = null;
    let playlistLobby = null;

    const onOpen = (ws, store) => () => {
        console.log('connected!');
        store.dispatch(doSocketConnected());
    };

    const onClose = (ws, store) => () => {
        console.log('disconnected!');
        store.dispatch(doSocketDisconnected());
    };

    const onNewPlaylist = (ws, store) => msg => {
        console.log('new playlist', msg);
        const { playlist } = msg;
        store.dispatch(doAddNewPlaylist(playlist));
    };

    const onNewSong = (ws, store) => msg => {
        const { song } = msg;
        console.log('new song', msg);
        store.dispatch(doAddNewSongToCurrentPlaylist(song));
    };

    return store => next => action => {
        const { type, payload } = action;

        switch (type) {
            case PUSH_SOCKET_CONNECT: {
                if (socket) socket.disconnect();

                socket = new Socket('/socket');
                socket.connect();
                playlistsLobby = socket.channel('playlists:lobby');
                playlistsLobby.join().receive('ok', onOpen(socket, store));

                playlistsLobby.on('new-playlist', onNewPlaylist(socket, store));
                break;
            }

            case PUSH_SOCKET_DISCONNECT: {
                if (socket) socket.disconnect();

                socket = null;
                break;
            }

            case PUSH_SOCKET_CHANGE: {
                console.log(`changing to ${payload}`);
                let { old_playlist, new_playlist } = payload;

                if (old_playlist && playlistLobby) {
                    playlistLobby.leave();
                }

                playlistLobby = socket.channel(`playlist:${new_playlist}`);
                playlistLobby.join().receive('ok', () => {
                    console.log(`connected to ${new_playlist}`);
                });
                playlistLobby.on('new-song', onNewSong(socket, store));

                break;
            }

            default: {
                return next(action);
            }
        }
    };
}

export default socketMiddleware();
