import * as dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const workerUrl = process.env.CLOUDFLARE_WORKER_URL || "https://cutscene-store.yossplays9714.workers.dev/";

console.log(`📡 Connecting to database via Cloudflare Worker at: ${workerUrl}`);

export let isDbReady = false;

export const db = {
  execute: async (query: string | { sql: string; args: any[] }) => {
    try {
      const sql = typeof query === 'string' ? query : query.sql;
      const rawArgs = typeof query === 'string' ? [] : query.args;

      // Transform arguments to LibSQL tagged format
      const args = rawArgs.map(arg => {
        if (arg === null) return { type: 'null' };
        if (typeof arg === 'number') {
          if (Number.isInteger(arg)) return { type: 'integer', value: arg.toString() };
          return { type: 'float', value: arg };
        }
        if (typeof arg === 'boolean') return { type: 'integer', value: arg ? "1" : "0" };
        return { type: 'text', value: arg.toString() };
      });

      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LIBSQL_AUTH_TOKEN || ''}`
        },
        body: JSON.stringify({
          requests: [
            {
              type: 'execute',
              stmt: { sql, args }
            },
            {
              type: 'close'
            }
          ]
        }),
      });

      console.log(`📡 SQL Executing: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
      if (args.length > 0) console.log(`📦 Args:`, JSON.stringify(args));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare Worker Error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log(`📥 Database Raw Response:`, JSON.stringify(result));
      
      // Handle LibSQL HTTP API nested structure (results[0].response.result)
      let rawResult = result;
      if (result.results && Array.isArray(result.results)) {
        const firstResult = result.results[0];
        if (firstResult.type === 'error') {
          throw new Error(`LibSQL Error: ${firstResult.error?.message || 'Unknown error'}`);
        }
        if (firstResult.response?.result) {
          rawResult = firstResult.response.result;
        }
      } else if (result.result) {
        rawResult = result.result;
      }

      // Normalize rows to always be an array of objects
      let rows: any[] = [];
      const cols = rawResult.cols || rawResult.columns || [];
      const rawRows = rawResult.rows || [];

      if (Array.isArray(rawRows)) {
        if (rawRows.length > 0 && Array.isArray(rawRows[0]) && cols.length > 0) {
          // It's an array of arrays (LibSQL format), map to objects using cols
          rows = rawRows.map((row: any[]) => {
            const obj: any = {};
            cols.forEach((col: any, index: number) => {
              const colName = typeof col === 'string' ? col : (col.name || col.label);
              const cell = row[index];
              
              // Unwrap LibSQL tagged value if necessary
              if (cell && typeof cell === 'object' && 'type' in cell && 'value' in cell) {
                if (cell.type === 'null') obj[colName] = null;
                else if (cell.type === 'integer' || cell.type === 'float') obj[colName] = Number(cell.value);
                else obj[colName] = cell.value;
              } else if (cell && typeof cell === 'object' && cell.type === 'null') {
                obj[colName] = null;
              } else {
                obj[colName] = cell;
              }
            });
            return obj;
          });
        } else {
          // Already an array of objects or empty
          rows = rawRows;
        }
      }

      console.log(`📊 Normalized Rows (${rows.length}):`, JSON.stringify(rows).substring(0, 100));
      return {
        rows,
        columns: cols,
        rowsAffected: rawResult.affected_row_count || rawResult.rowsAffected || rawResult.meta?.changes || 0,
        lastInsertRowid: rawResult.last_insert_rowid || rawResult.lastInsertRowid || rawResult.meta?.last_row_id || null,
      };
    } catch (error) {
      console.error("❌ Database execution error:", error);
      throw error;
    }
  },
  transaction: async (mode: "read" | "write" = "write") => {
    // Mock transaction that executes queries sequentially
    // In a real Cloudflare Worker / D1 scenario, you might use db.batch()
    return {
      execute: async (query: string | { sql: string; args: any[] }) => {
        return db.execute(query);
      },
      commit: async () => {
        console.log("🎬 Transaction committed (mock)");
      },
      rollback: async () => {
        console.log("🎬 Transaction rolled back (mock)");
      }
    };
  }
};

