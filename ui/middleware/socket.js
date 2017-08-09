/* eslint-disable no-console */
import { Socket } from 'phoenix';

import {
    doSocketConnected,
    doSocketDisconnected,
    PUSH_SOCKET_CONNECT,
    PUSH_SOCKET_DISCONNECT,
    PUSH_SOCKET_CHANGE,
} from '../ducks/push-socket';

import {
    doReceiveChatMessage,
    doSetChatSocket,
    JOIN_PLAYLIST_CHAT,
    SEND_PLAYLIST_MESSAGE,
    // LEAVE_PLAYLIST_CHAT,
} from '../ducks/chat';

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

    const onNewChatMessage = (ws, store) => msg => {
        store.dispatch(doReceiveChatMessage(msg));
    };

    return store => next => action => {
        const { type, payload } = action;

        switch (type) {
            case PUSH_SOCKET_CONNECT: {
                if (socket) socket.disconnect();

                socket = new Socket('/socket');
                socket.connect();
                playlistsLobby = socket.channel('playlists:lobby');
                playlistsLobby
                    .join()
                    .receive('ok', () => onOpen(socket, store));

                playlistsLobby.on('new-playlist', () =>
                    onNewPlaylist(socket, store)
                );
                break;
            }

            case PUSH_SOCKET_DISCONNECT: {
                if (socket) socket.disconnect();

                socket = null;
                break;
            }

            case PUSH_SOCKET_CHANGE: {
                console.log('changing to', payload);
                let { old_playlist, new_playlist } = payload;

                if (old_playlist && playlistLobby) {
                    playlistLobby.leave();
                }

                playlistLobby = socket.channel(`playlist:${new_playlist}`);
                playlistLobby.join().receive('ok', () => {
                    console.log(`connected to ${new_playlist}`);
                });
                playlistLobby.on('new-song', () => onNewSong(socket, store));

                break;
            }

            case JOIN_PLAYLIST_CHAT: {
                console.log('joining playlist chat');
                if (socket) {
                    let playlistChatChannel = socket.channel(
                        `playlist:chat:${payload}`
                    );
                    playlistChatChannel
                        .join()
                        .receive('ok', () =>
                            store.dispatch(doSetChatSocket(playlistChatChannel))
                        );

                    playlistChatChannel.on('message', msg =>
                        store.dispatch(doReceiveChatMessage(msg))
                    );
                }
                break;
            }

            case SEND_PLAYLIST_MESSAGE: {
                if (socket) {
                    let playlistChatChannel = store.getState().chat
                        .channelSocket;

                    let message = {
                        message: payload,
                        user: store.getState().auth.user.username,
                        time: Date.now(),
                    };

                    playlistChatChannel.push('message', message);
                }
                break;
            }

            default: {
                return next(action);
            }
        }
    };
}

export default socketMiddleware();
