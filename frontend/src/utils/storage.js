/**
 * Storage utility for managing user session data in localStorage
 */

const USER_ID_KEY = 'promptly_user_id';

/**
 * Saves the user ID to localStorage
 * @param {string} userId - The user ID to store
 */
export const saveUserId = (userId) => {
  try {
    localStorage.setItem(USER_ID_KEY, userId);
    console.log('User ID saved to localStorage');
  } catch (error) {
    console.error('Error saving user ID to localStorage:', error);
  }
};

/**
 * Retrieves the user ID from localStorage
 * @returns {string|null} The user ID if found, null otherwise
 */
export const getUserId = () => {
  try {
    return localStorage.getItem(USER_ID_KEY);
  } catch (error) {
    console.error('Error getting user ID from localStorage:', error);
    return null;
  }
};

/**
 * Removes the user ID from localStorage
 */
export const removeUserId = () => {
  try {
    localStorage.removeItem(USER_ID_KEY);
    console.log('User ID removed from localStorage');
  } catch (error) {
    console.error('Error removing user ID from localStorage:', error);
  }
};

/**
 * Checks if a user ID exists in localStorage
 * @returns {boolean} True if user ID exists, false otherwise
 */
export const hasUserId = () => {
  return getUserId() !== null;
};

const CHAT_ID_KEY = 'current_chat_id';
const GUEST_ID_KEY = 'promptly_guest_id';

/**
 * Stores the current chat ID in localStorage
 * @param {string} chatId - The chat ID to store
 */
export const storeChatId = (chatId) => {
  try {
    localStorage.setItem(CHAT_ID_KEY, chatId);
    console.log('Chat ID stored in localStorage:', chatId);
  } catch (error) {
    console.error('Error storing chat ID in localStorage:', error);
  }
};

/**
 * Retrieves the current chat ID from localStorage
 * @returns {string|null} The stored chat ID or null if not found
 */
export const getChatId = () => {
  try {
    return localStorage.getItem(CHAT_ID_KEY);
  } catch (error) {
    console.error('Error getting chat ID from localStorage:', error);
    return null;
  }
};

/**
 * Removes the chat ID from localStorage
 */
export const removeChatId = () => {
  try {
    localStorage.removeItem(CHAT_ID_KEY);
    console.log('Chat ID removed from localStorage');
  } catch (error) {
    console.error('Error removing chat ID from localStorage:', error);
  }
};

/**
 * Checks if a chat ID exists in localStorage
 * @returns {boolean} True if chat ID exists, false otherwise
 */
export const hasChatId = () => {
  return getChatId() !== null;
};

/**
 * Stores the guest ID in localStorage
 * @param {string} guestId - The guest ID to store
 */
export const storeGuestId = (guestId) => {
  try {
    localStorage.setItem(GUEST_ID_KEY, guestId);
    console.log('Guest ID stored in localStorage');
  } catch (error) {
    console.error('Error storing guest ID in localStorage:', error);
  }
};

/**
 * Retrieves the guest ID from localStorage
 * @returns {string|null} The stored guest ID or null if not found
 */
export const getGuestId = () => {
  try {
    return localStorage.getItem(GUEST_ID_KEY);
  } catch (error) {
    console.error('Error getting guest ID from localStorage:', error);
    return null;
  }
};

/**
 * Removes the guest ID from localStorage
 */
export const removeGuestId = () => {
  try {
    localStorage.removeItem(GUEST_ID_KEY);
    console.log('Guest ID removed from localStorage');
  } catch (error) {
    console.error('Error removing guest ID from localStorage:', error);
  }
};

/**
 * Checks if a guest ID exists in localStorage
 * @returns {boolean} True if guest ID exists, false otherwise
 */
export const hasGuestId = () => {
  return getGuestId() !== null;
};
