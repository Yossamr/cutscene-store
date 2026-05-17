var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server/db.ts
async function initDb() {
  console.log("\u{1F3AC} Initializing database tables via Cloudflare Worker...");
  isDbReady = true;
  try {
    const tables = [
      `CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        poster_url TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        is_active INTEGER DEFAULT 1,
        favorite_genres TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        genres TEXT,
        image_main TEXT,
        image_trailer TEXT,
        images TEXT,
        sizes TEXT,
        inventory_s INTEGER DEFAULT 0,
        inventory_m INTEGER DEFAULT 0,
        inventory_l INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        is_box_office_hit INTEGER DEFAULT 0,
        is_hidden INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        governorate TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        postal_code TEXT,
        country TEXT DEFAULT 'Egypt',
        total_amount REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        promo_code TEXT,
        discount_percentage REAL,
        barcode_url TEXT,
        payment_intent_id TEXT,
        status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'COD',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      `CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        size TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,
      `CREATE TABLE IF NOT EXISTS watchlist (
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        PRIMARY KEY (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS analytics_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        target_id TEXT,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discount_type TEXT NOT NULL,
        discount_value REAL NOT NULL,
        min_purchase REAL DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        expiry_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      `CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      `CREATE TABLE IF NOT EXISTS waitlist (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )`
    ];
    for (const sql of tables) {
      await db.execute(sql);
    }
    const migrations = [
      { table: "orders", column: "full_name", sql: "ALTER TABLE orders ADD COLUMN full_name TEXT NOT NULL DEFAULT 'Unknown'" },
      { table: "orders", column: "address", sql: "ALTER TABLE orders ADD COLUMN address TEXT NOT NULL DEFAULT ''" },
      { table: "orders", column: "city", sql: "ALTER TABLE orders ADD COLUMN city TEXT NOT NULL DEFAULT ''" },
      { table: "orders", column: "phone", sql: "ALTER TABLE orders ADD COLUMN phone TEXT" },
      { table: "orders", column: "governorate", sql: "ALTER TABLE orders ADD COLUMN governorate TEXT" },
      { table: "orders", column: "postal_code", sql: "ALTER TABLE orders ADD COLUMN postal_code TEXT" },
      { table: "orders", column: "country", sql: "ALTER TABLE orders ADD COLUMN country TEXT DEFAULT 'Egypt'" },
      { table: "orders", column: "total_amount", sql: "ALTER TABLE orders ADD COLUMN total_amount REAL NOT NULL DEFAULT 0" },
      { table: "orders", column: "discount_amount", sql: "ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0" },
      { table: "orders", column: "promo_code", sql: "ALTER TABLE orders ADD COLUMN promo_code TEXT" },
      { table: "orders", column: "discount_percentage", sql: "ALTER TABLE orders ADD COLUMN discount_percentage REAL" },
      { table: "orders", column: "barcode_url", sql: "ALTER TABLE orders ADD COLUMN barcode_url TEXT" },
      { table: "orders", column: "payment_intent_id", sql: "ALTER TABLE orders ADD COLUMN payment_intent_id TEXT" },
      { table: "orders", column: "status", sql: "ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending'" },
      { table: "orders", column: "payment_method", sql: "ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'COD'" },
      { table: "users", column: "is_active", sql: "ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1" },
      { table: "users", column: "points", sql: "ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0" },
      { table: "products", column: "spotify_url", sql: "ALTER TABLE products ADD COLUMN spotify_url TEXT" },
      { table: "products", column: "is_coming_soon", sql: "ALTER TABLE products ADD COLUMN is_coming_soon INTEGER DEFAULT 0" },
      { table: "products", column: "mood", sql: "ALTER TABLE products ADD COLUMN mood TEXT" },
      { table: "products", column: "franchise", sql: "ALTER TABLE products ADD COLUMN franchise TEXT" },
      { table: "products", column: "collection_id", sql: "ALTER TABLE products ADD COLUMN collection_id TEXT" },
      { table: "products", column: "sub_collection", sql: "ALTER TABLE products ADD COLUMN sub_collection TEXT" },
      { table: "products", column: "is_gallery", sql: "ALTER TABLE products ADD COLUMN is_gallery INTEGER DEFAULT 0" },
      { table: "products", column: "is_hidden", sql: "ALTER TABLE products ADD COLUMN is_hidden INTEGER DEFAULT 0" },
      { table: "products", column: "colors", sql: "ALTER TABLE products ADD COLUMN colors TEXT" },
      { table: "order_items", column: "custom_text", sql: "ALTER TABLE order_items ADD COLUMN custom_text TEXT" },
      { table: "order_items", column: "color", sql: "ALTER TABLE order_items ADD COLUMN color TEXT" },
      { table: "collections", column: "spotify_url", sql: "ALTER TABLE collections ADD COLUMN spotify_url TEXT" },
      { table: "collections", column: "status", sql: "ALTER TABLE collections ADD COLUMN status TEXT DEFAULT 'available'" },
      { table: "collections", column: "has_sub_collections", sql: "ALTER TABLE collections ADD COLUMN has_sub_collections INTEGER DEFAULT 0" },
      { table: "collections", column: "sub_collections", sql: "ALTER TABLE collections ADD COLUMN sub_collections TEXT" },
      { table: "collections", column: "category", sql: "ALTER TABLE collections ADD COLUMN category TEXT DEFAULT '\u0623\u0641\u0644\u0627\u0645'" },
      { table: "products", column: "season", sql: "ALTER TABLE products ADD COLUMN season TEXT DEFAULT 'all-season'" },
      { table: "products", column: "bts_content", sql: "ALTER TABLE products ADD COLUMN bts_content TEXT" },
      { table: "products", column: "has_color_variants", sql: "ALTER TABLE products ADD COLUMN has_color_variants INTEGER DEFAULT 0" }
    ];
    async function columnExists(tableName, columnName) {
      try {
        const result = await db.execute(`PRAGMA table_info(${tableName})`);
        return result.rows.some((row) => row.name === columnName);
      } catch (error) {
        console.warn(`\u26A0\uFE0F Could not check column existence for ${tableName}.${columnName}:`, error);
        return false;
      }
    }
    for (const migration of migrations) {
      try {
        const exists = await columnExists(migration.table, migration.column);
        if (!exists) {
          await db.execute(migration.sql);
          console.log(`\u2705 Migration successful: ${migration.sql}`);
        } else {
          console.log(`\u2139\uFE0F Column ${migration.table}.${migration.column} already exists, skipping.`);
        }
      } catch (error) {
        console.warn(`\u26A0\uFE0F Migration warning (${migration.sql}):`, error.message);
      }
    }
    try {
      const itemsExists = await columnExists("orders", "items");
      if (itemsExists) {
        await db.execute("ALTER TABLE orders DROP COLUMN items");
        console.log("\u2705 Dropped 'items' column from orders");
      } else {
        console.log("\u2139\uFE0F 'items' column does not exist in orders, skipping drop.");
      }
    } catch (error) {
      console.warn("\u26A0\uFE0F Error dropping 'items' column:", error.message);
    }
    const initialCoupons = [
      { code: "VCR-SAVE-20", type: "percentage", value: 20 },
      { code: "VCR-SAVE-15", type: "percentage", value: 15 },
      { code: "VCR-CASH-100", type: "fixed", value: 100 },
      { code: "VCR-FREE-SHIP", type: "free_shipping", value: 0 },
      { code: "VCR-B2G1", type: "b2g1", value: 0 }
    ];
    for (const coupon of initialCoupons) {
      await db.execute({
        sql: "INSERT OR IGNORE INTO coupons (id, code, discount_type, discount_value, min_purchase, is_active) VALUES (?, ?, ?, ?, ?, ?)",
        args: [import_crypto.default.randomUUID(), coupon.code, coupon.type, coupon.value, 0, 1]
      });
    }
    await seedInitialSettings();
    console.log("\u2705 Database tables initialized successfully.");
  } catch (error) {
    console.error("\u274C Database initialization error:", error);
    throw error;
  }
}
async function seedInitialSettings() {
  console.log("\u{1F331} Seeding initial settings...");
  const defaultSettings = {
    announcement: {
      text: "\u{1F3AC} WELCOME TO THE CUTSCENE STORE - THE DIRECTOR'S CUT IS HERE!",
      link: "/shop",
      isActive: true
    },
    hero: {
      title: "WEAR THE CINEMA",
      subtitle: "PREMIUM COLLECTIBLES FOR THE TRUE CINEPHILE",
      buttonText: "SHOP THE COLLECTION",
      buttonLink: "/shop",
      backgroundImage: "https://picsum.photos/seed/cinema/1920/1080"
    }
  };
  for (const [key, value] of Object.entries(defaultSettings)) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      args: [key, JSON.stringify(value)]
    });
  }
  console.log("\u2705 Settings seeded.");
}
var dotenv, import_crypto, workerUrl, isDbReady, db;
var init_db = __esm({
  "src/server/db.ts"() {
    dotenv = __toESM(require("dotenv"), 1);
    import_crypto = __toESM(require("crypto"), 1);
    dotenv.config();
    workerUrl = process.env.CLOUDFLARE_WORKER_URL || "https://cutscene-store.yossplays9714.workers.dev/";
    console.log(`\u{1F4E1} Connecting to database via Cloudflare Worker at: ${workerUrl}`);
    isDbReady = false;
    db = {
      execute: async (query) => {
        try {
          const sql = typeof query === "string" ? query : query.sql;
          const rawArgs = typeof query === "string" ? [] : query.args;
          const args = rawArgs.map((arg) => {
            if (arg === null) return { type: "null" };
            if (typeof arg === "number") {
              if (Number.isInteger(arg)) return { type: "integer", value: arg.toString() };
              return { type: "float", value: arg };
            }
            if (typeof arg === "boolean") return { type: "integer", value: arg ? "1" : "0" };
            return { type: "text", value: arg.toString() };
          });
          const response = await fetch(workerUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.LIBSQL_AUTH_TOKEN || ""}`
            },
            body: JSON.stringify({
              requests: [
                {
                  type: "execute",
                  stmt: { sql, args }
                },
                {
                  type: "close"
                }
              ]
            })
          });
          console.log(`\u{1F4E1} SQL Executing: ${sql.substring(0, 100)}${sql.length > 100 ? "..." : ""}`);
          if (args.length > 0) console.log(`\u{1F4E6} Args:`, JSON.stringify(args));
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloudflare Worker Error: ${response.status} ${errorText}`);
          }
          const result = await response.json();
          console.log(`\u{1F4E5} Database Raw Response:`, JSON.stringify(result));
          let rawResult = result;
          if (result.results && Array.isArray(result.results)) {
            const firstResult = result.results[0];
            if (firstResult.type === "error") {
              throw new Error(`LibSQL Error: ${firstResult.error?.message || "Unknown error"}`);
            }
            if (firstResult.response?.result) {
              rawResult = firstResult.response.result;
            }
          } else if (result.result) {
            rawResult = result.result;
          }
          let rows = [];
          const cols = rawResult.cols || rawResult.columns || [];
          const rawRows = rawResult.rows || [];
          if (Array.isArray(rawRows)) {
            if (rawRows.length > 0 && Array.isArray(rawRows[0]) && cols.length > 0) {
              rows = rawRows.map((row) => {
                const obj = {};
                cols.forEach((col, index) => {
                  const colName = typeof col === "string" ? col : col.name || col.label;
                  const cell = row[index];
                  if (cell && typeof cell === "object" && "type" in cell && "value" in cell) {
                    if (cell.type === "null") obj[colName] = null;
                    else if (cell.type === "integer" || cell.type === "float") obj[colName] = Number(cell.value);
                    else obj[colName] = cell.value;
                  } else if (cell && typeof cell === "object" && cell.type === "null") {
                    obj[colName] = null;
                  } else {
                    obj[colName] = cell;
                  }
                });
                return obj;
              });
            } else {
              rows = rawRows;
            }
          }
          console.log(`\u{1F4CA} Normalized Rows (${rows.length}):`, JSON.stringify(rows).substring(0, 100));
          return {
            rows,
            columns: cols,
            rowsAffected: rawResult.affected_row_count || rawResult.rowsAffected || rawResult.meta?.changes || 0,
            lastInsertRowid: rawResult.last_insert_rowid || rawResult.lastInsertRowid || rawResult.meta?.last_row_id || null
          };
        } catch (error) {
          console.error("\u274C Database execution error:", error);
          throw error;
        }
      },
      transaction: async (mode = "write") => {
        return {
          execute: async (query) => {
            return db.execute(query);
          },
          commit: async () => {
            console.log("\u{1F3AC} Transaction committed (mock)");
          },
          rollback: async () => {
            console.log("\u{1F3AC} Transaction rolled back (mock)");
          }
        };
      }
    };
  }
});

