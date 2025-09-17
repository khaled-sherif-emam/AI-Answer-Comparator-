import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getChatId } from './utils/storage';
import { getChatMessages } from './server';
import './Conversation.css';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';


const MODEL_ICONS = {
  'ChatGPT-4.1': 'https://pngimg.com/d/chatgpt_PNG1.png',
  'DeepSeek-V3': 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/deepseek-color.png',
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

  // Auto-scroll to bottom when messages change or when chat changes
  useEffect(() => {
    // Only scroll if we have messages and this isn't the initial render
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, selectedChatId, lastUpdated]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversation when selectedChatId changes
  useEffect(() => {
    const fetchConversation = async () => {
      if (!selectedChatId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const messages = await getChatMessages(selectedChatId);
        setMessages(messages);
        console.log('Fetched messages:', messages);

        if (messages.length > 0) {
          setMessagesFound(true);
        } else {
          setMessagesFound(false);
        }

      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
      }
    };


    fetchConversation();
  }, [selectedChatId, lastUpdated]);


  // Group messages by prompt_id whenever messages change
  useEffect(() => {
    const promptMap = new Map();
    
    if (messages && messages.length > 0) {
      // First, find all prompts and initialize their response arrays
      messages.forEach(message => {
        if (!message.model_used) {
          promptMap.set(message.id, {
            ...message,
            responses: []
          });
        }
      });
      
      // Then, assign responses to their prompts
      messages.forEach(message => {
        if (message.model_used && message.prompt_id) {
          const prompt = promptMap.get(message.prompt_id);
          if (prompt) {
            prompt.responses.push(message);
          }
        }
      });
      
      // Convert the map values to an array for rendering
      const newGroupedMessages = Array.from(promptMap.values());
      console.log('Grouped messages:', newGroupedMessages);
      setGroupedMessages(newGroupedMessages);
    } else {
      setGroupedMessages([]);
      console.log("No messages");
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
                  {selectedModels?.map((modelName) => (
                    MODEL_ICONS[modelName] && (
                      <div key={modelName} className="model-logo-loading">
                        <img 
                          src={MODEL_ICONS[modelName]} 
                          alt={`${modelName} logo`} 
                          title={modelName}
                        />
                      </div>
                    )
                  ))}
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
