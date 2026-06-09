const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDB();
  const { dept, status, priority, assignee, search } = req.query;
  let query = `SELECT t.*, u.full_name as assignee_name, u.avatar_initials, u.avatar_color, u.avatar_text_color,
    d.name as dept_name, d.color as dept_color,
    (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count,
    (SELECT COALESCE(SUM(te.duration_minutes),0) FROM time_entries te WHERE te.task_id = t.id) as total_minutes
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN departments d ON t.department_id = d.id
    WHERE 1=1`;
  const params = [];
  if (dept) { query += ' AND t.department_id = ?'; params.push(dept); }
  if (status === 'open') { query += ' AND t.done = 0'; }
  else if (status === 'done') { query += ' AND t.done = 1'; }
  else if (status === 'overdue') { query += ' AND t.done = 0 AND t.due_date < date("now")'; }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (assignee) { query += ' AND t.assignee_id = ?'; params.push(assignee); }
  if (search) { query += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (req.user.role === 'member') { query += ' AND (t.assignee_id = ? OR t.department_id = ?)'; params.push(req.user.id, req.user.dept); }
  query += ' ORDER BY CASE t.priority WHEN "urgent" THEN 0 WHEN "high" THEN 1 WHEN "medium" THEN 2 ELSE 3 END, t.due_date ASC';
  res.json(db.prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const db = getDB();
  const task = db.prepare(`SELECT t.*, u.full_name as assignee_name, u.avatar_initials, u.avatar_color, u.avatar_text_color,
    d.name as dept_name, d.color as dept_color
    FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id LEFT JOIN departments d ON t.department_id = d.id
    WHERE t.id = ?`).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/', (req, res) => {
  const { title, title_ar, description, department_id, assignee_id, priority, due_date, start_date, estimated_hours, parent_task_id } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const db = getDB();
  const id = uuidv4();
  db.prepare(`INSERT INTO tasks (id, title, title_ar, description, department_id, assignee_id, created_by, priority, due_date, start_date, estimated_hours, parent_task_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, title, title_ar || null, description || null, department_id || null, assignee_id || null, req.user.id, priority || 'medium', due_date || null, start_date || null, estimated_hours || 0, parent_task_id || null);
  const task = db.prepare('SELECT t.*, u.full_name as assignee_name, u.avatar_initials, u.avatar_color, u.avatar_text_color, d.name as dept_name, d.color as dept_color FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id LEFT JOIN departments d ON t.department_id = d.id WHERE t.id = ?').get(id);
  if (assignee_id && assignee_id !== req.user.id) {
    createNotification(db, assignee_id, 'task_assigned', 'New task assigned', 'تم تعيين مهمة جديدة', `You have been assigned: ${title}`, `تم تعيينك في: ${title}`, id, 'task');
    const io = req.app.get('io');
    io.to(`user_${assignee_id}`).emit('new_notification', { type: 'task_assigned', title });
  }
  req.app.get('io').emit('task_created', task);
  res.status(201).json(task);
});

router.put('/:id', (req, res) => {
  const db = getDB();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (req.user.role === 'member' && task.assignee_id !== req.user.id && task.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  const { title, title_ar, description, department_id, assignee_id, priority, due_date, start_date, estimated_hours, done } = req.body;
  db.prepare(`UPDATE tasks SET title=COALESCE(?,title), title_ar=COALESCE(?,title_ar), description=COALESCE(?,description),
    department_id=COALESCE(?,department_id), assignee_id=COALESCE(?,assignee_id), priority=COALESCE(?,priority),
    due_date=COALESCE(?,due_date), start_date=COALESCE(?,start_date), estimated_hours=COALESCE(?,estimated_hours),
    done=COALESCE(?,done), updated_at=datetime('now') WHERE id=?`).run(
    title||null, title_ar||null, description||null, department_id||null, assignee_id||null,
    priority||null, due_date||null, start_date||null, estimated_hours||null,
    done !== undefined ? (done ? 1 : 0) : null, req.params.id);
  const updated = db.prepare('SELECT t.*, u.full_name as assignee_name, u.avatar_initials, u.avatar_color, u.avatar_text_color, d.name as dept_name, d.color as dept_color FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id LEFT JOIN departments d ON t.department_id = d.id WHERE t.id = ?').get(req.params.id);
  req.app.get('io').emit('task_updated', updated);
  res.json(updated);
});

router.delete('/:id', requireRole('admin', 'manager'), (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  db.prepare('DELETE FROM comments WHERE task_id = ?').run(req.params.id);
  db.prepare('DELETE FROM time_entries WHERE task_id = ?').run(req.params.id);
  req.app.get('io').emit('task_deleted', { id: req.params.id });
  res.json({ message: 'Task deleted' });
});

function createNotification(db, userId, type, title, titleAr, message, messageAr, refId, refType) {
  db.prepare(`INSERT INTO notifications (id, user_id, type, title, title_ar, message, message_ar, reference_id, reference_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(uuidv4(), userId, type, title, titleAr, message, messageAr, refId, refType);
}

module.exports = router;
