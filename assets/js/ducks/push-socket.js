export const PUSH_SOCKET_CONNECT = 'playlistr/push-socket/PUSH_SOCKET_CONNECT';
export const PUSH_SOCKET_CONNECTED =
    'playlistr/push-socket/PUSH_SOCKET_CONNECTED';
export const PUSH_SOCKET_DISCONNECT =
    'playlistr/push-socket/PUSH_SOCKET_DISCONNECT';
export const PUSH_SOCKET_DISCONNECTED =
    'playlistr/push-socket/PUSH_SOCKET_DISCONNECTED';
export const PUSH_SOCKET_CHANGE = 'playlistr/push-socket/PUSH_SOCKET_CHANGE';
export const PUSH_SOCKET_CONNECTING =
    'playlistr/push-socket/PUSH_SOCKET_CONNECT';

export function doSocketConnect() {
    return {
        type: PUSH_SOCKET_CONNECT,
    };
}

export function doSocketConnecting() {
    return {
        type: PUSH_SOCKET_CONNECTING,
    };
}

export function doSocketConnected() {
    return {
        type: PUSH_SOCKET_CONNECTED,
    };
}

export function doSocketDisconnect() {
    return {
        type: PUSH_SOCKET_DISCONNECT,
    };
}

export function doSocketDisconnected() {
    return {
        type: PUSH_SOCKET_DISCONNECTED,
    };
}

export function doSocketChangePlaylist(old_playlist, new_playlist) {
    return {
        type: PUSH_SOCKET_CHANGE,
        payload: {
            old_playlist,
            new_playlist,
        },
    };
}

export function doSocketNewSong() {}

const initialState = {
    isConnecting: false,
    isConnected: false,
};

export default function pushSocketReducer(state = initialState, action) {
    const { type } = action;

    switch (type) {
        case PUSH_SOCKET_CONNECTING: {
            return {
                ...state,
                isConnecting: true,
            };
        }

        case PUSH_SOCKET_CONNECTED: {
            return {
                ...state,
                isConnected: true,
                isConnecting: false,
            };
        }

        case PUSH_SOCKET_DISCONNECTED: {
            return {
                ...state,
                isConnected: false,
            };
        }

        default: {
            return state;
        }
    }
}
