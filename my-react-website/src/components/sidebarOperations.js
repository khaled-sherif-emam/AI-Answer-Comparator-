import { supabase } from "../auth/supabaseClient"

export async function getChats(userId) {
    console.log('Fetching chats...')
    // Fetch chat names and their ids from the database
    const {data: chats, error} = await supabase
    .from('chats')
    .select('id, title')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

    if (error) {
        console.log("Error fetching the user's chats")
   } else {
    console.log('User chats fetched successfully', chats)
    return chats;
   }
}


export async function createChat(userId) {
    console.log("Creating a new chat for user", userId);

    // Get current date in user's local timezone
    const now = new Date();
    // Format as YYYY-MM-DD HH:MM:SS in local time
    const localDate = now.toISOString().slice(0, 19).replace('T', ' ');
    
    const { data, error } = await supabase
        .from('chats')
        .insert([{
            user_id: userId,
            title: 'New chat',
            created_at: localDate,
            updated_at: localDate
        }])
        .select('id, title, created_at, updated_at')
        .single();

    if (error) {
        console.error("Error creating the chat:", error);
        throw error;
    } else {
        console.log("Chat created successfully:", data);
        return data; // Return the full chat object with id
    }
}


export async function deleteChat(chatId) {
    // Delete chat and anything that belongs to it including messages (prompts & responses)
    console.log("Deleting chat with ID:", chatId);

    const { error: deletePromptsError} = await supabase
    .from('prompts')
    .delete()
    .eq('chat_id', chatId);

    if (deletePromptsError) {
        console.log(`Unable to delete the chat's prompts`, deletePromptsError)
        throw deletePromptsError;
    }
    
    const { error: deleteResponsesError} = await supabase
    .from('responses')
    .delete()
    .eq('chat_id', chatId); 

    if (deleteResponsesError) {
        console.log(`Unable to delete the chat's responses`, deleteResponsesError)
        throw deleteResponsesError;
    }
    
    const { data, error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
    
    if (error) {
        console.error("Error deleting the chat:", error);
        throw error;
    } else {
        console.log("Chat deleted successfully:", data);
    }
}


export async function updateChatTitle(chatId, newTitle) {
    console.log(`Updating chat ${chatId} title to:`, newTitle);
    const { data, error } = await supabase
        .from('chats')
        .update({ title: newTitle })
        .eq('id', chatId)
        .select();

    if (error) {
        console.error("Error updating chat title:", error);
        throw error;
    } else {
        console.log("Chat title updated successfully:", data);
        return data[0];
    }
}



// Operations for the Tokens Consumption section

export async function getTokensConsumption(user_id) {
    console.log('Fetching tokens consumption...')

    const {data, error} = await supabase
    .from('users')
    .select('available_tokens, allocated_tokens')
    .eq('user_id', user_id)
    .single()

    if (error) {
        console.log('Unable to fetch tokens consumption', error.message)
    } else {
        console.log('Tokens consumption fetched successfully', data)
        return data
    }

}

// Operations for the User Info section

export async function getUserName(userId) {
    console.log('Fetching user initials for user', userId);

    const {data, error} = await supabase
    .from('users')
    .select('name')
    .eq('user_id', userId)
    .single()

    if (error) {
        console.log("Error fetching user initials", error.message);
        return null;
    } else {
        console.log('User name:', data.name);
        return data.name;
    }
}

export async function getSubscriptionPlan(userId) {
    console.log("Getting the user's subscription plan...")
    
    const { data, error } = await supabase
    .from('users')
    .select('subscription_plan')
    .eq('user_id', userId)
    .single()

    const subscriptionPlan = data.subscription_plan;
    console.log('User subscription plan:', subscriptionPlan);
    
    return subscriptionPlan;
}

