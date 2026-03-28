import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API for attendance - forwards to Google Apps Script
  app.post("/api/attendance", async (req, res) => {
    try {
      console.log("Processing attendance for:", req.body.fullName);
      
      const GAS_URL = process.env.GAS_WEBAPP_URL;
      
      if (GAS_URL) {
        // Forward to Google Apps Script
        const response = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body)
        });
        
        if (!response.ok) throw new Error('GAS submission failed');
        console.log("Successfully forwarded to GAS");
      } else {
        console.warn("GAS_WEBAPP_URL not set, data only logged locally");
      }

      res.json({ status: "success", message: "Data terkirim" });
    } catch (error) {
      console.error("Server error forwarding to GAS:", error);
      res.status(500).json({ status: "error", message: "Gagal mengirim ke spreadsheet" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
