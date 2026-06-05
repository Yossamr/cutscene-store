import { Router } from "express";
import { trackEvent } from "../controllers/analyticsController";

const router = Router();

router.post("/track", trackEvent);

export default router;
