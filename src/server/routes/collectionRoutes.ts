import express from "express";
import { db } from "../db";
import crypto from "crypto";
import { verifyTicket } from "../middleware/authMiddleware";
import { isAdmin } from "../middleware/adminMiddleware";

const router = express.Router();

// Get all collections
router.get("/", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM collections ORDER BY name ASC");
    const collections = result.rows.map((row: any) => ({
      ...row,
      has_sub_collections: Boolean(row.has_sub_collections),
      sub_collections: row.sub_collections ? JSON.parse(row.sub_collections) : []
    }));
    res.json(collections);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create collection (Admin only)
router.post("/", verifyTicket, isAdmin, async (req, res) => {
  const { name, poster_url, description, spotify_url, status, has_sub_collections, sub_collections, category } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: "Collection name is required" });
  }

  try {
    const id = crypto.randomUUID();
    const subCollectionsJson = sub_collections ? JSON.stringify(sub_collections) : null;
    await db.execute({
      sql: "INSERT INTO collections (id, name, poster_url, description, spotify_url, status, has_sub_collections, sub_collections, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id, name, poster_url || null, description || null, spotify_url || null, status || 'available', has_sub_collections ? 1 : 0, subCollectionsJson, category || 'أفلام']
    });
    
    res.status(201).json({ 
      id, name, poster_url, description, spotify_url, status: status || 'available',
      has_sub_collections: Boolean(has_sub_collections),
      sub_collections: sub_collections || [],
      category: category || 'أفلام'
    });
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ message: "Collection name already exists" });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update collection (Admin only)
router.put("/:id", verifyTicket, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, poster_url, description, spotify_url, status, has_sub_collections, sub_collections, category } = req.body;

  try {
    const subCollectionsJson = sub_collections ? JSON.stringify(sub_collections) : null;
    await db.execute({
      sql: "UPDATE collections SET name = ?, poster_url = ?, description = ?, spotify_url = ?, status = ?, has_sub_collections = ?, sub_collections = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [name, poster_url, description, spotify_url, status || 'available', has_sub_collections ? 1 : 0, subCollectionsJson, category || 'أفلام', id]
    });
    res.json({ message: "Collection updated successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete collection (Admin only)
router.delete("/:id", verifyTicket, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if any products are using this collection
    const products = await db.execute({
      sql: "SELECT id FROM products WHERE collection_id = ?",
      args: [id]
    });

    if (products.rows.length > 0) {
      return res.status(400).json({ message: "Cannot delete collection that has products assigned to it." });
    }

    await db.execute({
      sql: "DELETE FROM collections WHERE id = ?",
      args: [id]
    });
    res.json({ message: "Collection deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
