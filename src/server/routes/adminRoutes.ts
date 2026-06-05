import { Router } from "express";
import { 
  getProducts, createProduct, updateProduct, deleteProduct, 
  getAllOrders, updateOrderStatus, deleteOrder, getStats, resetStats,
  getUsers, toggleUserStatus, getAuditLogs, getCouponStats, getSalesReports, exportDatabase
} from "../controllers/adminController";
import { createCoupon, getCoupons, deleteCoupon, toggleCouponStatus } from "../controllers/couponController";
import { verifyTicket } from "../middleware/authMiddleware";
import { isAdmin } from "../middleware/adminMiddleware";

const router = Router();

// Protect all admin routes with verifyTicket and isAdmin middlewares
router.use(verifyTicket, isAdmin);

router.get("/stats", getStats);
router.post("/stats/reset", resetStats);
router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.delete("/orders/:id", deleteOrder);

router.get("/coupons", getCoupons);
router.post("/coupons", createCoupon);
router.delete("/coupons/:id", deleteCoupon);
router.put("/coupons/:id/toggle", toggleCouponStatus);

// New Routes
router.get("/users", getUsers);
router.put("/users/:id/toggle", toggleUserStatus);
router.get("/audit-logs", getAuditLogs);
router.get("/coupon-stats", getCouponStats);
router.get("/sales-reports", getSalesReports);
router.post("/export-db", exportDatabase);
router.post("/automation/fetch-titles", async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: "Invalid input. Expected array of urls." });
  }

  try {
    const fetchPromises = urls.map(async (url) => {
      if (!url.includes("drive.google.com/file/d/")) {
        return { url, title: "Invalid Drive Link", error: true };
      }
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const text = await response.text();
        const titleMatch = text.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : "No title found";
        return { url, title };
      } catch (err: any) {
        return { url, title: err.message, error: true };
      }
    });

    const results = await Promise.all(fetchPromises);
    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
