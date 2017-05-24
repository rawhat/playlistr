import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import authenticationReducer from './authentication';
import playlistReducer from './playlist';

export default combineReducers({
    router: routerReducer,
    auth: authenticationReducer,
    playlist: playlistReducer,
});
