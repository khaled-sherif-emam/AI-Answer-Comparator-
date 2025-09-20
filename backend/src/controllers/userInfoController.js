import { getUserName } from '../services/userInfoServices.js';

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


