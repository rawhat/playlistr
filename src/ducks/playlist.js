import { ajax } from 'rxjs/observable/dom/ajax';
import { of as of$ } from 'rxjs/observable/of';
import axios from 'axios';
import { handle } from 'redux-pack';

import {
    doHidePasswordModal,
    doSetPasswordError,
} from '../ducks/protected-playlist';
import { doSocketChangePlaylist } from '../ducks/push-socket';

const FETCH_PLAYLISTS = 'playlistr/playlist/FETCH_PLAYLISTS';
const FETCH_PLAYLIST_BY_TITLE = 'playlistr/playlist/FETCH_PLAYLIST_BY_TITLE';
export const FETCH_PASSWORD_PLAYLIST_BY_TITLE =
    'playlist/playlist/FETCH_PASSWORD_PLAYLIST_BY_TITLE';
const SHOW_CREATE_PLAYLIST_MODAL =
    'playlistr/playlist/SHOW_CREATE_PLAYLIST_MODAL';
const HIDE_CREATE_PLAYLIST_MODAL =
    'playlistr/playlist/HIDE_CREATE_PLAYLIST_MODAL';
const CREATE_PLAYLIST = 'playlistr/playlist/CREATE_PLAYLIST';
export const GO_LIVE_ON_PLAYLIST = 'playlistr/playlist/GO_LIVE_ON_PLAYLIST';
const ADD_NEW_PLAYLIST = 'playlistr/playlist/ADD_NEW_PLAYLIST';
const ADD_NEW_SONG_TO_CURRENT_PLAYLIST =
    'playlistr/playlist/ADD_NEW_SONG_TO_CURRENT_PLAYLIST';
const SET_CURRENT_PLAYLIST = 'playlistr/playlist/SET_CURRENT_PLAYLIST';
const SET_PLAYLISTS = 'playlistr/playlist/SET_PLAYLISTS';
const SET_PLAYLIST_ERROR = 'playlistr/playlist/SET_PLAYLIST_ERROR';
const UPDATE_LIVE_PLAYLIST = 'playlistr/playlist/UPDATE_LIVE_PLAYLIST';
const SET_PLAYLIST_CREATE_ERROR =
    'playlistr/playlist/SET_PLAYLIST_CREATE_ERROR';
const CLEAR_PLAYLIST_CREATOR = 'playlistr/playlist/CLEAR_PLAYLIST_CREATOR';

const initialState = {
    playlists: [],
    currentPlaylist: {},
    creatingPlaylist: null,
    createPlaylistError: null,
    playlistFetchError: null,
    currentPlayTime: null,
    paused: true,
    currentSong: '',
};

export default function playlistReducer(state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case SET_PLAYLISTS: {
            return {
                ...state,
                playlists: payload,
            };
        }

        case SET_PLAYLIST_ERROR: {
            return {
                ...state,
                playlistFetchError: payload,
            };
        }

        case UPDATE_LIVE_PLAYLIST: {
            const { songUrl, time } = payload;

            let currentSong = state.currentSong;
            // new song, so update URL
            if (songUrl !== currentSong) currentSong = songUrl;

            let currentPlaytime = time;
            // playlist is over
            if (!songUrl) currentPlaytime = 0;

            let paused = false;
            // playlist is over
            if (!songUrl) paused = true;

            return {
                ...state,
                currentSong,
                currentPlaytime,
                paused,
            };
        }

        case SHOW_CREATE_PLAYLIST_MODAL: {
            return {
                ...state,
                creatingPlaylist: true,
            };
        }

        case HIDE_CREATE_PLAYLIST_MODAL: {
            return {
                ...state,
                creatingPlaylist: false,
            };
        }

        case CREATE_PLAYLIST: {
            return {
                ...state,
                createPlaylistError: false,
            };
        }

        case CLEAR_PLAYLIST_CREATOR: {
            return {
                ...state,
                createPlaylistError: false,
                creatingPlaylist: false,
            };
        }

        case SET_PLAYLIST_CREATE_ERROR: {
            return {
                ...state,
                createPlaylistError: payload,
            };
        }

        case ADD_NEW_PLAYLIST: {
            return {
                ...state,
                playlists: state.playlists.concat(payload),
            };
        }

        case ADD_NEW_SONG_TO_CURRENT_PLAYLIST: {
            return {
                ...state,
                currentPlaylist: Object.assign({}, state.currentPlaylist, {
                    songs: state.currentPlaylist.songs.concat(payload),
                }),
            };
        }

        case SET_CURRENT_PLAYLIST: {
            return {
                ...state,
                currentPlaylist: payload,
            };
        }

        default: {
            return state;
        }
    }
}

export function doFetchPlaylists() {
    return {
        type: FETCH_PLAYLISTS,
    };
}

export function doFetchPlaylistByTitle(title) {
    return {
        type: FETCH_PLAYLIST_BY_TITLE,
        // promise: axios.get(`/playlist?playlist=${title}`),
        payload: title,
    };
}

