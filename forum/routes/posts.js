import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/:threadId", async (req, res) => {
  const { threadId } = req.params;

  const result = await pool.query(
    "SELECT p.id, p.content, u.username, p.created_at FROM posts p JOIN users u ON p.author_id = u.id WHERE p.thread_id = $1 ORDER BY p.created_at",
    [threadId]
  );

  res.json(result.rows);
});

router.post("/:threadId", async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;

  await pool.query(
    "INSERT INTO posts (thread_id, author_id, content) VALUES ($1, $2, $3)",
    [req.params.threadId, userId, content]
  );

  res.sendStatus(201);
});

export default router;
