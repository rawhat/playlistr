import io from 'socket.io-client';

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

    const onOpen = (ws, store) => () => {
        console.log('connected!');
        store.dispatch(doSocketConnected());
    };

    const onClose = (ws, store) => () => {
        console.log('disconnected!');
        store.dispatch(doSocketDisconnected());
    };

    const onNewPlaylist = (ws, store) => msg => {
        console.log(msg);
        const { playlist } = msg;
        store.dispatch(doAddNewPlaylist(playlist));
    };

    const onNewSong = (ws, store) => msg => {
        const { song } = msg;
        console.log('new song', msg);
    };

    return store => next => action => {
        const { type, payload } = action;

        switch (type) {
            case PUSH_SOCKET_CONNECT: {
                if (socket) socket.close();

                socket = io.connect();
                socket.on('connect', onOpen(socket, store));
                socket.on('disconnect', onClose(socket, store));
                socket.on('new-playlist', onNewPlaylist(socket, store));
                socket.on('new-song', onNewSong(socket, store));
                break;
            }

            case PUSH_SOCKET_DISCONNECT: {
                if (socket) socket.close();

                socket = null;
                break;
            }

            case PUSH_SOCKET_CHANGE: {
                console.log('pushing change');
                socket.emit('change-playlist', payload);
                break;
            }

            default: {
                return next(action);
            }
        }
    };
}

export default socketMiddleware();
