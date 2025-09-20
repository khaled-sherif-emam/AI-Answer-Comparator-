import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import React, { useState, useEffect, useRef } from 'react';
import './Sidebar.css';
import { getUserId, storeChatId, getChatId } from '../utils/storage';
import { formatTokens } from './sidebarOperations';


const Sidebar = ({ onChatSelect, selectedChatId: propSelectedChatId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [internalSelectedChatId, setInternalSelectedChatId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  
  // Update selected chat when chats are loaded
  useEffect(() => {
    if (chats.length > 0 && !internalSelectedChatId) {
      const firstChatId = String(chats[0].id);
      setInternalSelectedChatId(firstChatId);
      if (onChatSelect) {
        onChatSelect(firstChatId);
      }
    }
  }, [chats, internalSelectedChatId, onChatSelect]);

  // Sync the prop with internal state
  useEffect(() => {
    if (propSelectedChatId !== undefined) {
      setInternalSelectedChatId(propSelectedChatId);
    }
  }, [propSelectedChatId]);
  

  const toggleSidebar = async (e) => {
    if (e) {
      e.stopPropagation();
    }
    
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    
    if (willOpen) {
      const chatId = getChatId();
      console.log('Chat id:', chatId);
      if (chatId === null) {
        handleNewChat();
      }
    }
  };

  const handleNewChat = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        console.error('No user ID found');
        return;
      }
      
      // Make API call to create a new chat
      const response = await fetch(API_ENDPOINTS.SIDEBAR.NEW_CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create new chat');
      }

      const result = await response.json();
      
      if (!result.success || !result.chat_id) {
        throw new Error('Invalid response from server');
      }
      
      const newChat = {
        id: result.chat_id.id,
        title: result.chat_id.title,
        created_at: result.chat_id.created_at,
        updated_at: result.chat_id.updated_at
      };
      
      console.log('New chat created:', newChat);
      
      // Update the chats list by adding the new chat to the beginning
      setChats(prevChats => [newChat, ...prevChats]);
      
      // Store the chat ID as a string
      const chatId = String(newChat.id);
      storeChatId(chatId);
      setInternalSelectedChatId(chatId);
      
      // Notify parent component about the new chat selection
      if (onChatSelect) {
        onChatSelect(chatId);
      }
      
      // Force a refresh of the messages
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  }


  // State to track which chat's menu is open
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  // Refs
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // Toggle menu for a specific chat
  const handleMenuClick = (e, chatId) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === chatId ? null : chatId);
  };

  // Handle renaming a chat
  const handleRenameChat = async (e, chatId, currentTitle) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setNewChatTitle(currentTitle);
    setMenuOpen(null);
    // Focus the input after it's rendered
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  };

  const handleRenameSubmit = async (e, chatId) => {
    e.preventDefault();
    if (!newChatTitle.trim()) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.SIDEBAR.RENAME_CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          chat_id: Number(chatId),
          newName: newChatTitle.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to rename chat');
      }

      // Update the chat title in the local state
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId 
            ? { ...chat, title: newChatTitle.trim() } 
            : chat
        )
      );
      
    } catch (error) {
      console.error('Failed to rename chat:', error);
      // Optionally show an error message to the user
    } finally {
      setEditingChatId(null);
      setNewChatTitle('');
    }
  };

  // Handle chat deletion
  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();

    try {
      console.log("Chat ID to delete:", chatId);
      console.log("Chat object from state:", chats.find(chat => chat.id === chatId));
      
      // Ensure chatId is a number (matching the database type)
      const cleanChatId = Number(chatId);
      if (isNaN(cleanChatId)) {
        throw new Error('Invalid chat ID format');
      }
      console.log("Cleaned chat ID:", cleanChatId);

      const payload = {
        chat_id: cleanChatId  // Send as number
      };
      
      console.log("Sending payload:", payload);
      
      const response = await fetch(API_ENDPOINTS.SIDEBAR.DELETE_CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response data:", result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete chat');
      }
      
      if (result.success) {
        // If the deleted chat was selected, clear the selection
        if (internalSelectedChatId === String(chatId)) {
          setInternalSelectedChatId(null);
          storeChatId(null);
        }
        
        // Remove the chat from the list
        setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
        
        // If there are no more chats, create a new one
        if (chats.length === 1) { // If this is the last available chat to be deleted
          console.log('Last chat deleted, creating a new one');
          setInternalSelectedChatId(null);
          storeChatId(null);
          handleNewChat();
        } else {
          // Select another chat if available
          const newSelectedChat = chats.find(chat => chat.id !== chatId)?.id || null;
          if (newSelectedChat) {
            const newChatId = String(newSelectedChat);
            setInternalSelectedChatId(newChatId);
            storeChatId(newChatId);
            if (onChatSelect) {
              onChatSelect(newChatId);
            }
          } else {
            // If no chats left, clear the selection
            setInternalSelectedChatId(null);
            storeChatId(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    } finally {
      setMenuOpen(null);
    }
  };

  // Fetch chats when the sidebar is opened
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const userId = getUserId();
        if (!userId) {
          console.error('No user ID found');
          return;
        }

        // Call the API endpoint to get the user's chats
        const response = await fetch(`${API_BASE_URL}/api/sidebar/getChats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }),
        });

        const result = await response.json();
        console.log('API Response:', result);
        
        // Ensure we always set an array, even if the response is malformed
        if (result && Array.isArray(result.chats)) {
          setChats(result.chats);
        } else if (result && result.success && Array.isArray(result.data)) {
          // Handle case where data is in result.data
          setChats(result.data);
        } else {
          console.warn('Unexpected response format, defaulting to empty array');
          setChats([]);
        }
      } catch (error) {
        console.error('Failed to get chats:', error);
      }
    };

    fetchChats();
  }, []); // Empty dependency array means this runs once on mount









  // User info variables
  const [availableTokens, setAvailableTokens] = useState(null);
  const [allocatedTokens, setAllocatedTokens] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userInitials, setUserInitials] = useState(null);
  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState(null)

  // Get user info
  useEffect(() => {
    const getUserInfo = async () => {
      console.log('Fetching user info')
      const userId = getUserId();
      
      if (userId) {
        // Get the user's name
        const userName = localStorage.getItem('userName');
        console.log(`User's name:`, userName);
        setUserName(userName);

        // Get the user's initials
        const initials = userName
          .split(" ")          // split into words
          .map(word => word[0]) // take first letter of each
          .join("")            // join them
          .toUpperCase();      // make uppercase
        
        setUserInitials(initials);

        // Get the user's subscription plan that they're subscribed to
        try {
          console.log('Fetching subscription plan for user:', userId);
          const response = await fetch(`${API_BASE_URL}/api/user/handleGetSubscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ user_id: userId }),
          });
          
          const data = await response.json();
          console.log('Subscription plan response:', data);
          
          if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch subscription plan');
          }
          
          if (!data.success) {
            throw new Error(data.message || 'Failed to get subscription plan');
          }
          
          console.log(`User's subscription plan:`, data.subscription_plan);
          setUserSubscriptionPlan(data.subscription_plan || 'free');
        } catch (error) {
          console.error('Failed to get subscription plan:', error);
          // Set a default plan if the request fails
          setUserSubscriptionPlan('free');
        }

        // Get the total tokens used by the user and the total tokens allocated
        try {
          console.log('Fetching user tokens for user:', userId);
          const response = await fetch(`${API_BASE_URL}/api/user/handleGetUserTokens`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ user_id: userId }),
          });
          
          const data = await response.json();
          console.log('User tokens response:', data);
          
          if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch user tokens');
          }
          
          if (!data.success) {
            throw new Error(data.message || 'Failed to get user tokens');
          }
          
          console.log(`User's available tokens:`, data.available_tokens);
          console.log(`User's allocated tokens:`, data.allocated_tokens);
          setAvailableTokens(data.available_tokens);
          setAllocatedTokens(data.allocated_tokens);
        } catch (error) {
          console.error('Failed to get user tokens:', error);
        }
       


      } // Add an ELSE part
    }
    getUserInfo();
  }, []);


  return (
    <>
      <button 
        className={`sidebar-button ${isOpen ? 'open' : ''}`} 
        onClick={toggleSidebar}
      >
        <img 
          src="https://www.svgrepo.com/show/349874/sidebar.svg" 
          className="sidebar-button-svg"
          alt="Toggle sidebar"
        />
      </button>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        
        <div className="sidebar-content">
          <div className="sidebar-actions-container">
            {/* Add your sidebar content here */}
            <button className="sidebar-actions" onClick={handleNewChat}>
              <img src="https://www.svgrepo.com/show/456551/pencil-chat.svg" className="sidebar-actions-icons" />
              <p className="sidebar-actions-text">New chat</p>
            </button>
            <button className="sidebar-actions">
            <img src="https://www.svgrepo.com/show/356535/search-button.svg" className="sidebar-actions-icons" />
              <p className="sidebar-actions-text">Search chat</p></button>
            <button className="sidebar-actions">
              <img src="https://www.svgrepo.com/show/521658/feedback.svg" className="sidebar-actions-icons" />
              <p className="sidebar-actions-text">Notes</p></button>
            <button className="sidebar-actions">
            <img src="https://www.svgrepo.com/show/437146/photo-on-rectangle.svg" className="sidebar-actions-icons" />
              <p className="sidebar-actions-text">Library</p></button>
          </div>

          { /* Display all user chats */}
          <div className="chats-container">
            <p className="chats-title">Chats</p>
            {chats.length === 0 &&
            <div className='no-chats-found-container'>
              <p className="no-chats-found-label">No chats found</p>
            </div>
            }
            {Array.isArray(chats) && chats.map(chat => (
              <div key={chat.id} className="chat-button-wrapper">
                {editingChatId === chat.id ? (
                  <form 
                    className="chat-rename-form"
                    onSubmit={(e) => handleRenameSubmit(e, chat.id)}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={newChatTitle}
                      onChange={(e) => setNewChatTitle(e.target.value)}
                      onBlur={(e) => {
                        if (newChatTitle.trim()) {
                          handleRenameSubmit(e, chat.id);
                        } else {
                          setEditingChatId(null);
                        }
                      }}
                      className="chat-rename-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </form>
                ) : (
                  <button 
                    className={`chat-button ${internalSelectedChatId === String(chat.id) ? 'selected' : ''}`}
                    onClick={() => {
                      const chatId = String(chat.id);
                      setInternalSelectedChatId(chatId);
                      storeChatId(chatId);
                      if (onChatSelect) {
                        onChatSelect(chatId);
                      }
                    }}
                  >
                    <span className="chat-name">{chat.title}</span>
                    <button 
                      className="edit-chat-button"
                      onClick={(e) => handleMenuClick(e, chat.id)}
                    >
                      <img 
                        src="https://www.svgrepo.com/show/335225/ellipsis.svg" 
                        className="edit-chat-button-svg" 
                        alt="Menu"
                      />
                    </button>
                    {menuOpen === chat.id && (
                      <div className="chat-menu-dropdown" ref={menuRef}>
                        <button
                          className="chat-menu-item rename"
                          onClick={(e) => handleRenameChat(e, chat.id, chat.title)}
                        >
                          Rename Chat
                        </button>
                        <button 
                          className="chat-menu-item delete"
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                        >
                          Delete Chat
                        </button>
                      </div>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          { /* Display the user's token's consumption */ }
          <div className="user-tokens-container">
            <div className="token-progress-container">
              <div className="token-progress-labels">
                <span>Remaining Tokens</span>
          
              </div>
              <div className="token-progress-bar">
                <div 
                  className="token-progress-fill"
                  style={{
                    width: `${(availableTokens / allocatedTokens) * 100}%`,
                    background: availableTokens / allocatedTokens < 0.2 
                      ? 'linear-gradient(90deg, #ff6b6b, #ff8e8e)' 
                      : 'linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)'
                  }}
                />
              </div>
              <div className="token-info">
                {formatTokens(availableTokens)} / {formatTokens(allocatedTokens)} tokens remaining
              </div>
            </div>
          </div>

          { /* Display user info */ }
          <div className="user-profile-container">
            <div className="user-profile-circle">
              <p className="initials">{userInitials}</p>
            </div>
            <div className="user-profile-info">
              <p className="user-profile-name">{userName}</p>
              <p className="user-subscription-plan">{userSubscriptionPlan}</p>
            </div>

            <button className="user-actions-button">
            <img 
              src="https://www.svgrepo.com/show/335225/ellipsis.svg" 
              className="user-actions-button-svg" 
            />
            </button>
          </div>
        </div>
      
      
      </div>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar} />
    </>
  );
};

export default Sidebar;
