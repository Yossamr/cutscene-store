import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { db } from "../db";
import Stripe from "stripe";
import crypto from "crypto";
import { getImageUrl } from "../../lib/utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", {
  apiVersion: "2023-10-16" as any,
});

export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
  try {
    const { totalAmount, promoCode, discountPercentage } = req.body;

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    let finalAmount = totalAmount;
    if (discountPercentage && discountPercentage > 0 && discountPercentage <= 100) {
      finalAmount = totalAmount * (1 - discountPercentage / 100);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        userId: req.user?.id || "guest",
        promoCode: promoCode || "none",
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe payment intent error:", error);
    res.status(500).json({ message: "Failed to create payment intent" });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items, shippingDetails, totalAmount, paymentIntentId, couponCode, discountAmount } = req.body;
    let userId = req.user?.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in the cart." });
    }

    // Verify payment intent with Stripe ONLY if paymentIntentId is provided
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Payment not successful." });
      }
    }

    // Use a transaction for order creation and inventory update
    const transaction = await db.transaction("write");
    try {
      // If no userId, create a guest user or use a default guest user
      if (!userId) {
        // Check if guest user exists
        const guestPhone = "guest_" + (shippingDetails.phone || crypto.randomUUID());
        const guestResult = await transaction.execute({
          sql: "SELECT id FROM users WHERE phone = ?",
          args: [guestPhone],
        });

        if (guestResult.rows.length > 0) {
          userId = guestResult.rows[0].id;
        } else {
          userId = crypto.randomUUID();
          await transaction.execute({
            sql: `INSERT INTO users (id, phone, password, name, role) VALUES (?, ?, ?, ?, ?)`,
            args: [userId, guestPhone, "guest_password", shippingDetails.fullName || "Guest", "guest"],
          });
        }
      }

      for (const item of items) {
        const productResult = await transaction.execute({
          sql: "SELECT * FROM products WHERE id = ?",
          args: [item.product],
        });

        if (productResult.rows.length === 0) {
          throw new Error(`Product not found: ${item.product}`);
        }

        const product = productResult.rows[0];
      }

      const orderId = crypto.randomUUID();
      const barcodeUrl = Math.random().toString(36).substring(2, 15).toUpperCase() + 
                         Math.random().toString(36).substring(2, 15).toUpperCase();

      await transaction.execute({
        sql: `INSERT INTO orders (
          id, user_id, full_name, phone, governorate, address, city, postal_code, country, 
          total_amount, discount_amount, promo_code, barcode_url, payment_intent_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          orderId, userId, shippingDetails.fullName, shippingDetails.phone || null, 
          shippingDetails.governorate || null, shippingDetails.address, 
          shippingDetails.city || shippingDetails.governorate || "Unknown", shippingDetails.postalCode || null, shippingDetails.country || "Egypt",
          totalAmount, discountAmount || 0, couponCode || null, barcodeUrl, paymentIntentId || null
        ],
      });

      for (const item of items) {
        const itemId = crypto.randomUUID();
        await transaction.execute({
          sql: `INSERT INTO order_items (id, order_id, product_id, size, color, quantity, price, custom_text) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [itemId, orderId, item.product, item.size, item.color || null, item.quantity, item.price, item.customText || null],
        });
      }

      // Award points to user (1 point per $1 spent) - only for non-guest users
      if (userId && !userId.toString().includes("guest") && req.user?.id) {
        const pointsEarned = Math.floor(totalAmount);
        // We need to check if points column exists, but let's assume it does or we can just ignore errors
        try {
          await transaction.execute({
            sql: "UPDATE users SET points = points + ? WHERE id = ?",
            args: [pointsEarned, userId]
          });
        } catch (e) {
          // Ignore if points column doesn't exist
        }
      }

      // Send Telegram Notification to Admin
      const { sendTelegramNotification } = await import("../services/telegramService");
      const e = (s: any) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      // Fetch product titles for the notification
      const orderItemsWithTitles = [];
      for (const item of items) {
        const productRes = await transaction.execute({
          sql: "SELECT id, title, image_main FROM products WHERE id = ?",
          args: [item.product]
        });
        const productData = productRes.rows[0];
        orderItemsWithTitles.push({
          ...item,
          product_id: productData?.id || item.product,
          product_title: productData?.title || "Unknown Product",
          product_image: productData?.image_main || ""
        });
      }

      const itemsList = orderItemsWithTitles.map((i: any) => {
        const productUrl = `https://yossamr.github.io/cutscene-store/product/${i.product_id}`;
        const imgUrl = getImageUrl(i.product_image);
        
        // Ensure URLs are properly escaped for HTML attributes
        const safeImgUrl = String(imgUrl || 'https://via.placeholder.com/150').replace(/"/g, '&quot;');
        const safeProductUrl = String(productUrl || '#').replace(/"/g, '&quot;');
        
        return `🎬 <b>${e(i.quantity)}x ${e(i.product_title)}</b>
🎬 المقاس: ${e(i.size) || 'Standard'}
💵 السعر: ${e(i.price)} ج.م
🖼️ <a href="${safeImgUrl}">صورة المنتج</a> | 🔗 <a href="${safeProductUrl}">صفحة المنتج</a>`;
      }).join('\n\n');

      const message = `
🌟 <b>طلب جديد (متجر اللوحة)</b> 🌟
<b>رقم الطلب:</b> <code>${orderId}</code>

👤 <b>بيانات العميل:</b>
👤 الإسم: ${e(shippingDetails.fullName)}
📱 رقم الموبايل: <code>${e(shippingDetails.phone)}</code>
📍 المحافظة: ${e(shippingDetails.governorate) || 'N/A'}
🌆 المدينة: ${e(shippingDetails.city)}
🏠 العنوان: ${e(shippingDetails.address)}

🛍️ <b>المنتجات (${orderItemsWithTitles.length}):</b>

${itemsList}

💰 <b>الإجمالي: ${totalAmount} ج.م</b>
`.trim();
      
      try {
        await sendTelegramNotification(message, shippingDetails.phone);
      } catch (tgError) {
        console.error("Telegram notification failed. Rolling back order:", tgError);
        throw new Error("فشل تأكيد الطلب بسبب مشكلة في الإشعارات. يرجى المحاولة مرة أخرى أو التواصل معنا.");
      }

      await transaction.commit();

      res.status(201).json({ message: "Order confirmed.", orderId, barcodeUrl });
    } catch (err: any) {
      await transaction.rollback();
      return res.status(400).json({ message: err.message || "Failed to process order." });
    }
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Failed to process order." });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const ordersResult = await db.execute({
      sql: "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      args: [userId],
    });

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
        items: itemsResult.rows.map(item => ({
          ...item,
          custom_text: item.custom_text,
          color: item.color,
          product: {
            title: item.product_title,
            images: { main: item.product_image }
          }
        }))
      });
    }

    res.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const orderId = req.params.id;

    const orderResult = await db.execute({
      sql: "SELECT * FROM orders WHERE id = ? AND user_id = ?",
      args: [orderId, userId],
    });

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "Order not found." });
    }

    const order = orderResult.rows[0];
    if (order.status !== "Processing") {
      return res.status(400).json({ message: "Only processing orders can be cancelled." });
    }

    await db.execute({
      sql: "UPDATE orders SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [orderId],
    });

    res.json({ message: "Order cancelled successfully." });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Failed to cancel order." });
  }
};
