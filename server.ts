import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import multer from "multer";
import fs from "fs";
import authRoutes from "./src/server/routes/auth";
import adminRoutes from "./src/server/routes/adminRoutes";
import orderRoutes from "./src/server/routes/orderRoutes";
import aiRoutes from "./src/server/routes/aiRoutes";
import couponRoutes from "./src/server/routes/couponRoutes";
import productRoutes from "./src/server/routes/productRoutes";
import settingsRoutes from "./src/server/routes/settingsRoutes";
import analyticsRoutes from "./src/server/routes/analyticsRoutes";
import collectionRoutes from "./src/server/routes/collectionRoutes";
import { seedAdmin } from "./src/server/controllers/authController";
import { checkDbConnection } from "./src/server/middleware/dbCheck";
import { initDb, db } from "./src/server/db";
import { trackVisitor, startVisitorReporting } from "./src/server/services/visitorService";

const __dirname = process.cwd();

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. CORS Middleware (Must be FIRST)
  const corsOptions = {
    origin: true, // Reflect the request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions)); // Explicitly handle OPTIONS for all routes

  // 2. Visitor Tracking & Logging Middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin || 'none';
    const referer = req.headers.referer || 'none';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    // Track visitor if it's a page request (not a static asset or internal API)
    if (!req.url.includes('.') && !req.url.startsWith('/api/admin') && !req.url.startsWith('/uploads')) {
      trackVisitor(Array.isArray(ip) ? ip[0] : ip);
    }

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} (Origin: ${origin}, Referer: ${referer}, IP: ${ip})`);
    next();
  });

  // Remove the old cors() middleware later in the file
  app.use(express.json());

  // Static file serving for uploads
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.get("/test-api", (req, res) => {
    res.json({ message: "API is reachable" });
  });

  // API Routes
  const apiRouter = express.Router();
  
  // Ensure no trailing slash redirects for API
  app.set('strict routing', false);
  
  // Check DB connection for all API routes
  apiRouter.use(checkDbConnection);
  
  apiRouter.use("/auth", authRoutes);
  apiRouter.use("/admin", adminRoutes);
  apiRouter.use("/orders", orderRoutes);
  apiRouter.use("/ai", aiRoutes);
  apiRouter.use("/coupons", couponRoutes);
  apiRouter.use("/products", productRoutes);
  apiRouter.use("/settings", settingsRoutes);
  apiRouter.use("/analytics", analyticsRoutes);
  apiRouter.use("/collections", collectionRoutes);

  // File upload route
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  const upload = multer({ storage });
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
    } catch (err: any) {
      res.status(500).json({ status: "error", database: "disconnected", error: err.message });
    }
  });

  apiRouter.get("/ping", (req, res) => {
    // Middleware already tracks the visitor
    res.json({ status: "pong" });
  });

  apiRouter.get("/cron/visitor-report", async (req, res) => {
    try {
      const { forceSendVisitorReport } = await import("./src/server/services/visitorService");
      await forceSendVisitorReport();
      res.json({ status: "ok", message: "Visitor report sent" });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: err.message });
    }
  });

  // JSON 404 for API routes
  apiRouter.use("*", (req, res) => {
    res.status(404).json({ error: "API route not found", path: req.originalUrl });
  });

  app.use("/api", apiRouter);

  // Vite middleware for development (initialized BEFORE listen to pick up routes correctly)
  if (process.env.NODE_ENV !== "production") {
    console.log("📦 Starting Vite development server...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("✅ Vite middleware integrated.");
    } catch (err) {
      console.error("❌ Vite startup error:", err);
    }
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("🔥 Express Error Handler:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  });

  // Handle process-level errors to prevent mysterious crashes
  process.on('uncaughtException', (err: any) => {
    if (err.code === 'EPIPE' || err.message?.includes('EPIPE') || err.syscall?.includes('write')) {
      // Ignore EPIPE errors which happens when clients disconnect
      return;
    }
    console.error('🔥 UNCAUGHT EXCEPTION:', err);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  });

  // Start listening
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is officially live and listening on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialize Database in the background
    (async () => {
      try {
        console.log("🎬 Wait for background initialization...");
        await new Promise(resolve => setTimeout(resolve, 500)); // Short delay to let platform settle
        console.log("🎬 Initializing database...");
        await initDb();
        console.log("🎬 Database Initialized!");
        await seedAdmin();
      } catch (err) {
        console.error("❌ Initialization error:", err);
      }
    })();

    // Start Telegram Visitor Reporting
    try {
      startVisitorReporting();
    } catch (err) {
      console.error("❌ Visitor reporting startup error:", err);
    }
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`🔥 Port ${PORT} is already in use. Retrying or exiting...`);
      process.exit(1);
    } else {
      console.error("🔥 Server instance error:", err);
    }
  });
}

startServer().catch(err => {
  console.error("💥 Fatal server startup error:", err);
  process.exit(1);
});
