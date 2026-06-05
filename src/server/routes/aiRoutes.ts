import { Router } from "express";
import { 
  vibeSearch, 
  generateDescription, 
  chat,
  getSocialPosts,
  createSocialPost,
  updateSocialPost,
  deleteSocialPost,
  generateSocialPlan,
  generateSocialImage
} from "../controllers/aiController";
import { verifyTicket } from "../middleware/authMiddleware";
import { isAdmin } from "../middleware/adminMiddleware";

const router = Router();

// Public route for vibe search
router.post("/vibe-search", vibeSearch);

// Public route for chatbot
router.post("/chat", chat);

// Protected route for generating descriptions (Admin only)
router.post("/generate-description", verifyTicket, isAdmin, generateDescription);

// Social Media AI endpoints (Admin only)
router.get("/social-posts", verifyTicket, isAdmin, getSocialPosts);
router.post("/social-posts", verifyTicket, isAdmin, createSocialPost);
router.put("/social-posts/:id", verifyTicket, isAdmin, updateSocialPost);
router.delete("/social-posts/:id", verifyTicket, isAdmin, deleteSocialPost);
router.post("/generate-social-plan", verifyTicket, isAdmin, generateSocialPlan);
router.post("/generate-social-image", verifyTicket, isAdmin, generateSocialImage);

export default router;
