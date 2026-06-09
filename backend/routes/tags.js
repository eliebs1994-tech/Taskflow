const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => res.json(getDB().prepare('SELECT * FROM tags ORDER BY name').all()));

router.post('/', requireRole('admin', 'manager'), (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const db = getDB();
  const id = uuidv4();
  db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)').run(id, name, color || '#534AB7');
  res.status(201).json(db.prepare('SELECT * FROM tags WHERE id = ?').get(id));
});

router.put('/:id', requireRole('admin', 'manager'), (req, res) => {
  const { name, color } = req.body;
  getDB().prepare('UPDATE tags SET name=COALESCE(?,name), color=COALESCE(?,color) WHERE id=?').run(name || null, color || null, req.params.id);
  res.json(getDB().prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireRole('admin', 'manager'), (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM task_tags WHERE tag_id = ?').run(req.params.id);
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

router.post('/task/:taskId', (req, res) => {
  const { tag_id } = req.body;
  try {
    getDB().prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(req.params.taskId, tag_id);
    res.json({ message: 'Added' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/task/:taskId/:tagId', (req, res) => {
  getDB().prepare('DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?').run(req.params.taskId, req.params.tagId);
  res.json({ message: 'Removed' });
});

module.exports = router;
