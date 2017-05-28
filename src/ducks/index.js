import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import authenticationReducer from './authentication';
import playlistReducer from './playlist';
import pushSocketReducer from './push-socket';
import protectedPlaylistReducer from './protected-playlist';

import { combineEpics } from 'redux-observable';

import {
    fetchPasswordPlaylistEpic,
    fetchPlaylistEpic,
    fetchPlaylistsEpic,
    goLiveOnPlaylistEpic,
    createPlaylistEpic,
} from './playlist';
import {
    userLoginEpic,
    userSignOutEpic,
    userSignupEpic,
    userCheckAuthEpic,
} from './authentication';

export const rootEpic = combineEpics(
    userLoginEpic,
    userSignOutEpic,
    userSignupEpic,
    userCheckAuthEpic,
    fetchPlaylistsEpic,
    fetchPasswordPlaylistEpic,
    fetchPlaylistEpic,
    goLiveOnPlaylistEpic,
    createPlaylistEpic
);

export default combineReducers({
    router: routerReducer,
    auth: authenticationReducer,
    playlist: playlistReducer,
    protectedPlaylist: protectedPlaylistReducer,
    socketStatus: pushSocketReducer,
});
