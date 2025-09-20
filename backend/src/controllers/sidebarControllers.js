import { getChats, createChat, deleteChat, renameChat } from '../services/SidebarServices.js'


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

export async function handleDeleteChat(req, res) {
    console.log('Delete chat request received with body:', req.body);
    
    const { chat_id } = req.body;

    if (!chat_id) {
        console.error('No chat_id provided in request body');
        return res.status(400).json({
            success: false,
            message: 'Chat ID is required',
            error: 'No chat ID provided in request body'
        });
    }

    try {
        console.log('Attempting to delete chat with ID:', chat_id);
        await deleteChat(chat_id);
        console.log('Successfully deleted chat with ID:', chat_id);
        return res.status(200).json({
            success: true,
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        console.error('Error in handleDeleteChat:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

export async function handleRenameChat(req, res) {
    console.log('Rename chat request received with body:', req.body);
    
    const { chat_id, newName } = req.body;

    if (!chat_id) {
        console.error('No chat_id provided in request body');
        return res.status(400).json({
            success: false,
            message: 'Chat ID is required',
            error: 'No chat ID provided in request body'
        });
    }

    try {
        console.log('Attempting to rename chat with ID:', chat_id);
        await renameChat(chat_id, newName);
        console.log('Successfully renamed chat with ID:', chat_id);
        return res.status(200).json({
            success: true,
            message: 'Chat renamed successfully'
        });
    } catch (error) {
        console.error('Error in handleRenameChat:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}