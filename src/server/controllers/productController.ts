import { Request, Response } from "express";
import { db } from "../db";

import crypto from "crypto";

// @desc    Get all products
// @route   GET /api/products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const result = await db.execute(`
      SELECT p.*, c.name as collection_name, c.poster_url as collection_poster, c.spotify_url as collection_spotify_url, c.status as collection_status, c.category as collection_category
      FROM products p
      LEFT JOIN collections c ON p.collection_id = c.id
      WHERE p.is_hidden = 0
      ORDER BY p.created_at DESC
    `);
    const products = result.rows.map(row => ({
      ...row,
      genres: JSON.parse(row.genres as string || "[]"),
      images: {
        main: row.image_main,
        trailer: row.image_trailer,
        additional: JSON.parse(row.images as string || "[]"),
      },
      availableSizes: JSON.parse(row.sizes as string || '["S", "M", "L"]'),
      colors: JSON.parse(row.colors as string || "[]"),
      btsContent: JSON.parse(row.bts_content as string || "null"),
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l,
      },
      isComingSoon: !!row.is_coming_soon,
      isGallery: !!row.is_gallery,
      collectionId: row.collection_id as string,
      spotifyUrl: row.collection_spotify_url as string,
      franchise: (row.collection_name as string) || (row.franchise as string),
      collectionStatus: row.collection_status as string,
      subCollection: row.sub_collection as string,
      season: row.season as string,
      collection: row.collection_id ? {
        id: row.collection_id,
        name: row.collection_name,
        poster: row.collection_poster,
        spotifyUrl: row.collection_spotify_url,
        status: row.collection_status,
        category: row.collection_category
      } : null
    }));
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products." });
  }
};

// @desc    Global search across products and collections
// @route   GET /api/products/search
export const searchAll = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    console.log(`Global search initiated for: "${q}"`);
    
    if (!q) return res.json({ products: [], collections: [] });

    const query = `%${q}%`;

    // Search products
    const productsResult = await db.execute({
      sql: `
        SELECT p.*, c.name as collection_name, c.status as collection_status, c.category as collection_category
        FROM products p
        LEFT JOIN collections c ON p.collection_id = c.id
        WHERE (p.title LIKE ? OR p.description LIKE ? OR c.name LIKE ?)
        AND (c.status IS NULL OR c.status != 'coming_soon')
        AND p.is_hidden = 0
        LIMIT 20
      `,
      args: [query, query, query]
    });

    // Search collections
    const collectionsResult = await db.execute({
      sql: "SELECT * FROM collections WHERE (name LIKE ? OR description LIKE ?) AND status != 'coming_soon' LIMIT 10",
      args: [query, query]
    });

    console.log(`Search results: ${productsResult.rows.length} products, ${collectionsResult.rows.length} collections`);

    const products = productsResult.rows.map(row => ({
      ...row,
      genres: JSON.parse(row.genres as string || "[]"),
      images: {
        main: row.image_main,
        trailer: row.image_trailer,
        additional: JSON.parse(row.images as string || "[]"),
      },
      availableSizes: JSON.parse(row.sizes as string || '["S", "M", "L"]'),
      colors: JSON.parse(row.colors as string || "[]"),
      btsContent: JSON.parse(row.bts_content as string || "null"),
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l,
      },
      isComingSoon: !!row.is_coming_soon,
      isBoxOfficeHit: !!row.is_box_office_hit,
      isGallery: !!row.is_gallery,
      franchise: (row.collection_name as string) || (row.franchise as string),
      subCollection: row.sub_collection as string,
      season: row.season as string,
      collectionStatus: row.collection_status as string,
    }));

    res.json({
      products,
      collections: collectionsResult.rows
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search failed." });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
export const getProductById = async (req: Request, res: Response) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT p.*, c.name as collection_name, c.poster_url as collection_poster, c.spotify_url as collection_spotify_url, c.status as collection_status, c.category as collection_category
        FROM products p
        LEFT JOIN collections c ON p.collection_id = c.id
        WHERE p.id = ? AND p.is_hidden = 0
      `,
      args: [req.params.id],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found." });
    }

    const row = result.rows[0];
    const product = {
      ...row,
      genres: JSON.parse(row.genres as string || "[]"),
      images: {
        main: row.image_main,
        trailer: row.image_trailer,
        additional: JSON.parse(row.images as string || "[]"),
      },
      availableSizes: JSON.parse(row.sizes as string || '["S", "M", "L"]'),
      colors: JSON.parse(row.colors as string || "[]"),
      btsContent: JSON.parse(row.bts_content as string || "null"),
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l,
      },
      isComingSoon: !!row.is_coming_soon,
      isGallery: !!row.is_gallery,
      collectionId: row.collection_id as string,
      spotifyUrl: row.collection_spotify_url as string,
      franchise: (row.collection_name as string) || (row.franchise as string),
      collectionStatus: row.collection_status as string,
      subCollection: row.sub_collection as string,
      season: row.season as string,
      collection: row.collection_id ? {
        id: row.collection_id,
        name: row.collection_name,
        poster: row.collection_poster,
        spotifyUrl: row.collection_spotify_url,
        status: row.collection_status,
        category: row.collection_category
      } : null
    };

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Failed to fetch product." });
  }
};

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT r.*, u.name as user_name 
        FROM reviews r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.product_id = ? 
        ORDER BY r.created_at DESC
      `,
      args: [req.params.id],
    });
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews." });
  }
};

// @desc    Add product review
// @route   POST /api/products/:id/reviews
export const addProductReview = async (req: Request, res: Response) => {
  try {
    const { rating, comment, imageUrl } = req.body;
    const userId = (req as any).user.id;
    const productId = req.params.id;

    await db.execute({
      sql: "INSERT INTO reviews (id, product_id, user_id, rating, comment, image_url) VALUES (?, ?, ?, ?, ?, ?)",
      args: [crypto.randomUUID(), productId, userId, rating, comment, imageUrl || null],
    });

    // Update product rating
    const reviewsResult = await db.execute({
      sql: "SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ?",
      args: [productId]
    });
    
    const avgRating = reviewsResult.rows[0].avg_rating || 0;
    const count = reviewsResult.rows[0].count || 0;

    await db.execute({
      sql: "UPDATE products SET rating = ?, review_count = ? WHERE id = ?",
      args: [avgRating, count, productId]
    });

    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Failed to add review." });
  }
};

// @desc    Join waitlist
// @route   POST /api/products/:id/waitlist
export const joinWaitlist = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const productId = req.params.id;

    // Check if already in waitlist
    const existing = await db.execute({
      sql: "SELECT id FROM waitlist WHERE product_id = ? AND user_email = ?",
      args: [productId, email]
    });

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "You are already on the waitlist for this item." });
    }

    await db.execute({
      sql: "INSERT INTO waitlist (id, product_id, user_email) VALUES (?, ?, ?)",
      args: [crypto.randomUUID(), productId, email],
    });

    res.status(201).json({ message: "Successfully joined the waitlist!" });
  } catch (error) {
    console.error("Error joining waitlist:", error);
    res.status(500).json({ message: "Failed to join waitlist." });
  }
};
