import { ajax } from 'rxjs/observable/dom/ajax';
import { of as of$ } from 'rxjs/observable/of';

const LOGIN_USER = 'playlistr/authentication/LOGIN_USER';
const SIGNUP_USER = 'playlistr/authentication/SIGNUP_USER';
const AUTH_CHECK_LOADING = 'playlistr/authentication/AUTH_CHECK_LOADING';
const CHECK_AUTH_STATUS = 'playlistr/authentication/CHECK_AUTH_STATUS';
const SIGN_OUT = 'playlistr/authentication/SIGN_OUT';
const SET_LOGIN_ERROR = 'playlistr/authentication/SET_LOGIN_ERROR';
const SET_SIGNUP_ERROR = 'playlistr/authentication/SET_SIGNUP_ERROR';
const SET_CURRENT_USER = 'playlistr/authentication/SET_CURRENT_USER';
const SIGN_OUT_USER = 'playlistr/authentication/SIGN_OUT_USER';

const initialState = {
    isLoading: false,
    loginAuthError: false,
    signupAuthError: false,
    authStatus: false,
    user: null,
};

export default function authenticationReducer(state = initialState, action) {
    const { type, payload } = action;
    console.log('handling', type);
    switch (type) {
        case AUTH_CHECK_LOADING: {
            console.log('in here?')
            return {
                ...state,
                isLoading: true
            }
        }
        case LOGIN_USER: {
            return {
                ...state,
                loginAuthError: false,
            };
        }

        case SIGNUP_USER: {
            return {
                ...state,
                signupAuthError: false,
            };
        }

        case SET_LOGIN_ERROR: {
            return {
                ...state,
                loginAuthError: payload,
            };
        }

        case SET_SIGNUP_ERROR: {
            return {
                ...state,
                signupAuthError: payload,
            };
        }

        case SET_CURRENT_USER: {
            return {
                ...state,
                isLoading: false,
                loginAuthError: null,
                signupAuthError: null,
                authStatus: true,
                user: payload,
            };
        }

        case SIGN_OUT_USER: {
            return {
                ...state,
                authStatus: false,
                user: null,
            };
        }

        default: {
            return state;
        }
    }
}

export function doLogin(username, password) {
    return {
        type: LOGIN_USER,
        payload: { username, password },
    };
}

export function doSignup(username, email, password, password_repeat) {
    return {
        type: SIGNUP_USER,
        payload: {
            username,
            email,
            password,
            password_repeat,
        },
    };
}

function doAuthLoading() {
    console.log('this is firing?');
    return {
        type: AUTH_CHECK_LOADING,
    };
}

export function doAuthCheck() {
    return {
        type: CHECK_AUTH_STATUS,
    };
}

export function doSignOut() {
    return {
        type: SIGN_OUT,
    };
}

export function doLoginError(error) {
    return {
        type: SET_LOGIN_ERROR,
        payload: !!error,
    };
}

export function doSignupError(error) {
    return {
        type: SET_SIGNUP_ERROR,
        payload: !!error,
    };
}

export function doSetUser(user) {
    return {
        type: SET_CURRENT_USER,
        payload: user,
    };
}

export function doSignOutUser() {
    return {
        type: SIGN_OUT_USER,
    };
}

export const userLoginEpic = action$ =>
    action$.ofType(LOGIN_USER).switchMap(({ payload }) =>
        ajax({
            url: '/login',
            body: payload,
            method: 'POST',
            responseType: 'json',
        })
            .map(response => response.response)
            .map(doSetUser)
            .catch(err => of$(err).map(doLoginError))
    );

// signup flow
//  -> isLoading, user, signupError null
//  -> success:  user to payload, authStatus true, isLoading false
//  -> failure:  signupError to payload
export const userSignupEpic = action$ =>
    action$.ofType(SIGNUP_USER).switchMap(({ payload }) =>
        ajax({
            url: '/signup',
            body: payload,
            method: 'POST',
            responseType: 'json',
        })
            .map(res => res.response)
            .map(doSetUser)
            .catch(err => of$(err).map(doSignupError))
    );

// check status flow
//  -> isLoading, user to null
//  -> success:  user to payload, authStatus to true, isLoading to false
//  -> failure:  authStatus to false
export const userCheckAuthEpic = action$ =>
    action$
        .ofType(CHECK_AUTH_STATUS)
        .switchMap(() =>
            ajax({ url: '/authenticated', responseType: 'json' })
                .map(response => response.response)
                .map(doSetUser)
                .catch(err => of$(err).map(doSignOutUser))
        );

// sign out flow
//  -> user to null, authstatus to false
export const userSignOutEpic = action$ =>
    action$
        .ofType(SIGN_OUT)
        .switchMap(() =>
            ajax('/signout')
                .map(doSignOutUser)
                .catch(err => of$(err).map(doSignOutUser))
        );
