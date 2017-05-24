import axios from 'axios';
import { handle } from 'redux-pack';

const FETCH_PLAYLISTS = 'playlistr/playlist/FETCH_PLAYLISTS';
const FETCH_PLAYLIST_BY_TITLE = 'playlistr/playlist/FETCH_PLAYLIST_BY_TITLE';
const CREATE_PLAYLIST = 'playlistr/playlist/CREATE_PLAYLIST';
const GO_LIVE_ON_PLAYLIST = 'playlistr/playlist/GO_LIVE_ON_PLAYLIST';

const initialState = {
    playlists: [],
    currentPlaylist: {},
    playlistError: null,
};

export default function playlistReducer(state = initialState, action) {
    const { type, payload } = action;
    switch (type) {
        case FETCH_PLAYLISTS: {
            return handle(state, action, {
                start: prevState => ({
                    ...prevState,
                    playlistError: null,
                }),
                success: prevState => ({
                    ...prevState,
                    playlists: payload.data.playlists,
                }),
                failure: prevState => ({
                    ...prevState,
                    playlistError: true,
                }),
            });
        }

        case FETCH_PLAYLIST_BY_TITLE: {
            return handle(state, action, {
                start: prevState => ({
                    ...prevState,
                    playlistError: false,
                    currentPlaylist: null,
                }),
                success: prevState => ({
                    ...prevState,
                    currentPlaylist: payload.data.playlist,
                }),
                failure: prevState => ({
                    ...prevState,
                    playlistError: true,
                }),
            });
        }

        case GO_LIVE_ON_PLAYLIST: {
            return state;
        }

        case CREATE_PLAYLIST: {
            return handle(state, action, {
                start: prevState => ({
                    ...prevState,
                    playlistCreateError: null,
                }),
                success: prevState => ({
                    ...prevState,
                    currentPlaylist: payload.data,
                }),
                failure: prevState => ({
                    ...prevState,
                    playlistCreateError: true,
                }),
            });
        }

        default: {
            return state;
        }
    }
}

export function doFetchPlaylists() {
    return {
        type: FETCH_PLAYLISTS,
        promise: axios.get('/playlist'),
    };
}

export function doFetchPlaylistByTitle(title) {
    return {
        type: FETCH_PLAYLIST_BY_TITLE,
        promise: axios.get(`/playlist?playlist=${title}`),
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
        promise: axios.put('/playlist', {
            playlist,
            category,
            password,
            openSubmissions,
            type,
        }),
    };
}
