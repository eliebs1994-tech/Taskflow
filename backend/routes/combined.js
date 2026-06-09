const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

// ── Departments ──────────────────────────────────────────────────────────────
const deptRouter = express.Router();
deptRouter.use(authMiddleware);

deptRouter.get('/', (req, res) => {
  const db = getDB();
  const depts = db.prepare(`SELECT d.*, u.full_name as manager_name,
    (SELECT COUNT(*) FROM tasks t WHERE t.department_id = d.id AND t.done = 0) as open_tasks,
    (SELECT COUNT(*) FROM users u2 WHERE u2.department_id = d.id AND u2.is_active = 1) as member_count
    FROM departments d LEFT JOIN users u ON d.manager_id = u.id`).all();
  res.json(depts);
});

deptRouter.post('/', requireRole('admin'), (req, res) => {
  const { name, name_ar, color, description, manager_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const db = getDB();
  const id = 'd-' + name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  db.prepare('INSERT INTO departments (id, name, name_ar, color, description, manager_id) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, name_ar || null, color || '#534AB7', description || null, manager_id || null);
  res.status(201).json(db.prepare('SELECT * FROM departments WHERE id = ?').get(id));
});

deptRouter.put('/:id', requireRole('admin'), (req, res) => {
  const { name, name_ar, color, description, manager_id } = req.body;
  const db = getDB();
  db.prepare('UPDATE departments SET name=COALESCE(?,name), name_ar=COALESCE(?,name_ar), color=COALESCE(?,color), description=COALESCE(?,description), manager_id=COALESCE(?,manager_id) WHERE id=?')
    .run(name||null, name_ar||null, color||null, description||null, manager_id||null, req.params.id);
  res.json(db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id));
});

deptRouter.delete('/:id', requireRole('admin'), (req, res) => {
  getDB().prepare('DELETE FROM departments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ── Users ────────────────────────────────────────────────────────────────────
const userRouter = express.Router();
userRouter.use(authMiddleware);

userRouter.get('/', (req, res) => {
  const db = getDB();
  const users = db.prepare('SELECT id, username, email, full_name, role, department_id, avatar_initials, avatar_color, avatar_text_color, is_active, created_at, last_login FROM users WHERE is_active = 1').all();
  res.json(users);
});

userRouter.put('/:id', requireRole('admin'), (req, res) => {
  const { full_name, email, role, department_id, is_active } = req.body;
  const db = getDB();
  db.prepare('UPDATE users SET full_name=COALESCE(?,full_name), email=COALESCE(?,email), role=COALESCE(?,role), department_id=COALESCE(?,department_id), is_active=COALESCE(?,is_active) WHERE id=?')
    .run(full_name||null, email||null, role||null, department_id||null, is_active !== undefined ? is_active : null, req.params.id);
  res.json({ message: 'Updated' });
});

userRouter.delete('/:id', requireRole('admin'), (req, res) => {
  getDB().prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deactivated' });
});

// ── Time entries ─────────────────────────────────────────────────────────────
const timeRouter = express.Router();
timeRouter.use(authMiddleware);

timeRouter.get('/', (req, res) => {
  const db = getDB();
  const { task_id, user_id, from, to } = req.query;
  let q = `SELECT te.*, t.title as task_title, t.department_id, d.name as dept_name, d.color as dept_color, u.full_name as user_name
    FROM time_entries te LEFT JOIN tasks t ON te.task_id = t.id LEFT JOIN departments d ON t.department_id = d.id LEFT JOIN users u ON te.user_id = u.id WHERE 1=1`;
  const p = [];
  if (task_id) { q += ' AND te.task_id = ?'; p.push(task_id); }
  if (user_id) { q += ' AND te.user_id = ?'; p.push(user_id); }
  if (from) { q += ' AND te.date >= ?'; p.push(from); }
  if (to) { q += ' AND te.date <= ?'; p.push(to); }
  if (req.user.role === 'member') { q += ' AND te.user_id = ?'; p.push(req.user.id); }
  q += ' ORDER BY te.date DESC, te.created_at DESC';
  res.json(db.prepare(q).all(...p));
});

timeRouter.post('/', (req, res) => {
  const { task_id, duration_minutes, date, note } = req.body;
  if (!task_id || !duration_minutes || !date) return res.status(400).json({ error: 'task_id, duration_minutes, date required' });
  const db = getDB();
  const id = uuidv4();
  db.prepare('INSERT INTO time_entries (id, task_id, user_id, duration_minutes, date, note) VALUES (?, ?, ?, ?, ?, ?)').run(id, task_id, req.user.id, duration_minutes, date, note || null);
  res.status(201).json(db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id));
});

timeRouter.delete('/:id', (req, res) => {
  const db = getDB();
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'member' && entry.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

// ── Notifications ────────────────────────────────────────────────────────────
const notifRouter = express.Router();
notifRouter.use(authMiddleware);

notifRouter.get('/', (req, res) => {
  const db = getDB();
  const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(notifs);
});

notifRouter.put('/read-all', (req, res) => {
  getDB().prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'All marked as read' });
});

notifRouter.put('/:id/read', (req, res) => {
  getDB().prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Marked as read' });
});

// ── Comments ─────────────────────────────────────────────────────────────────
const commentRouter = express.Router();
commentRouter.use(authMiddleware);

commentRouter.get('/:taskId', (req, res) => {
  const comments = getDB().prepare(`SELECT c.*, u.full_name, u.avatar_initials, u.avatar_color, u.avatar_text_color
    FROM comments c JOIN users u ON c.user_id = u.id WHERE c.task_id = ? ORDER BY c.created_at ASC`).all(req.params.taskId);
  res.json(comments);
});

commentRouter.post('/:taskId', (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  const db = getDB();
  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, task_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, req.params.taskId, req.user.id, content);
  db.prepare('INSERT INTO activity (id, task_id, user_id, action, new_value) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), req.params.taskId, req.user.id, 'commented', content);
  const comment = db.prepare('SELECT c.*, u.full_name, u.avatar_initials, u.avatar_color, u.avatar_text_color FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(id);
  req.app.get('io').emit('comment_added', { taskId: req.params.taskId, comment });
  res.status(201).json(comment);
});

commentRouter.delete('/:id', (req, res) => {
  const db = getDB();
  const c = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'member' && c.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = { deptRouter, userRouter, timeRouter, notifRouter, commentRouter };
