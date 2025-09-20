import { getChats, createChat } from '../services/SidebarServices.js'


export async function handleGetChats(req, res) {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required',
            error: 'No user ID provided in request body'
        });
    }

    try {
        const chats = await getChats(user_id);
        return res.status(200).json({
            success: true,
            chats: chats
        });
    } catch (error) {
        console.error('Error in handleGetChats:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export async function handleNewChat(req, res) {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required',
            error: 'No user ID provided in request body'
        });
    }

    try {
        const chat_id = await createChat(user_id);
        return res.status(200).json({
            success: true,
            chat_id: chat_id
        });
    } catch (error) {
        console.error('Error in handleNewChat:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}