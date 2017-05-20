import { handle } from 'redux-pack';
import axios from 'axios';

export const LOGIN_USER = 'LOGIN_USER';
export const SIGNUP_USER = 'SIGNUP_USER';

const initialState = {
    isLoading: null,
    authenticationError: null,
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
                    authenticationError: null,
                    user: null,
                }),
                finish: prevState => ({ ...prevState, isLoading: false }),
                failure: prevState => ({
                    ...prevState,
                    authenticationError: payload,
                }),
                success: prevState => ({ ...prevState, user: payload }),
            });
        }

        case SIGNUP_USER: {
            return handle(state, action, {
                start: prevState => ({
                    ...prevState,
                    isLoading: true,
                    authenticationError: null,
                    user: null,
                }),
                finish: prevState => ({ ...prevState, isLoading: false }),
                failure: prevState => ({
                    ...prevState,
                    authenticationError: payload,
                }),
                success: prevState => ({ ...prevState, user: payload }),
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
