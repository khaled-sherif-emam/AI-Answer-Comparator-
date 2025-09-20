import express from "express";
import { handleGetChatMessages } from "../controllers/chatController.js";

const router = express.Router();

router.post('/getChatMessages', handleGetChatMessages);

export { router };