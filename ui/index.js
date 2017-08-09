import React from 'react';
import { render } from 'react-dom';
import App from './app';
/* eslint-disable no-unused-vars */
import rxjs from 'rxjs';
/* eslint-enable */

import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';

import { routerMiddleware } from 'react-router-redux';

import { createEpicMiddleware } from 'redux-observable';

import socketMiddleware from './middleware/socket';

import rootReducer, { rootEpic } from './ducks/index';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// const history = createHistory();
const middleware = routerMiddleware(history);

const epicMiddleware = createEpicMiddleware(rootEpic);

const store = createStore(
    rootReducer,
    composeEnhancers(
        applyMiddleware(epicMiddleware, middleware, socketMiddleware)
    )
);

render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('main-panel')
);
