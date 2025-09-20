import express from "express";
import { handleGetChats, handleNewChat } from "../controllers/sidebarControllers";

const router = express.Router();

router.post('/getChats', handleGetChats);
router.post('/newChat', handleNewChat);

export default router;