export async function initDb() {
  console.log("🎬 Initializing database tables via Cloudflare Worker...");
  isDbReady = true; // Set to true early so that if a non-critical migration fails, the app still works.
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
      )`,
      `CREATE TABLE IF NOT EXISTS social_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        platform TEXT NOT NULL,
        plan_date TEXT,
        caption TEXT,
        prompt TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      await db.execute(sql);
    }

    // Migration: Ensure orders table has full_name column
    const migrations = [
      { table: 'orders', column: 'full_name', sql: "ALTER TABLE orders ADD COLUMN full_name TEXT NOT NULL DEFAULT 'Unknown'" },
      { table: 'orders', column: 'address', sql: "ALTER TABLE orders ADD COLUMN address TEXT NOT NULL DEFAULT ''" },
      { table: 'orders', column: 'city', sql: "ALTER TABLE orders ADD COLUMN city TEXT NOT NULL DEFAULT ''" },
      { table: 'orders', column: 'phone', sql: "ALTER TABLE orders ADD COLUMN phone TEXT" },
      { table: 'orders', column: 'governorate', sql: "ALTER TABLE orders ADD COLUMN governorate TEXT" },
      { table: 'orders', column: 'postal_code', sql: "ALTER TABLE orders ADD COLUMN postal_code TEXT" },
      { table: 'orders', column: 'country', sql: "ALTER TABLE orders ADD COLUMN country TEXT DEFAULT 'Egypt'" },
      { table: 'orders', column: 'total_amount', sql: "ALTER TABLE orders ADD COLUMN total_amount REAL NOT NULL DEFAULT 0" },
      { table: 'orders', column: 'discount_amount', sql: "ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0" },
      { table: 'orders', column: 'promo_code', sql: "ALTER TABLE orders ADD COLUMN promo_code TEXT" },
      { table: 'orders', column: 'discount_percentage', sql: "ALTER TABLE orders ADD COLUMN discount_percentage REAL" },
      { table: 'orders', column: 'barcode_url', sql: "ALTER TABLE orders ADD COLUMN barcode_url TEXT" },
      { table: 'orders', column: 'payment_intent_id', sql: "ALTER TABLE orders ADD COLUMN payment_intent_id TEXT" },
      { table: 'orders', column: 'status', sql: "ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending'" },
      { table: 'orders', column: 'payment_method', sql: "ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'COD'" },
      { table: 'users', column: 'is_active', sql: "ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1" },
      { table: 'users', column: 'points', sql: "ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0" },
      { table: 'products', column: 'spotify_url', sql: "ALTER TABLE products ADD COLUMN spotify_url TEXT" },
      { table: 'products', column: 'is_coming_soon', sql: "ALTER TABLE products ADD COLUMN is_coming_soon INTEGER DEFAULT 0" },
      { table: 'products', column: 'mood', sql: "ALTER TABLE products ADD COLUMN mood TEXT" },
      { table: 'products', column: 'franchise', sql: "ALTER TABLE products ADD COLUMN franchise TEXT" },
      { table: 'products', column: 'collection_id', sql: "ALTER TABLE products ADD COLUMN collection_id TEXT" },
      { table: 'products', column: 'sub_collection', sql: "ALTER TABLE products ADD COLUMN sub_collection TEXT" },
      { table: 'products', column: 'is_gallery', sql: "ALTER TABLE products ADD COLUMN is_gallery INTEGER DEFAULT 0" },
      { table: 'products', column: 'is_hidden', sql: "ALTER TABLE products ADD COLUMN is_hidden INTEGER DEFAULT 0" },
      { table: 'products', column: 'colors', sql: "ALTER TABLE products ADD COLUMN colors TEXT" },
      { table: 'order_items', column: 'custom_text', sql: "ALTER TABLE order_items ADD COLUMN custom_text TEXT" },
      { table: 'order_items', column: 'color', sql: "ALTER TABLE order_items ADD COLUMN color TEXT" },
      { table: 'collections', column: 'spotify_url', sql: "ALTER TABLE collections ADD COLUMN spotify_url TEXT" },
      { table: 'collections', column: 'status', sql: "ALTER TABLE collections ADD COLUMN status TEXT DEFAULT 'available'" },
      { table: 'collections', column: 'has_sub_collections', sql: "ALTER TABLE collections ADD COLUMN has_sub_collections INTEGER DEFAULT 0" },
      { table: 'collections', column: 'sub_collections', sql: "ALTER TABLE collections ADD COLUMN sub_collections TEXT" },
      { table: 'collections', column: 'category', sql: "ALTER TABLE collections ADD COLUMN category TEXT DEFAULT 'أفلام'" },
      { table: 'products', column: 'season', sql: "ALTER TABLE products ADD COLUMN season TEXT DEFAULT 'all-season'" },
      { table: 'products', column: 'bts_content', sql: "ALTER TABLE products ADD COLUMN bts_content TEXT" },
      { table: 'products', column: 'has_color_variants', sql: "ALTER TABLE products ADD COLUMN has_color_variants INTEGER DEFAULT 0" }
    ];

    async function columnExists(tableName: string, columnName: string): Promise<boolean> {
      try {
        const result = await db.execute(`PRAGMA table_info(${tableName})`);
        return result.rows.some(row => row.name === columnName);
      } catch (error) {
        console.warn(`⚠️ Could not check column existence for ${tableName}.${columnName}:`, error);
        return false;
      }
    }

    for (const migration of migrations) {
      try {
        const exists = await columnExists(migration.table, migration.column);
        if (!exists) {
          await db.execute(migration.sql);
          console.log(`✅ Migration successful: ${migration.sql}`);
        } else {
          console.log(`ℹ️ Column ${migration.table}.${migration.column} already exists, skipping.`);
        }
      } catch (error: any) {
        console.warn(`⚠️ Migration warning (${migration.sql}):`, error.message);
      }
    }
    
    // Drop 'items' column if it exists (special case)
    try {
      const itemsExists = await columnExists('orders', 'items');
      if (itemsExists) {
        await db.execute("ALTER TABLE orders DROP COLUMN items");
        console.log("✅ Dropped 'items' column from orders");
      } else {
        console.log("ℹ️ 'items' column does not exist in orders, skipping drop.");
      }
    } catch (error: any) {
      console.warn("⚠️ Error dropping 'items' column:", error.message);
    }

    // Seed initial coupons if they don't exist
    const initialCoupons = [
      { code: 'VCR-SAVE-20', type: 'percentage', value: 20 },
      { code: 'VCR-SAVE-15', type: 'percentage', value: 15 },
      { code: 'VCR-CASH-100', type: 'fixed', value: 100 },
      { code: 'VCR-FREE-SHIP', type: 'free_shipping', value: 0 },
      { code: 'VCR-B2G1', type: 'b2g1', value: 0 }
    ];

    for (const coupon of initialCoupons) {
      // Check if coupon exists first to avoid randomUUID collision on every initDb call if we used INSERT OR IGNORE with fixed ID
      // But since we use randomUUID, INSERT OR IGNORE on code is better.
      await db.execute({
        sql: "INSERT OR IGNORE INTO coupons (id, code, discount_type, discount_value, min_purchase, is_active) VALUES (?, ?, ?, ?, ?, ?)",
        args: [crypto.randomUUID(), coupon.code, coupon.type, coupon.value, 0, 1]
      });
    }

    // await seedInitialProducts();
    await seedInitialSettings();
    
    console.log("✅ Database tables initialized successfully.");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  }
}

