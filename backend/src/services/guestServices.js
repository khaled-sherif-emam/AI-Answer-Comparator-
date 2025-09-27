import { supabase } from '../config/supabaseClient.js';
import { askChatGPT4, askDeepSeekV3 } from '../services/chatbotServices.js';

export async function getGuestMessages(guestId) {
    try {
        if (!guestId) {
            console.error('No guestId provided to getGuestMessages');
            return { 
                success: false, 
                message: 'Guest ID is required',
                error: 'MISSING_GUEST_ID'
            };
        }

        console.log(`[DEBUG] Fetching messages for guest ID: ${guestId}`);
        console.log(`[DEBUG] Querying guests_prompts for guest_id: ${guestId}`);
        console.log(`[DEBUG] Querying guests_responses for guest_id: ${guestId}`);
            
        // Fetch prompts and responses in parallel
        const [promptsResult, responsesResult] = await Promise.all([
            supabase
                .from('guests_prompts')
                .select('*')
                .eq('guest_id', guestId)
                .order('created_at', { ascending: true }),
                
            supabase
                .from('guests_responses')
                .select('id, guest_id, content, model_used, tokens_used, created_at')
                .eq('guest_id', guestId)
                .order('created_at', { ascending: true })
        ]);

        const { data: prompts, error: promptsError } = promptsResult;
        const { data: responses, error: responsesError } = responsesResult;
            
        if (promptsError || responsesError) {
            console.error('Error fetching messages:', { promptsError, responsesError });
            return {
                success: false,
                message: 'Failed to fetch messages',
                error: promptsError?.message || responsesError?.message
            };
        }

        console.log(`[DEBUG] Found ${prompts?.length || 0} prompts and ${responses?.length || 0} responses`);
        
        // Process prompts first
        const processedPrompts = (prompts || []).map(p => {
            console.log(`[DEBUG] Processing prompt:`, p);
            return {
                ...p,
                role: 'user',
                model_used: null,
                prompt_id: p.id // Set prompt_id to the prompt's own ID
            };
        });

        // Process responses and match them with prompts
        const processedResponses = (responses || []).map(r => {
            console.log(`[DEBUG] Processing response:`, r);
            // Find the most recent prompt before this response
            const prompt = processedPrompts
                .filter(p => new Date(p.created_at) <= new Date(r.created_at))
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                
            return {
                ...r,
                role: 'assistant',
                prompt_id: prompt?.id || null // Link to the most recent prompt
            };
        });

        // Combine and sort all messages
        const allMessages = [
            ...processedPrompts,
            ...processedResponses
        ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        return {
            success: true,
            messages: allMessages
        };
        
    } catch (error) {
        console.error('Error in getGuestMessages:', error);
        return {
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        };
    }
}

export async function getGuestTokens(guestId) {
    try {
        console.log('Fetching tokens for guest ID:', guestId);
        
        if (!guestId) {
            throw new Error('No guest ID provided');
        }
        
        const { data, error } = await supabase
            .from('guests')
            .select('available_tokens, allocated_tokens')
            .eq('guest_id', guestId)
            .single();
            
        if (error) {
            console.error('Supabase error:', error);
            throw new Error('Failed to fetch guest tokens from database');
        }
        
        if (!data) {
            throw new Error('No guest found with the provided ID');
        }
        
        console.log('Retrieved guest tokens:', data);
        return { data };
    } catch (error) {
        console.error('Error in getGuestTokens:', error);
        throw error; // Re-throw to be handled by the controller
    }
}

export async function storeGuestPrompt(guestId, prompt, selectedModels) {
    try {
        console.log(`Storing prompt for guest_id: ${guestId}`);
        
        const {data, error} = await supabase
        .from('guests_prompts')
        .insert([{
            'guest_id':guestId,
            'content':prompt,
            'selected_models':selectedModels
        }])
        .select()
        
        if (error) {
            console.error("Error storing prompt for guest:", error.message);
            return {
                success: false,
                message: 'Failed to store prompt for guest',
                error: error.message
            };
        }
            
        console.log(`Successfully stored prompt for guest ${guestId}`);
        return { 
            success: true, 
            prompt_id: data[0].id 
        };
    } catch (error) {
        console.error("Error storing prompt for guest:", error.message);
        return { 
            success: false,
            message: error.message || 'Failed to store prompt for guest',
            error: error.message
        };
    }
}


export async function contactAI(guestId, prompt_to_answer, selectedModels) {
    console.log('contactAI called with:', { guestId, prompt_to_answer, selectedModels });
    
    if (!selectedModels || !Array.isArray(selectedModels) || selectedModels.length === 0) {
        throw new Error('No AI models selected');
    }
    
    let responses = [];
    let tokensUsed = [];
    
    try {
        if (selectedModels.includes('ChatGPT-4.1')) {
            console.log('Calling ChatGPT-4.1...');
            const responseAndTokens = await askChatGPT4(prompt_to_answer, null);
            const response = responseAndTokens[0];
            const tokens = responseAndTokens[1];
            responses.push({
                model: 'ChatGPT-4.1',
                response: response,
                tokens: tokens
            });
            tokensUsed.push(tokens);
            console.log('ChatGPT-4.1 response received');
        }

        if (selectedModels.includes('DeepSeek-V3')) {
            console.log('Calling DeepSeek-V3...');
            const responseAndTokens = await askDeepSeekV3(prompt_to_answer, null);
            const response = responseAndTokens[0];
            const tokens = responseAndTokens[1];
            responses.push({
                model: 'DeepSeek-V3',
                response: response,
                tokens: tokens
            });
            tokensUsed.push(tokens);
            console.log('DeepSeek-V3 response received');
        }
        
        // Check for unsupported models
        const unsupportedModels = selectedModels.filter(model => 
            !['ChatGPT-4.1', 'DeepSeek-V3'].includes(model)
        );
        
        if (unsupportedModels.length > 0) {
            console.warn('The following models are not supported:', unsupportedModels);
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


export async function storeGuestResponse(guest_id, responses, models_used, tokens_used) {
    try {
        console.log('Storing guest response for guest_id:', guest_id);
        
        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            const model_used = models_used[i];
            const tokens = tokens_used[i]; // Fixed variable name to avoid shadowing
            
            const {data, error} = await supabase
            .from('guests_responses')
            .insert([{
                'guest_id': guest_id,
                'content': response,
                'model_used': model_used,
                'tokens_used': tokens,
                'created_at': new Date().toISOString()
            }])
            .select()
            
            if (error) {
                console.error("Error storing guest response:", error.message);
                return {
                    success: false,
                message: 'Failed to store guest response',
                error: error.message
            };
        }
        }
            
        console.log('Successfully stored guest response for guest_id:', guest_id);
        return { 
            success: true, 
            response: data 
        };
    } catch (error) {
        console.error("Error storing guest response:", error.message);
        return {
            success: false,
            message: 'Failed to store guest response',
            error: error.message
        };
    }
}

export async function deductGuestTokens(tokens_used, guest_id) {
    console.log(`Deducting tokens from the guest's available tokens...`)

    // Fetch the user's current tokens
    const {data: userData, error: fetchError} = await supabase
    .from('guests')
    .select('available_tokens')
    .eq('guest_id', guest_id)
    .single()
    
    const available_tokens = userData?.available_tokens || 0;

    if (fetchError) {
        console.log(`Unable to fetch the guest's available tokens`, fetchError.message)
    } else {
        console.log(`Guest's available tokens fetched successfully`)
    }

    // Update the user's available tokens
    const current_tokens = available_tokens - tokens_used;
    const {data, error} = await supabase
    .from('guests')
    .update({available_tokens: current_tokens})
    .eq('guest_id', guest_id)

    if (error) {
        console.log('Unable to deduct tokens', error.message)
    } else {
        console.log('Tokens deducted successfully')
    }
}
    
