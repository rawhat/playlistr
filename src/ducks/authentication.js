import { handle } from 'redux-pack';
import axios from 'axios';

export const LOGIN_USER = 'playlistr/authentication/LOGIN_USER';
export const SIGNUP_USER = 'playlistr/authentication/SIGNUP_USER';
export const CHECK_AUTH_STATUS = 'playlistr/authentication/CHECK_AUTH_STATUS';

const initialState = {
    isLoading: false,
    loginAuthError: false,
    signupAuthError: false,
    authStatus: false,
    user: null,
};

export default function authenticationReducer(state = initialState, action) {
    const { type, payload } = action;

    switch (type) {
        case LOGIN_USER: {
            return handle(state, action, {
                start: prevState => ({
                    ...prevState,
                    isLoading: true,
                    loginAuthError: null,
                    user: null,
                }),
                finish: prevState => ({
                    ...prevState,
                    isLoading: false,
                }),
                failure: prevState => ({
                    ...prevState,
                    loginAuthError: true,
                }),
                success: prevState => ({
                    ...prevState,
                    user: payload.data,
                    authStatus: true,
                }),
            });
        }

        case SIGNUP_USER: {
            return handle(state, action, {
                start: prevState => ({
                    ...prevState,
                    isLoading: true,
                    signupAuthError: null,
                    user: null,
                }),
                finish: prevState => ({
                    ...prevState,
                    isLoading: false,
                }),
                failure: prevState => ({
                    ...prevState,
                    signupAuthError: true,
                }),
                success: prevState => ({
                    ...prevState,
                    user: payload.data,
                    authStatus: true,
                }),
            });
        }

        case CHECK_AUTH_STATUS: {
            return handle(state, action, {
                start: prevState => ({
                    ...prevState,
                    isLoading: true,
                    user: null,
                }),
                finish: prevState => ({
                    ...prevState,
                    isLoading: false,
                }),
                success: prevState => ({
                    ...prevState,
                    user: payload.data,
                    authStatus: true,
                }),
                failure: prevState => ({
                    ...prevState,
                    authStatus: false,
                }),
            });
        }

        default: {
            return state;
        }
    }
}

export function doLogin(username, password) {
    return {
        type: LOGIN_USER,
        promise: axios.post('/login', { username, password }),
    };
}

export function doSignup(username, email, password, password_repeat) {
    return {
        type: SIGNUP_USER,
        promise: axios.post('/signup', {
            username,
            email,
            password,
            password_repeat,
        }),
    };
}

export function doAuthCheck() {
    return {
        type: CHECK_AUTH_STATUS,
        promise: axios.get('/authenticated'),
    };
}