async function seedInitialProducts() {
  console.log("🌱 Seeding initial products...");
  const products = [
    {
      id: 'p1',
      title: 'The Godfather Tee',
      description: 'An offer you can\'t refuse. Premium cotton t-shirt featuring the iconic logo.',
      price: 450,
      genres: JSON.stringify(['Classic', 'Crime']),
      image_main: 'https://picsum.photos/seed/godfather/800/1000',
      image_trailer: 'https://picsum.photos/seed/godfather-trailer/800/1000',
      images: JSON.stringify(['https://picsum.photos/seed/godfather2/800/1000']),
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      inventory_s: 10,
      inventory_m: 15,
      inventory_l: 5,
      rating: 4.8,
      review_count: 124,
      is_box_office_hit: 1
    },
    {
      id: 'p2',
      title: 'Pulp Fiction Hoodie',
      description: 'Bad Mother F***er. High-quality hoodie inspired by the Tarantino masterpiece.',
      price: 750,
      genres: JSON.stringify(['Cult', 'Action']),
      image_main: 'https://picsum.photos/seed/pulp/800/1000',
      image_trailer: 'https://picsum.photos/seed/pulp-trailer/800/1000',
      images: JSON.stringify(['https://picsum.photos/seed/pulp2/800/1000']),
      sizes: JSON.stringify(['M', 'L', 'XL']),
      inventory_s: 0,
      inventory_m: 8,
      inventory_l: 12,
      rating: 4.9,
      review_count: 89,
      is_box_office_hit: 1
    },
    {
      id: 'p3',
      title: 'Inception Dream Totem',
      description: 'Is it a dream? A replica of Cobb\'s spinning top. Comes with a display case.',
      price: 300,
      genres: JSON.stringify(['Sci-Fi', 'Thriller']),
      image_main: 'https://picsum.photos/seed/inception/800/1000',
      image_trailer: 'https://picsum.photos/seed/inception-trailer/800/1000',
      images: JSON.stringify(['https://picsum.photos/seed/inception2/800/1000']),
      sizes: JSON.stringify(['One Size']),
      inventory_s: 50,
      inventory_m: 0,
      inventory_l: 0,
      rating: 4.7,
      review_count: 56,
      is_box_office_hit: 0
    }
  ];

  for (const product of products) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO products (
        id, title, description, price, genres, image_main, image_trailer, images, 
        sizes, inventory_s, inventory_m, inventory_l, rating, review_count, is_box_office_hit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        product.id, product.title, product.description, product.price, product.genres,
        product.image_main, product.image_trailer, product.images, product.sizes,
        product.inventory_s, product.inventory_m, product.inventory_l,
        product.rating, product.review_count, product.is_box_office_hit
      ]
    });
  }
  console.log("✅ Products seeded.");
}

async function seedInitialSettings() {
  console.log("🌱 Seeding initial settings...");
  const defaultSettings = {
    announcement: {
      text: "🎬 WELCOME TO THE CUTSCENE STORE - THE DIRECTOR'S CUT IS HERE!",
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
  console.log("✅ Settings seeded.");
}
