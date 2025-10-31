// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  reports;
  constructor() {
    this.reports = /* @__PURE__ */ new Map();
  }
  async createReport(insertReport) {
    const id = randomUUID();
    const report = {
      ...insertReport,
      status: insertReport.status || "pending",
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.reports.set(id, report);
    return report;
  }
  async getReports() {
    return Array.from(this.reports.values());
  }
  async getReportsByUser(userId) {
    return Array.from(this.reports.values()).filter(
      (report) => report.userId === userId
    );
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  userEmail: text("user_email").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  longitude: real("longitude").notNull(),
  latitude: real("latitude").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true
});

// server/gemini.ts
import { GoogleGenAI } from "@google/genai";
var ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
async function chatWithAI(messages, context) {
  try {
    const systemInstruction = `You are an expert urban planning AI assistant. You help urban planners and city officials make data-driven decisions about city development, traffic management, infrastructure planning, and environmental sustainability.

${context ? `Current context: ${context}` : ""}

Provide actionable, specific recommendations based on urban planning best practices. Keep responses concise but informative.`;
    const formattedMessages = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction
      },
      contents: formattedMessages
    });
    return response.text || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(`AI service error: ${error.message}`);
  }
}
async function getOptimizationSuggestions(area, currentData) {
  const prompt = `Analyze this urban area and provide optimization suggestions:
Area: ${area}
Current Data: ${JSON.stringify(currentData, null, 2)}

Provide 3-5 specific, actionable recommendations for improving this area.`;
  return chatWithAI([{ role: "user", content: prompt }]);
}
async function predictCongestion(location, trafficData) {
  const prompt = `Analyze traffic patterns and predict congestion:
Location: ${location}
Current Traffic Data: ${JSON.stringify(trafficData, null, 2)}

Provide congestion predictions for the next 2-4 hours and suggest mitigation strategies.`;
  return chatWithAI([{ role: "user", content: prompt }]);
}
async function analyzeTraffic(location, coordinates) {
  const prompt = `Provide a detailed traffic analysis for:
Location: ${location}
Coordinates: ${coordinates[0]}, ${coordinates[1]}

Include current conditions, peak times, bottlenecks, and improvement recommendations.`;
  return chatWithAI([{ role: "user", content: prompt }]);
}

// server/aqi.ts
async function getAQI(lat, lon) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(
          `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        if (response.ok) {
          const data = await response.json();
          const list = data.list[0];
          return {
            aqi: list.main.aqi * 50,
            // Convert to US AQI scale (1-5 to 0-250)
            pollutants: {
              pm25: list.components.pm2_5,
              pm10: list.components.pm10,
              o3: list.components.o3,
              no2: list.components.no2,
              so2: list.components.so2,
              co: list.components.co
            },
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            location: { lat, lon }
          };
        }
      } catch (apiError) {
        console.error("Real AQI API failed, falling back to simulated data:", apiError);
      }
    }
    const mockAQI = {
      aqi: Math.floor(Math.random() * 150) + 50,
      pollutants: {
        pm25: Math.floor(Math.random() * 50) + 10,
        pm10: Math.floor(Math.random() * 80) + 20,
        o3: Math.floor(Math.random() * 100) + 30,
        no2: Math.floor(Math.random() * 60) + 15,
        so2: Math.floor(Math.random() * 40) + 10,
        co: Math.floor(Math.random() * 500) + 200
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      location: { lat, lon },
      simulated: true
    };
    return mockAQI;
  } catch (error) {
    console.error("AQI fetch error:", error);
    throw new Error(`Failed to fetch AQI data: ${error.message}`);
  }
}
function getAQICategory(aqi) {
  if (aqi <= 50) {
    return {
      level: "Good",
      color: "#00e400",
      description: "Air quality is satisfactory"
    };
  } else if (aqi <= 100) {
    return {
      level: "Moderate",
      color: "#ffff00",
      description: "Air quality is acceptable"
    };
  } else if (aqi <= 150) {
    return {
      level: "Unhealthy for Sensitive Groups",
      color: "#ff7e00",
      description: "Sensitive groups may experience health effects"
    };
  } else if (aqi <= 200) {
    return {
      level: "Unhealthy",
      color: "#ff0000",
      description: "Everyone may begin to experience health effects"
    };
  } else if (aqi <= 300) {
    return {
      level: "Very Unhealthy",
      color: "#8f3f97",
      description: "Health alert: everyone may experience serious effects"
    };
  } else {
    return {
      level: "Hazardous",
      color: "#7e0023",
      description: "Health warnings of emergency conditions"
    };
  }
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      res.json(report);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app2.get("/api/reports", async (req, res) => {
    try {
      const reports2 = await storage.getReports();
      res.json(reports2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/reports/user/:userId", async (req, res) => {
    try {
      const reports2 = await storage.getReportsByUser(req.params.userId);
      res.json(reports2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, context } = req.body;
      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages must be an array" });
      }
      for (const msg of messages) {
        if (!msg.role || !msg.content || typeof msg.content !== "string") {
          return res.status(400).json({ error: "Invalid message format" });
        }
      }
      const response = await chatWithAI(messages, context);
      res.json({ message: response });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/ai/optimize", async (req, res) => {
    try {
      const { area, data } = req.body;
      const suggestions = await getOptimizationSuggestions(area, data);
      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/ai/predict-congestion", async (req, res) => {
    try {
      const { location, trafficData } = req.body;
      const prediction = await predictCongestion(location, trafficData);
      res.json({ prediction });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/ai/analyze-traffic", async (req, res) => {
    try {
      const { location, coordinates } = req.body;
      const analysis = await analyzeTraffic(location, coordinates);
      res.json({ analysis });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/aqi", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      const aqiData = await getAQI(lat, lon);
      const category = getAQICategory(aqiData.aqi);
      res.json({ ...aqiData, category });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/geocode", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
      }
      const mapboxToken = process.env.MAPBOX_TOKEN;
      if (!mapboxToken) {
        return res.status(500).json({ error: "MAPBOX_TOKEN environment variable is not configured" });
      }
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5`
      );
      if (!response.ok) {
        throw new Error("Geocoding request failed");
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
