import express from "express";
import { handleUserName } from "../controllers/userInfoController.js";

const router = express.Router();

router.post('/handleUserName', handleUserName);

export default router;
