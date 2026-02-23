import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const isVercel = process.env.VERCEL === '1';
let db: any;
let useMemoryStore = false;
let memoryScores: any[] = [];

try {
  db = new Database("leaderboard.db");
  // Initialize database
  if (!isVercel) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        score INTEGER NOT NULL,
        date TEXT NOT NULL
      )
    `);
  }
} catch (error) {
  console.error("Failed to initialize SQLite database, falling back to memory store:", error);
  useMemoryStore = true;
}

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), store: useMemoryStore ? "memory" : "sqlite" });
});

// API Routes
app.get("/api/scores", (req, res) => {
  console.log("GET /api/scores request received");
  try {
    if (useMemoryStore) {
      const scores = [...memoryScores].sort((a, b) => b.score - a.score).slice(0, 10);
      return res.json(scores);
    }
    const scores = db.prepare("SELECT * FROM scores ORDER BY score DESC LIMIT 10").all();
    console.log("Fetched scores:", scores.length);
    res.json(scores);
  } catch (error) {
    console.error("Error fetching scores:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
});

app.post("/api/scores", (req, res) => {
  const { name, score } = req.body;
  if (!name || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid data" });
  }

  try {
    const date = new Date().toISOString().split('T')[0];
    if (useMemoryStore) {
      memoryScores.push({ id: Date.now(), name, score, date });
      return res.json({ success: true });
    }
    const stmt = db.prepare("INSERT INTO scores (name, score, date) VALUES (?, ?, ?)");
    stmt.run(name, score, date);
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).json({ error: "Failed to save score" });
  }
});

// Export for Vercel
export default app;

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !isVercel) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!isVercel) {
    // Production static serving (only if not on Vercel, Vercel handles this via vercel.json)
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  if (!isVercel) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

if (!isVercel) {
  startServer();
}
