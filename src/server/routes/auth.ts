import { Router } from "express";
import { register, login, getMe, getWatchlist, toggleWatchlist } from "../controllers/authController";
import { verifyTicket } from "../middleware/authMiddleware";

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new user
router.post("/register", register);

// @route   POST /api/auth/login
// @desc    Login user and get token
router.post("/login", login);

// @route   GET /api/auth/me
// @desc    Get current user data
router.get("/me", verifyTicket, getMe);

// @route   GET /api/auth/watchlist
// @desc    Get user's watchlist
router.get("/watchlist", verifyTicket, getWatchlist);

// @route   POST /api/auth/watchlist/toggle
// @desc    Add/remove from watchlist
router.post("/watchlist/toggle", verifyTicket, toggleWatchlist);

export default router;
