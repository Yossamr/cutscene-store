import { Request, Response } from "express";
import { db } from "../db";
import crypto from "crypto";

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const result = await db.execute(`
      SELECT p.*, c.name as collection_name, c.poster_url as collection_poster, c.spotify_url as collection_spotify_url
      FROM products p
      LEFT JOIN collections c ON p.collection_id = c.id
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
      hasColorVariants: row.has_color_variants === 1,
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l,
      },
      isComingSoon: !!row.is_coming_soon,
      isBoxOfficeHit: !!row.is_box_office_hit,
      isHidden: !!row.is_hidden,
      isGallery: !!row.is_gallery,
      season: row.season as string,
      collectionId: row.collection_id as string,
      subCollection: row.sub_collection as string,
      spotifyUrl: row.collection_spotify_url as string,
      collection: row.collection_id ? {
        id: row.collection_id as string,
        name: row.collection_name as string,
        poster: row.collection_poster as string,
        spotifyUrl: row.collection_spotify_url as string
      } : null
    }));
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch set list." });
  }
};

// @desc    Create a new product
// @route   POST /api/admin/products
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { title, description, price, genres, images, colors, hasColorVariants, inventory, isBoxOfficeHit, availableSizes, isComingSoon, isHidden, franchise, collectionId, subCollection, season, isGallery, btsContent } = req.body;
    const id = crypto.randomUUID();
    
    await db.execute({
      sql: `INSERT INTO products (
        id, title, description, price, genres, image_main, image_trailer, images, colors, has_color_variants, sizes,
        inventory_s, inventory_m, inventory_l, is_box_office_hit, is_coming_soon, is_hidden, franchise, collection_id, sub_collection, season, is_gallery, bts_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, title, description, price, JSON.stringify(genres || []), 
        images.main, images.trailer || null, JSON.stringify(images.additional || []),
        JSON.stringify(colors || []),
        hasColorVariants ? 1 : 0,
        JSON.stringify(availableSizes || ["S", "M", "L"]),
        inventory.S || 0, inventory.M || 0, inventory.L || 0,
        isBoxOfficeHit ? 1 : 0,
        isComingSoon ? 1 : 0,
        isHidden ? 1 : 0,
        franchise || null,
        collectionId || null,
        subCollection || null,
        season || 'all-season',
        isGallery ? 1 : 0,
        JSON.stringify(btsContent || null)
      ],
    });

    res.status(201).json({ id, ...req.body });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({ message: "Failed to create product. Check your script." });
  }
};

