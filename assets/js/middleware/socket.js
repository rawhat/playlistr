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
        store.dispatch(doSocketConnected());
    };

    const onClose = (ws, store) => () => {
        store.dispatch(doSocketDisconnected());
    };

    const onNewPlaylist = (ws, store) => msg => {
        store.dispatch(doAddNewPlaylist(msg));
    };

    const onNewSong = (ws, store) => msg => {
        store.dispatch(doAddNewSongToCurrentPlaylist(msg));
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

                playlistsLobby.on('new-playlist', (msg) => {
                    onNewPlaylist(socket, store)(msg);
                });
                break;
            }

            case PUSH_SOCKET_DISCONNECT: {
                if (socket) socket.disconnect();

                socket = null;
                break;
            }

            case PUSH_SOCKET_CHANGE: {
                let { old_playlist, new_playlist } = payload;

                if (old_playlist && playlistLobby) {
                    playlistLobby.leave();
                }

                playlistLobby = socket.channel(`playlist:${new_playlist}`);
                playlistLobby.join().receive('ok', () => {
                });
                playlistLobby.on('new-song', (msg) => {
                    onNewSong(socket, store)(msg);
                });

                break;
            }

            case JOIN_PLAYLIST_CHAT: {
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
