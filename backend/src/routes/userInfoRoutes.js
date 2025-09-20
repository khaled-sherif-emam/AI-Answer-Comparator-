import express from "express";
import { handleUserName, handleGetSubscription, handleGetUserTokens } from "../controllers/userInfoController.js";

const router = express.Router();

router.post('/handleUserName', handleUserName);
router.post('/handleGetSubscription', handleGetSubscription);
router.post('/handleGetUserTokens', handleGetUserTokens);

export default router;
