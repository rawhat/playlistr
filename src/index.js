import React from 'react';
import { render } from 'react-dom';
import App from './app';
import rxjs from 'rxjs';

import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
// import { middleware as reduxPackMiddleware } from 'redux-pack';

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
        applyMiddleware(
            epicMiddleware,
            middleware,
            socketMiddleware

            // reduxPackMiddleware
        )
    )
);

render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('main-panel')
);
