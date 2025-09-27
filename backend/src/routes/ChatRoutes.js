import express from "express";
import { handleGetChatMessages } from "../controllers/chatController.js";
import { handleStorePrompt } from "../controllers/chatController.js";
import { handleContactAI } from "../controllers/chatController.js";
import { handleStoreResponses } from "../controllers/chatController.js";
import { handleEnhancePrompt } from "../controllers/chatController.js";

const router = express.Router();

router.post('/getChatMessages', handleGetChatMessages);
router.post('/enhancePrompt', handleEnhancePrompt);
router.post('/storePrompt', handleStorePrompt);
router.post('/contactAI', handleContactAI);
router.post('/storeResponses', handleStoreResponses);

export { router };