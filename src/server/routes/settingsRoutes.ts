import { Router } from "express";
import { getSettings, updateSettings, testTelegram } from "../controllers/settingsController";
import { verifyTicket } from "../middleware/authMiddleware";
import { isAdmin } from "../middleware/adminMiddleware";

const router = Router();

// Public route to get settings
router.get("/", getSettings);

// Admin route to update settings
router.put("/", verifyTicket, isAdmin, updateSettings);

// Admin route to test telegram
router.post("/test-telegram", verifyTicket, isAdmin, testTelegram);

export default router;
