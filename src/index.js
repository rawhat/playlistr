import React from 'react';
import { render } from 'react-dom';
import App from './app';

import { createStore, applyMiddleware, compose  } from 'redux';
import { Provider } from 'react-redux';
import { middleware as reduxPackMiddleware } from 'redux-pack';

import createHistory from 'history/createBrowserHistory';
import { ConnectedRouter, routerMiddleware } from 'react-router-redux';

import rootReducer from './ducks/index';

const composeEnhancers = (process.NODE_ENV === 'production') ? compose : window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const history = createHistory();
const middleware = routerMiddleware(history);

const store = createStore(
    rootReducer, composeEnhancers(
        applyMiddleware(middleware, reduxPackMiddleware)
    )
);

render(
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <App />
        </ConnectedRouter>
    </Provider>
    , document.getElementById('main-panel'));