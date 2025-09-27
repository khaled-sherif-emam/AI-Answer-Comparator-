import { getUserName, 
         getSubscriptionPlan,
         getUserTokens,
         getGuestTokens } from '../services/userInfoServices.js';

export async function handleUserName(req, res) {
    try {
        const { user_id } = req.body;
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
                error: 'No user ID provided in request body'
            });
        }

        const result = await getUserName(user_id);
        
        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message || 'Failed to fetch user name',
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            name: result.name
        });
        
    } catch (error) {
        console.error('Error in handleUserName controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export async function handleGetSubscription(req, res) {
    try {
        const { user_id } = req.body;
        
        const result = await getSubscriptionPlan(user_id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message || 'Failed to fetch subscription plan',
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            subscription_plan: result.subscription_plan
        });
        
    } catch(error) {
        console.error('Error in handleGetSubscription controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }); 
    }
}

export async function handleGetUserTokens(req, res) {
    try {
        const { user_id } = req.body;
        
        const result = await getUserTokens(user_id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message || 'Failed to fetch user tokens',
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            available_tokens: result.available_tokens,
            allocated_tokens: result.allocated_tokens
        });
        
    } catch(error) {
        console.error('Error in handleGetUserTokens controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }); 
    }
}

export async function handleGetGuestTokens(req, res) {
    try {
        const { user_id } = req.body;
        
        const result = await getGuestTokens(user_id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message || 'Failed to fetch guest tokens',
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            available_tokens: result.available_tokens,
            allocated_tokens: result.allocated_tokens
        });
        
    } catch(error) {
        console.error('Error in handleGetGuestTokens controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }); 
    }
}

