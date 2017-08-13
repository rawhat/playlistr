const HIDE_SIDEBAR = 'playlistr/layout/HIDE_SIDEBAR';
const SHOW_SIDEBAR = 'playlistr/layout/SHOW_SIDEBAR';
const TOGGLE_SIDEBAR = 'playlistr/layout/TOGGLE_SIDEBAR';
const HIDE_CHAT = 'playlistr/layout/HIDE_CHAT';
const SHOW_CHAT = 'playlistr/layout/SHOW_CHAT';
const TOGGLE_CHAT = 'playlistr/layout/TOGGLE_CHAT';

export function doHideSidebar() {
    return {
        type: HIDE_SIDEBAR
    };
}

export function doShowSidebar() {
    return {
        type: SHOW_SIDEBAR
    };
}

export function doToggleSidebar() {
    return {
        type: TOGGLE_SIDEBAR
    };
}

export function doHideChat() {
    return {
        type: HIDE_CHAT
    };
}

export function doShowChat() {
    return {
        type: SHOW_CHAT
    };
}

export function doToggleChat() {
    return {
        type: TOGGLE_CHAT
    };
}


const initialState = {
    sidebarHidden: false,
    chatHidden: false
};

const layoutReducer = (state = initialState, action) => {
    switch(action.type) {
        case HIDE_SIDEBAR: {
            return {
                ...state,
                sidebarHidden: true
            };
        }
        case SHOW_SIDEBAR: {
            return {
                ...state,
                sidebarHidden: false
            };
        }
        case TOGGLE_SIDEBAR: {
            return {
                ...state,
                sidebarHidden: !state.sidebarHidden
            };
        }
        case HIDE_CHAT: {
            return {
                ...state,
                chatHidden: true
            };
        }
        case SHOW_CHAT: {
            return {
                ...state,
                chatHidden: false
            };
        }
        case TOGGLE_CHAT: {
            return {
                ...state,
                chatHidden: !state.chatHidden
            };
        }
        default: {
            return state;
        }
    }
};

export default layoutReducer;
