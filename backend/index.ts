import express, { type Request, Response, NextFunction } from "express";
import cors from "cors"; 
import { registerRoutes } from "./routes";
import { connectDB } from "./db";
import { LocalCompilerService } from "./services/local-compiler";
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL
].filter((origin): origin is string => !!origin); // This removes undefined and satisfies TS

app.use(cors({
  origin: allowedOrigins, // Allow both common Vite ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware to track API hits
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`[API] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

app.get("/", (req, res) => {
  res.send("🚀 DevFlow API is running perfectly!");
});

(async () => {
  try {
    console.log('--- 🏁 Boot Sequence Started ---');

    // 1. Connect to MongoDB
    console.log('Step 1: Connecting to Database...');
    await connectDB();
    console.log('✅ Database Link Established');

    // 2. Initialize Local Java Compiler
    console.log('Step 2: Initializing Java Compiler...');
    try {
      await LocalCompilerService.initialize();
      console.log('✅ Local Java compiler initialized');
    } catch (error) {
      // We don't crash the server if Java isn't ready yet, just log it.
      console.error('⚠️ Java compiler warning: Check JDK installation.');
    }

    // 3. Register Routes (Wait for the HTTP Server object)
    console.log('Step 3: Registering API Routes...');
    const httpServer = await registerRoutes(app);
    console.log('✅ Routes Registered');

    // 4. Global Error Handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || "Internal Server Error" });
    });

    const PORT: number = Number(process.env.PORT) || 3000;
    const HOST: string = '0.0.0.0'; // Allows access from other devices
    
    // Correct Order: (port, host, callback)
    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 API Server running on http://localhost:${PORT}`);
      console.log(`📝 Health Check: http://localhost:${PORT}/api/health`);
      console.log('--- 🚀 Boot Sequence Complete ---');
    });

  } catch (bootError: any) {
    console.error('❌ Critical Server Boot Failure:', bootError.message);
    process.exit(1);
  }
})();