const express = require('express');
const { getDB } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

router.get('/task/:taskId', (req, res) => {
  const db = getDB();
  const activity = db.prepare(`
    SELECT a.*, u.full_name, u.avatar_initials, u.avatar_color, u.avatar_text_color, 'activity' as item_type
    FROM activity a LEFT JOIN users u ON a.user_id = u.id
    WHERE a.task_id = ? ORDER BY a.created_at DESC LIMIT 100
  `).all(req.params.taskId);
  res.json(activity);
});

module.exports = router;
