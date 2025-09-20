import { supabase } from "../config/db.js";

export async function getUserName(user_id) {
    try {
        if (!user_id) {
            throw new Error('User ID is required');
        }

        const { data, error } = await supabase
            .from('users')
            .select('name')
            .eq('user_id', user_id)
            .single();

        if (error) {
            console.error("Error fetching user's name:", error.message);
            throw error;
        }

        if (!data) {
            throw new Error('User not found');
        }

        return {
            success: true,
            name: data.name
        };
        
    } catch (error) {
        console.error('Error in getUserName service:', error.message);
        return {
            success: false,
            message: error.message || 'Failed to fetch user name',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
}