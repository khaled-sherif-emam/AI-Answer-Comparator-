import { API_ENDPOINTS, API_CONFIG } from '../config/api';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getChatId, getGuestId } from '../utils/storage';
import { getUserId } from '../utils/storage';

import './Conversation.css';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';


const MODEL_ICONS = {
  'ChatGPT 4o': 'https://pngimg.com/d/chatgpt_PNG1.png',
  'ChatGPT-5 Mini': 'https://pngimg.com/d/chatgpt_PNG1.png',
  'ChatGPT-5': 'https://pngimg.com/d/chatgpt_PNG1.png',
  'DeepSeek-V3': 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png',
  'DeepSeek R1': 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png',
  'Llama 3.3 70B Instruct': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg/2560px-Meta_Platforms_Inc._logo_%28cropped%29.svg.png',
  'Joint Response': 'https://cdn-icons-png.flaticon.com/512/7046/7046086.png',
};

const Conversation = ({ selectedChatId, lastUpdated, isLoading: isParentLoading, selectedModels = [] }) => {
  const [messages, setMessages] = useState([]);
  const [groupedMessages, setGroupedMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeModel, setActiveModel] = useState({});

  const [messagesFound, setMessagesFound] = useState(null);
  const showLoading = isParentLoading || isLoading;
  const messagesEndRef = React.useRef(null);

  // Initialize messages as empty array if null/undefined
  const safeMessages = Array.isArray(messages) ? messages : [];

  // Auto-scroll to bottom when messages change or when chat changes
  useEffect(() => {
    // Only scroll if we have messages and this isn't the initial render
    if (safeMessages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [safeMessages.length, selectedChatId, lastUpdated]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // This function fetches conversation when selectedChatId changes
  useEffect(() => {
    const fetchConversation = async () => {
      if (!selectedChatId) {
        setMessages([]);
        setMessagesFound(false);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(API_ENDPOINTS.CHAT.GET_CHAT_MESSAGES, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...API_CONFIG.DEFAULT_HEADERS
          },
          credentials: 'include',
          body: JSON.stringify({ chat_id: selectedChatId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch messages');
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to load conversation');
        }

        const messages = Array.isArray(data.chat_messages) ? data.chat_messages : [];
        
        console.log('Fetched messages:', messages);
        setMessages(messages);
        setMessagesFound(messages.length > 0);
        
        // Scroll to bottom after messages are updated
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
        setMessagesFound(false);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchGuestConversation = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const guest_id = getGuestId();
        console.log('Guest ID:', guest_id);
        
        if (!guest_id) {
          console.log('No guest ID found, starting fresh conversation');
          setMessages([]);
          setMessagesFound(false);
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(API_ENDPOINTS.GUEST_CHAT.GET_GUEST_MESSAGES, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...API_CONFIG.DEFAULT_HEADERS
          },
          credentials: 'include',
          body: JSON.stringify({ guest_id }),
        });

        // Handle non-200 responses
        if (!response.ok) {
          // If 404, it means no messages found (which is fine for a new guest)
          if (response.status === 404) {
            console.log('No messages found for guest, starting fresh conversation');
            setMessages([]);
            setMessagesFound(false);
            setIsLoading(false);
            return;
          }
          
          // For other errors, throw an error
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch messages');
        }

        const data = await response.json();
        
        // If no messages found, set empty array and return
        if (!data.success) {
          if (data.message && data.message.includes('No messages found')) {
            console.log('No messages found for guest, starting fresh conversation');
            setMessages([]);
            setMessagesFound(false);
            setIsLoading(false);
            return;
          }
          throw new Error(data.message || 'Failed to load conversation');
        }

        // The backend returns messages in data.messages
        const messages = Array.isArray(data.messages) ? data.messages : [];
        console.log('Guest messages from API:', messages);
        
        // Transform messages to match the expected format
        const transformedMessages = messages.map(msg => ({
          ...msg,
          // Ensure required fields exist
          id: msg.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: msg.role || (msg.model_used ? 'assistant' : 'user'),
          content: msg.content || '',
          created_at: msg.created_at || new Date().toISOString(),
          model_used: msg.model_used || null,
          prompt_id: msg.prompt_id || null
        }));
        
        console.log('Transformed messages:', transformedMessages);
        setMessages(transformedMessages);
        setMessagesFound(transformedMessages.length > 0);
        
        // Scroll to bottom after messages are updated
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
        setMessagesFound(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (getUserId()) {
      fetchConversation();
    } else {
      fetchGuestConversation();
    }
  }, [selectedChatId, lastUpdated]);


  // This function groups messages by prompt_id whenever messages change
  useEffect(() => {
    const promptMap = new Map();
    
    const safeMessages = Array.isArray(messages) ? messages : [];
    console.log('Grouping messages:', safeMessages);
    
    if (safeMessages.length > 0) {
      // First, find all prompts and initialize their response arrays
      safeMessages.forEach(message => {
        // A message is a prompt if it's from the user or doesn't have a model_used
        const isPrompt = message.role === 'user' || !message.model_used;
        if (isPrompt) {
          promptMap.set(message.id, {
            ...message,
            responses: [],
            // Ensure selected_models is always an array
            selected_models: message.selected_models || []
          });
        }
      });
      
      // Then, assign responses to their prompts
      safeMessages.forEach(message => {
        // A message is a response if it's from the assistant or has a model_used
        const isResponse = message.role === 'assistant' || message.model_used;
        if (isResponse) {
          let prompt = null;
          
          // First try to find by prompt_id if it exists
          if (message.prompt_id) {
            prompt = promptMap.get(message.prompt_id);
          }
          
          // If no prompt found by ID, find the most recent prompt before this response
          if (!prompt) {
            const prompts = Array.from(promptMap.values())
              .filter(p => new Date(p.created_at) <= new Date(message.created_at));
              
            if (prompts.length > 0) {
              // Sort by creation time (newest first) and take the most recent one
              prompts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              prompt = prompts[0];
            }
          }
          
          if (prompt) {
            // Check if this response is already in the prompt's responses
            const existingResponse = prompt.responses.find(r => r.id === message.id);
            
            if (!existingResponse) {
              prompt.responses.push({
                ...message,
                model_used: message.model_used || 'Unknown Model',
                created_at: message.created_at || new Date().toISOString()
              });
              console.log(`Added response to prompt ${prompt.id}:`, message.content);
            }
          } else {
            console.warn('Could not find prompt for response:', message);
          }
        }
      });
      
      // Convert the map values to an array and sort by creation time
      const newGroupedMessages = Array.from(promptMap.values())
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
      console.log('Grouped messages:', newGroupedMessages);
      setGroupedMessages(newGroupedMessages);
    } else {
      setGroupedMessages([]);
      console.log("No messages to display");
    }
  }, [messages]);
  
  
  // Set default active model for each prompt if not already set
  useEffect(() => {
    const newActiveModel = { ...activeModel };
    let shouldUpdate = false;
    
    groupedMessages.forEach(prompt => {
      if (prompt.responses.length > 0 && !(prompt.id in newActiveModel)) {
        newActiveModel[prompt.id] = prompt.responses[0].model_used || 'default';
        shouldUpdate = true;
      }
    });
    
    if (shouldUpdate) {
      setActiveModel(newActiveModel);
    }
  }, [groupedMessages]);

  return (
    <div className="conversation-container">
      <div className="conversation-wrapper">
      {error && <div className="error-message">{error}</div>}
      
      {/* Show this if the user's chat has no messages yet */}
      {!error && messagesFound === false && ( 
        <div className="welcome-container">
          <div className="welcome-message">Welcome to Promptly</div>
          <div className="welcome-message-subtext">Welcome! Your AI assistant is ready to help, inspire, and explore with you. Let’s get started!</div>
        </div>
      )}

      {/* Show this if the user's chat has messages */}
      {groupedMessages.length > 0 ? (
        groupedMessages.map((prompt, index) => (   
          <div key={index} className="message-group">
            <div className="prompt">
              <div>
                <p>{prompt.content}</p>
              </div>
            </div>
            {/* Response/Responses to the user's prompt */}
            { /* This container is shown when a response is being generated */ }
            {showLoading && !prompt.responses?.length && (
              <div className="loading-message-container">
                <div className="model-logos-loading">
                  {/* Use prompt.selected_models if available, otherwise fallback to selectedModels prop */}
                  {(prompt.selected_models || selectedModels)?.map((modelName) => {
                    const icon = MODEL_ICONS[modelName];
                    return icon ? (
                      <div key={modelName} className="model-logo-loading">
                        <img 
                          src={icon} 
                          alt={`${modelName} logo`} 
                          title={modelName}
                        />
                      </div>
                    ) : null;
                  })}
                  <div className="bouncing-dots">
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                  </div>
                </div>
              </div>
            )}


            {prompt.responses.length > 0 && (
              <div className="responses">
                <div className="model-buttons">
                  {prompt.responses.map((response, idx) => {
                    const modelKey = response.model_used || 'default';
                    const isActive = activeModel[prompt.id] === modelKey;
                    return (
                      <button 
                        key={`${prompt.id}-${modelKey}`}
                        className={`model-button ${isActive ? 'active' : ''}`}
                        data-model={modelKey}
                        onClick={() => setActiveModel(prev => ({
                          ...prev,
                          [prompt.id]: isActive ? null : modelKey
                        }))}
                      >
                        <div className="model-button-content">
                          <img 
                            src={MODEL_ICONS[modelKey] || MODEL_ICONS['default']} 
                            alt={`${modelKey} icon`} 
                            className="model-icon"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = MODEL_ICONS['default'];
                            }}
                          />
                          <span>{modelKey}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Seperator line here */}
                <div className="response-line-seperator"></div>
                <div className="responses-content">
                  {prompt.responses.map((response, idx) => {
                    const modelKey = response.model_used || 'default';
                    const isActive = activeModel[prompt.id] === modelKey;
                    return isActive && (
                      <div key={`${prompt.id}-${idx}`} className="response-container">
                        <div className="response">
                          {typeof response.content === 'string' ? (
                            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                              {response.content}
                            </ReactMarkdown>
                          ) : (
                            <div>{response.content}</div>
                          )}
                        </div>
                        { /* Show the user the number of tokens used for the response */ }
                        <div className="tokens-used-container">
                          <p>{response.tokens_used} tokens used</p>
                        </div>
                        { /* Add an Option for the user to respond specifically to a Chatbot's response */ }
                        <div>
                        </div>
                      </div>
                      
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))
      ) : null}
      <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default Conversation;