// src/server/services/telegramService.ts
var telegramService_exports = {};
__export(telegramService_exports, {
  sendTelegramNotification: () => sendTelegramNotification
});
async function sendTelegramNotification(message, phone, retries = 3) {
  try {
    const result = await db.execute("SELECT value FROM settings WHERE key = 'telegram_config'");
    let token = process.env.TELEGRAM_BOT_TOKEN || "7719448492:AAGqzuFAFrGJHcqYA7BVYTALgU6le4ua_YQ";
    let chatId = process.env.TELEGRAM_CHAT_ID;
    if (result.rows.length > 0) {
      const config2 = JSON.parse(result.rows[0].value);
      if (config2.token) token = config2.token;
      if (config2.chatId) chatId = config2.chatId;
    }
    if (!token || !chatId) {
      console.warn("\u26A0\uFE0F Telegram notification skipped: Token or Chat ID missing.");
      return;
    }
    const inline_keyboard = [
      [
        {
          text: "\u{1F680} \u0641\u062A\u062D \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645",
          url: "https://yossamr.github.io/cutscene-store/admin"
        }
      ],
      [
        {
          text: "\u2699\uFE0F \u062F\u062E\u0648\u0644 \u0627\u0644\u0623\u062F\u0645\u0646 (Browser)",
          url: "https://yossamr.github.io/cutscene-store/admin"
        }
      ]
    ];
    if (phone) {
      const formattedPhone = phone.startsWith("0") ? phone.substring(1) : phone;
      inline_keyboard.push([
        {
          text: "\u{1F4AC} \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u0639\u0645\u064A\u0644 (\u0648\u0627\u062A\u0633\u0627\u0628)",
          url: `https://wa.me/20${formattedPhone}`
        }
      ]);
    }
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    let attempt = 0;
    while (attempt < retries) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard
            }
          })
        });
        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const delay = retryAfter ? parseInt(retryAfter) * 1e3 : (attempt + 1) * 2e3;
            console.warn(`\u26A0\uFE0F Telegram rate limited. Retrying after ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
            await new Promise((res) => setTimeout(res, delay));
            attempt++;
            continue;
          } else if (response.status === 400) {
            const errorText = await response.text();
            console.error(`\u274C Telegram 400 Error (Formatting?):`, errorText);
            console.error(`\u274C Message that caused error (Length: ${message.length}):`, message);
            console.log("\u{1F504} Attempting fallback: Plain text message...");
            const plainMessage = message.replace(/<[^>]*>/g, "").trim();
            const fallbackRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: `\u26A0\uFE0F [\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u0646\u0633\u064A\u0642] \u26A0\uFE0F

${plainMessage}`,
                reply_markup: {
                  inline_keyboard
                }
              })
            });
            if (fallbackRes.ok) {
              console.log("\u2705 Telegram fallback notification sent successfully.");
              return;
            }
            throw new Error(`Telegram API Fallback Error: ${fallbackRes.status}`);
          } else {
            const error = await response.text();
            console.error(`\u274C Telegram API Error (${response.status}):`, error);
            throw new Error(`Telegram API Error: ${response.status}`);
          }
        } else {
          console.log("\u2705 Telegram notification sent successfully.");
          return;
        }
      } catch (err) {
        if (err.message?.includes("429")) {
          attempt++;
          continue;
        }
        throw err;
      }
    }
    throw new Error("Telegram notification failed after all retries.");
  } catch (error) {
    console.error("\u274C Failed to send Telegram notification:", error);
    throw error;
  }
}
var init_telegramService = __esm({
  "src/server/services/telegramService.ts"() {
    init_db();
  }
});

// src/server/services/visitorService.ts
var visitorService_exports = {};
__export(visitorService_exports, {
  checkAndSendReport: () => checkAndSendReport,
  forceSendVisitorReport: () => forceSendVisitorReport,
  startVisitorReporting: () => startVisitorReporting,
  trackVisitor: () => trackVisitor
});
var import_crypto9, isReporting, trackVisitor, checkAndSendReport, startVisitorReporting, forceSendVisitorReport;
var init_visitorService = __esm({
  "src/server/services/visitorService.ts"() {
    init_db();
    init_telegramService();
    import_crypto9 = __toESM(require("crypto"), 1);
    isReporting = false;
    trackVisitor = async (ip) => {
      try {
        await db.execute({
          sql: "INSERT INTO analytics_events (id, event_type, user_id) VALUES (?, ?, ?)",
          args: [import_crypto9.default.randomUUID(), "page_view", ip]
        });
        await checkAndSendReport();
      } catch (error) {
        console.error("Error tracking visitor:", error);
      }
    };
    checkAndSendReport = async () => {
      if (isReporting) return;
      isReporting = true;
      try {
        const result = await db.execute("SELECT value FROM settings WHERE key = 'last_visitor_report_time'");
        let lastReportTime = 0;
        if (result.rows.length > 0) {
          lastReportTime = parseInt(result.rows[0].value, 10);
        }
        const now = Date.now();
        if (now - lastReportTime >= 36e5) {
          const countResult = await db.execute("SELECT COUNT(DISTINCT user_id) as count FROM analytics_events WHERE event_type = 'page_view' AND created_at >= datetime('now', '-1 hour')");
          const count = countResult.rows[0]?.count || 0;
          const message = count > 0 ? `
<b>\u{1F4CA} Store Traffic Report</b>
<b>Active Visitors (Last Hour):</b> ${count} \u{1F465}

<i>Keep the cameras rolling! \u{1F3A5}</i>
        ` : `
<b>\u{1F4CA} Store Traffic Report</b>
<b>Active Visitors (Last Hour):</b> 0 \u{1F465}

<i>Quiet on the set... \u{1F3AC}</i>
        `;
          await sendTelegramNotification(message);
          await db.execute({
            sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
            args: ["last_visitor_report_time", now.toString()]
          });
          await db.execute("DELETE FROM analytics_events WHERE event_type = 'page_view' AND created_at < datetime('now', '-24 hour')");
        }
      } catch (error) {
        console.error("Failed to check/send visitor report:", error);
      } finally {
        isReporting = false;
      }
    };
    startVisitorReporting = () => {
      setInterval(() => {
        checkAndSendReport();
      }, 6e4);
    };
    forceSendVisitorReport = async () => {
      const countResult = await db.execute("SELECT COUNT(DISTINCT user_id) as count FROM analytics_events WHERE event_type = 'page_view' AND created_at >= datetime('now', '-1 hour')");
      const count = countResult.rows[0]?.count || 0;
      const message = `
<b>\u{1F4CA} Store Traffic Report (Forced)</b>
<b>Active Visitors (Last Hour):</b> ${count} \u{1F465}

<i>Keep the cameras rolling! \u{1F3A5}</i>
  `;
      await sendTelegramNotification(message);
      await db.execute({
        sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        args: ["last_visitor_report_time", Date.now().toString()]
      });
    };
  }
});

// server.ts
var import_express10 = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_cors = __toESM(require("cors"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_fs2 = __toESM(require("fs"), 1);

// src/server/routes/auth.ts
var import_express = require("express");

// src/server/controllers/authController.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
init_db();
var import_crypto2 = __toESM(require("crypto"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";
var register = async (req, res) => {
  try {
    const { phone, password, name, favoriteGenres } = req.body;
    const existingUser = await db.execute({
      sql: "SELECT * FROM users WHERE phone = ?",
      args: [phone]
    });
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Phone number already registered for the premiere." });
    }
    const salt = await import_bcryptjs.default.genSalt(10);
    const hashedPassword = await import_bcryptjs.default.hash(password, salt);
    const id = import_crypto2.default.randomUUID();
    await db.execute({
      sql: "INSERT INTO users (id, phone, password, name, favorite_genres) VALUES (?, ?, ?, ?, ?)",
      args: [id, phone, hashedPassword, name, JSON.stringify(favoriteGenres || [])]
    });
    res.status(201).json({ message: "Registration successful! Welcome to the Box Office." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error during registration." });
  }
};
var login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log(`Login attempt for phone: ${phone}`);
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE phone = ?",
      args: [phone]
    });
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials. Ticket not found." });
    }
    const user = result.rows[0];
    console.log(`\u{1F3AC} User found: ${user.id}, hashed password length: ${user.password?.length}`);
    const isMatch = await import_bcryptjs.default.compare(password, user.password);
    console.log(`\u{1F3AC} Password match result: ${isMatch}`);
    if (!isMatch) {
      console.log(`\u{1F3AC} Password mismatch for user: ${phone}`);
      return res.status(400).json({ message: "Invalid credentials. Ticket not found." });
    }
    const token = import_jsonwebtoken.default.sign(
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
        points: user.points || 0
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error during login." });
  }
};
var getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const result = await db.execute({
      sql: "SELECT id, name, phone, role, points FROM users WHERE id = ?",
      args: [userId]
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
      points: user.points || 0
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};
var getWatchlist = async (req, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT p.* FROM products p
        JOIN watchlist w ON p.id = w.product_id
        WHERE w.user_id = ?
      `,
      args: [req.user?.id]
    });
    const watchlist = result.rows.map((row) => ({
      ...row,
      genres: JSON.parse(row.genres || "[]")
    }));
    res.json(watchlist);
  } catch (error) {
    console.error("Watchlist fetch error:", error);
    res.status(500).json({ message: "Failed to fetch watchlist" });
  }
};
var toggleWatchlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const existing = await db.execute({
      sql: "SELECT * FROM watchlist WHERE user_id = ? AND product_id = ?",
      args: [userId, productId]
    });
    if (existing.rows.length > 0) {
      await db.execute({
        sql: "DELETE FROM watchlist WHERE user_id = ? AND product_id = ?",
        args: [userId, productId]
      });
      return res.json({ message: "Removed from watchlist", added: false });
    } else {
      await db.execute({
        sql: "INSERT INTO watchlist (user_id, product_id) VALUES (?, ?)",
        args: [userId, productId]
      });
      await db.execute({
        sql: "INSERT INTO analytics_events (id, event_type, target_id, user_id) VALUES (?, ?, ?, ?)",
        args: [import_crypto2.default.randomUUID(), "add_to_watchlist", productId, userId]
      });
      return res.json({ message: "Added to watchlist", added: true });
    }
  } catch (error) {
    console.error("Toggle watchlist error:", error);
    res.status(500).json({ message: "Failed to update watchlist" });
  }
};
var seedAdmin = async () => {
  console.log("\u{1F3AC} Checking for admin account...");
  try {
    const adminPhone = "00000000000";
    const adminPassword = "0000";
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE phone = ?",
      args: [adminPhone]
    });
    console.log(`\u{1F3AC} Admin check result: ${result.rows.length} users found.`);
    if (result.rows.length === 0) {
      console.log("\u{1F3AC} Seeding admin account...");
      const salt = await import_bcryptjs.default.genSalt(10);
      const hashedPassword = await import_bcryptjs.default.hash(adminPassword, salt);
      const id = import_crypto2.default.randomUUID();
      await db.execute({
        sql: "INSERT INTO users (id, phone, password, name, role) VALUES (?, ?, ?, ?, ?)",
        args: [id, adminPhone, hashedPassword, "Admin", "admin"]
      });
      console.log("\u{1F3AC} Admin account seeded successfully!");
    } else {
      console.log("\u{1F3AC} Admin account already exists.");
    }
  } catch (error) {
    console.error("\u274C Admin seeding error:", error);
  }
};

