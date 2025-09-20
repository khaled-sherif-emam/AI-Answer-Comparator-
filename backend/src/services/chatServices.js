import { supabase } from '../config/supabaseClient.js';

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