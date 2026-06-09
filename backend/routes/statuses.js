const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json(getDB().prepare('SELECT * FROM statuses ORDER BY position').all());
});

router.post('/', requireRole('admin', 'manager'), (req, res) => {
  const { name, color, is_closed } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const db = getDB();
  const maxPos = db.prepare('SELECT MAX(position) as p FROM statuses').get().p || 0;
  const id = uuidv4();
  db.prepare('INSERT INTO statuses (id, name, color, position, is_closed) VALUES (?, ?, ?, ?, ?)').run(id, name, color || '#6B6F76', maxPos + 1, is_closed ? 1 : 0);
  res.status(201).json(db.prepare('SELECT * FROM statuses WHERE id = ?').get(id));
});

router.put('/:id', requireRole('admin', 'manager'), (req, res) => {
  const { name, color, is_closed, position } = req.body;
  const db = getDB();
  db.prepare('UPDATE statuses SET name=COALESCE(?,name), color=COALESCE(?,color), is_closed=COALESCE(?,is_closed), position=COALESCE(?,position) WHERE id=?')
    .run(name || null, color || null, is_closed !== undefined ? (is_closed ? 1 : 0) : null, position !== undefined ? position : null, req.params.id);
  res.json(db.prepare('SELECT * FROM statuses WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  getDB().prepare('DELETE FROM statuses WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
