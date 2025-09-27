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

export async function getSubscriptionPlan(user_id) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('subscription')
            .eq('user_id', user_id)
            .single();

        if (error) {
            console.error("Error fetching subscription plan:", error.message);
            throw error;
        }

        if (!data) {
            throw new Error('Subscription plan not found');
        }

        return {
            success: true,
            subscription_plan: data.subscription
        };
        
    } catch (error) {
        console.error('Error in getSubscriptionPlan service:', error.message);
        return {
            success: false,
            message: error.message || 'Failed to fetch subscription plan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
}


// Gets the available and allocated tokens of the user
export async function getUserTokens(user_id) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('available_tokens, allocated_tokens')
            .eq('user_id', user_id)
            .single();

        if (error) {
            console.error("Error fetching user's tokens:", error.message);
            throw error;
        }

        if (!data) {
            // If user not found, try to check if guest exists
            const {data, error} = await supabase
            .from('guests')
            .select('available_tokens, allocated_tokens')
            .eq('guest_id', user_id)
            .single();

            if (error) {
                console.error("Error fetching guest's tokens:", error.message);
                throw error;
            }

            if (!data) {
                throw new Error('Guest not found');
            }
        }

        return {
            success: true,
            available_tokens: data.available_tokens,
            allocated_tokens: data.allocated_tokens
        };
        
    } catch (error) {
        console.error('Error in getUserTokens service:', error.message);
        return {
            success: false,
            message: error.message || 'Failed to fetch user tokens',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
}

// Gets the available and allocated tokens of the guest
export async function getGuestTokens(guest_id) {
    try {
        const { data, error } = await supabase
            .from('guests')
            .select('available_tokens, allocated_tokens')
            .eq('guest_id', guest_id)
            .single();

        if (error) {
            console.error("Error fetching guest's tokens:", error.message);
            throw error;
        }

        if (!data) {
            throw new Error('Guest not found');
        }

        return {
            success: true,
            available_tokens: data.available_tokens,
            allocated_tokens: data.allocated_tokens
        };  
        
    } catch (error) {
        console.error('Error in getGuestTokens service:', error.message);
        return {
            success: false,
            message: error.message || 'Failed to fetch guest tokens',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }
}