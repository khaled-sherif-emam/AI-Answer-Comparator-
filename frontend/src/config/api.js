export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5002';

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    USER_INFO: `${API_BASE_URL}/auth/handleUserInfo`,
    CHECK_SESSION: `${API_BASE_URL}/auth/checkSession`,
    USER_NAME: `${API_BASE_URL}/api/user/handleUserName`,
    SUBSCRIPTION_PLAN: `${API_BASE_URL}/api/user/handleGetSubscription`,
    // Add other auth endpoints here
  },
  USER_INFO: {
    TOKENS_DATA: `${API_BASE_URL}/api/user/handleGetUserTokens`,
  },
  CHAT: {
    GET_CHAT_MESSAGES: `${API_BASE_URL}/api/chat/getChatMessages`,
  },
  SIDEBAR: {
    GET_CHATS: `${API_BASE_URL}/api/sidebar/getChats`,
    NEW_CHAT: `${API_BASE_URL}/api/sidebar/newChat`,
    DELETE_CHAT: `${API_BASE_URL}/api/sidebar/deleteChat`,
    RENAME_CHAT: `${API_BASE_URL}/api/sidebar/renameChat`,
    // Add other sidebar endpoints here
  },
  // Add other API endpoints here
};

export const API_CONFIG = {
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10),
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};
