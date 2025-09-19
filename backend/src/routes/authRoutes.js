import express from "express";
import { loginUser } from "../controllers/authController.js";
import { signupUser } from "../controllers/authController.js";
import { handleUserInfo } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/signup", signupUser);
router.post("/handleUserInfo", handleUserInfo);

export default router;
