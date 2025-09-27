import { supabase } from '../config/supabaseClient.js';
import { askChatGPT4, askDeepSeekV3, askChatGPT5Mini, askDeepSeekR1 } from './chatbotServices.js';

// Get all messages for a specific chat
export async function getChatMessages(chat_id) {
    try {
        if (!chat_id) {
            console.error('No chat_id provided to getChatMessages');
            return { 
                success: false, 
                message: 'Chat ID is required',
                error: 'No chat_id provided'
            };
        }

        console.log(`Fetching messages for chat_id: ${chat_id}`);
            
        // Fetch prompts + responses in parallel
        const { data: prompts, error: promptsError } = await supabase
            .from('prompts')
            .select('*')
            .eq('chat_id', chat_id);
              
        const { data: responses, error: responsesError } = await supabase
            .from('responses')
            .select('id, prompt_id, content, model_used, tokens_used, created_at, chat_id')
            .eq('chat_id', chat_id);
            
        // Check for errors
        if (promptsError) {
            console.error("Error fetching prompts:", promptsError.message);
            return {
                success: false,
                message: 'Failed to fetch prompts',
                error: promptsError.message
            };
        }
        if (responsesError) {
            console.error("Error fetching responses:", responsesError.message);
            return {
                success: false,
                message: 'Failed to fetch responses',
                error: responsesError.message
            };
        }
            
        // Debug the data before merging
        console.log(`Found ${prompts.length} prompts and ${responses.length} responses`);
            
        // Merge and sort
        const messages = [...prompts, ...responses]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
        console.log(`Successfully fetched ${messages.length} messages for chat ${chat_id}`);
        return { 
            success: true, 
            chat_messages: messages 
        };
    } catch (error) {
        console.error("Error fetching chat messages:", error.message);
        return null;
    }
}

// Function to fetch chat history
export async function fetchChatHistory(chat_id) {
    try {
        if (!chat_id) {
            console.error('No chat_id provided to fetchChatHistory');
            return [];
        }
        
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat_id)
            .order('created_at', { ascending: true });
            
        if (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }
        
        return messages || [];
    } catch (error) {
        console.error('Error in fetchChatHistory:', error);
        return [];
    }
}