// src/server/middleware/authMiddleware.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var JWT_SECRET2 = process.env.JWT_SECRET || "fallback_secret_for_development_only";
var verifyTicket = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No VIP Ticket found, authorization denied." });
  }
  try {
    const decoded = import_jsonwebtoken2.default.verify(token, JWT_SECRET2);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "VIP Ticket is invalid or expired." });
  }
};
var optionalVerifyTicket = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return next();
  }
  try {
    const decoded = import_jsonwebtoken2.default.verify(token, JWT_SECRET2);
    req.user = decoded;
    next();
  } catch (err) {
    next();
  }
};

// src/server/routes/auth.ts
var router = (0, import_express.Router)();
router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyTicket, getMe);
router.get("/watchlist", verifyTicket, getWatchlist);
router.post("/watchlist/toggle", verifyTicket, toggleWatchlist);
var auth_default = router;

// src/server/routes/adminRoutes.ts
var import_express2 = require("express");

// src/server/controllers/adminController.ts
init_db();
var import_crypto3 = __toESM(require("crypto"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var getProducts = async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT p.*, c.name as collection_name, c.poster_url as collection_poster, c.spotify_url as collection_spotify_url
      FROM products p
      LEFT JOIN collections c ON p.collection_id = c.id
      ORDER BY p.created_at DESC
    `);
    const products = result.rows.map((row) => ({
      ...row,
      genres: JSON.parse(row.genres || "[]"),
      images: {
        main: row.image_main,
        trailer: row.image_trailer,
        additional: JSON.parse(row.images || "[]")
      },
      availableSizes: JSON.parse(row.sizes || '["S", "M", "L"]'),
      colors: JSON.parse(row.colors || "[]"),
      hasColorVariants: row.has_color_variants === 1,
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l
      },
      isComingSoon: !!row.is_coming_soon,
      isBoxOfficeHit: !!row.is_box_office_hit,
      isHidden: !!row.is_hidden,
      isGallery: !!row.is_gallery,
      season: row.season,
      collectionId: row.collection_id,
      subCollection: row.sub_collection,
      spotifyUrl: row.collection_spotify_url,
      collection: row.collection_id ? {
        id: row.collection_id,
        name: row.collection_name,
        poster: row.collection_poster,
        spotifyUrl: row.collection_spotify_url
      } : null
    }));
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch set list." });
  }
};
var createProduct = async (req, res) => {
  try {
    const { title, description, price, genres, images, colors, hasColorVariants, inventory, isBoxOfficeHit, availableSizes, isComingSoon, isHidden, franchise, collectionId, subCollection, season, isGallery, btsContent } = req.body;
    const id = import_crypto3.default.randomUUID();
    await db.execute({
      sql: `INSERT INTO products (
        id, title, description, price, genres, image_main, image_trailer, images, colors, has_color_variants, sizes,
        inventory_s, inventory_m, inventory_l, is_box_office_hit, is_coming_soon, is_hidden, franchise, collection_id, sub_collection, season, is_gallery, bts_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        title,
        description,
        price,
        JSON.stringify(genres || []),
        images.main,
        images.trailer || null,
        JSON.stringify(images.additional || []),
        JSON.stringify(colors || []),
        hasColorVariants ? 1 : 0,
        JSON.stringify(availableSizes || ["S", "M", "L"]),
        inventory.S || 0,
        inventory.M || 0,
        inventory.L || 0,
        isBoxOfficeHit ? 1 : 0,
        isComingSoon ? 1 : 0,
        isHidden ? 1 : 0,
        franchise || null,
        collectionId || null,
        subCollection || null,
        season || "all-season",
        isGallery ? 1 : 0,
        JSON.stringify(btsContent || null)
      ]
    });
    res.status(201).json({ id, ...req.body });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({ message: "Failed to create product. Check your script." });
  }
};
var updateProduct = async (req, res) => {
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
        title,
        description,
        price,
        JSON.stringify(genres || []),
        images.main,
        images.trailer || null,
        JSON.stringify(images.additional || []),
        JSON.stringify(colors || []),
        hasColorVariants ? 1 : 0,
        JSON.stringify(availableSizes || ["S", "M", "L"]),
        inventory.S || 0,
        inventory.M || 0,
        inventory.L || 0,
        isBoxOfficeHit ? 1 : 0,
        isComingSoon ? 1 : 0,
        isHidden ? 1 : 0,
        franchise || null,
        collectionId || null,
        subCollection || null,
        season || "all-season",
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
var deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const orderCheck = await db.execute({
      sql: "SELECT COUNT(*) as count FROM order_items WHERE product_id = ?",
      args: [id]
    });
    if (Number(orderCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: "This product has order history and cannot be deleted. Use the 'Hide' feature instead to remove it from the shop."
      });
    }
    await db.execute({ sql: "DELETE FROM watchlist WHERE product_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM waitlist WHERE product_id = ?", args: [id] });
    await db.execute({ sql: "DELETE FROM reviews WHERE product_id = ?", args: [id] });
    const result = await db.execute({
      sql: "DELETE FROM products WHERE id = ?",
      args: [id]
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
var getAllOrders = async (req, res) => {
  try {
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
        args: [order.id]
      });
      orders.push({
        ...order,
        user: {
          name: order.full_name || order.user_name,
          phone: order.phone || order.user_phone_account
        },
        items: itemsResult.rows.map((item) => ({
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
var updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db.execute({
      sql: "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [status, req.params.id]
    });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "Order not found." });
    }
    try {
      await db.execute({
        sql: "INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)",
        args: [
          import_crypto3.default.randomUUID(),
          req.user.id,
          "UPDATE_ORDER_STATUS",
          `Updated order ${req.params.id} status to ${status}`
        ]
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
var deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const transaction = await db.transaction("write");
    try {
      await transaction.execute({
        sql: "DELETE FROM order_items WHERE order_id = ?",
        args: [orderId]
      });
      const result = await transaction.execute({
        sql: "DELETE FROM orders WHERE id = ?",
        args: [orderId]
      });
      if (result.rowsAffected === 0) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found." });
      }
      await transaction.commit();
      try {
        await db.execute({
          sql: "INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)",
          args: [
            import_crypto3.default.randomUUID(),
            req.user.id,
            "DELETE_ORDER",
            `Deleted order ${orderId}`
          ]
        });
      } catch (logError) {
        console.error("Failed to log audit event:", logError);
      }
      res.json({ message: "Order deleted successfully." });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Failed to delete order." });
  }
};
var resetStats = async (req, res) => {
  try {
    await db.execute("DELETE FROM analytics_events");
    res.json({ message: "Statistics reset successfully." });
  } catch (error) {
    console.error("Error resetting stats:", error);
    res.status(500).json({ message: "Failed to reset statistics." });
  }
};
var getStats = async (req, res) => {
  try {
    const visitorsResult = await db.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_view'");
    const totalVisitors = visitorsResult.rows[0].count;
    const activeVisitorsResult = await db.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'page_view' AND created_at >= datetime('now', '-5 minutes')");
    const activeVisitors = activeVisitorsResult.rows[0].count;
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
    const lowStockCountResult = await db.execute("SELECT COUNT(*) as count FROM products WHERE (inventory_s + inventory_m + inventory_l) < 5");
    const lowStockCount = Number(lowStockCountResult.rows[0].count);
    const revenueResult = await db.execute("SELECT SUM(total_amount) as total FROM orders WHERE status != 'Cancelled'");
    const totalRevenue = Number(revenueResult.rows[0].total || 0);
    const ordersCountResult = await db.execute("SELECT COUNT(*) as count FROM orders");
    const ordersCount = Number(ordersCountResult.rows[0].count);
    const visitorsCount = Number(totalVisitors);
    const conversionRate = visitorsCount > 0 ? (ordersCount / visitorsCount * 100).toFixed(2) + "%" : "0%";
    const revenueByDayResult = await db.execute(`
      SELECT DATE(created_at) as date, SUM(total_amount) as total
      FROM orders
      WHERE created_at >= date('now', '-7 days') AND status != 'Cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
    const revenueByDay = last7Days.map((date) => {
      const found = revenueByDayResult.rows.find((r) => r.date === date);
      return {
        date,
        total: found ? Number(found.total) : 0
      };
    });
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
    let popularGenres = popularGenresResult.rows.map((row) => ({ genre: String(row.genre), views: Number(row.views) }));
    if (popularGenres.length === 0) {
      popularGenres = [
        { genre: "Action", views: 1 },
        { genre: "Drama", views: 1 }
      ];
    }
    const topCustomersResult = await db.execute(`
      SELECT u.name, u.phone, SUM(o.total_amount) as total_spend
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status != 'Cancelled'
      GROUP BY u.id
      ORDER BY total_spend DESC
      LIMIT 5
    `);
    const addToCartCountResult = await db.execute("SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'add_to_cart'");
    const addToCartCount = Number(addToCartCountResult.rows[0].count);
    let cartAbandonmentRate = "0%";
    let abandonedCount = 0;
    if (addToCartCount > 0) {
      abandonedCount = Math.max(0, addToCartCount - ordersCount);
      cartAbandonmentRate = (abandonedCount / addToCartCount * 100).toFixed(1) + "%";
    }
    const mostAddedToCartResult = await db.execute(`
      SELECT p.title, COUNT(*) as count
      FROM analytics_events a
      JOIN products p ON a.target_id = p.id
      WHERE a.event_type = 'add_to_cart' AND a.target_id IS NOT NULL
      GROUP BY p.title
      ORDER BY count DESC
      LIMIT 5
    `);
    const mostWishlistedResult = await db.execute(`
      SELECT p.title, COUNT(*) as count
      FROM analytics_events a
      JOIN products p ON a.target_id = p.id
      WHERE a.event_type = 'add_to_watchlist' AND a.target_id IS NOT NULL
      GROUP BY p.title
      ORDER BY count DESC
      LIMIT 5
    `);
    const topGovernoratesResult = await db.execute(`
      SELECT governorate, COUNT(*) as count
      FROM orders
      WHERE status != 'Cancelled' AND governorate IS NOT NULL AND governorate != ''
      GROUP BY governorate
      ORDER BY count DESC
      LIMIT 5
    `);
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
    salesByCategoryResult.rows.forEach((r) => {
      if (r.is_gallery) {
        salesByCategory.posters = Number(r.sold);
      } else {
        salesByCategory.clothing = Number(r.sold);
      }
    });
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
      topCustomers: topCustomersResult.rows.map((row) => ({ name: row.name, phone: row.phone, total_spend: Number(row.total_spend) })),
      topProduct: topViewedProducts[0] || { title: "None" },
      cartAbandonmentRate,
      abandonedCount,
      mostAddedToCart: mostAddedToCartResult.rows.map((r) => ({ title: r.title, count: Number(r.count) })),
      mostWishlisted: mostWishlistedResult.rows.map((r) => ({ title: r.title, count: Number(r.count) })),
      topGovernorates: topGovernoratesResult.rows.map((r) => ({ governorate: r.governorate, count: Number(r.count) })),
      salesByCategory,
      topSellingProducts: topSellingProductsResult.rows.map((r) => ({ title: r.title, count: Number(r.total_sold) }))
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};
var getUsers = async (req, res) => {
  try {
    const result = await db.execute("SELECT id, name, phone, role, is_active, points FROM users");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users." });
  }
};
var toggleUserStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.execute({
      sql: "UPDATE users SET is_active = NOT is_active WHERE id = ?",
      args: [id]
    });
    if (result.rowsAffected === 0) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User status updated." });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ message: "Failed to update user status." });
  }
};
var getAuditLogs = async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Failed to fetch audit logs." });
  }
};
var getCouponStats = async (req, res) => {
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
var getSalesReports = async (req, res) => {
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
var exportDatabase = async (req, res) => {
  try {
    const collectionsRes = await db.execute("SELECT * FROM collections ORDER BY name ASC");
    const collections = collectionsRes.rows.map((row) => ({
      ...row,
      has_sub_collections: Boolean(row.has_sub_collections),
      sub_collections: row.sub_collections ? JSON.parse(row.sub_collections) : []
    }));
    const productsRes = await db.execute(`
      SELECT p.*, c.name as collection_name, c.poster_url as collection_poster, c.spotify_url as collection_spotify_url, c.category as collection_category
      FROM products p
      LEFT JOIN collections c ON p.collection_id = c.id
      ORDER BY p.created_at DESC
    `);
    const products = productsRes.rows.filter((row) => !row.is_hidden).map((row) => ({
      ...row,
      genres: JSON.parse(row.genres || "[]"),
      images: {
        main: row.image_main,
        trailer: row.image_trailer,
        additional: JSON.parse(row.images || "[]")
      },
      availableSizes: JSON.parse(row.sizes || '["S", "M", "L"]'),
      colors: JSON.parse(row.colors || "[]"),
      hasColorVariants: row.has_color_variants === 1,
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l
      },
      isComingSoon: !!row.is_coming_soon,
      isBoxOfficeHit: !!row.is_box_office_hit,
      isHidden: !!row.is_hidden,
      isGallery: !!row.is_gallery,
      season: row.season,
      collectionId: row.collection_id,
      subCollection: row.sub_collection,
      spotifyUrl: row.collection_spotify_url,
      collection: row.collection_id ? {
        id: row.collection_id,
        name: row.collection_name,
        poster: row.collection_poster,
        spotifyUrl: row.collection_spotify_url,
        category: row.collection_category
      } : null
    }));
    const settingsRes = await db.execute("SELECT * FROM settings");
    const settingsObj = {};
    settingsRes.rows.forEach((row) => {
      try {
        settingsObj[row.key] = JSON.parse(row.value);
      } catch (e) {
        settingsObj[row.key] = row.value;
      }
    });
    const staticData = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      collections,
      products,
      settings: settingsObj
    };
    const publicDir = import_path.default.join(process.cwd(), "public");
    if (!import_fs.default.existsSync(publicDir)) {
      import_fs.default.mkdirSync(publicDir, { recursive: true });
    }
    const publicPath = import_path.default.join(publicDir, "static-data.json");
    import_fs.default.writeFileSync(publicPath, JSON.stringify(staticData, null, 2));
    res.json({ message: "Database exported to public/static-data.json successfully.", data: staticData, count: products.length });
  } catch (error) {
    console.error("Error exporting database:", error);
    res.status(500).json({ message: "Failed to export database." });
  }
};

// src/server/controllers/couponController.ts
init_db();
var import_crypto4 = __toESM(require("crypto"), 1);
var createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minPurchase, isActive, expiryDate } = req.body;
    const existingResult = await db.execute({
      sql: "SELECT * FROM coupons WHERE code = ?",
      args: [code.toUpperCase()]
    });
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: "Coupon code already exists." });
    }
    const id = import_crypto4.default.randomUUID();
    await db.execute({
      sql: "INSERT INTO coupons (id, code, discount_type, discount_value, min_purchase, is_active, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        id,
        code.toUpperCase(),
        discountType || "percentage",
        discountValue || 0,
        minPurchase || 0,
        isActive !== false ? 1 : 0,
        expiryDate || null
      ]
    });
    res.status(201).json({ id, code, discountType, discountValue, minPurchase, isActive, expiryDate });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Failed to create coupon." });
  }
};
var getCoupons = async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM coupons ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Failed to fetch coupons." });
  }
};
var deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: "DELETE FROM coupons WHERE id = ?",
      args: [id]
    });
    res.json({ message: "Coupon deleted successfully." });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ message: "Failed to delete coupon." });
  }
};
var toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.execute({
      sql: "SELECT is_active FROM coupons WHERE id = ?",
      args: [id]
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Coupon not found." });
    }
    const currentStatus = result.rows[0].is_active;
    const newStatus = currentStatus ? 0 : 1;
    await db.execute({
      sql: "UPDATE coupons SET is_active = ? WHERE id = ?",
      args: [newStatus, id]
    });
    res.json({ message: "Coupon status updated.", isActive: !!newStatus });
  } catch (error) {
    console.error("Error toggling coupon status:", error);
    res.status(500).json({ message: "Failed to toggle coupon status." });
  }
};
var validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Coupon code is required." });
    }
    const result = await db.execute({
      sql: "SELECT * FROM coupons WHERE code = ?",
      args: [code.toUpperCase()]
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Invalid cheat code." });
    }
    const coupon = result.rows[0];
    if (!coupon.is_active) {
      return res.status(400).json({ message: "This cheat code is no longer active." });
    }
    if (coupon.expiry_date && new Date(coupon.expiry_date) < /* @__PURE__ */ new Date()) {
      return res.status(400).json({ message: "This cheat code has expired." });
    }
    if (cartTotal && coupon.min_purchase > 0 && cartTotal < coupon.min_purchase) {
      return res.status(400).json({ message: `Minimum purchase of ${coupon.min_purchase} EGP required.` });
    }
    let message = "Cheat Code Activated!";
    if (coupon.discount_type === "percentage") message = `${coupon.discount_value}% off applied!`;
    else if (coupon.discount_type === "fixed") message = `${coupon.discount_value} EGP discount applied!`;
    else if (coupon.discount_type === "free_shipping") message = `Free shipping activated!`;
    else if (coupon.discount_type === "b2g1") message = `Buy 2 Get 1 Free activated!`;
    res.json({
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      message
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Failed to validate coupon." });
  }
};

// src/server/middleware/adminMiddleware.ts
var isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access Denied: Director's clearance required." });
  }
};

// src/server/routes/adminRoutes.ts
var router2 = (0, import_express2.Router)();
router2.use(verifyTicket, isAdmin);
router2.get("/stats", getStats);
router2.post("/stats/reset", resetStats);
router2.get("/products", getProducts);
router2.post("/products", createProduct);
router2.put("/products/:id", updateProduct);
router2.delete("/products/:id", deleteProduct);
router2.get("/orders", getAllOrders);
router2.put("/orders/:id/status", updateOrderStatus);
router2.delete("/orders/:id", deleteOrder);
router2.get("/coupons", getCoupons);
router2.post("/coupons", createCoupon);
router2.delete("/coupons/:id", deleteCoupon);
router2.put("/coupons/:id/toggle", toggleCouponStatus);
router2.get("/users", getUsers);
router2.put("/users/:id/toggle", toggleUserStatus);
router2.get("/audit-logs", getAuditLogs);
router2.get("/coupon-stats", getCouponStats);
router2.get("/sales-reports", getSalesReports);
router2.post("/export-db", exportDatabase);
router2.post("/automation/fetch-titles", async (req, res) => {
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
          }
        });
        const text = await response.text();
        const titleMatch = text.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : "No title found";
        return { url, title };
      } catch (err) {
        return { url, title: err.message, error: true };
      }
    });
    const results = await Promise.all(fetchPromises);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var adminRoutes_default = router2;

// src/server/routes/orderRoutes.ts
var import_express3 = require("express");

// src/server/controllers/orderController.ts
init_db();
var import_stripe = __toESM(require("stripe"), 1);
var import_crypto5 = __toESM(require("crypto"), 1);

// src/lib/utils.ts
var import_clsx = require("clsx");
var import_tailwind_merge = require("tailwind-merge");

// src/config.ts
var isProduction = typeof process !== "undefined" ? process.env.NODE_ENV === "production" : typeof window !== "undefined" && window.location.hostname !== "localhost";
var isBrowser = typeof window !== "undefined";
var isGitHubPages = isBrowser && window.location.hostname.includes("github.io");
var API_BASE_URL = isGitHubPages ? "https://ais-pre-3yn7g7wuqe5k5dfv5rpyzs-203126784499.europe-west2.run.app" : isBrowser ? window.location.origin : process.env.API_BASE_URL || "https://ais-pre-3yn7g7wuqe5k5dfv5rpyzs-203126784499.europe-west2.run.app";
if (isBrowser) {
  console.log("[Config] API_BASE_URL resolved to:", API_BASE_URL);
  console.log("[Config] hostname:", window.location.hostname);
  console.log("[Config] isGitHubPages:", isGitHubPages);
}

// src/lib/utils.ts
function getImageUrl(url, size) {
  if (!url) return "https://via.placeholder.com/400?text=No+Image";
  if (url.startsWith("http")) return getDirectDriveLink(url, size);
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/uploads/${url}`;
}
function getDirectDriveLink(url, size = "w800") {
  if (!url) return "";
  if (url.includes("google.com/url") && (url.includes("q=") || url.includes("url="))) {
    try {
      const urlObj = new URL(url);
      const actualUrl = urlObj.searchParams.get("q") || urlObj.searchParams.get("url");
      if (actualUrl) {
        return getDirectDriveLink(decodeURIComponent(actualUrl), size);
      }
    } catch (e) {
      console.error("Error parsing google redirect URL:", e);
    }
  }
  if (url.includes("drive.google.com/thumbnail")) {
    if (url.includes("sz=")) {
      return url.replace(/sz=[^&]+/, `sz=${size}`);
    }
    return `${url}&sz=${size}`;
  }
  let fileId = "";
  const driveFileRegex = /\/file\/d\/([^\/?]+)/;
  const driveIdMatch = url.match(driveFileRegex);
  if (driveIdMatch && driveIdMatch[1]) {
    fileId = driveIdMatch[1];
  } else {
    const driveUcRegex = /[?&]id=([^&]+)/;
    const driveUcMatch = url.match(driveUcRegex);
    if (url.includes("drive.google.com") && driveUcMatch && driveUcMatch[1]) {
      fileId = driveUcMatch[1];
    }
  }
  if (!fileId && (url.includes("lh3.googleusercontent.com/u/0/d/") || url.includes("lh3.google.com/u/0/d/"))) {
    const lhMatch = /\/d\/([^\/=]+)/;
    const match = url.match(lhMatch);
    if (match && match[1]) fileId = match[1];
  }
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
  }
  return url;
}

// src/server/controllers/orderController.ts
var stripe = new import_stripe.default(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", {
  apiVersion: "2023-10-16"
});
var createPaymentIntent = async (req, res) => {
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
      amount: Math.round(finalAmount * 100),
      // Convert to cents
      currency: "usd",
      metadata: {
        userId: req.user?.id || "guest",
        promoCode: promoCode || "none"
      }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe payment intent error:", error);
    res.status(500).json({ message: "Failed to create payment intent" });
  }
};
var createOrder = async (req, res) => {
  try {
    const { items, shippingDetails, totalAmount, paymentIntentId, couponCode, discountAmount } = req.body;
    let userId = req.user?.id;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in the cart." });
    }
    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Payment not successful." });
      }
    }
    const transaction = await db.transaction("write");
    try {
      if (!userId) {
        const guestPhone = "guest_" + (shippingDetails.phone || import_crypto5.default.randomUUID());
        const guestResult = await transaction.execute({
          sql: "SELECT id FROM users WHERE phone = ?",
          args: [guestPhone]
        });
        if (guestResult.rows.length > 0) {
          userId = guestResult.rows[0].id;
        } else {
          userId = import_crypto5.default.randomUUID();
          await transaction.execute({
            sql: `INSERT INTO users (id, phone, password, name, role) VALUES (?, ?, ?, ?, ?)`,
            args: [userId, guestPhone, "guest_password", shippingDetails.fullName || "Guest", "guest"]
          });
        }
      }
      for (const item of items) {
        const productResult = await transaction.execute({
          sql: "SELECT * FROM products WHERE id = ?",
          args: [item.product]
        });
        if (productResult.rows.length === 0) {
          throw new Error(`Product not found: ${item.product}`);
        }
        const product = productResult.rows[0];
      }
      const orderId = import_crypto5.default.randomUUID();
      const barcodeUrl = Math.random().toString(36).substring(2, 15).toUpperCase() + Math.random().toString(36).substring(2, 15).toUpperCase();
      await transaction.execute({
        sql: `INSERT INTO orders (
          id, user_id, full_name, phone, governorate, address, city, postal_code, country, 
          total_amount, discount_amount, promo_code, barcode_url, payment_intent_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          orderId,
          userId,
          shippingDetails.fullName,
          shippingDetails.phone || null,
          shippingDetails.governorate || null,
          shippingDetails.address,
          shippingDetails.city || shippingDetails.governorate || "Unknown",
          shippingDetails.postalCode || null,
          shippingDetails.country || "Egypt",
          totalAmount,
          discountAmount || 0,
          couponCode || null,
          barcodeUrl,
          paymentIntentId || null
        ]
      });
      for (const item of items) {
        const itemId = import_crypto5.default.randomUUID();
        await transaction.execute({
          sql: `INSERT INTO order_items (id, order_id, product_id, size, color, quantity, price, custom_text) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [itemId, orderId, item.product, item.size, item.color || null, item.quantity, item.price, item.customText || null]
        });
      }
      if (userId && !userId.toString().includes("guest") && req.user?.id) {
        const pointsEarned = Math.floor(totalAmount);
        try {
          await transaction.execute({
            sql: "UPDATE users SET points = points + ? WHERE id = ?",
            args: [pointsEarned, userId]
          });
        } catch (e2) {
        }
      }
      const { sendTelegramNotification: sendTelegramNotification2 } = await Promise.resolve().then(() => (init_telegramService(), telegramService_exports));
      const e = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
      const itemsList = orderItemsWithTitles.map((i) => {
        const productUrl = `https://yossamr.github.io/cutscene-store/product/${i.product_id}`;
        const imgUrl = getImageUrl(i.product_image);
        const safeImgUrl = String(imgUrl || "https://via.placeholder.com/150").replace(/"/g, "&quot;");
        const safeProductUrl = String(productUrl || "#").replace(/"/g, "&quot;");
        return `\u{1F3AC} <b>${e(i.quantity)}x ${e(i.product_title)}</b>
\u{1F3AC} \u0627\u0644\u0645\u0642\u0627\u0633: ${e(i.size) || "Standard"}
\u{1F4B5} \u0627\u0644\u0633\u0639\u0631: ${e(i.price)} \u062C.\u0645
\u{1F5BC}\uFE0F <a href="${safeImgUrl}">\u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0646\u062A\u062C</a> | \u{1F517} <a href="${safeProductUrl}">\u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0646\u062A\u062C</a>`;
      }).join("\n\n");
      const message = `
\u{1F31F} <b>\u0637\u0644\u0628 \u062C\u062F\u064A\u062F (\u0645\u062A\u062C\u0631 \u0627\u0644\u0644\u0648\u062D\u0629)</b> \u{1F31F}
<b>\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628:</b> <code>${orderId}</code>

\u{1F464} <b>\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644:</b>
\u{1F464} \u0627\u0644\u0625\u0633\u0645: ${e(shippingDetails.fullName)}
\u{1F4F1} \u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644: <code>${e(shippingDetails.phone)}</code>
\u{1F4CD} \u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629: ${e(shippingDetails.governorate) || "N/A"}
\u{1F306} \u0627\u0644\u0645\u062F\u064A\u0646\u0629: ${e(shippingDetails.city)}
\u{1F3E0} \u0627\u0644\u0639\u0646\u0648\u0627\u0646: ${e(shippingDetails.address)}

\u{1F6CD}\uFE0F <b>\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A (${orderItemsWithTitles.length}):</b>

${itemsList}

\u{1F4B0} <b>\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A: ${totalAmount} \u062C.\u0645</b>
`.trim();
      try {
        await sendTelegramNotification2(message, shippingDetails.phone);
      } catch (tgError) {
        console.error("Telegram notification failed. Rolling back order:", tgError);
        throw new Error("\u0641\u0634\u0644 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0637\u0644\u0628 \u0628\u0633\u0628\u0628 \u0645\u0634\u0643\u0644\u0629 \u0641\u064A \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649 \u0623\u0648 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627.");
      }
      await transaction.commit();
      res.status(201).json({ message: "Order confirmed.", orderId, barcodeUrl });
    } catch (err) {
      await transaction.rollback();
      return res.status(400).json({ message: err.message || "Failed to process order." });
    }
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Failed to process order." });
  }
};
var getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const ordersResult = await db.execute({
      sql: "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      args: [userId]
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
        args: [order.id]
      });
      orders.push({
        ...order,
        items: itemsResult.rows.map((item) => ({
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
var cancelOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = req.params.id;
    const orderResult = await db.execute({
      sql: "SELECT * FROM orders WHERE id = ? AND user_id = ?",
      args: [orderId, userId]
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
      args: [orderId]
    });
    res.json({ message: "Order cancelled successfully." });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Failed to cancel order." });
  }
};

// src/server/routes/orderRoutes.ts
var router3 = (0, import_express3.Router)();
router3.post("/create-payment-intent", optionalVerifyTicket, createPaymentIntent);
router3.post("/", optionalVerifyTicket, createOrder);
router3.get("/my-orders", verifyTicket, getMyOrders);
router3.put("/:id/cancel", verifyTicket, cancelOrder);
var orderRoutes_default = router3;

// src/server/routes/aiRoutes.ts
var import_express4 = require("express");

// src/server/controllers/aiController.ts
var import_groq_sdk = __toESM(require("groq-sdk"), 1);
init_db();
var groqClient = null;
function getGroq() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is required for AI features.");
    }
    groqClient = new import_groq_sdk.default({ apiKey });
  }
  return groqClient;
}
var vibeSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }
    const groq = getGroq();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert cinematic fashion recommender. Analyze the user query and return a list of 1 to 3 relevant movie genres or thematic tags. Possible genres/tags in our database include: Sci-Fi, Cyberpunk, Horror, Action, Thriller, Fantasy, 80s, Synthwave, Noir, Romance, Comedy, Drama, Space, Crime, Adventure, Anime, Zombies, Post-Apocalyptic, Mafia, Gangster, Historical, Magical. If the user query mentions a specific movie, identify its core genres. You must ONLY output a valid JSON object with a single key 'genres' containing an array of strings. Do not add markdown backticks."
        },
        {
          role: "user",
          content: query
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    const jsonStr = chatCompletion.choices[0]?.message?.content?.trim() || '{"genres":[]}';
    let genres = [];
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.genres && Array.isArray(parsed.genres)) {
        genres = parsed.genres;
      }
    } catch (e) {
      console.error("Failed to parse Groq response:", jsonStr);
    }
    if (!genres || genres.length === 0) {
      return res.json([]);
    }
    let whereClause = genres.map(() => "genres LIKE ?").join(" OR ");
    let args = genres.map((g) => `%${g}%`);
    const result = await db.execute({
      sql: `SELECT * FROM products WHERE ${whereClause} LIMIT 10`,
      args
    });
    const products = result.rows.map((row) => ({
      ...row,
      genres: JSON.parse(row.genres || "[]"),
      images: {
        main: row.image_main,
        trailer: row.image_trailer
      },
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l
      }
    }));
    res.json({ genres, products });
  } catch (error) {
    console.error("Vibe search error:", error);
    res.status(500).json({ message: "Failed to process vibe search" });
  }
};
var chat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Messages array is required" });
    }
    const productsResult = await db.execute("SELECT id, title, price, is_coming_soon, is_hidden, genres FROM products WHERE is_hidden = 0");
    const collectionsResult = await db.execute("SELECT id, name, category, sub_collections FROM collections");
    const productsList = productsResult.rows.map((p) => {
      let genresStr = "";
      try {
        const parsed = JSON.parse(p.genres || "[]");
        if (parsed && parsed.length > 0) {
          genresStr = ` - Genres: ${parsed.join(", ")}`;
        }
      } catch (e) {
      }
      return `- [${p.title}](/product/${p.id}) (${p.price} EGP)${p.is_coming_soon ? " [Coming Soon]" : ""}${genresStr}`;
    }).join("\n");
    const collectionsList = collectionsResult.rows.map((c) => {
      let subColsInfo = "";
      try {
        const parsed = JSON.parse(c.sub_collections || "[]");
        if (parsed && parsed.length > 0) {
          subColsInfo = ` (Includes: ${parsed.join(", ")})`;
        }
      } catch (e) {
      }
      return `- [${c.name}](/shop?franchise=${encodeURIComponent(c.name)})${subColsInfo} - Type: ${c.category || "\u0623\u0641\u0644\u0627\u0645"}`;
    }).join("\n");
    const systemPrompt = `You are a friendly, helpful, and cinematic AI shopping assistant for a premium apparel brand called "Director's Cut" (or "Cutscene"). 
You speak Arabic and English, matching the user's language, but default to a friendly, slightly cinematic Arabic tone (Egyptian dialect is great).

Here is the current knowledge base of the store:

Available Collections:
${collectionsList}

Available Products:
${productsList}

Interactive Visual Themes Available on the Website:
When a user searches for or views products related to these exact franchises, the website visually transforms to match their cinematic universe! The themes are:
- Fight Club, Interstellar, The Matrix, Peaky Blinders, Breaking Bad, Game of Thrones, The Godfather, The Walking Dead, Demon Slayer, Spider Man, Michael, The Punisher, Attack on Titan, Dexter, Stranger Things, La Casa De Papel.
(You can tease users about this visual transformation to make the experience more fun!)

Your Rules:
1. Be extremely helpful and polite.
2. When recommending ANY product or collection from the list, you MUST provide them as clickable Markdown links using the exact paths provided above.
   CRITICAL: For links, instead of just the product name, use actionable button text! 
   Example format: [\u064A\u0644\u0627 \u0646\u0634\u0648\u0641 \u0627\u0644\u0643\u0648\u0644\u0643\u0634\u0646 \u{1F3AC}](/shop?franchise=Fight%20Club) or [\u0634\u0648\u0641 \u0627\u0644\u0645\u0646\u062A\u062C \u062F\u0647 \u{1F6D2}](/product/123)
3. If a user asks for a specific movie, character, or custom design that is NOT in the list, or if they explicitly ask for a "custom" order, you MUST tell them: "\u0646\u0642\u062F\u0631 \u0646\u0639\u0645\u0644\u0643 \u0623\u064A \u062F\u064A\u0632\u0627\u064A\u0646 \u0643\u0627\u0633\u062A\u0648\u0645 \u0623\u0648 \u0623\u064A \u0641\u064A\u0644\u0645 \u0628\u062A\u062D\u0628\u0647! \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0627\u0646\u0627 \u0639\u0644\u0649 \u0631\u0633\u0627\u064A\u0644 \u0627\u0644\u0625\u0646\u0633\u062A\u062C\u0631\u0627\u0645 \u0648\u0647\u0646\u0638\u0628\u0637\u0644\u0643 \u0627\u0644\u0644\u064A \u0623\u0646\u062A \u0639\u0627\u064A\u0632\u0647 \u{1F3AC}\u2728".
4. Keep responses concise and engaging. Use cinematic emojis (\u{1F3AC}, \u{1F3A5}, \u{1F37F}, \u2728, \u{1F5E1}\uFE0F, \u{1F9DF}).
5. Do not make up products or collections that do not exist in the list. If it's not there, direct them to Instagram custom orders.
6. Use the genre/category data to make smart recommendations! (e.g. if they want Anime, show Demon Slayer, if they want Horror/Zombies show The Walking Dead, etc.)`;
    let formattedMessages = [{ role: "system", content: systemPrompt }];
    for (const msg of messages) {
      let role = msg.role === "user" ? "user" : "assistant";
      formattedMessages.push({ role, content: msg.content });
    }
    const groq = getGroq();
    const chatCompletion = await groq.chat.completions.create({
      messages: formattedMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7
    });
    const reply = chatCompletion.choices[0]?.message?.content?.trim() || "\u0639\u0630\u0631\u0627\u064B\u060C \u0641\u064A \u0645\u0634\u0643\u0644\u0629 \u0641\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u062F\u0644\u0648\u0642\u062A\u064A. \u062C\u0631\u0628 \u062A\u0627\u0646\u064A \u0643\u0645\u0627\u0646 \u0634\u0648\u064A\u0629! \u{1F3AC}";
    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    let errorMessage = "Failed to process chat";
    if (error.message && error.message.includes("API key not valid")) {
      errorMessage = "API key not valid";
    }
    res.status(500).json({ message: errorMessage, error: error.message, stack: error.stack });
  }
};
var generateDescription = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title or concept is required" });
    }
    const groq = getGroq();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a master copywriter for a premium cinematic apparel brand called "Cutscene". 
