import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { AuthRequest } from "../middleware/authMiddleware";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";

export const register = async (req: Request, res: Response) => {
  try {
    const { phone, password, name, favoriteGenres } = req.body;

    // Check if audience member already exists
    const existingUser = await db.execute({
      sql: "SELECT * FROM users WHERE phone = ?",
      args: [phone],
    });

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Phone number already registered for the premiere." });
    }

    // Hashing the password (securing the script)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Saving the new audience member
    const id = crypto.randomUUID();
    await db.execute({
      sql: "INSERT INTO users (id, phone, password, name, favorite_genres) VALUES (?, ?, ?, ?, ?)",
      args: [id, phone, hashedPassword, name, JSON.stringify(favoriteGenres || [])],
    });

    res.status(201).json({ message: "Registration successful! Welcome to the Box Office." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error during registration." });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    console.log(`Login attempt for phone: ${phone}`);

    // Find the audience member
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE phone = ?",
      args: [phone],
    });

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials. Ticket not found." });
    }

    const user = result.rows[0];
    console.log(`🎬 User found: ${user.id}, hashed password length: ${user.password?.length}`);

    // Verify the password
    const isMatch = await bcrypt.compare(password, user.password as string);
    console.log(`🎬 Password match result: ${isMatch}`);
    
    if (!isMatch) {
      console.log(`🎬 Password mismatch for user: ${phone}`);
      return res.status(400).json({ message: "Invalid credentials. Ticket not found." });
    }

    // Generating the VIP Ticket (JWT)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful! Enjoy the show.",
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        points: user.points || 0,
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error during login." });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await db.execute({
      sql: "SELECT id, name, phone, role, points FROM users WHERE id = ?",
      args: [userId],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      points: user.points || 0,
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};

export const getWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT p.* FROM products p
        JOIN watchlist w ON p.id = w.product_id
        WHERE w.user_id = ?
      `,
      args: [req.user?.id],
    });
    
    // Parse JSON fields if necessary
    const watchlist = result.rows.map(row => ({
      ...row,
      genres: JSON.parse(row.genres as string || "[]"),
    }));

    res.json(watchlist);
  } catch (error) {
    console.error("Watchlist fetch error:", error);
    res.status(500).json({ message: "Failed to fetch watchlist" });
  }
};

export const toggleWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const existing = await db.execute({
      sql: "SELECT * FROM watchlist WHERE user_id = ? AND product_id = ?",
      args: [userId, productId],
    });

    if (existing.rows.length > 0) {
      await db.execute({
        sql: "DELETE FROM watchlist WHERE user_id = ? AND product_id = ?",
        args: [userId, productId],
      });
      return res.json({ message: "Removed from watchlist", added: false });
    } else {
      await db.execute({
        sql: "INSERT INTO watchlist (user_id, product_id) VALUES (?, ?)",
        args: [userId, productId],
      });
      await db.execute({
        sql: "INSERT INTO analytics_events (id, event_type, target_id, user_id) VALUES (?, ?, ?, ?)",
        args: [crypto.randomUUID(), 'add_to_watchlist', productId, userId],
      });
      return res.json({ message: "Added to watchlist", added: true });
    }
  } catch (error) {
    console.error("Toggle watchlist error:", error);
    res.status(500).json({ message: "Failed to update watchlist" });
  }
};

export const seedAdmin = async () => {
  console.log("🎬 Checking for admin account...");
  try {
    const adminPhone = "00000000000";
    const adminPassword = "0000";
    
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE phone = ?",
      args: [adminPhone],
    });

    console.log(`🎬 Admin check result: ${result.rows.length} users found.`);

    if (result.rows.length === 0) {
      console.log("🎬 Seeding admin account...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      const id = crypto.randomUUID();
      await db.execute({
        sql: "INSERT INTO users (id, phone, password, name, role) VALUES (?, ?, ?, ?, ?)",
        args: [id, adminPhone, hashedPassword, "Admin", "admin"],
      });
      
      console.log("🎬 Admin account seeded successfully!");
    } else {
      console.log("🎬 Admin account already exists.");
    }
  } catch (error) {
    console.error("❌ Admin seeding error:", error);
  }
};
