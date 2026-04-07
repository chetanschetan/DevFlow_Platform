import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger, type ViteDevServer } from "vite";
import { type Server } from "http";
// @ts-ignore - Ignore if the relative path is temporarily broken during folder move
import viteConfig from "../vite.config"; 
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite: ViteDevServer = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // Do not exit in production, only in dev if critical
        if (process.env.NODE_ENV !== 'production') process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  
  // Explicitly typing req/res/next to remove "any" errors
  app.use("*", async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;

    try {
      // FIX: Using process.cwd() is safer for monorepos
      const clientTemplate = path.resolve(process.cwd(), "client", "index.html");

      if (!fs.existsSync(clientTemplate)) {
        return next(new Error(`Template not found at ${clientTemplate}`));
      }

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // Cache busting for main entry point
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // FIX: Path resolution for the production 'dist' folder
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    // In production, we log instead of throwing to prevent container restart loops
    console.warn(`⚠️ Warning: Build directory not found: ${distPath}`);
    return;
  }

  app.use(express.static(distPath));

  app.use("*", (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}