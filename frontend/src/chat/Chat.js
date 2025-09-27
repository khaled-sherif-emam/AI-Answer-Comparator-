import { API_ENDPOINTS, API_CONFIG } from '../config/api';
import { getInitials } from '../chat/chatOperations';
import './Chat.css';
import React, { useState, useEffect, useRef } from "react";
import { saveUserId, getUserId, removeUserId, removeChatId } from '../utils/storage';
import WelcomePopup from '../components/WelcomePopup';
import { storeGuestId, getGuestId, removeGuestId, hasGuestId } from '../utils/storage';
import Conversation from './Conversation';
import { useNavigate } from "react-router-dom";
import { deductTokens, deductGuestTokens } from '../server';
import { getChatId, storeChatId } from '../utils/storage';
import Sidebar from '../components/Sidebar';
import LogoutConfirmation from '../components/LogoutConfirmation';



function Chat() {
  const [userId, setUserId] = useState('')
  const [guestId, setGuestId] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [user_name, setUserName] = useState('')
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
      console.log("Checking session...");
      
      try {
        // Check if the user is logged in
        const currentUserId = getUserId();
        
        if (currentUserId) {
          removeGuestId(); // Remove guest id if there is one
          console.log("User is logged in:", currentUserId);
          setUserId(currentUserId);  // Set the user ID in state
          saveUserId(currentUserId);  // Save the user ID to localStorage

          try {
            // Get user's name
            const user_info_response = await fetch(API_ENDPOINTS.AUTH.USER_NAME, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ user_id: currentUserId })
            });
            
            if (!user_info_response.ok) {
              throw new Error(`HTTP error! status: ${user_info_response.status}`);
            }
            
            const user_info_data = await user_info_response.json();
            
            if (user_info_data && user_info_data.success) {
              console.log("User name has been successfully fetched:", user_info_data);
              setUserName(user_info_data.name);
              // Store user name in local storage
              localStorage.setItem('userName', user_info_data.name);
              // Generate initials for the user's name
              setInitials(getInitials(user_info_data.name));
            } else {
              console.log("Couldn't fetch the user's name:", user_info_data?.message || 'Unknown error');
            }
          } catch (error) {
            console.error("Error fetching user's name:", error);
          }
        } else {
          console.log("User is not logged in");

          // Check if the user is a guest
          if (hasGuestId()) {
            console.log("User is a guest");
            setGuestId(getGuestId());
          } else {
            // Create a guest Id
            const response = await fetch(API_ENDPOINTS.AUTH.CREATE_GUEST, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const guest = await response.json();
            
            if (guest && guest.success) {
              console.log("Guest has been successfully created:", guest);
              const guestId = guest.guest?.guestId || guest.guestId;
              console.log('Extracted guestId:', guestId);
              storeGuestId(guestId);
              setGuestId(guestId);
              setShowWelcomePopup(true);
            } else {
              console.log("Couldn't create guest:", guest?.message || 'Unknown error');
            }
          }

        }

      } catch (error) {
        console.error(`Error fetching the user's name:`, error);
      }
    }
    
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
      } else {
        console.log("No chat ID found")
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
      // Clear user ID and chat ID from local storage
      removeUserId();
      removeChatId();
      
      // Navigate to login page
      navigate('/authentication/LoginPage');
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
  const [searchQuery, setSearchQuery] = useState('');

  const [conversation, setConversation] = useState([])
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const textareaRef = useRef(null);
  
  // Reset textarea height when prompt is cleared
  useEffect(() => {
    if (!prompt && textareaRef.current) {
      console.log('Resetting textarea height');
      const textarea = textareaRef.current;
      textarea.style.height = '24px';
      textarea.style.minHeight = '24px';
      
      // Log computed styles for debugging
      const styles = window.getComputedStyle(textarea);
      console.log('Current textarea styles:', {
        height: styles.height,
        minHeight: styles.minHeight,
        maxHeight: styles.maxHeight,
        overflowY: styles.overflowY
      });
    }
  }, [prompt]);
  
  
  // Auto-resize textarea and container based on content
  const autoResize = (element) => {
    if (!element) return;
    
    // If textarea is empty, reset to initial height
    if (!element.value) {
      element.style.height = '38px';
      element.style.minHeight = '38px';
      
      const container = element.closest('.input-container');
      if (container) {
        container.style.height = '56px';
        container.style.minHeight = '56px';
      }
      
      const messageContainer = container?.closest('.message-container');
      if (messageContainer) {
        messageContainer.style.height = '112px';
        messageContainer.style.minHeight = '112px';
        messageContainer.style.transform = 'translate(-50%, 0)';
      }
      return;
    }
    
    // For non-empty textarea, calculate new height
    element.style.height = 'auto';
    const container = element.closest('.input-container');
    const messageContainer = container?.closest('.message-container');
    
    const newHeight = Math.min(element.scrollHeight, 300);
    const containerPadding = 12; 
    const totalHeight = newHeight + containerPadding;
    
    // Set the new height for the textarea
    element.style.height = `${newHeight}px`;
    
    // Adjust container height if it exists
    if (container) {
      container.style.minHeight = `${totalHeight}px`;
    }
    
    // Adjust message container height and position
    if (messageContainer) {
      messageContainer.style.minHeight = `${totalHeight + 60}px`;
      const maxContainerHeight = 400;
      const translateY = Math.max(0, totalHeight - maxContainerHeight);
      messageContainer.style.transform = `translate(-50%, -${translateY}px)`;
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
    {name: 'Claude Opus 4.1', logo: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/claude-color.png'},
    {name: 'Google Gemini 2.5 Pro', logo: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Gemini_SparkIcon_.width-500.format-webp.webp'},
    {name: 'DeepSeek-V3', logo: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png'},
    {name: 'Claude Sonnet 3.7', logo: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/claude-color.png'},
    {name: 'Claude Haiku 3', logo: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/claude-color.png'},
    {name: 'Google Gemini 2.5 Flash', logo: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Gemini_SparkIcon_.width-500.format-webp.webp'},
  ];

  const testingModels = [
    {name: 'ChatGPT-4.1', logo: 'https://pngimg.com/d/chatgpt_PNG1.png'},
    {name: 'DeepSeek-V3', logo: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png'},
    {name: 'Llama 3.3 70B Instruct', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg/2560px-Meta_Platforms_Inc._logo_%28cropped%29.svg.png'},
  ]
  const premiumModels = [
    {name: 'ChatGPT-5', logo: 'https://pngimg.com/d/chatgpt_PNG1.png'},
    {name: 'Claude Opus 4.1', logo: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/claude-color.png'},
    {name: 'Google Gemini 2.5 Pro', logo: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Gemini_SparkIcon_.width-500.format-webp.webp'},
    {name: 'DeepSeek-V3', logo: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png'},
  ]
  const tokenEfficientModels = [
    {name: 'ChatGPT-5 Mini', logo: 'https://pngimg.com/d/chatgpt_PNG1.png'},
    {name: 'Claude Sonnet 3.7', logo: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/claude-color.png'},
    {name: 'Claude Haiku 3', logo: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/claude-color.png'},
    {name: 'Google Gemini 2.5 Flash', logo: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Gemini_SparkIcon_.width-500.format-webp.webp'},
  ]
  
  // Handles the dropdown of the modes selector
  const toggleModelDropdown = () => {
    const newState = !showModelDropdown;
    setShowModelDropdown(newState);
    if (newState) {
      setSearchQuery('');
    }
    // Close other menus when opening model dropdown
    if (showUserMenu) setShowUserMenu(false);
    if (showMoreMenu) setShowMoreMenu(false);
  };

  const handleModelSelect = (model) => {
    if (selectedModels.includes(model)) {
      setSelectedModels(selectedModels.filter(m => m !== model));
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };

  const filterModels = (models) => {
    if (!searchQuery.trim()) return models;
    const query = searchQuery.toLowerCase();
    return models.filter(model => 
      model.name.toLowerCase().includes(query) ||
      model.name.toLowerCase().replace(/\s+/g, '').includes(query)
    );
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
      const response = await fetch(API_ENDPOINTS.CHAT.ENHANCE_PROMPT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          user_id: getChatId()
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data && data.success) {
        setPrompt(data.enhanced_prompt);
      } else {
        throw new Error(data?.error || 'Failed to enhance prompt');
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
    } finally {
      setIsEnhancing(false);
    }
  }


  // Handle the chat operation when the user clicks on the send button
  const handleChatOperation = async () => {

    if (!userId) {
      handleGuestChatOperation();
      return;
    }

    if (!prompt.trim()) return; // Don't send empty messages
    
    setIsGeneratingResponse(prevState => true);
    try {
      let chatId = selectedChatId || getChatId();
      console.log("Current chat ID:", chatId);
      
      if (!chatId) {
        console.log('No chat ID found, creating a new chat...');
        // Continue this later... If necessary
      }
      
      console.log('Using chat ID:', chatId);
      const prompt_info_response = await fetch(API_ENDPOINTS.CHAT.STORE_PROMPT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          chat_id: chatId,
          selectedModels,
        }),
      });
      
      const prompt_info = await prompt_info_response.json();
      const prompt_id = prompt_info.prompt_id;
      console.log('Prompt ID:', prompt_id);

      
      // Store the prompt in a variable before clearing the input
      const prompt_to_answer = prompt;
      
      // Store the textarea and container references
      const textarea = textareaRef.current;
      const container = textarea?.closest('.input-container');
      const messageContainer = container?.closest('.message-container');
      
      // Clear the input field
      setPrompt('');
      
      // Reset textarea to initial state
      if (textarea) {
        // Reset textarea styles
        textarea.style.height = '38px';
        textarea.style.minHeight = '38px';
        
        // Reset container heights if they exist
        if (container) {
          container.style.height = '56px';
          container.style.minHeight = '56px';
          void container.offsetHeight; // Force reflow
        }
        
        if (messageContainer) {
          messageContainer.style.height = '112px';
          messageContainer.style.minHeight = '112px';
          messageContainer.style.transform = 'translate(-50%, 0)';
          void messageContainer.offsetHeight; // Force reflow
        }
        
        console.log('Textarea reset to height:', textarea.offsetHeight);
      }
      
      // Trigger a refresh to show the user's message
      setLastUpdated(Date.now());
      
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Send prompt to the selected AI models through the ContactAI() function
      console.log('Sending request to:', API_ENDPOINTS.CHAT.CONTACT_AI);
      console.log('Selected models:', selectedModels);
      console.log('Prompt:', prompt);
      console.log('Chat ID:', chatId);
      
      let responses = [];
      let tokensUsed = [];
      let AIResponses;
      
      try {
        AIResponses = await fetch(API_ENDPOINTS.CHAT.CONTACT_AI, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedModels,
            prompt,
            chat_id: chatId,
          }),
        });

        if (!AIResponses.ok) {
          const errorText = await AIResponses.text();
          throw new Error(`HTTP error! status: ${AIResponses.status}, ${errorText}`);
        }

        const responseData = await AIResponses.json();
        
        if (!responseData || !responseData.success) {
          console.error('Error response from server:', responseData);
          throw new Error(responseData?.message || 'Failed to get AI responses');
        }

        // Update responses and tokens from the response
        responses = responseData.response?.responses || [];
        tokensUsed = responseData.response?.tokensUsed || [];

        console.log('AI Responses:', responses);
        console.log('Tokens Used:', tokensUsed);
        
        if (responses.length === 0) {
          throw new Error('No responses were generated by any AI models');
        }
      } catch (error) {
        console.error('Error in AI response generation:', error);
        throw error; // Re-throw to be caught by the outer try-catch
      }
      
      // Store the AI responses in the database
      const storeResponsesResponse = await fetch(API_ENDPOINTS.CHAT.STORE_RESPONSES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          prompt_id: prompt_id,
          selectedModels: selectedModels,
          responses: responses,
          tokens_used: tokensUsed,
        }),
      })

      const storeResponsesData = await storeResponsesResponse.json();
      console.log('Store responses data:', storeResponsesData);

      if (!storeResponsesData.success) {
        throw new Error(storeResponsesData.message || 'Failed to store responses');
      }

      // TODO: implement joint answer

      // Deduct the tokens used from the user's balance
      console.log("Tokens to deduct:", tokensUsed[0])
      deductTokens(tokensUsed[0], userId)
      
      // Final refresh to show AI responses
      setLastUpdated(Date.now());
      
    } catch (error) {
      console.error('Error in handleChatOperation:', error);
    } finally {
      setIsGeneratingResponse(false);
    }  
  }


  // If guest, handle guest chat operation in this function
  const handleGuestChatOperation = async () => {
    if (!prompt.trim()) return; // Don't send empty messages
    
    setIsGeneratingResponse(prevState => true);

    console.log('Storing prompt for guest');

    try {
      // Store the guests prompt in the guest_prompts table
      const storeGuestPromptResponse = await fetch(API_ENDPOINTS.GUEST_CHAT.STORE_GUEST_PROMPT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guest_id: guestId,
          prompt: prompt,
          selected_models: selectedModels,
        }),
      });
      
      const storeGuestPromptData = await storeGuestPromptResponse.json();
      console.log('Store guest prompt data:', storeGuestPromptData);
      
      if (!storeGuestPromptData.success) {
        throw new Error(storeGuestPromptData.message || 'Failed to store guest prompt');
      }

      // Get the prompt id of the prompt from the response
      const prompt_id = storeGuestPromptData.data.prompt_id;
      console.log("Prompt ID:", prompt_id)
      console.log("Prompt to answer:", prompt)

      // Store the prompt in a variable before clearing the input
      const prompt_to_answer = prompt;
      
      // Store the textarea and container references
      const textarea = textareaRef.current;
      const container = textarea?.closest('.input-container');
      const messageContainer = container?.closest('.message-container');
      
      // Clear the input field
      setPrompt('');
      
      // Reset textarea to initial state
      if (textarea) {
        // Reset textarea styles
        textarea.style.height = '38px';
        textarea.style.minHeight = '38px';
        
        // Reset container heights if they exist
        if (container) {
          container.style.height = '56px';
          container.style.minHeight = '56px';
          void container.offsetHeight; // Force reflow
        }
        
        if (messageContainer) {
          messageContainer.style.height = '112px';
          messageContainer.style.minHeight = '112px';
          messageContainer.style.transform = 'translate(-50%, 0)';
          void messageContainer.offsetHeight; // Force reflow
        }
        
        console.log('Textarea reset to height:', textarea.offsetHeight);
      }
      
      // Trigger a refresh to show the user's message
      setLastUpdated(Date.now());
      
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Contact AI to get responses
      console.log('Sending request to CONTACT_AI endpoint:', {
        url: API_ENDPOINTS.GUEST_CHAT.CONTACT_AI,
        guest_id: guestId,
        prompt_to_answer: prompt_to_answer, // Use the saved prompt variable
        selected_models: selectedModels
      });
      
      const contactAIResponse = await fetch(API_ENDPOINTS.GUEST_CHAT.CONTACT_AI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guest_id: guestId,
          prompt_to_answer: prompt_to_answer, // Use the saved prompt variable
          selected_models: selectedModels,
        }),
      });
      
      const contactAIData = await contactAIResponse.json();
      console.log('Contact AI response status:', contactAIResponse.status);
      console.log('Contact AI response data:', contactAIData);
      
      if (!contactAIData.success) {
        console.error('Error in CONTACT_AI response:', contactAIData);
        throw new Error(contactAIData.message || 'Failed to contact AI');
      }
      console.log("Contact AI response:", contactAIData);
      const responses = contactAIData.data.response.responses;
      const AIresponses = responses.map(item => item.response);
      const tokens_used = contactAIData.data.response.tokensUsed;
      console.log("Contact AI response responses:", AIresponses);
      console.log("Contact AI response tokens used:", tokens_used);


      // Store each AI response in the database
      if (AIresponses && AIresponses.length > 0) {
        console.log("Starting to store responses...");
        try {
          // Create models_used array that matches each response with its corresponding model
          const models_used = responses.map((item, index) => {
            // Get the model name for this response
            return item.model || (selectedModels[index] || selectedModels[0]);
          });
          
          console.log('Models used for responses:', models_used);
          
          const storeResponsesResponse = await fetch(API_ENDPOINTS.GUEST_CHAT.STORE_GUEST_RESPONSE, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...API_CONFIG.headers
            },
            body: JSON.stringify({
              guest_id: guestId,
              models_used: models_used,
              responses: AIresponses,
              tokens_used: tokens_used.map(t => t.tokens || t) // Handle both formats
            }),
          })
          
          console.log('All responses stored successfully');
          
          // Refresh the conversation to show the new messages
          setLastUpdated(Date.now());

          // Deduct the tokens used
          deductGuestTokens(tokens_used, guestId);
          
        } catch (error) {
          console.error('Error storing guest responses:', error);
        }
      }
      
    } catch (error) {
      console.error('Error in handleGuestChatOperation:', error);
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
      <Sidebar 
        selectedChatId={selectedChatId}
        onChatSelect={(chatId) => {
          console.log('Chat selected:', chatId);
          setSelectedChatId(chatId);
          handleDisplayMessages(chatId);
      }} />
      
      <div className="header-actions">
        {userId && (
          <button className="more-actions-button" onClick={toggleMoreMenu}>
            <img 
              src="https://www.svgrepo.com/show/335225/ellipsis.svg" 
              className="edit-chat-button-svg" 
              alt="More actions"
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
        )}

        { /* Check if the user is logged in... */}
        { hasGuestId() ? (
          <>
          <button className="login-direct-button" onClick={() => navigate("/authentication/LoginPage")}>
            Log in
          </button>
          <button className="signup-direct-button" onClick={() => navigate("/authentication/SignupPage")}>Sign up for free!</button>
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
                    <input 
                      className="models-search-bar" 
                      type="text" 
                      placeholder='Search models...' 
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="dropdown-content">
                    <div className='dropdown-text'>Testing models</div>
                    {filterModels(testingModels).map((model, index) => (
                      <div 
                        key={`testing-${index}`}
                        className={`dropdown-item ${selectedModels.includes(model.name) ? 'selected' : ''}`}
                        style={{ '--item-index': index }}
                        onClick={() => handleModelSelect(model.name)}
                      >
                        <img src={model.logo} className="select-model-logo" alt={model.name} />
                        {model.name}
                      </div>
                    ))}
                    <div className="models-class-seperator"></div>
                    <div className='dropdown-text'>Premium models</div>
                    {filterModels(premiumModels).map((model, index) => (
                      <div 
                        key={`premium-${index}`}
                        className={`dropdown-item ${selectedModels.includes(model.name) ? 'selected' : ''}`}
                        style={{ '--item-index': index }}
                        onClick={() => handleModelSelect(model.name)}
                      >
                        <img src={model.logo} className="select-model-logo" alt={model.name} />
                        {model.name}
                      </div>
                    ))}
                    <div className="models-class-seperator"></div>
                    <div className='dropdown-text'>Token efficient models</div>
                    {filterModels(tokenEfficientModels).map((model, index) => (
                      <div 
                        key={`efficient-${index}`}
                        className={`dropdown-item ${selectedModels.includes(model.name) ? 'selected' : ''}`}
                        style={{ '--item-index': index }}
                        onClick={() => handleModelSelect(model.name)}
                      >
                        <img src={model.logo} className="select-model-logo" alt={model.name} />
                        {model.name}
                      </div>
                    ))}
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

      {showWelcomePopup && (
        <WelcomePopup onClose={() => setShowWelcomePopup(false)} />
      )}
      
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
