import React, { useState, useEffect, useRef } from 'react';
import './Sidebar.css';
import { getUserId, storeChatId, getChatId } from '../utils/storage';
import { createChat, getChats, deleteChat, updateChatTitle, getUserName, getSubscriptionPlan } from './sidebarOperations';

const Sidebar = ({ onChatSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  

  const toggleSidebar = (e) => {
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
      const newChat = await createChat(userId);
      console.log('New chat created:', newChat);
      
      if (!newChat || !newChat.id) {
        throw new Error('Failed to create new chat');
      }
      
      // Update the chats list
      const updatedChats = await getChats(userId);
      setChats(updatedChats);
      
      // Update the selected chat ID in local storage and state
      storeChatId(newChat.id);
      setSelectedChatId(newChat.id);
      
      // Notify parent component about the new chat selection
      if (onChatSelect) {
        onChatSelect(newChat.id);
      }
      
      // Force a refresh of the messages
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  }

  // DELETE CHAT SECTION
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
      await updateChatTitle(chatId, newChatTitle.trim());
      const userId = getUserId();
      const updatedChats = await getChats(userId);
      setChats(updatedChats);
    } catch (error) {
      console.error('Failed to rename chat:', error);
    } finally {
      setEditingChatId(null);
      setNewChatTitle('');
    }
  };

  // Handle chat deletion
  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    try {
      // Get the index of the chat to delete
      const oldChats = [...chats];
      const deletedIndex = chats.findIndex(c => c.id === chatId);

      await deleteChat(chatId);
      const userId = getUserId();
      const updatedChats = await getChats(userId);
      setChats(updatedChats);
      if (selectedChatId === chatId) {   // Check if we're deleting the currently selected chat
        console.log('Chats to choose from NOW:', chats)

        let newSelectedChat = null;
        
        if (chats.length === 1) { // If this is the last available chat to be deletd
          console.log('Path 1')
          setSelectedChatId(null);
          storeChatId(null)

          // Create a new chat
          handleNewChat();
        } else {
          console.log('Path 2')
          console.log("Old chats", oldChats)
          console.log("Deleted index", deletedIndex)
          newSelectedChat = oldChats[deletedIndex - 1]?.id;
          if (newSelectedChat === undefined) {
            newSelectedChat = oldChats[deletedIndex + 1]?.id;
          }
          console.log('New selected chat:', newSelectedChat)
          setSelectedChatId(newSelectedChat);
          storeChatId(newSelectedChat)
          onChatSelect(newSelectedChat);
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
        const userChats = await getChats(userId);
        setChats(userChats || []);
        console.log('User chats:', userChats);
        
      } catch (error) {
        console.error('Failed to get chats:', error);
      }
    };

    fetchChats();
  }, []); // Empty dependency array means this runs once on mount


  // User info variables
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
        const userName = await getUserName(userId)
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
        const subscriptionPlan = await getSubscriptionPlan(userId);
        setUserSubscriptionPlan(subscriptionPlan);



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
            {chats.map(chat => (
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
                    className={`chat-button ${selectedChatId === chat.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedChatId(chat.id);
                      storeChatId(chat.id);
                      if (onChatSelect) {
                        onChatSelect(chat.id);
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