export function doFetchPasswordPlaylistByTitle(title, password) {
    return {
        type: FETCH_PASSWORD_PLAYLIST_BY_TITLE,
        payload: {
            title,
            password,
        },
    };
}

export function doSetPlaylists(playlists) {
    return {
        type: SET_PLAYLISTS,
        payload: playlists,
    };
}

export function doSetPlaylistError(error) {
    return {
        type: SET_PLAYLIST_ERROR,
        payload: !!error,
    };
}

export function doShowCreatePlaylistModal() {
    return {
        type: SHOW_CREATE_PLAYLIST_MODAL,
    };
}

export function doHideCreatePlaylistModal() {
    return {
        type: HIDE_CREATE_PLAYLIST_MODAL,
    };
}

export function doCreatePlaylist(
    playlist,
    category,
    password,
    openSubmissions,
    type
) {
    return {
        type: CREATE_PLAYLIST,
        payload: {
            playlist,
            category,
            password,
            openSubmissions,
            type,
        },
    };
}

export function doSetPlaylistCreateError(error) {
    return {
        type: SET_PLAYLIST_CREATE_ERROR,
        payload: !!error,
    };
}

export function doAddNewPlaylist(playlist) {
    return {
        type: ADD_NEW_PLAYLIST,
        payload: playlist,
    };
}

export function doAddNewSongToCurrentPlaylist(song) {
    return {
        type: ADD_NEW_SONG_TO_CURRENT_PLAYLIST,
        payload: song,
    };
}

export function doSetCurrentPlaylist(playlist) {
    return {
        type: SET_CURRENT_PLAYLIST,
        payload: playlist,
    };
}

export function doGoLiveOnCurrentPlaylist() {
    return {
        type: GO_LIVE_ON_PLAYLIST,
    };
}

export function doUpdateLivePlaylist(songUrl, time) {
    return {
        type: UPDATE_LIVE_PLAYLIST,
        payload: { songUrl, time },
    };
}

function doClearPlaylistCreator() {
    return {
        type: CLEAR_PLAYLIST_CREATOR,
    };
}

export const fetchPlaylistsEpic = action$ =>
    action$.ofType(FETCH_PLAYLISTS).switchMap(() =>
        ajax({
            url: '/playlist',
            responseType: 'json',
        })
            .map(response => response.response.playlists)
            .map(doSetPlaylists)
            .catch(err => of$(err).map(doSetPlaylistError))
    );

export const fetchPlaylistEpic = (action$, store) =>
    action$.ofType(FETCH_PLAYLIST_BY_TITLE).switchMap(({ payload }) =>
        ajax({
            url: `/playlist?playlist=${payload}`,
            responseType: 'json',
        })
            .map(response => response.response)
            .flatMap(res => {
                let playlistTitle = res.playlist.title;
                return of$(
                    doSetCurrentPlaylist(res.playlist),
                    doSocketChangePlaylist(
                        store.getState().playlist.currentPlaylist.title,
                        playlistTitle
                    ),
                    doGoLiveOnCurrentPlaylist(playlistTitle)
                );
            })
            .catch(err => of$(err).map(doSetPlaylistError))
    );

export const fetchPasswordPlaylistEpic = (action$, store) =>
    action$.ofType(FETCH_PASSWORD_PLAYLIST_BY_TITLE).switchMap(({ payload }) =>
        ajax({
            url: `/playlist?playlist=${payload.title}&password=${payload.password}`,
            responseType: 'json',
        })
            .map(response => response.response)
            .flatMap(res => {
                let playlistTitle = res.playlist.title;
                return of$(
                    doHidePasswordModal(playlistTitle),
                    doSetCurrentPlaylist(res.playlist),
                    doSocketChangePlaylist(
                        store.getState().playlist.currentPlaylist.title,
                        playlistTitle
                    ),
                    doGoLiveOnCurrentPlaylist(playlistTitle)
                );
            })
            .catch(err => of$(err).map(doSetPlaylistError))
    );

export const goLiveOnPlaylistEpic = (action$, store) =>
    action$.ofType(GO_LIVE_ON_PLAYLIST).switchMap(() =>
        ajax({
            url: `/song?playlist=${store.getState().playlist.currentPlaylist.title}`,
            responseType: 'json',
        })
            .map(response => response.response)
            .map(doUpdateLivePlaylist)
            .catch(err => of$(err).map(doSetPlaylistError))
    );

export const createPlaylistEpic = action$ =>
    action$.ofType(CREATE_PLAYLIST).switchMap(({ payload }) =>
        ajax({
            url: '/playlist',
            method: 'PUT',
            responseType: 'json',
            body: payload,
        })
            .map(response => response.response)
            .flatMap(res => [
                doClearPlaylistCreator(),
                doFetchPasswordPlaylistByTitle(res.title, res.password),
            ])
            .catch(err => of$(err).map(doSetPlaylistCreateError))
    );