Write a compelling, SEO-friendly, and highly atmospheric product description for a premium hoodie inspired by the provided movie title or concept. 

Guidelines:
- The tone should be thrilling, immersive, and engaging, as if marketing a blockbuster movie.
- Focus on the "vibe", the aesthetic, and how wearing it makes the customer feel like the main character.
- Mention premium quality (e.g., heavyweight cotton, cinematic comfort).
- Keep it under 150 words. 
- Do not include introductory phrases like "Here is a description" or "Introducing". Start directly with the captivating copy.`
        },
        {
          role: "user",
          content: title
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7
    });
    const description = chatCompletion.choices[0]?.message?.content?.trim() || "";
    res.json({ description });
  } catch (error) {
    console.error("Generate description error:", error);
    res.status(500).json({ message: "Failed to generate description" });
  }
};

// src/server/routes/aiRoutes.ts
var router4 = (0, import_express4.Router)();
router4.post("/vibe-search", vibeSearch);
router4.post("/chat", chat);
router4.post("/generate-description", verifyTicket, isAdmin, generateDescription);
var aiRoutes_default = router4;

// src/server/routes/couponRoutes.ts
var import_express5 = require("express");
var router5 = (0, import_express5.Router)();
router5.post("/validate", validateCoupon);
var couponRoutes_default = router5;

// src/server/routes/productRoutes.ts
var import_express6 = require("express");

// src/server/controllers/productController.ts
init_db();
var import_crypto6 = __toESM(require("crypto"), 1);
var getProducts2 = async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT p.*, c.name as collection_name, c.poster_url as collection_poster, c.spotify_url as collection_spotify_url, c.status as collection_status, c.category as collection_category
      FROM products p
      LEFT JOIN collections c ON p.collection_id = c.id
      WHERE p.is_hidden = 0
      ORDER BY p.created_at DESC
    `);
    const products = result.rows.map((row) => ({
      ...row,
      genres: JSON.parse(row.genres || "[]"),
      images: {
        main: row.image_main,
        trailer: row.image_trailer,
        additional: JSON.parse(row.images || "[]")
      },
      availableSizes: JSON.parse(row.sizes || '["S", "M", "L"]'),
      colors: JSON.parse(row.colors || "[]"),
      btsContent: JSON.parse(row.bts_content || "null"),
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l
      },
      isComingSoon: !!row.is_coming_soon,
      isGallery: !!row.is_gallery,
      collectionId: row.collection_id,
      spotifyUrl: row.collection_spotify_url,
      franchise: row.collection_name || row.franchise,
      collectionStatus: row.collection_status,
      subCollection: row.sub_collection,
      season: row.season,
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
var searchAll = async (req, res) => {
  try {
    const { q } = req.query;
    console.log(`Global search initiated for: "${q}"`);
    if (!q) return res.json({ products: [], collections: [] });
    const query = `%${q}%`;
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
    const collectionsResult = await db.execute({
      sql: "SELECT * FROM collections WHERE (name LIKE ? OR description LIKE ?) AND status != 'coming_soon' LIMIT 10",
      args: [query, query]
    });
    console.log(`Search results: ${productsResult.rows.length} products, ${collectionsResult.rows.length} collections`);
    const products = productsResult.rows.map((row) => ({
      ...row,
      genres: JSON.parse(row.genres || "[]"),
      images: {
        main: row.image_main,
        trailer: row.image_trailer,
        additional: JSON.parse(row.images || "[]")
      },
      availableSizes: JSON.parse(row.sizes || '["S", "M", "L"]'),
      colors: JSON.parse(row.colors || "[]"),
      btsContent: JSON.parse(row.bts_content || "null"),
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l
      },
      isComingSoon: !!row.is_coming_soon,
      isBoxOfficeHit: !!row.is_box_office_hit,
      isGallery: !!row.is_gallery,
      franchise: row.collection_name || row.franchise,
      subCollection: row.sub_collection,
      season: row.season,
      collectionStatus: row.collection_status
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
var getProductById = async (req, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT p.*, c.name as collection_name, c.poster_url as collection_poster, c.spotify_url as collection_spotify_url, c.status as collection_status, c.category as collection_category
        FROM products p
        LEFT JOIN collections c ON p.collection_id = c.id
        WHERE p.id = ? AND p.is_hidden = 0
      `,
      args: [req.params.id]
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found." });
    }
    const row = result.rows[0];
    const product = {
      ...row,
      genres: JSON.parse(row.genres || "[]"),
      images: {
        main: row.image_main,
        trailer: row.image_trailer,
        additional: JSON.parse(row.images || "[]")
      },
      availableSizes: JSON.parse(row.sizes || '["S", "M", "L"]'),
      colors: JSON.parse(row.colors || "[]"),
      btsContent: JSON.parse(row.bts_content || "null"),
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l
      },
      isComingSoon: !!row.is_coming_soon,
      isGallery: !!row.is_gallery,
      collectionId: row.collection_id,
      spotifyUrl: row.collection_spotify_url,
      franchise: row.collection_name || row.franchise,
      collectionStatus: row.collection_status,
      subCollection: row.sub_collection,
      season: row.season,
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
var getProductReviews = async (req, res) => {
  try {
    const result = await db.execute({
      sql: `
        SELECT r.*, u.name as user_name 
        FROM reviews r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.product_id = ? 
        ORDER BY r.created_at DESC
      `,
      args: [req.params.id]
    });
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews." });
  }
};
var addProductReview = async (req, res) => {
  try {
    const { rating, comment, imageUrl } = req.body;
    const userId = req.user.id;
    const productId = req.params.id;
    await db.execute({
      sql: "INSERT INTO reviews (id, product_id, user_id, rating, comment, image_url) VALUES (?, ?, ?, ?, ?, ?)",
      args: [import_crypto6.default.randomUUID(), productId, userId, rating, comment, imageUrl || null]
    });
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
var joinWaitlist = async (req, res) => {
  try {
    const { email } = req.body;
    const productId = req.params.id;
    const existing = await db.execute({
      sql: "SELECT id FROM waitlist WHERE product_id = ? AND user_email = ?",
      args: [productId, email]
    });
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "You are already on the waitlist for this item." });
    }
    await db.execute({
      sql: "INSERT INTO waitlist (id, product_id, user_email) VALUES (?, ?, ?)",
      args: [import_crypto6.default.randomUUID(), productId, email]
    });
    res.status(201).json({ message: "Successfully joined the waitlist!" });
  } catch (error) {
    console.error("Error joining waitlist:", error);
    res.status(500).json({ message: "Failed to join waitlist." });
  }
};

// src/server/routes/productRoutes.ts
var router6 = (0, import_express6.Router)();
router6.get("/", getProducts2);
router6.get("/search", searchAll);
router6.get("/:id", getProductById);
router6.get("/:id/reviews", getProductReviews);
router6.post("/:id/reviews", verifyTicket, addProductReview);
router6.post("/:id/waitlist", joinWaitlist);
var productRoutes_default = router6;

// src/server/routes/settingsRoutes.ts
var import_express7 = require("express");

// src/server/controllers/settingsController.ts
init_db();
var getSettings = async (req, res) => {
  try {
    const result = await db.execute("SELECT key, value FROM settings");
    const settings = {};
    result.rows.forEach((row) => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch (e) {
        settings[row.key] = row.value;
      }
    });
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};
var updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      await db.execute({
        sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        args: [key, stringValue]
      });
    }
    res.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
};
var testTelegram = async (req, res) => {
  try {
    const { token, chatId } = req.body;
    if (!token || !chatId) {
      return res.status(400).json({ error: "Token and Chat ID are required" });
    }
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: "<b>\u{1F3AC} Cutscene Store Notification Test</b>\n\nYour Telegram bot is now connected to the Director's Cut! \u{1F3A5}\n\nYou will receive notifications here for every new order.",
        parse_mode: "HTML"
      })
    });
    if (!response.ok) {
      const error = await response.text();
      return res.status(400).json({ error: `Telegram API Error: ${error}` });
    }
    await db.execute({
      sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
      args: ["telegram_config", JSON.stringify({ token, chatId })]
    });
    res.json({ success: true, message: "Test notification sent successfully and settings saved" });
  } catch (error) {
    console.error("Error testing Telegram:", error);
    res.status(500).json({ error: "Failed to send test notification" });
  }
};

// src/server/routes/settingsRoutes.ts
var router7 = (0, import_express7.Router)();
router7.get("/", getSettings);
router7.put("/", verifyTicket, isAdmin, updateSettings);
router7.post("/test-telegram", verifyTicket, isAdmin, testTelegram);
var settingsRoutes_default = router7;

// src/server/routes/analyticsRoutes.ts
var import_express8 = require("express");

// src/server/controllers/analyticsController.ts
init_db();
var import_crypto7 = __toESM(require("crypto"), 1);
var trackEvent = async (req, res) => {
  try {
    console.log("Analytics request body:", req.body);
    const { eventType, targetId, userId } = req.body;
    if (!eventType) {
      console.warn("Analytics tracking failed: eventType is missing", req.body);
      return res.status(400).json({ message: "Event type is required" });
    }
    const id = import_crypto7.default.randomUUID();
    await db.execute({
      sql: "INSERT INTO analytics_events (id, event_type, target_id, user_id) VALUES (?, ?, ?, ?)",
      args: [id, eventType, targetId || null, userId || null]
    });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error tracking event:", error);
    res.status(500).json({ message: "Failed to track event" });
  }
};

// src/server/routes/analyticsRoutes.ts
var router8 = (0, import_express8.Router)();
router8.post("/track", trackEvent);
var analyticsRoutes_default = router8;

// src/server/routes/collectionRoutes.ts
var import_express9 = __toESM(require("express"), 1);
init_db();
var import_crypto8 = __toESM(require("crypto"), 1);
var router9 = import_express9.default.Router();
router9.get("/", async (req, res) => {
  try {
    const result = await db.execute("SELECT * FROM collections ORDER BY name ASC");
    const collections = result.rows.map((row) => ({
      ...row,
      has_sub_collections: Boolean(row.has_sub_collections),
      sub_collections: row.sub_collections ? JSON.parse(row.sub_collections) : []
    }));
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router9.post("/", verifyTicket, isAdmin, async (req, res) => {
  const { name, poster_url, description, spotify_url, status, has_sub_collections, sub_collections, category } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Collection name is required" });
  }
  try {
    const id = import_crypto8.default.randomUUID();
    const subCollectionsJson = sub_collections ? JSON.stringify(sub_collections) : null;
    await db.execute({
      sql: "INSERT INTO collections (id, name, poster_url, description, spotify_url, status, has_sub_collections, sub_collections, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id, name, poster_url || null, description || null, spotify_url || null, status || "available", has_sub_collections ? 1 : 0, subCollectionsJson, category || "\u0623\u0641\u0644\u0627\u0645"]
    });
    res.status(201).json({
      id,
      name,
      poster_url,
      description,
      spotify_url,
      status: status || "available",
      has_sub_collections: Boolean(has_sub_collections),
      sub_collections: sub_collections || [],
      category: category || "\u0623\u0641\u0644\u0627\u0645"
    });
  } catch (error) {
    if (error.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ message: "Collection name already exists" });
    }
    res.status(500).json({ message: error.message });
  }
});
router9.put("/:id", verifyTicket, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, poster_url, description, spotify_url, status, has_sub_collections, sub_collections, category } = req.body;
  try {
    const subCollectionsJson = sub_collections ? JSON.stringify(sub_collections) : null;
    await db.execute({
      sql: "UPDATE collections SET name = ?, poster_url = ?, description = ?, spotify_url = ?, status = ?, has_sub_collections = ?, sub_collections = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [name, poster_url, description, spotify_url, status || "available", has_sub_collections ? 1 : 0, subCollectionsJson, category || "\u0623\u0641\u0644\u0627\u0645", id]
    });
    res.json({ message: "Collection updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router9.delete("/:id", verifyTicket, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
var collectionRoutes_default = router9;

// src/server/middleware/dbCheck.ts
init_db();
var checkDbConnection = (req, res, next) => {
  if (!isDbReady) {
    return res.status(503).json({
      message: "Database is initializing. Please wait a moment and refresh.",
      status: "error"
    });
  }
  next();
};

// server.ts
init_db();
init_visitorService();
var __dirname = process.cwd();
if (!import_fs2.default.existsSync(import_path2.default.join(__dirname, "uploads"))) {
  import_fs2.default.mkdirSync(import_path2.default.join(__dirname, "uploads"), { recursive: true });
}
async function startServer() {
  const app = (0, import_express10.default)();
  const PORT = 3e3;
  const corsOptions = {
    origin: true,
    // Reflect the request origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["X-Requested-With", "Content-Type", "Authorization", "Accept", "Origin"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
  app.use((0, import_cors.default)(corsOptions));
  app.options("*", (0, import_cors.default)(corsOptions));
  app.use((req, res, next) => {
    const origin = req.headers.origin || "none";
    const referer = req.headers.referer || "none";
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    if (!req.url.includes(".") && !req.url.startsWith("/api/admin") && !req.url.startsWith("/uploads")) {
      trackVisitor(Array.isArray(ip) ? ip[0] : ip);
    }
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${req.method} ${req.url} (Origin: ${origin}, Referer: ${referer}, IP: ${ip})`);
    next();
  });
  app.use(import_express10.default.json());
  app.use("/uploads", import_express10.default.static(import_path2.default.join(__dirname, "uploads")));
  app.get("/test-api", (req, res) => {
    res.json({ message: "API is reachable" });
  });
  const apiRouter = import_express10.default.Router();
  app.set("strict routing", false);
  apiRouter.use(checkDbConnection);
  apiRouter.use("/auth", auth_default);
  apiRouter.use("/admin", adminRoutes_default);
  apiRouter.use("/orders", orderRoutes_default);
  apiRouter.use("/ai", aiRoutes_default);
  apiRouter.use("/coupons", couponRoutes_default);
  apiRouter.use("/products", productRoutes_default);
  apiRouter.use("/settings", settingsRoutes_default);
  apiRouter.use("/analytics", analyticsRoutes_default);
  apiRouter.use("/collections", collectionRoutes_default);
  const storage = import_multer.default.diskStorage({
    destination: (req, file, cb) => {
      cb(null, import_path2.default.join(__dirname, "uploads/"));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  const upload = (0, import_multer.default)({ storage });
  apiRouter.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
  apiRouter.get("/health", async (req, res) => {
    try {
      await db.execute("SELECT 1");
      res.json({ status: "ok", database: "connected", message: "Director's cut is rolling!" });
    } catch (err) {
      res.status(500).json({ status: "error", database: "disconnected", error: err.message });
    }
  });
  apiRouter.get("/ping", (req, res) => {
    res.json({ status: "pong" });
  });
  apiRouter.get("/cron/visitor-report", async (req, res) => {
    try {
      const { forceSendVisitorReport: forceSendVisitorReport2 } = await Promise.resolve().then(() => (init_visitorService(), visitorService_exports));
      await forceSendVisitorReport2();
      res.json({ status: "ok", message: "Visitor report sent" });
    } catch (err) {
      res.status(500).json({ status: "error", error: err.message });
    }
  });
  apiRouter.use("*", (req, res) => {
    res.status(404).json({ error: "API route not found", path: req.originalUrl });
  });
  app.use("/api", apiRouter);
  if (process.env.NODE_ENV !== "production") {
    console.log("\u{1F4E6} Starting Vite development server...");
    try {
      const vite = await (0, import_vite.createServer)({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
      console.log("\u2705 Vite middleware integrated.");
    } catch (err) {
      console.error("\u274C Vite startup error:", err);
    }
  } else {
    const distPath = import_path2.default.join(__dirname, "dist");
    app.use(import_express10.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.use((err, req, res, next) => {
    console.error("\u{1F525} Express Error Handler:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  });
  process.on("uncaughtException", (err) => {
    if (err.code === "EPIPE" || err.message?.includes("EPIPE") || err.syscall?.includes("write")) {
      return;
    }
    console.error("\u{1F525} UNCAUGHT EXCEPTION:", err);
  });
  process.on("unhandledRejection", (reason, promise) => {
    console.error("\u{1F525} UNHANDLED REJECTION at:", promise, "reason:", reason);
  });
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Server is officially live and listening on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    (async () => {
      try {
        console.log("\u{1F3AC} Wait for background initialization...");
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log("\u{1F3AC} Initializing database...");
        await initDb();
        console.log("\u{1F3AC} Database Initialized!");
        await seedAdmin();
      } catch (err) {
        console.error("\u274C Initialization error:", err);
      }
    })();
    try {
      startVisitorReporting();
    } catch (err) {
      console.error("\u274C Visitor reporting startup error:", err);
    }
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\u{1F525} Port ${PORT} is already in use. Retrying or exiting...`);
      process.exit(1);
    } else {
      console.error("\u{1F525} Server instance error:", err);
    }
  });
}
startServer().catch((err) => {
  console.error("\u{1F4A5} Fatal server startup error:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
