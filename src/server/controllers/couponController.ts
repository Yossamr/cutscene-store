import { Request, Response } from "express";
import { db } from "../db";
import crypto from "crypto";

// @desc    Create a new coupon (Admin)
// @route   POST /api/admin/coupons
export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { code, discountType, discountValue, minPurchase, isActive, expiryDate } = req.body;

    const existingResult = await db.execute({
      sql: "SELECT * FROM coupons WHERE code = ?",
      args: [code.toUpperCase()],
    });

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: "Coupon code already exists." });
    }

    const id = crypto.randomUUID();
    await db.execute({
      sql: "INSERT INTO coupons (id, code, discount_type, discount_value, min_purchase, is_active, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        id, 
        code.toUpperCase(), 
        discountType || 'percentage', 
        discountValue || 0, 
        minPurchase || 0,
        isActive !== false ? 1 : 0, 
        expiryDate || null
      ],
    });

    res.status(201).json({ id, code, discountType, discountValue, minPurchase, isActive, expiryDate });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Failed to create coupon." });
  }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/admin/coupons
export const getCoupons = async (req: Request, res: Response) => {
  try {
    const result = await db.execute("SELECT * FROM coupons ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Failed to fetch coupons." });
  }
};

// @desc    Delete a coupon (Admin)
// @route   DELETE /api/admin/coupons/:id
export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: "DELETE FROM coupons WHERE id = ?",
      args: [id],
    });
    res.json({ message: "Coupon deleted successfully." });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ message: "Failed to delete coupon." });
  }
};

// @desc    Toggle coupon status (Admin)
// @route   PUT /api/admin/coupons/:id/toggle
export const toggleCouponStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.execute({
      sql: "SELECT is_active FROM coupons WHERE id = ?",
      args: [id],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    const currentStatus = result.rows[0].is_active;
    const newStatus = currentStatus ? 0 : 1;

    await db.execute({
      sql: "UPDATE coupons SET is_active = ? WHERE id = ?",
      args: [newStatus, id],
    });

    res.json({ message: "Coupon status updated.", isActive: !!newStatus });
  } catch (error) {
    console.error("Error toggling coupon status:", error);
    res.status(500).json({ message: "Failed to toggle coupon status." });
  }
};

// @desc    Validate a coupon code (Public)
// @route   POST /api/coupons/validate
export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required." });
    }

    const result = await db.execute({
      sql: "SELECT * FROM coupons WHERE code = ?",
      args: [code.toUpperCase()],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Invalid cheat code." });
    }

    const coupon = result.rows[0];

    if (!coupon.is_active) {
      return res.status(400).json({ message: "This cheat code is no longer active." });
    }

    if (coupon.expiry_date && new Date(coupon.expiry_date as string) < new Date()) {
      return res.status(400).json({ message: "This cheat code has expired." });
    }

    if (cartTotal && coupon.min_purchase > 0 && cartTotal < coupon.min_purchase) {
      return res.status(400).json({ message: `Minimum purchase of ${coupon.min_purchase} EGP required.` });
    }

    let message = "Cheat Code Activated!";
    if (coupon.discount_type === 'percentage') message = `${coupon.discount_value}% off applied!`;
    else if (coupon.discount_type === 'fixed') message = `${coupon.discount_value} EGP discount applied!`;
    else if (coupon.discount_type === 'free_shipping') message = `Free shipping activated!`;
    else if (coupon.discount_type === 'b2g1') message = `Buy 2 Get 1 Free activated!`;

    res.json({
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      message,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Failed to validate coupon." });
  }
};
