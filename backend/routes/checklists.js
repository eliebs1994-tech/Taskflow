const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

router.get('/task/:taskId', (req, res) => {
  const db = getDB();
  const lists = db.prepare('SELECT * FROM checklists WHERE task_id = ? ORDER BY position').all(req.params.taskId);
  const items = db.prepare('SELECT * FROM checklist_items WHERE checklist_id IN (SELECT id FROM checklists WHERE task_id = ?) ORDER BY position').all(req.params.taskId);
  res.json(lists.map(l => ({ ...l, items: items.filter(i => i.checklist_id === l.id) })));
});

router.post('/task/:taskId', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const db = getDB();
  const maxPos = db.prepare('SELECT MAX(position) as p FROM checklists WHERE task_id = ?').get(req.params.taskId).p || 0;
  const id = uuidv4();
  db.prepare('INSERT INTO checklists (id, task_id, name, position) VALUES (?, ?, ?, ?)').run(id, req.params.taskId, name, maxPos + 1);
  res.status(201).json({ id, task_id: req.params.taskId, name, items: [] });
});

router.delete('/:id', (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM checklist_items WHERE checklist_id = ?').run(req.params.id);
  db.prepare('DELETE FROM checklists WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

router.post('/:checklistId/items', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const db = getDB();
  const maxPos = db.prepare('SELECT MAX(position) as p FROM checklist_items WHERE checklist_id = ?').get(req.params.checklistId).p || 0;
  const id = uuidv4();
  db.prepare('INSERT INTO checklist_items (id, checklist_id, name, position) VALUES (?, ?, ?, ?)').run(id, req.params.checklistId, name, maxPos + 1);
  res.status(201).json(db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(id));
});

router.put('/items/:id', (req, res) => {
  const { name, is_done } = req.body;
  getDB().prepare('UPDATE checklist_items SET name=COALESCE(?,name), is_done=COALESCE(?,is_done) WHERE id=?')
    .run(name || null, is_done !== undefined ? (is_done ? 1 : 0) : null, req.params.id);
  res.json(getDB().prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id));
});

router.delete('/items/:id', (req, res) => {
  getDB().prepare('DELETE FROM checklist_items WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
