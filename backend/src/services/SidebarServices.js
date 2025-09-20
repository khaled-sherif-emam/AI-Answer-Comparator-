import { supabase } from "../config/db.js";


// Function that gets all the user's chats
export async function getChats(user_id) {
    console.log("Getting the user's chats...");

    const { data, error } = await supabase
        .from('chats')
        .select('id, title')
        .eq('user_id', user_id)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error("Error fetching the user's chats:", error.message);
        throw error;
    }

    console.log("User chats have been fetched successfully");
    return data || [];
}

// Function that creates a new chat
export async function createChat(user_id) {
    console.log("Creating a new chat for user", user_id);

    // Get current date in user's local timezone
    const now = new Date();
    // Format as YYYY-MM-DD HH:MM:SS in local time
    const localDate = now.toISOString().slice(0, 19).replace('T', ' ');

    const { data, error } = await supabase
        .from('chats')
        .insert([
            {
                user_id: user_id,
                title: 'New chat',
                created_at: localDate,
                updated_at: localDate
            }
        ])
        .select('id, title, created_at, updated_at')
        .single();

    if (error) {
        console.error("Error creating the chat:", error.message);
        throw error;
    }

    console.log("Chat created successfully:", data);
    return data;
}

// Fucntion that deletes an existing chat
export async function deleteChat(chat_id) {
    console.log(`Starting deleteChat for chat_id: ${chat_id} (type: ${typeof chat_id})`);
    
    try {
        // First, delete related prompts
        console.log('Deleting prompts for chat_id:', chat_id);
        const { error: deletePromptsError, count: promptsDeleted } = await supabase
            .from('prompts')
            .delete()
            .eq('chat_id', chat_id);
    
        if (deletePromptsError) {
            console.error('Error deleting prompts:', deletePromptsError);
            throw new Error(`Failed to delete prompts: ${deletePromptsError.message}`);
        }
        console.log(`Deleted ${promptsDeleted} prompts`);
        
        // Then, delete related responses
        console.log('Deleting responses for chat_id:', chat_id);
        const { error: deleteResponsesError, count: responsesDeleted } = await supabase
            .from('responses')
            .delete()
            .eq('chat_id', chat_id);
    
        if (deleteResponsesError) {
            console.error('Error deleting responses:', deleteResponsesError);
            throw new Error(`Failed to delete responses: ${deleteResponsesError.message}`);
        }
        console.log(`Deleted ${responsesDeleted} responses`);
        
        // Finally, delete the chat itself
        console.log('Deleting chat with id:', chat_id);
        const { data, error, count } = await supabase
            .from('chats')
            .delete()
            .eq('id', chat_id);
        
        if (error) {
            console.error('Error deleting chat:', error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        if (count === 0) {
            console.error('No chat found with id:', chat_id);
            throw new Error('Chat not found');
        }
        
        console.log('Successfully deleted chat:', data);
        return data;
        
    } catch (error) {
        console.error('Error in deleteChat:', error);
        throw error; // Re-throw to be handled by the controller
    }
}

// Function that renames a chat
export async function renameChat(chat_id, newName) {
    try {
        const {data, error} = await supabase
            .from('chats')
            .update({title: newName})
            .eq('id', chat_id);

        if (error) {
            console.error('Error renaming chat:', error);
            throw error;
        }

        console.log('Successfully renamed chat:', data);
        return data;
    } catch (error) {
        console.error('Error renaming chat:', error);
        throw error;
    }
}
