const SET_PLAYLIST_TITLE = 'playlistr/protected-playlist/SET_PLAYLIST_TITLE';
const SHOW_PASSWORD_MODAL = 'playlistr/protected-playlist/SHOW_PASSWORD_MODAL';
export const HIDE_PASSWORD_MODAL =
    'playlistr/protected-playlist/HIDE_PASSWORD_MODAL';
const TOGGLE_MODAL = 'playlistr/protected-playlist/TOGGLE_MODAL';
const SET_PASSWORD_ERROR = 'playlistr/protected-playlist/SET_PASSWORD_ERROR';

export function doSetPlaylistTitle(title) {
    return {
        type: SET_PLAYLIST_TITLE,
        payload: title,
    };
}

export function doShowPasswordModal(title) {
    return { type: SHOW_PASSWORD_MODAL, payload: title };
}

export function doHidePasswordModal(title) {
    return { type: HIDE_PASSWORD_MODAL, payload: title };
}

export function doToggleModal(title) {
    return {
        type: TOGGLE_MODAL,
        payload: title,
    };
}

export function doSetPasswordError(error) {
    return {
        type: SET_PASSWORD_ERROR,
        payload: error,
    };
}

const initialState = {
    playlistTitle: null,
    error: null,
    displayModal: false,
};

export default function protectedPlaylistReducer(state = initialState, action) {
    const { type, payload } = action;

    switch (type) {
        case SET_PLAYLIST_TITLE: {
            return {
                ...state,
                playlistTitle: payload,
                error: null,
            };
        }

        case SHOW_PASSWORD_MODAL: {
            return {
                ...state,
                displayModal: true,
                playlistTitle: payload,
                error: false,
            };
        }

        case HIDE_PASSWORD_MODAL: {
            return Object.assign(
                {},
                state,
                { error: false },
                payload === state.playlistTitle ? { playlistTitle: null } : {}
            );
        }

        case TOGGLE_MODAL: {
            // if payload === state.title, toggle displaymodal
            // otherwise, set title and set displaymodal to true
            return payload === state.playlistTitle
                ? {
                      ...state,
                      displayModal: !state.displayModal,
                  }
                : {
                      ...state,
                      playlistTitle: payload,
                      displayModal: true,
                  };
        }

        case SET_PASSWORD_ERROR: {
            return {
                ...state,
                error: payload,
            };
        }

        default:
            return state;
    }
}
