import { ajax } from 'rxjs/observable/dom/ajax';
import { of as of$ } from 'rxjs/observable/of';

const ADD_NEW_SONG = 'playlistr/playlist/ADD_NEW_SONG';
const SET_ADD_SONG_ERROR = 'playlistr/playlist/SET_ADD_SONG_ERROR';
const CLEAR_SONG_ERRORS = 'playlistr/playlist/CLEAR_SONG_ERRORS';
const CLEAR_SONG_TEXT = 'playlistr/playlist/CLEAR_SONG_TEXT';
const SET_SONG_TEXT = 'playlistr/playlist/SET_SONG_TEXT';

const initialState = {
    error: false,
    text: '',
};

export default function addSongReducer(state = initialState, action) {
    const { type, payload } = action;

    switch (type) {
        case ADD_NEW_SONG: {
            return {
                ...state,
                error: false,
            };
        }

        case SET_ADD_SONG_ERROR: {
            return {
                ...state,
                error: true,
            };
        }

        case CLEAR_SONG_ERRORS: {
            return {
                ...state,
                error: false,
            };
        }

        case CLEAR_SONG_TEXT: {
            return {
                ...state,
                text: '',
            };
        }

        case SET_SONG_TEXT: {
            return {
                ...state,
                text: payload,
            };
        }

        default: {
            return state;
        }
    }
}

export function doAddSong(song, type, title) {
    return {
        type: ADD_NEW_SONG,
        payload: { song, type, title },
    };
}

function doAddSongError(error) {
    return {
        type: SET_ADD_SONG_ERROR,
        payload: !!error,
    };
}

function doClearSongErrors() {
    return {
        type: CLEAR_SONG_ERRORS,
    };
}

function doClearSongText() {
    return {
        type: CLEAR_SONG_TEXT,
    };
}

export function doSetText(text) {
    return {
        type: SET_SONG_TEXT,
        payload: text,
    };
}

export const addSongEpic = (action$, store) =>
    action$.ofType(ADD_NEW_SONG).switchMap(() => {
        const state = store.getState();
        const { type, title: playlist } = state.playlist.currentPlaylist;
        const { text: songUrl } = state.addSong;

        return ajax({
            url: '/song',
            method: 'PUT',
            responseType: 'json',
            body: { type, playlist, songUrl },
        })
            .map(response => response.response)
            .flatMap(() => [doClearSongText(), doClearSongErrors()])
            .catch(err => of$(err).map(doAddSongError));
    });
