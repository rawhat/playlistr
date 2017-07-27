import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import authenticationReducer from './authentication';
import playlistReducer from './playlist';
import pushSocketReducer from './push-socket';
import protectedPlaylistReducer from './protected-playlist';
import addSongReducer from './add-song';

import { combineEpics } from 'redux-observable';

import {
    fetchPasswordPlaylistEpic,
    fetchPlaylistEpic,
    fetchPlaylistsEpic,
    goLiveOnPlaylistEpic,
    createPlaylistEpic,
    pausePlaylistEpic,
    getNextSongEpic,
    refreshPlaylistEpic,
} from './playlist';

import {
    userLoginEpic,
    userSignOutEpic,
    userSignupEpic,
    userCheckAuthEpic,
} from './authentication';

import { addSongEpic } from './add-song';

export const rootEpic = combineEpics(
    userLoginEpic,
    userSignOutEpic,
    userSignupEpic,
    userCheckAuthEpic,
    fetchPlaylistsEpic,
    fetchPasswordPlaylistEpic,
    fetchPlaylistEpic,
    goLiveOnPlaylistEpic,
    createPlaylistEpic,
    addSongEpic,
    pausePlaylistEpic,
    getNextSongEpic,
    refreshPlaylistEpic
);

export default combineReducers({
    router: routerReducer,
    auth: authenticationReducer,
    playlist: playlistReducer,
    protectedPlaylist: protectedPlaylistReducer,
    socketStatus: pushSocketReducer,
    addSong: addSongReducer,
});
