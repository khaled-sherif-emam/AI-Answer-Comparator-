import express from "express";
import { handleUserName, 
    handleGetSubscription, 
    handleGetUserTokens, 
    handleGetGuestTokens } from "../controllers/userInfoController.js";

const router = express.Router();

router.post('/handleUserName', handleUserName);
router.post('/handleGetSubscription', handleGetSubscription);
router.post('/handleGetUserTokens', handleGetUserTokens);
router.post('/handleGetGuestTokens', handleGetGuestTokens);

export default router;
