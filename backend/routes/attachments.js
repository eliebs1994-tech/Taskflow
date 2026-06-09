const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

router.get('/task/:taskId', (req, res) => {
  const atts = getDB().prepare(`
    SELECT a.id, a.task_id, a.name, a.mime_type, a.created_at,
      u.full_name, u.avatar_initials, u.avatar_color, u.avatar_text_color
    FROM attachments a LEFT JOIN users u ON a.user_id = u.id
    WHERE a.task_id = ? ORDER BY a.created_at DESC
  `).all(req.params.taskId);
  res.json(atts);
});

router.get('/:id/data', (req, res) => {
  const att = getDB().prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);
  if (!att) return res.status(404).json({ error: 'Not found' });
  res.json({ data: att.data, mime_type: att.mime_type, name: att.name });
});

router.post('/task/:taskId', (req, res) => {
  const { name, mime_type, data } = req.body;
  if (!name || !data) return res.status(400).json({ error: 'Name and data required' });
  if (data.length > 15000000) return res.status(400).json({ error: 'File too large (max 10MB)' });
  const db = getDB();
  const id = uuidv4();
  db.prepare('INSERT INTO attachments (id, task_id, user_id, name, mime_type, data) VALUES (?, ?, ?, ?, ?, ?)').run(id, req.params.taskId, req.user.id, name, mime_type || 'application/octet-stream', data);
  db.prepare('INSERT INTO activity (id, task_id, user_id, action, new_value) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), req.params.taskId, req.user.id, 'attachment_added', name);
  res.status(201).json({ id, name, mime_type, created_at: new Date().toISOString() });
});

router.delete('/:id', (req, res) => {
  getDB().prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