// TODO: Add the function that enhances the user's prompt
export async function enhancePrompt(prompt, user_id) {
    try {
        console.log('Enhancing the prompt...');
        
        const enhancementCommand = `You are a prompt enhancement assistant. Your task is to enhance the user's prompt to make it more clear and concise. Your answer is what you'd type into the prompt box`;
        const enhancedPromptAndTokensUsed = await askDeepSeekV3(enhancementCommand + "\n\n" + prompt, null);
        
        if (!Array.isArray(enhancedPromptAndTokensUsed) || enhancedPromptAndTokensUsed.length < 2) {
            throw new Error('Invalid response format from AI service');
        }
        
        const enhancedPrompt = enhancedPromptAndTokensUsed[0];
        const tokensUsed = enhancedPromptAndTokensUsed[1];
    
        // Don't await this to speed up the response
        deductTokens(tokensUsed, user_id).catch(console.error);
    
        return {
            success: true,
            enhanced_prompt: enhancedPrompt
        };
    } catch (error) {
        console.error('Error in enhancePrompt:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Store a prompt for a specific chat
export async function storePrompt(prompt, chat_id, selectedModels) {
    try {
        if (!prompt || !chat_id) {
            console.error('No prompt or chat_id provided to storePrompt');
            return { 
                success: false, 
                message: 'Prompt and chat ID are required',
                error: 'Missing prompt or chat ID in request body'
            };
        }

        console.log(`Storing prompt for chat_id: ${chat_id}`);
            
        console.log(prompt)
        
        const {data, error} = await supabase
        .from('prompts')
        .insert([{
            chat_id,
            content: prompt,
            selected_models: selectedModels
        }])
        .select()
        
        if (error) {
            console.error("Error storing prompt:", error.message);
            return {
                success: false,
                message: 'Failed to store prompt',
                error: error.message
            };
        }
            
        console.log(`Successfully stored prompt for chat ${chat_id}`);
        return { 
            success: true, 
            prompt_id: data[0].id 
        };
    } catch (error) {
        console.error("Error storing prompt:", error.message);
        return null;
    }
}

export async function contactAI(selectedModels, prompt_to_answer, chat_id, user_id) {
    console.log('Sending the prompt to the following models:', selectedModels);    
    let responses = [];
    let tokensUsed = [];
        
    try {
        // First, check if user has enough tokens
        const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('available_tokens')
            .eq('user_id', user_id)
            .single();
            
        if (fetchError) {
            console.error('Error fetching user token balance:', fetchError);
            return {
                success: false,
                message: 'Failed to verify token balance',
                error: 'Failed to verify token balance'
            };
        }
        
        const availableTokens = userData?.available_tokens || 0;
        
        // Estimate tokens needed (this is a rough estimate - adjust based on your needs)
        const estimatedTokensNeeded = prompt_to_answer.length / 4; // Rough estimate of tokens
        
        if (availableTokens <= 0) {
            return {
                success: false,
                message: 'Insufficient tokens. Please purchase more tokens to continue.',
                error: 'Insufficient tokens'
            };
        }
        if (selectedModels.includes('ChatGPT 4o')) {
            const responseAndTokens = await askChatGPT4(prompt_to_answer, chat_id);
            const response = responseAndTokens[0];
            const tokens = responseAndTokens[1];
            responses.push(response);
            tokensUsed.push(tokens);
        }

        if (selectedModels.includes('DeepSeek-V3')) {
            const responseAndTokens = await askDeepSeekV3(prompt_to_answer, chat_id);
            const response = responseAndTokens[0];
            const tokens = responseAndTokens[1];
            responses.push(response);
            tokensUsed.push(tokens);
        }

        if (selectedModels.includes('ChatGPT-5 Mini')) {   
            const responseAndTokens = await askChatGPT5Mini(prompt_to_answer, chat_id);
            const response = responseAndTokens[0];
            const tokens = responseAndTokens[1];
            responses.push(response);
            tokensUsed.push(tokens);
        }
        
        if (selectedModels.includes('ChatGPT-5')) {
            const responseAndTokens = await askChatGPT5Mini(prompt_to_answer, chat_id);
            const response = responseAndTokens[0];
            const tokens = responseAndTokens[1];
            responses.push(response);
            tokensUsed.push(tokens);
        }

        if (selectedModels.includes('DeepSeek R1')) {
            const responseAndTokens = await askDeepSeekR1(prompt_to_answer, chat_id);
            const response = responseAndTokens[0];
            const tokens = responseAndTokens[1];
            responses.push(response);
            tokensUsed.push(tokens);
        }
    
        console.log('AI responses:', responses);
        return {
            success: true,
            response: {
                responses,
                tokensUsed
            }
        };
    } catch (error) {
        console.error('Error in contactAI:', error);
        return {
            success: false,
            message: error.message || 'Failed to contact AI',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
    }
}

export async function storeResponses(chat_id, prompt_id, selectedModels, responses, tokens_used) {
    console.log(`Storing responses for chat ${chat_id}, prompt ${prompt_id}...`);
    
    if (!chat_id || !prompt_id || !selectedModels || !responses || !tokens_used) {
        console.error('Missing required parameters for storing responses');
        return {
            success: false,
            message: 'Missing required parameters',
            error: 'chat_id, prompt_id, selectedModels, responses, and tokens_used are required'
        };
    }

    if (selectedModels.length !== responses.length || selectedModels.length !== tokens_used.length) {
        return {
            success: false,
            message: 'Mismatched array lengths',
            error: 'selectedModels, responses, and tokens_used arrays must have the same length'
        };
    }

    try {
        const results = [];
        
        for (let i = 0; i < selectedModels.length; i++) {
            const { data, error } = await supabase
                .from('responses')
                .insert([{
                    chat_id: chat_id,
                    prompt_id: prompt_id,
                    content: responses[i],
                    model_used: selectedModels[i],
                    tokens_used: tokens_used[i],
                }])
                .select();

            if (error) {
                console.error(`Error storing ${selectedModels[i]}'s response:`, error);
                results.push({
                    success: false,
                    model: selectedModels[i],
                    error: error.message
                });
            } else {
                console.log(`${selectedModels[i]}'s response stored successfully`);
                results.push({
                    success: true,
                    model: selectedModels[i],
                    data: data[0]
                });
            }
        }

        // Check if all operations were successful
        const allSuccessful = results.every(r => r.success);
        
        return {
            success: allSuccessful,
            message: allSuccessful ? 'All responses stored successfully' : 'Some responses failed to store',
            results: results
        };

    } catch (error) {
        console.error('Error in storeResponses:', error);
        return {
            success: false,
            message: 'Failed to store responses',
            error: error.message
        };
    }
}

export async function deductTokens(tokensUsed, user_id) {

    console.log(`Deducting tokens from the user's available tokens...`)

    // Fetch the user's current tokens
    const {data: userData, error: fetchError} = await supabase
    .from('users')
    .select('available_tokens')
    .eq('user_id', user_id)
    .single()
    
    const available_tokens = userData?.available_tokens || 0;

    if (fetchError) {
        console.log(`Unable to fetch the user's available tokens`, fetchError.message)
    } else {
        console.log(`User's available tokens fetched successfully`)
    }

    // Update the user's available tokens
    const current_tokens = available_tokens - tokensUsed;
    const {data, error} = await supabase
    .from('users')
    .update({available_tokens: current_tokens})
    .eq('user_id', user_id)

    if (error) {
        console.log('Unable to deduct tokens', error.message)
    } else {
        console.log('Tokens deducted successfully')
    }
}