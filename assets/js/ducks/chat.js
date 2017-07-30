import _assign from 'lodash/assign';
import _orderBy from 'lodash/orderBy';
import { createSelector } from 'reselect';

export const JOIN_PLAYLIST_CHAT = 'playlistr/chat/JOIN_PLAYLIST_CHAT';
export const SET_PLAYLIST_SOCKET = 'playlistr/chat/SET_PLAYLIST_SOCKET';
export const SEND_PLAYLIST_MESSAGE = 'playlistr/chat/SEND_PLAYLIST_MESSAGE';
export const RECEIVE_PLAYLIST_MESSAGE =
    'playlistr/chat/RECEIVE_PLAYLIST_MESSAGE';

const sampleMessages = [
    { message: 'this is a test', user: 'rawhat', date: Date.now() },
    { message: 'this is a test 1', user: 'rawhat', date: Date.now() - 1000 },
    { message: 'this is a test 2', user: 'rawhat1', date: Date.now() - 2000 },
    { message: 'this is a test 3', user: 'rawhat', date: Date.now() - 10000 },
    { message: 'this is a test 4', user: 'rawhat1', date: Date.now() - 15000 },
    { message: 'this is a test 5', user: 'rawhat', date: Date.now() - 50000 },
];

const initialState = {
    channelSocket: null,
    hasError: false,
    messages: sampleMessages,
};

export default function chatReducer(state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case JOIN_PLAYLIST_CHAT: {
            return state;
        }
        case SEND_PLAYLIST_MESSAGE: {
            return state;
        }
        case SET_PLAYLIST_SOCKET: {
            return {
                ...state,
                channelSocket: payload,
            };
        }
        case RECEIVE_PLAYLIST_MESSAGE: {
            let newMessage = _assign({}, payload, { date: Date.now() });
            return {
                ...state,
                messages: state.messages.concat(newMessage),
            };
        }
        default: {
            return state;
        }
    }
}

export const getChatMessages = createSelector(
    state => state.chat.messages,
    messages => _orderBy(messages, 'date', 'asc')
);

export const getMyMessages = createSelector(
    [getChatMessages, state => state.auth.user.username],
    (messages, username) =>
        messages.filter(message => message.user === username)
);

export const getLongestUsernameLength = createSelector(
    getChatMessages,
    messages =>
        messages.reduce(
            (max, next) => (next.user.length > max ? next.user.length : max),
            -1
        )
);

export const doJoinChannel = title => ({
    type: JOIN_PLAYLIST_CHAT,
    payload: title,
});

export const doSetChatSocket = socket => ({
    type: SET_PLAYLIST_SOCKET,
    payload: socket,
});

export const doReceiveChatMessage = message => ({
    type: RECEIVE_PLAYLIST_MESSAGE,
    payload: message,
});

export const doSendChatMessage = message => ({
    type: SEND_PLAYLIST_MESSAGE,
    payload: message,
});