// @desc    Update a product
// @route   PUT /api/admin/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { title, description, price, genres, images, colors, hasColorVariants, inventory, isBoxOfficeHit, availableSizes, isComingSoon, isHidden, franchise, collectionId, subCollection, season, isGallery, btsContent } = req.body;
    const id = req.params.id;

    const result = await db.execute({
      sql: `UPDATE products SET 
        title = ?, description = ?, price = ?, genres = ?, 
        image_main = ?, image_trailer = ?, images = ?, colors = ?, has_color_variants = ?, sizes = ?,
        inventory_s = ?, inventory_m = ?, inventory_l = ?, 
        is_box_office_hit = ?, is_coming_soon = ?, is_hidden = ?, franchise = ?, collection_id = ?, sub_collection = ?, season = ?, is_gallery = ?, bts_content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
      args: [
        title, description, price, JSON.stringify(genres || []), 
        images.main, images.trailer || null, JSON.stringify(images.additional || []),
        JSON.stringify(colors || []),
        hasColorVariants ? 1 : 0,
        JSON.stringify(availableSizes || ["S", "M", "L"]),
        inventory.S || 0, inventory.M || 0, inventory.L || 0,
        isBoxOfficeHit ? 1 : 0, 
        isComingSoon ? 1 : 0,
        isHidden ? 1 : 0,
        franchise || null,
        collectionId || null,
        subCollection || null,
        season || 'all-season',
        isGallery ? 1 : 0,
        JSON.stringify(btsContent || null),
        id
      ]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Product not found on set." });
    }

    res.json({ id, ...req.body });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({ message: "Failed to update product." });
  }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // 1. Check if product has order history
    const orderCheck = await db.execute({
      sql: "SELECT COUNT(*) as count FROM order_items WHERE product_id = ?",
      args: [id]
    });

    if (Number(orderCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: "This product has order history and cannot be deleted. Use the 'Hide' feature instead to remove it from the shop." 
      });
    }

    // 2. Clean up related records
    await db.execute({ sql: "DELETE FROM watchlist WHERE product_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM waitlist WHERE product_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM reviews WHERE product_id = ?", args: [id] });

    // 3. Delete the product
    const result = await db.execute({
      sql: "DELETE FROM products WHERE id = ?",
      args: [id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Product not found on set." });
    }

    res.json({ message: "Product cut from the scene successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product. It may be linked to other records." });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    // This is more complex because we need to join with users and items
    const ordersResult = await db.execute(`
      SELECT o.*, u.name as user_name, u.phone as user_phone_account
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    const orders = [];
    for (const order of ordersResult.rows) {
      const itemsResult = await db.execute({
        sql: `
          SELECT oi.*, p.title as product_title, p.image_main as product_image
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `,
        args: [order.id],
      });

      orders.push({
        ...order,
        user: {
          name: order.full_name || order.user_name,
          phone: order.phone || order.user_phone_account,
        },
        items: itemsResult.rows.map(item => ({
          ...item,
          custom_text: item.custom_text,
          product: {
            id: item.product_id,
            title: item.product_title,
            images: { main: item.product_image }
          }
        }))
      });
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const result = await db.execute({
      sql: "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [status, req.params.id],
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Log the action
    try {
      await db.execute({
        sql: "INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)",
        args: [
          crypto.randomUUID(),
          (req as any).user.id,
          "UPDATE_ORDER_STATUS",
          `Updated order ${req.params.id} status to ${status}`
        ],
      });
    } catch (logError) {
      console.error("Failed to log audit event:", logError);
    }

    res.json({ id: req.params.id, status });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(400).json({ message: "Failed to update order status." });
  }
};

// @desc    Delete order completely
// @route   DELETE /api/admin/orders/:id
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    
    const transaction = await db.transaction("write");
    try {
      await transaction.execute({
        sql: "DELETE FROM order_items WHERE order_id = ?",
        args: [orderId],
      });
      
      const result = await transaction.execute({
        sql: "DELETE FROM orders WHERE id = ?",
        args: [orderId],
      });

      if (result.rowsAffected === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found." });
      }

      await transaction.commit();

      // Log the action
      try {
        await db.execute({
          sql: "INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)",
          args: [
            crypto.randomUUID(),
            (req as any).user.id,
            "DELETE_ORDER",
            `Deleted order ${orderId}`
          ],
        });
      } catch (logError) {
        console.error("Failed to log audit event:", logError);
      }

      res.json({ message: "Order deleted successfully." });
    } catch (err: any) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Failed to delete order." });
  }
};

// @desc    Reset dashboard stats

// @route   POST /api/admin/stats/reset
export const resetStats = async (req: Request, res: Response) => {
  try {
    await db.execute("DELETE FROM analytics_events");
    res.json({ message: "Statistics reset successfully." });
  } catch (error) {
    console.error("Error resetting stats:", error);
    res.status(500).json({ message: "Failed to reset statistics." });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
export const getStats = async (req: Request, res: Response) => {
  try {
    // 1. Total Visitors (Page Views)
    const visitorsResult = await db.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_view'");
    const totalVisitors = visitorsResult.rows[0].count;

    // 1.1 Active Visitors (Last 5 minutes)
    const activeVisitorsResult = await db.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_view' AND created_at >= datetime('now', '-5 minutes')");
    const activeVisitors = activeVisitorsResult.rows[0].count;

    // 2. Most Viewed Products
    const topViewsResult = await db.execute(`
      SELECT target_id, COUNT(*) as views 
      FROM analytics_events 
      WHERE event_type = 'product_view' AND target_id IS NOT NULL
      GROUP BY target_id 
      ORDER BY views DESC 
      LIMIT 10
    `);
    
    const topViewedProducts = [];
    for (const row of topViewsResult.rows) {
      const product = await db.execute({
        sql: "SELECT title FROM products WHERE id = ?",
        args: [row.target_id]
      });
      if (product.rows.length > 0) {
        topViewedProducts.push({
          title: product.rows[0].title,
          views: Number(row.views)
        });
      }
    }

    // 3. Low Stock Count
    const lowStockCountResult = await db.execute("SELECT COUNT(*) as count FROM products WHERE (inventory_s + inventory_m + inventory_l) < 5");
    const lowStockCount = Number(lowStockCountResult.rows[0].count);

    // 4. Total Revenue
    const revenueResult = await db.execute("SELECT SUM(total_amount) as total FROM orders WHERE status != 'Cancelled'");
    const totalRevenue = Number(revenueResult.rows[0].total || 0);

    // 5. Conversion Rate (Orders / Page Views)
    const ordersCountResult = await db.execute("SELECT COUNT(*) as count FROM orders");
    const ordersCount = Number(ordersCountResult.rows[0].count);
    const visitorsCount = Number(totalVisitors);
    const conversionRate = visitorsCount > 0 ? ((ordersCount / visitorsCount) * 100).toFixed(2) + "%" : "0%";

    // 6. Revenue by Day (Last 7 days)
    const revenueByDayResult = await db.execute(`
      SELECT DATE(created_at) as date, SUM(total_amount) as total
      FROM orders
      WHERE created_at >= date('now', '-7 days') AND status != 'Cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Fill in missing days for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const revenueByDay = last7Days.map(date => {
      const found = revenueByDayResult.rows.find(r => r.date === date);
      return {
        date,
        total: found ? Number(found.total) : 0
      };
    });

    // 7. Popular Genres (based on product views)
    const popularGenresResult = await db.execute(`
      SELECT j.value as genre, COUNT(*) as views
      FROM analytics_events a
      JOIN products p ON a.target_id = p.id
      JOIN json_each(p.genres) j
      WHERE a.event_type = 'product_view' AND a.target_id IS NOT NULL
      GROUP BY j.value
      ORDER BY views DESC
      LIMIT 5
    `);

    let popularGenres = popularGenresResult.rows.map(row => ({ genre: String(row.genre), views: Number(row.views) }));
    
    // If no genre data, provide some dummy data so the chart isn't completely empty
    if (popularGenres.length === 0) {
      popularGenres = [
        { genre: "Action", views: 1 },
        { genre: "Drama", views: 1 }
      ];
    }

    // 8. Top Customers (by total spend)
    const topCustomersResult = await db.execute(`
      SELECT u.name, u.phone, SUM(o.total_amount) as total_spend
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status != 'Cancelled'
      GROUP BY u.id
      ORDER BY total_spend DESC
      LIMIT 5
    `);

    // 9. Abandoned Carts
    const addToCartCountResult = await db.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'add_to_cart'");
    const addToCartCount = Number(addToCartCountResult.rows[0].count);
    let cartAbandonmentRate = "0%";
    let abandonedCount = 0;
    if (addToCartCount > 0) {
      abandonedCount = Math.max(0, addToCartCount - ordersCount);
      cartAbandonmentRate = ((abandonedCount / addToCartCount) * 100).toFixed(1) + "%";
    }

    // 10. Most Added to Cart
    const mostAddedToCartResult = await db.execute(`
      SELECT p.title, COUNT(*) as count
      FROM analytics_events a
      JOIN products p ON a.target_id = p.id
      WHERE a.event_type = 'add_to_cart' AND a.target_id IS NOT NULL
      GROUP BY p.title
      ORDER BY count DESC
      LIMIT 5
    `);

    // 11. Most Wishlisted
    const mostWishlistedResult = await db.execute(`
      SELECT p.title, COUNT(*) as count
      FROM analytics_events a
      JOIN products p ON a.target_id = p.id
      WHERE a.event_type = 'add_to_watchlist' AND a.target_id IS NOT NULL
      GROUP BY p.title
      ORDER BY count DESC
      LIMIT 5
    `);

    // 12. Top Governorates
    const topGovernoratesResult = await db.execute(`
      SELECT governorate, COUNT(*) as count
      FROM orders
      WHERE status != 'Cancelled' AND governorate IS NOT NULL AND governorate != ''
      GROUP BY governorate
      ORDER BY count DESC
      LIMIT 5
    `);

    // 13. Sales by Category
    const salesByCategoryResult = await db.execute(`
      SELECT p.is_gallery, SUM(oi.quantity) as sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'Cancelled'
      GROUP BY p.is_gallery
    `);
    
    const salesByCategory = {
      posters: 0,
      clothing: 0
    };
    
    salesByCategoryResult.rows.forEach(r => {
      if (r.is_gallery) {
        salesByCategory.posters = Number(r.sold);
      } else {
        salesByCategory.clothing = Number(r.sold);
      }
    });

    // 14. Top Selling Products
    const topSellingProductsResult = await db.execute(`
      SELECT p.title, SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'Cancelled'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    res.json({
      totalVisitors,
      activeVisitors,
      topViewedProducts,
      lowStockCount,
      totalRevenue,
      conversionRate,
      revenueByDay,
      popularGenres,
      topCustomers: topCustomersResult.rows.map(row => ({ name: row.name, phone: row.phone, total_spend: Number(row.total_spend) })),
      topProduct: topViewedProducts[0] || { title: "None" },
      cartAbandonmentRate,
      abandonedCount,
      mostAddedToCart: mostAddedToCartResult.rows.map(r => ({ title: r.title, count: Number(r.count) })),
      mostWishlisted: mostWishlistedResult.rows.map(r => ({ title: r.title, count: Number(r.count) })),
      topGovernorates: topGovernoratesResult.rows.map(r => ({ governorate: r.governorate, count: Number(r.count) })),
      salesByCategory,
      topSellingProducts: topSellingProductsResult.rows.map(r => ({ title: r.title, count: Number(r.total_sold) }))
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await db.execute("SELECT id, name, phone, role, is_active, points FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

// @desc    Toggle user status (block/unblock)
// @route   PUT /api/admin/users/:id/toggle
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const result = await db.execute({
      sql: "UPDATE users SET is_active = NOT is_active WHERE id = ?",
      args: [id],
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User status updated." });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ message: "Failed to update user status." });
  }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const result = await db.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Failed to fetch audit logs." });
  }
};

// @desc    Get coupon stats
// @route   GET /api/admin/coupon-stats
export const getCouponStats = async (req: Request, res: Response) => {
  try {
    const result = await db.execute(`
      SELECT c.code, COUNT(o.id) as usage_count
      FROM coupons c
      LEFT JOIN orders o ON o.coupon_code = c.code
      GROUP BY c.code
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching coupon stats:", error);
    res.status(500).json({ message: "Failed to fetch coupon stats." });
  }
};

// @desc    Get sales reports
// @route   GET /api/admin/sales-reports
export const getSalesReports = async (req: Request, res: Response) => {
  try {
    const result = await db.execute(`
      SELECT p.title, SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching sales reports:", error);
    res.status(500).json({ message: "Failed to fetch sales reports." });
  }
};

import fs from 'fs';
import path from 'path';

// @desc    Export public database for static deployment (GitHub Pages)
// @route   POST /api/admin/export-db
export const exportDatabase = async (req: Request, res: Response) => {
  try {
    // 1. Fetch Collections
    const collectionsRes = await db.execute("SELECT * FROM collections ORDER BY name ASC");
    const collections = collectionsRes.rows.map((row: any) => ({
      ...row,
      has_sub_collections: Boolean(row.has_sub_collections),
      sub_collections: row.sub_collections ? JSON.parse(row.sub_collections) : []
    }));

    // 2. Fetch Products
    const productsRes = await db.execute(`
      SELECT p.*, c.name as collection_name, c.poster_url as collection_poster, c.spotify_url as collection_spotify_url, c.category as collection_category
      FROM products p
      LEFT JOIN collections c ON p.collection_id = c.id
      ORDER BY p.created_at DESC
    `);
    
    // We filter out hidden products so they don't end up in public static dump
    const products = productsRes.rows
      .filter(row => !row.is_hidden)
      .map(row => ({
      ...row,
      genres: JSON.parse(row.genres as string || "[]"),
      images: {
        main: row.image_main,
        trailer: row.image_trailer,
        additional: JSON.parse(row.images as string || "[]"),
      },
      availableSizes: JSON.parse(row.sizes as string || '["S", "M", "L"]'),
      colors: JSON.parse(row.colors as string || "[]"),
      hasColorVariants: row.has_color_variants === 1,
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l,
      },
      isComingSoon: !!row.is_coming_soon,
      isBoxOfficeHit: !!row.is_box_office_hit,
      isHidden: !!row.is_hidden,
      isGallery: !!row.is_gallery,
      season: row.season as string,
      collectionId: row.collection_id as string,
      subCollection: row.sub_collection as string,
      spotifyUrl: row.collection_spotify_url as string,
      collection: row.collection_id ? {
        id: row.collection_id as string,
        name: row.collection_name as string,
        poster: row.collection_poster as string,
        spotifyUrl: row.collection_spotify_url as string,
        category: row.collection_category as string
      } : null
    }));

    // 3. Fetch Settings
    const settingsRes = await db.execute("SELECT * FROM settings");
    const settingsObj: any = {};
    settingsRes.rows.forEach(row => {
      try {
        settingsObj[row.key as string] = JSON.parse(row.value as string);
      } catch (e) {
        settingsObj[row.key as string] = row.value;
      }
    });

    const staticData = {
      timestamp: new Date().toISOString(),
      collections,
      products,
      settings: settingsObj
    };

    // Save to public directory
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const publicPath = path.join(publicDir, 'static-data.json');
    fs.writeFileSync(publicPath, JSON.stringify(staticData, null, 2));

    // Send the data back so the admin can optionally download it immediately
    res.json({ message: "Database exported to public/static-data.json successfully.", data: staticData, count: products.length });
  } catch (error) {
    console.error("Error exporting database:", error);
    res.status(500).json({ message: "Failed to export database." });
  }
};



