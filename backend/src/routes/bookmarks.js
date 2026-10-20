import express from "express";
import pool from "../db.js";
import redisClient from "../redisClient.js";

const router = express.Router();

// List all bookmarks
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bookmarks ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

// Add a new bookmark
router.post("/", async (req, res) => {
  const { title, url, tag } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: "title and url are required" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO bookmarks (title, url, tag) VALUES ($1, $2, $3) RETURNING *",
      [title, url, tag || "general"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create bookmark" });
  }
});

// Delete a bookmark
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM bookmarks WHERE id = $1", [req.params.id]);
    await redisClient.del(`clicks:${req.params.id}`);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete bookmark" });
  }
});

// Register a click (increment counter in Redis)
router.post("/:id/click", async (req, res) => {
  try {
    const count = await redisClient.incr(`clicks:${req.params.id}`);
    res.json({ id: req.params.id, clicks: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register click" });
  }
});

// Get click count for a bookmark
router.get("/:id/clicks", async (req, res) => {
  try {
    const count = await redisClient.get(`clicks:${req.params.id}`);
    res.json({ id: req.params.id, clicks: parseInt(count || "0", 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch click count" });
  }
});

export default router;
