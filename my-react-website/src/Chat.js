import './Chat.css';
import React, { useState, useEffect, useRef } from "react";
import { checkSession } from './auth/auth';
import { saveUserId, getUserId, removeUserId } from './utils/storage';
import { getUserName } from './auth/auth';
import Conversation from './Conversation';
import { useNavigate } from "react-router-dom";
import { supabase } from './auth/supabaseClient';
import { createChat } from './components/sidebarOperations';
import { enhancePrompt } from './server';
import { storePrompt } from './server';
import { contactAI } from './server';
import { generateJointAnswer } from './server';
import { storeResponses } from './server';
import { storeTokensUsedPerResponse } from './server';
import { getChatId, storeChatId } from './utils/storage';
import Sidebar from './components/Sidebar';
import { Logout } from './auth/auth';
import LogoutConfirmation from './components/LogoutConfirmation';



function Chat() {
  const [userId, setUserId] = useState('')
  const [initials, setInitials] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(Date.now())
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Refs for clicking outside drop down menus
  const wrapperRef = useRef(null);
  const moreMenuRef = useRef(null);
  const modelDropdownRef = useRef(null);
  

  // Check if the user is already logged in when component mounts ~ For automatic logins
  useEffect(() => {
    const checkUserSession = async () => {
      const userId = await checkSession();
      console.log("User ID from checkSession:", userId);
      
      if (userId) {
        console.log("User is logged in with ID:", userId);
        // Store the user's id in the local storage for future use.
        saveUserId(userId);
        setUserId(userId)
        const initials = await getUserName(userId, 'Initials')
        setInitials(initials)
      } else {
        console.log("No active user session found");
        // Clear any existing user ID from storage if session is invalid
        removeUserId();
      }
    };
    
    checkUserSession();
  }, []);

  // Load last saved chat when the page loads
  useEffect(() => {
    const loadLastChat = async () => {
      console.log("START - Page loaded")
      const chatId = getChatId();
      if (chatId) {
        setSelectedChatId(chatId);
        handleDisplayMessages(chatId);
      }
    };
    loadLastChat();
  }, []);


  // Handle user logout & more (ONLY IF USER IS LOGGED IN) - It's a dropdown menu toggler
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    // Close more menu when opening user menu and vice versa
    if (showMoreMenu) setShowMoreMenu(false);
  }
  const handleLogout = async () => {
    try {
      await Logout();
      navigate('/auth/LoginPage');
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Optionally show error to user
    }
  }

  // Handle clicks outside of menus and popups
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close more menu when clicking outside
      if (moreMenuRef.current && 
          !moreMenuRef.current.contains(e.target) && 
          !e.target.closest('.more-actions-button')) {
        setShowMoreMenu(false);
      }
      
      // Close user menu when clicking outside
      if (showUserMenu && 
          !e.target.closest('.user-button') &&
          !e.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
      
      // Close model dropdown when clicking outside
      if (showModelDropdown && 
          modelDropdownRef.current && 
          !modelDropdownRef.current.contains(e.target) &&
          !e.target.closest('.model-select-button')) {
        setShowModelDropdown(false);
      }
      
      // Close logout confirmation when clicking outside
      if (showLogoutConfirm && 
          !e.target.closest('.popup-content') && 
          !e.target.closest('.user-menu-item.delete')) {
        setShowLogoutConfirm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showModelDropdown, showLogoutConfirm]);

  const toggleMoreMenu = () => {
    setShowMoreMenu(!showMoreMenu);
    // Close user menu when opening more menu and vice versa
    if (showUserMenu) setShowUserMenu(false);
  }


  // Navigation
  const navigate = useNavigate();

  const [selectedModels, setSelectedModels] = useState(['ChatGPT-4.1', 'DeepSeek-V3']);
  const [collaborate, setCollaborate] = useState(false);

  const [conversation, setConversation] = useState([])
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const textareaRef = useRef(null);
  
  // Auto-resize textarea and container based on content
  const autoResize = (element) => {
    // Reset heights to get accurate scrollHeight
    element.style.height = 'auto';
    const container = element.closest('.input-container');
    const messageContainer = container?.closest('.message-container');
    
    // Calculate new heights
    const newHeight = Math.min(element.scrollHeight, 300);
    const containerPadding = 12; 
    const totalHeight = newHeight + containerPadding;
    
    // Apply new heights
    element.style.height = `${newHeight}px`;
    if (container) {
      container.style.minHeight = `${totalHeight}px`;
      
      // Adjust message container height and position
      if (messageContainer) {
        // Set the message container's min-height to match the input container
        messageContainer.style.minHeight = `${totalHeight + 60}px`; // Add some margin
        const maxContainerHeight = 400; // Match the max-height from CSS
        const translateY = Math.max(0, totalHeight - maxContainerHeight);
        messageContainer.style.transform = `translate(-50%, -${translateY}px)`;
      }
    }
  };
  
  // Handle textarea changes
  const handleTextareaChange = (e) => {
    setPrompt(e.target.value);
    const container = e.target.closest('.input-container');
    const messageContainer = container?.closest('.message-container');
    
    // Always call autoResize to maintain consistent height
    autoResize(e.target);
  };
  
  // Initial adjustment and on window resize
  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
    
    const handleResize = () => {
      if (textareaRef.current) {
        autoResize(textareaRef.current);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [response, setResponse] = useState('')

  
  const models = [
    {name: 'ChatGPT-4.1', logo: 'https://pngimg.com/d/chatgpt_PNG1.png'},
    {name: 'DeepSeek-V3', logo: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png'},
    {name: 'Llama 3.3 70B Instruct', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg/2560px-Meta_Platforms_Inc._logo_%28cropped%29.svg.png'},
    {name: 'ChatGPT-5', logo: 'https://pngimg.com/d/chatgpt_PNG1.png'},
    {name: 'ChatGPT-5 Mini', logo: 'https://pngimg.com/d/chatgpt_PNG1.png'},
  ];
  
  // Handles the dropdown of the modes selector
  const toggleModelDropdown = () => {
    setShowModelDropdown(!showModelDropdown);
    // Close other menus when opening model dropdown
    if (showUserMenu) setShowUserMenu(false);
    if (showMoreMenu) setShowMoreMenu(false);
  };

  const handleModelSelect = (model) => {
    if (selectedModels.includes(model)) {  // If model is already selected, remove it
      setSelectedModels(selectedModels.filter(m => m !== model));
    } else {
      setSelectedModels([...selectedModels, model]);
    }
    console.log(model)
  };
  const handleRemove = (model) => {
    setSelectedModels(selectedModels.filter(m => m !== model));
  }

  const handleCollaborateChange = (e) => {
    setCollaborate(e.target.checked)
  }

  // Handles the display of the messages between the user and AI for a specific chat
  const handleDisplayMessages = (chatId) => {
    console.log('Displaying messages for chat ID:', chatId);
    if (chatId) {
      setSelectedChatId(chatId);
      storeChatId(chatId);
      setLastUpdated(Date.now()); // Trigger refresh
    } else {
      console.log('No chat ID provided to handleDisplayMessages');
    }
  }


  const handleEnhancePrompt = async() => {
    if (!prompt.trim() || isEnhancing) return;
    
    setIsEnhancing(true);
    try {
      const enhancedPrompt = await enhancePrompt(prompt);
      setPrompt(enhancedPrompt);
    } catch (error) {
      console.error('Error enhancing prompt:', error);
    } finally {
      setIsEnhancing(false);
    }
  }


  // Handle the chat operation when the user clicks on the send button
  const handleChatOperation = async () => {
    if (!prompt.trim()) return; // Don't send empty messages
    
    setIsGeneratingResponse(true);
    try {
      let chatId = selectedChatId || getChatId();
      console.log("Current chat ID:", chatId);
      
      if (!chatId) {
        console.log('No chat ID found, creating a new chat...');
        const newChat = await createChat(userId);
        chatId = newChat.id;
        console.log("New chat created with ID:", chatId);
        
        // Update the selected chat ID in state and storage
        setSelectedChatId(chatId);
        storeChatId(chatId);
        
        // Wait for the state to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('Using chat ID:', chatId);
      const prompt_id = await storePrompt(prompt, chatId);
      
      // Store the prompt in a variable before clearing the input
      const prompt_to_answer = prompt;
      setPrompt(''); // Clear the input field
      
      // Trigger a refresh to show the user's message
      setLastUpdated(Date.now());
      
      // Wait for the UI to update before sending to AI
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const responsesAndTokens = await contactAI(selectedModels, prompt_to_answer, chatId);
      const responses = responsesAndTokens[0];
      const tokensUsed = responsesAndTokens[1];

      console.log('Responses & Tokens used', responsesAndTokens)
      
      await storeResponses(chatId, prompt_id, selectedModels, responses, tokensUsed);

      // If the user wants all the chosen models to colaborate
      if (collaborate) {   
        const jointAnswer = await generateJointAnswer(prompt_id, responses, chatId);
        console.log("Joint answer:", jointAnswer)
      }
      
      // Final refresh to show AI responses
      setLastUpdated(Date.now());
      
    } catch (error) {
      console.error('Error in handleChatOperation:', error);
    } finally {
      setIsGeneratingResponse(false);
    }  
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // prevent newline if using textarea
      handleChatOperation();
      setPrompt(""); // clear input
    }
    console.log("KEYDOWN IS BEING HANDLED")
  }
  

  return (
    <div className="main-container" ref={wrapperRef}>
      <Sidebar onChatSelect={(chatId) => {
        console.log('User ID::', userId) 
        setSelectedChatId(chatId);
        handleDisplayMessages(chatId);
      }} />
      
      <div className="header-actions">
        <button className="more-actions-button" onClick={toggleMoreMenu}>
          <img 
            src="https://www.svgrepo.com/show/335225/ellipsis.svg" 
            className="edit-chat-button-svg" 
            alt="Menu"
          />
          {showMoreMenu && (
            <div className="more-actions-menu" ref={moreMenuRef}>
              <button className="more-actions-menu-item">
                <img className='report-icon'src="https://static.thenounproject.com/png/1045119-200.png"/>
                <p className="report-text">Report</p>
              </button>
            </div>
          )}
        </button>

        { /* Check if the user is logged in... */}
        {!userId ? (
          <>
          <button className="login-button" onClick={() => navigate("/auth/LoginPage")}>
            Log in
          </button>
          <button className="signup-button">Sign up for free!</button>
          </>
        ) : (
          <div style={{ position: 'relative' }}>
            <button className="user-button" onClick={toggleUserMenu}>
              { /* Adjust initials font size depending on the length of the initials */ }
              { initials.length === 1 ? (
                <p className="initial">{initials}</p>
              ) : (
                <p className="initials">{initials}</p>
              )}
            </button>
            {showUserMenu && (
              <div className="user-menu">
                <button className="user-menu-item">Profile</button>
                <button className="user-menu-item">Settings</button>
                <button className="user-menu-item delete" onClick={() => setShowLogoutConfirm(true)}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>

    

      {/* Display conversation */}
      <Conversation 
        selectedChatId={selectedChatId} 
        lastUpdated={lastUpdated} 
        conversation={conversation}
        isLoading={isGeneratingResponse}
        selectedModels={selectedModels}
      />

      <div className="message-container">
        <div className="input-container">  { /* Container for the text-input, attach files, voice input */ }
          <textarea
            ref={textareaRef}
            className="text-input"
            placeholder="Ask anything..."
            value={prompt}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows="1"
          />
          <button 
            className={`improve-prompt-button ${isEnhancing ? 'loading' : ''} ${!prompt.trim() ? 'disabled' : ''}`} 
            onClick={handleEnhancePrompt}
            disabled={isEnhancing || !prompt.trim()}
            title='Enhance prompt'
          >
            {isEnhancing ? (
              <div className="loading-spinner"></div>
            ) : (
              <img 
                src="https://img.icons8.com/fluent/200/bard.png" 
                className="improve-prompt-button-icon" 
                alt="Enhance prompt"
              />
            )}
          </button>
          <button className="attach-files-button">+</button> { /* Attach Files Button */ }
        </div>
        
        <div className='second-container'> { /* This container holds the customization controls & the 'Send' button*/}
          <div className="customization-controls">
            <div className="dropdown-container">
              
              { /* Select Model Button - Dropdown menu */}
              <button className="model-select-button"onClick={toggleModelDropdown}>
                <img className="arrow-up" src="https://cdn-icons-png.flaticon.com/512/156/156318.png"></img>
                {selectedModels.map((modell, index) => {
                  const model = models.find(m => m.name === modell);
                  return (
                    <div className="selected-models-logos">
                      <div className="model-logo-container">
                        <img src={model?.logo} className="selected-model-logo"></img>
                      </div>
                    </div>
                  )
                })}
                
              </button>
              {showModelDropdown && (
                <div className="dropdown-menu" ref={modelDropdownRef}>
                  <div className="model-search-container">
                    <input className="models-search-bar" type="text" placeholder='Search models...'></input>
                  </div>
                  <text className='dropdown-text'>Testing models</text>
                  <div 
                    className={`dropdown-item ${selectedModels.includes('ChatGPT-4.1') ? 'selected' : ''}`} 
                    onClick={() => handleModelSelect('ChatGPT-4.1')}
                  >
                    <img src="https://pngimg.com/d/chatgpt_PNG1.png" className="select-model-logo"></img>
                    ChatGPT-4.1
                  </div>
                  <div 
                    className={`dropdown-item ${selectedModels.includes('DeepSeek-V3') ? 'selected' : ''}`} 
                    onClick={() => handleModelSelect('DeepSeek-V3')}
                  >
                    <img src="https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png" className="select-model-logo"></img>
                    DeepSeek-V3
                  </div>
                  <div 
                    className={`dropdown-item ${selectedModels.includes('Llama 3.3 70B Instruct') ? 'selected' : ''}`} 
                    onClick={() => handleModelSelect('Llama 3.3 70B Instruct')}
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg/2560px-Meta_Platforms_Inc._logo_%28cropped%29.svg.png" className="select-model-logo"></img>
                    Llama 3.3 70B Instruct
                  </div>
                  <div className="models-class-seperator"></div>
                  {/* Premium models */}
                  <text className="dropdown-text">Premium models</text>
                  <div 
                    className={`dropdown-item ${selectedModels.includes('ChatGPT-5') ? 'selected' : ''}`} 
                    onClick={() => handleModelSelect('ChatGPT-5')}
                  >
                    <img src="https://pngimg.com/d/chatgpt_PNG1.png" className="select-model-logo"></img>
                    ChatGPT-5
                  </div>
                  <div 
                    className={`dropdown-item ${selectedModels.includes('ChatGPT-5 Mini') ? 'selected' : ''}`} 
                    onClick={() => handleModelSelect('ChatGPT-5 Mini')}
                  >
                    <img src="https://pngimg.com/d/chatgpt_PNG1.png" className="select-model-logo"></img>
                    ChatGPT-5 Mini
                  </div>
                </div>
              )}
            </div>

            { /* Collaborate option */ }
            <div className="collaborate-container">
              <span className="collaborate-label">Collaborate?</span>
              <label className="switch">
                <input type="checkbox" onChange={handleCollaborateChange}/>
                <span className="slider round"></span>
              </label>
            </div>

            { /* "Send prompt" button */ }
          <button className="send-button" onClick={handleChatOperation}>
            <svg xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20"
              className="send-button-svg"
            >
                <path xmlns="http://www.w3.org/2000/svg" d="M2.25 15V3L16.5 9L2.25 15ZM3.75 12.75L12.6375 9L3.75 5.25V7.875L8.25 9L3.75 10.125V12.75ZM3.75 12.75V9V5.25V7.875V10.125V12.75Z" fill="white"/>
            </svg>
          </button>

          </div>

          
        </div>
      </div>

      { /* Warning message */ }
      <p className="warning-message">Promptly can make mistakes. Check important info.</p>
      
      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <LogoutConfirmation 
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}

export default Chat;
