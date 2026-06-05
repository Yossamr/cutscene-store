import { Router } from "express";
import { createOrder, createPaymentIntent, getMyOrders, cancelOrder } from "../controllers/orderController";
import { verifyTicket, optionalVerifyTicket } from "../middleware/authMiddleware";

const router = Router();

router.post("/create-payment-intent", optionalVerifyTicket, createPaymentIntent);
router.post("/", optionalVerifyTicket, createOrder);
router.get("/my-orders", verifyTicket, getMyOrders);
router.put("/:id/cancel", verifyTicket, cancelOrder);

export default router;
