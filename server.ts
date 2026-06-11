import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import generateNotesHandler from "./api/generate-notes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Increase payload bounds for base64 PDFs and notes
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 1. API: Generate study guide from uploaded materials
app.post("/api/generate-notes", generateNotesHandler);

// Configure client environment & routing
async function init() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Express in Development mode (with Vite middleware)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up Express in Production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express dev/prod server listening at http://0.0.0.0:${PORT}`);
  });
}

init();
