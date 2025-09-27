import { getChatMessages } from './chatServices.js';
import { fetchChatHistory } from "./chatServices.js";
import OpenAI from "openai";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// Verify OpenAI key is set
if (!process.env.OPENAI_KEY) {
    console.error('ERROR: OPENAI_KEY is not set in environment variables');
    throw new Error('OpenAI API key is not configured');
}

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

console.log('OpenAI client initialized successfully');

export async function askChatGPT4(prompt, chat_id) {
    try {
        console.log('Starting askChatGPT4 with prompt:', prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''));
        
        // Validate input
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Prompt must be a non-empty string');
        }

        // Initialize messages array with system message
        const messages = [{
            role: "system",
            content: "You are ChatGPT, a helpful AI assistant. " +
                     "When providing mathematical expressions or calculations, use LaTeX. " +
                     "Inline math: \\(E=mc^2\\), block math: \\[ \\sum_{i=1}^n x_i \\]."
        }];

        // Add chat history if available
        if (chat_id) {
            try {
                console.log('Fetching chat history for chat_id:', chat_id);
                const chatHistory = await getChatMessages(chat_id);
                console.log('Chat history result:', {
                    success: chatHistory?.success,
                    messageCount: chatHistory?.chat_messages?.length || 0
                });
                
                if (chatHistory?.success && Array.isArray(chatHistory.chat_messages)) {
                    chatHistory.chat_messages.forEach((message, index) => {
                        if (message?.content) {
                            messages.push({
                                role: message.role === 'user' ? 'user' : 'assistant',
                                content: String(message.content)
                            });
                            console.log(`Added history message ${index + 1}: ${message.role} - ${String(message.content).substring(0, 30)}...`);
                        }
                    });
                }
            } catch (historyError) {
                console.error('Error processing chat history:', historyError);
                // Continue with empty history if there's an error
            }
        }

        // Add current user message
        const userMessage = { role: 'user', content: prompt };
        messages.push(userMessage);
        console.log('Sending request to OpenAI with messages:', JSON.stringify(messages, null, 2));

        // Make API request
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            temperature: 0.7,
       
        });

        console.log('Raw API response:', JSON.stringify(response, null, 2));

        // Validate response structure
        if (!response?.choices?.[0]?.message) {
            throw new Error('Invalid response format from OpenAI API');
        }

        const responseContent = response.choices[0].message.content;
        const totalTokens = response.usage?.total_tokens || 0;

        if (!responseContent) {
            console.error('Empty response content from API. Full response:', response);
            throw new Error('Received empty response content from OpenAI API');
        }

        console.log('Successfully got response. Tokens used:', totalTokens);
        return [responseContent, totalTokens];

    } catch (err) {
        console.error('Error in askChatGPT5Mini:', {
            message: err.message,
            stack: err.stack,
            chat_id,
            prompt_preview: prompt?.substring(0, 100) || 'No prompt'
        });
        throw err;
    }
}

// TODO: Add the other chatbots

