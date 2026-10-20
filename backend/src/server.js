import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { initDb } from "./db.js";
import { connectRedis } from "./redisClient.js";
import bookmarksRouter from "./routes/bookmarks.js";
import pool from "./db.js";
import redisClient from "./redisClient.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", async (req, res) => {
  let dbState = "unknown";
  let redisState = "unknown";

  try {
    await pool.query("SELECT 1");
    dbState = "connected";
  } catch {
    dbState = "disconnected";
  }

  try {
    await redisClient.ping();
    redisState = "connected";
  } catch {
    redisState = "disconnected";
  }

  res.json({
    status: "ok",
    service: "bookmarks-api",
    postgres: dbState,
    redis: redisState,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/bookmarks", bookmarksRouter);

async function start() {
  try {
    await initDb();
    console.log("Connected to Postgres, table ready");

    await connectRedis();
    console.log("Connected to Redis");

    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
