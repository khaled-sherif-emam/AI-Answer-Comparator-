
import { getChatMessages,
         enhancePrompt,
         storePrompt, 
         contactAI, 
         storeResponses } from '../services/chatServices.js';


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


export async function handleEnhancePrompt(req, res) {
    try {
        const { prompt, user_id } = req.body;

        if (!prompt || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Prompt and user ID are required',
                error: 'Missing prompt or user ID in request body'
            });
        }

        const result = await enhancePrompt(prompt, user_id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message || 'Failed to enhance prompt',
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Prompt enhanced successfully',
            enhanced_prompt: result.enhanced_prompt
        });
    } catch (error) {
        console.error('Error in handleEnhancePrompt controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}


export async function handleStorePrompt(req, res) {
    try {
        const { prompt, chat_id, selectedModels } = req.body;

        if (!prompt || !chat_id) {
            return res.status(400).json({
                success: false,
                message: 'Prompt and chat ID are required',
                error: 'Missing prompt or chat ID in request body'
            });
        }

        const result = await storePrompt(prompt, chat_id, selectedModels);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message || 'Failed to store prompt',
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Prompt stored successfully',
            prompt_id: result.prompt_id
        });
    } catch (error) {
        console.error('Error in handleStorePrompt controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}


export async function handleContactAI(req, res) {
    try {
        const { selectedModels, prompt, chat_id } = req.body;

        if (!prompt || !chat_id) {
            return res.status(400).json({
                success: false,
                message: 'Prompt and chat ID are required',
                error: 'Missing prompt or chat ID in request body'
            });
        }

        const result = await contactAI(selectedModels, prompt, chat_id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message || 'Failed to contact AI',
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            message: 'AI contacted successfully',
            response: result.response
        });
    } catch (error) {
        console.error('Error in handleContactAI controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}


export async function handleStoreResponses(req, res) {
    try {
        const { chat_id, prompt_id, selectedModels, responses, tokens_used } = req.body;

        if (!chat_id || !prompt_id || !selectedModels || !responses || !tokens_used) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID, prompt ID, selected models, responses, and tokens used are required',
                error: 'Missing required fields in request body'
            });
        }

        const result = await storeResponses(chat_id, prompt_id, selectedModels, responses, tokens_used);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message || 'Failed to store responses',
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Responses stored successfully',
            response_id: result.response_id
        });
    } catch (error) {
        console.error('Error in handleStoreResponses controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
