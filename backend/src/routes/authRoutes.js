import express from "express";
import { loginUser } from "../controllers/authController.js";
import { signupUser } from "../controllers/authController.js";
import { handleUserInfo } from "../controllers/authController.js";
import { checkSession } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/signup", signupUser);
router.post("/handleUserInfo", handleUserInfo);
router.post("/checkSession", checkSession);

export default router;
