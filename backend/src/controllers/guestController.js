import dotenv from 'dotenv';
import { 
    getGuestTokens, 
    storeGuestPrompt, 
    contactAI,
    getGuestMessages,
    storeGuestResponse
} from '../services/guestServices.js';

dotenv.config();

export const handleGetGuestTokens = async (req, res) => {
    try {
        const {guest_id} = req.body;
        const {data, error} = await getGuestTokens(guest_id);
        if (error) {
            return res.status(500).json({error: error.message});
        }
        // Return the tokens in the root of the response
        return res.status(200).json({
            success: true,
            available_tokens: data.available_tokens,
            allocated_tokens: data.allocated_tokens
        });
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

export const handleStoreGuestPrompt = async (req, res) => {
    try {
        const {guest_id, prompt, selected_models} = req.body;
        const result = await storeGuestPrompt(guest_id, prompt, selected_models);
        
        if (!result || !result.success) {
            return res.status(500).json({
                success: false,
                message: result?.message || 'Failed to store prompt',
                error: result?.error || 'Unknown error'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

export const handleGetGuestMessages = async (req, res) => {
    try {
        const { guest_id } = req.body;
        
        if (!guest_id) {
            return res.status(400).json({
                success: false,
                message: 'Guest ID is required',
                error: 'MISSING_GUEST_ID'
            });
        }
        
        const result = await getGuestMessages(guest_id);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message || 'Failed to fetch guest messages',
                error: result.error
            });
        }
        
        return res.status(200).json({
            success: true,
            messages: result.messages
        });
        
    } catch (error) {
        console.error('Error in handleGetGuestMessages:', error);
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred while fetching guest messages',
            error: error.message
        });
    }
};

export const handleContactAI = async (req, res) => {
    try {
        const {guest_id, prompt_to_answer, selected_models} = req.body;
        console.log('Received contact AI request:', { guest_id, prompt_to_answer, selected_models });
        const result = await contactAI(guest_id, prompt_to_answer, selected_models);
        
        if (!result || !result.success) {
            return res.status(500).json({
                success: false,
                message: result?.message || 'Failed to contact AI',
                error: result?.error || 'Unknown error'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}

export const handleStoreGuestResponse = async (req, res) => {
    try {
        const {guest_id, models_used, responses, tokens_used} = req.body;
        console.log('Received store guest response request:', { guest_id, responses, models_used, tokens_used });
        const result = await storeGuestResponse(guest_id, responses, models_used, tokens_used);
        
        if (!result || !result.success) {
            return res.status(500).json({
                success: false,
                message: result?.message || 'Failed to store guest response',
                error: result?.error || 'Unknown error'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).json({error: error.message});
    }
}