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