export async function askDeepSeekV3(prompt, chat_id) {
    try {
        const apiKey = process.env.DEEPSEEK_TOKEN;
        
        // Get chat history if chat_id is provided
        let messages = [];
        
        // Add system message with chat history if available
        if (chat_id) {
            const chatHistory = await getChatMessages(chat_id);
            if (chatHistory && chatHistory.success && Array.isArray(chatHistory.chat_messages)) {
                // Convert chat history to messages format
                chatHistory.chat_messages.forEach(msg => {
                    messages.push({
                        role: msg.role === 'user' ? 'user' : 'assistant',
                        content: msg.content
                    });
                });
            }
        }
        
        // Add the current user message
        messages.push({ role: 'user', content: prompt });
        
        // Add system message at the beginning
        const systemMessage = {
            role: 'system',
            content: 'You are DeepSeek, a clear, concise AI assistant. Be conversational, use bullet points, and explain calculations briefly.'
        };
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [systemMessage, ...messages],
                temperature: 0.7,
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`);
        }
        
        const responseData = await response.json();
        const responseContent = responseData.choices[0].message.content;
        const totalTokens = responseData.usage?.total_tokens || 0;
        
        console.log('DeepSeek response received. Tokens used:', totalTokens);
        return [responseContent, totalTokens];
        
    } catch (error) {
        console.error("Error in askDeepSeekV3:", error);
        throw error;
    }
}

export async function askChatGPT5Mini(prompt, chat_id) {
    try {
        console.log('Starting askChatGPT5 mini with prompt:', prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''));
        
        // Validate input
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Prompt must be a non-empty string');
        }

        // Initialize messages array with system message
        const messages = [{
            role: "system",
            content: "You are ChatGPT, a helpful AI assistant. " +
                     "When providing mathematical expressions or calculations, use LaTeX. " +
                     "Inline math: \\(E=mc^2\\), block math: \\[ \\sum_{i=1}^n x_i \\]."
        }];

        // Add chat history if available
        if (chat_id) {
            try {
                console.log('Fetching chat history for chat_id:', chat_id);
                const chatHistory = await getChatMessages(chat_id);
                console.log('Chat history result:', {
                    success: chatHistory?.success,
                    messageCount: chatHistory?.chat_messages?.length || 0
                });
                
                if (chatHistory?.success && Array.isArray(chatHistory.chat_messages)) {
                    chatHistory.chat_messages.forEach((message, index) => {
                        if (message?.content) {
                            messages.push({
                                role: message.role === 'user' ? 'user' : 'assistant',
                                content: String(message.content)
                            });
                            console.log(`Added history message ${index + 1}: ${message.role} - ${String(message.content).substring(0, 30)}...`);
                        }
                    });
                }
            } catch (historyError) {
                console.error('Error processing chat history:', historyError);
                // Continue with empty history if there's an error
            }
        }

        // Add current user message
        const userMessage = { role: 'user', content: prompt };
        messages.push(userMessage);
        console.log('Sending request to OpenAI with messages:', JSON.stringify(messages, null, 2));

        // Make API request
        const response = await openai.chat.completions.create({
            model: "gpt-5-mini",  // Using gpt-4-turbo-preview for better performance
            messages,
            temperature: 1,
    
        });

        console.log('Raw API response:', JSON.stringify(response, null, 2));

        // Validate response structure
        if (!response?.choices?.[0]?.message) {
            throw new Error('Invalid response format from OpenAI API');
        }

        const responseContent = response.choices[0].message.content;
        const totalTokens = response.usage?.total_tokens || 0;

        if (!responseContent) {
            console.error('Empty response content from API. Full response:', response);
            throw new Error('Received empty response content from OpenAI API');
        }

        console.log('Successfully got response. Tokens used:', totalTokens);
        return [responseContent, totalTokens];

    } catch (err) {
        console.error('Error in askChatGPT5Mini:', {
            message: err.message,
            stack: err.stack,
            chat_id,
            prompt_preview: prompt?.substring(0, 100) || 'No prompt'
        });
        throw err;
    }
}

export async function askDeepSeekR1(prompt, chat_id) {
    try {
        const apiKey = process.env.DEEPSEEK_TOKEN;
        
        // Get chat history if chat_id is provided
        let messages = [];
        
        // Add system message with chat history if available
        if (chat_id) {
            const chatHistory = await getChatMessages(chat_id);
            if (chatHistory && chatHistory.success && Array.isArray(chatHistory.chat_messages)) {
                // Convert chat history to messages format
                chatHistory.chat_messages.forEach(msg => {
                    messages.push({
                        role: msg.role === 'user' ? 'user' : 'assistant',
                        content: msg.content
                    });
                });
            }
        }
        
        // Add the current user message
        messages.push({ role: 'user', content: prompt });
        
        // Add system message at the beginning
        const systemMessage = {
            role: 'system',
            content: 'You are DeepSeek, a clear, concise AI assistant. Be conversational, use bullet points, and explain calculations briefly.'
        };
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-reasoner',
                messages: [systemMessage, ...messages],
                temperature: 0.7,
               
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`DeepSeek API error: ${errorData.error?.message || response.statusText}`);
        }
        
        const responseData = await response.json();
        const responseContent = responseData.choices[0].message.content;
        const totalTokens = responseData.usage?.total_tokens || 0;
        
        console.log('DeepSeek response received. Tokens used:', totalTokens);
        return [responseContent, totalTokens];
        
    } catch (error) {
        console.error("Error in askDeepSeekV3:", error);
        throw error;
    }
}

