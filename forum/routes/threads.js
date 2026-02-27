import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Get all threads
router.get("/", async (req, res) => {
  const result = await pool.query(
    "SELECT t.id, t.title, u.username, t.created_at FROM threads t JOIN users u ON t.author_id = u.id ORDER BY t.created_at DESC"
  );
  res.json(result.rows);
});

// Create a thread
router.post("/", async (req, res) => {
  const { title } = req.body;
  const userId = req.user.id; // from auth middleware

  await pool.query(
    "INSERT INTO threads (title, author_id) VALUES ($1, $2)",
    [title, userId]
  );

  res.sendStatus(201);
});

export default router;
