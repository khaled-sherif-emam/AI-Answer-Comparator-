import express from "express";
import { handleGetChats, 
        handleNewChat, 
        handleDeleteChat,
        handleRenameChat } from "../controllers/sidebarControllers.js";

const router = express.Router();

router.post('/getChats', handleGetChats);
router.post('/newChat', handleNewChat);
router.post('/deleteChat', handleDeleteChat);
router.post('/renameChat', handleRenameChat);

// Test route
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ success: true, message: 'Test route works!' });
});

export default router;