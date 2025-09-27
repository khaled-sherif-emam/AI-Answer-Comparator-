import express from 'express';
import { 
    handleGetGuestTokens, 
    handleStoreGuestPrompt, 
    handleContactAI,
    handleGetGuestMessages,
    handleStoreGuestResponse 
} from '../controllers/guestController.js';

const router = express.Router();

// Route for guest login
router.post('/handleGetGuestTokens', handleGetGuestTokens);
router.post('/handleStoreGuestPrompt', handleStoreGuestPrompt);
router.post('/handleContactAI', handleContactAI);
router.post('/handleGetGuestMessages', handleGetGuestMessages);
router.post('/handleStoreGuestResponse', handleStoreGuestResponse)

export default router;