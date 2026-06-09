const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => res.json(getDB().prepare('SELECT * FROM custom_fields ORDER BY position').all()));

router.post('/', requireRole('admin', 'manager'), (req, res) => {
  const { name, type, options } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const db = getDB();
  const maxPos = db.prepare('SELECT MAX(position) as p FROM custom_fields').get().p || 0;
  const id = uuidv4();
  db.prepare('INSERT INTO custom_fields (id, name, type, options, position) VALUES (?, ?, ?, ?, ?)').run(id, name, type || 'text', options ? JSON.stringify(options) : null, maxPos + 1);
  res.status(201).json(db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(id));
});

router.put('/:id', requireRole('admin', 'manager'), (req, res) => {
  const { name, options } = req.body;
  getDB().prepare('UPDATE custom_fields SET name=COALESCE(?,name), options=COALESCE(?,options) WHERE id=?').run(name || null, options ? JSON.stringify(options) : null, req.params.id);
  res.json(getDB().prepare('SELECT * FROM custom_fields WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireRole('admin', 'manager'), (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM task_custom_values WHERE field_id = ?').run(req.params.id);
  db.prepare('DELETE FROM custom_fields WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

router.get('/task/:taskId', (req, res) => {
  const db = getDB();
  const fields = db.prepare('SELECT * FROM custom_fields ORDER BY position').all();
  const values = db.prepare('SELECT * FROM task_custom_values WHERE task_id = ?').all(req.params.taskId);
  res.json({ fields, values });
});

router.put('/task/:taskId/:fieldId', (req, res) => {
  const { value } = req.body;
  getDB().prepare('INSERT OR REPLACE INTO task_custom_values (task_id, field_id, value) VALUES (?, ?, ?)').run(req.params.taskId, req.params.fieldId, value !== undefined ? value : null);
  res.json({ message: 'Saved' });
});

module.exports = router;
