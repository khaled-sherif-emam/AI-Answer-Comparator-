
import { getChatMessages } from '../services/chatServices.js';

export async function handleGetChatMessages(req, res) {
    try {
        const {chat_id} = req.body;

        if (!chat_id) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID is required',
                error: 'No chat ID provided in request body'
            });
        }

        const result = await getChatMessages(chat_id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message || 'Failed to fetch chat messages',
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            chat_messages: result.chat_messages
        });
    } catch (error) {
        console.error('Error in handleGetChatMessages controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}