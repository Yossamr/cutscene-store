import { Router } from "express";
import { getProducts, getProductById, getProductReviews, addProductReview, joinWaitlist, searchAll } from "../controllers/productController";
import { verifyTicket } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getProducts);
router.get("/search", searchAll);
router.get("/:id", getProductById);
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", verifyTicket, addProductReview);
router.post("/:id/waitlist", joinWaitlist);

export default router;
