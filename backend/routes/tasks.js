const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const router = express.Router();
router.use(authMiddleware);

function logActivity(db, taskId, userId, action, field, oldVal, newVal) {
  db.prepare('INSERT INTO activity (id, task_id, user_id, action, field, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), taskId, userId, action, field || null, oldVal != null ? String(oldVal) : null, newVal != null ? String(newVal) : null);
}

const TASK_SELECT = `
  SELECT t.*,
    u.full_name as assignee_name, u.avatar_initials, u.avatar_color, u.avatar_text_color,
    d.name as dept_name, d.color as dept_color,
    s.name as status_name, s.color as status_color, s.is_closed as status_is_closed,
    (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count,
    (SELECT COALESCE(SUM(te.duration_minutes),0) FROM time_entries te WHERE te.task_id = t.id) as total_minutes,
    (SELECT json_group_array(json_object('id', tg.id, 'name', tg.name, 'color', tg.color))
     FROM task_tags tt JOIN tags tg ON tt.tag_id = tg.id WHERE tt.task_id = t.id) as tags_json,
    (SELECT json_group_array(json_object('id', wu.id, 'full_name', wu.full_name, 'avatar_initials', wu.avatar_initials, 'avatar_color', wu.avatar_color, 'avatar_text_color', wu.avatar_text_color))
     FROM task_watchers tw JOIN users wu ON tw.user_id = wu.id WHERE tw.task_id = t.id) as watchers_json
  FROM tasks t
  LEFT JOIN users u ON t.assignee_id = u.id
  LEFT JOIN departments d ON t.department_id = d.id
  LEFT JOIN statuses s ON t.status_id = s.id
`;

function parseTags(task) {
  try { task.tags = JSON.parse(task.tags_json || '[]').filter(Boolean); } catch { task.tags = []; }
  try { task.watchers = JSON.parse(task.watchers_json || '[]').filter(Boolean); } catch { task.watchers = []; }
  delete task.tags_json; delete task.watchers_json;
  return task;
}

router.get('/', (req, res) => {
  const db = getDB();
  const { dept, status, priority, assignee, search } = req.query;
  let query = TASK_SELECT + ' WHERE 1=1';
  const params = [];
  if (dept) { query += ' AND t.department_id = ?'; params.push(dept); }
  if (status === 'open') { query += ' AND (s.is_closed = 0 OR t.status_id IS NULL)'; }
  else if (status === 'done') { query += ' AND s.is_closed = 1'; }
  else if (status === 'overdue') { query += " AND (s.is_closed = 0 OR t.status_id IS NULL) AND t.due_date < date('now')"; }
  else if (status && !['all', 'mine', 'urgent'].includes(status)) { query += ' AND t.status_id = ?'; params.push(status); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (assignee) { query += ' AND t.assignee_id = ?'; params.push(assignee); }
  if (search) { query += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (req.user.role === 'member') { query += ' AND (t.assignee_id = ? OR t.department_id = ?)'; params.push(req.user.id, req.user.dept); }
  query += " ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, t.due_date ASC NULLS LAST";
  res.json(db.prepare(query).all(...params).map(parseTags));
});

router.get('/:id', (req, res) => {
  const db = getDB();
  const task = db.prepare(TASK_SELECT + ' WHERE t.id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(parseTags(task));
});

router.post('/', (req, res) => {
  const { title, title_ar, description, department_id, assignee_id, priority, due_date, start_date, estimated_hours, parent_task_id, status_id, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const db = getDB();
  const defaultStatus = status_id || db.prepare('SELECT id FROM statuses ORDER BY position LIMIT 1').get()?.id || null;
  const id = uuidv4();
  db.prepare('INSERT INTO tasks (id, title, title_ar, description, department_id, assignee_id, created_by, priority, status_id, due_date, start_date, estimated_hours, parent_task_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, title, title_ar || null, description || null, department_id || null, assignee_id || null, req.user.id, priority || 'medium', defaultStatus, due_date || null, start_date || null, estimated_hours || 0, parent_task_id || null);
  if (tags && Array.isArray(tags)) tags.forEach(tagId => { try { db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(id, tagId); } catch (e) {} });
  logActivity(db, id, req.user.id, 'created', null, null, title);
  if (assignee_id && assignee_id !== req.user.id) {
    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?, ?)').run(uuidv4(), assignee_id, 'task_assigned', 'New task assigned', `You have been assigned: ${title}`, id, 'task');
    req.app.get('io').to(`user_${assignee_id}`).emit('new_notification', { type: 'task_assigned', title });
  }
  const task = db.prepare(TASK_SELECT + ' WHERE t.id = ?').get(id);
  req.app.get('io').emit('task_created', parseTags(task));
  res.status(201).json(parseTags(task));
});

router.put('/:id', (req, res) => {
  const db = getDB();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (req.user.role === 'member' && task.assignee_id !== req.user.id && task.created_by !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  const { title, title_ar, description, department_id, assignee_id, priority, due_date, start_date, estimated_hours, done, status_id, tags } = req.body;

  if (status_id !== undefined && status_id !== task.status_id) {
    const oldSt = task.status_id ? db.prepare('SELECT name FROM statuses WHERE id = ?').get(task.status_id)?.name : 'None';
    const newSt = status_id ? db.prepare('SELECT name FROM statuses WHERE id = ?').get(status_id)?.name : 'None';
    logActivity(db, req.params.id, req.user.id, 'status_changed', 'status', oldSt, newSt);
  }
  if (assignee_id !== undefined && assignee_id !== task.assignee_id) {
    const oldU = task.assignee_id ? db.prepare('SELECT full_name FROM users WHERE id = ?').get(task.assignee_id)?.full_name : 'Unassigned';
    const newU = assignee_id ? db.prepare('SELECT full_name FROM users WHERE id = ?').get(assignee_id)?.full_name : 'Unassigned';
    logActivity(db, req.params.id, req.user.id, 'field_changed', 'assignee', oldU, newU);
  }
  if (priority !== undefined && priority !== task.priority) logActivity(db, req.params.id, req.user.id, 'field_changed', 'priority', task.priority, priority);
  if (due_date !== undefined && due_date !== task.due_date) logActivity(db, req.params.id, req.user.id, 'field_changed', 'due date', task.due_date, due_date);
  if (title !== undefined && title !== task.title) logActivity(db, req.params.id, req.user.id, 'field_changed', 'title', task.title, title);

  let doneVal = done !== undefined ? (done ? 1 : 0) : null;
  if (status_id !== undefined) {
    const st = db.prepare('SELECT is_closed FROM statuses WHERE id = ?').get(status_id);
    if (st) doneVal = st.is_closed;
  }

  db.prepare(`UPDATE tasks SET title=COALESCE(?,title), title_ar=COALESCE(?,title_ar), description=COALESCE(?,description),
    department_id=COALESCE(?,department_id), assignee_id=COALESCE(?,assignee_id), priority=COALESCE(?,priority),
    due_date=COALESCE(?,due_date), start_date=COALESCE(?,start_date), estimated_hours=COALESCE(?,estimated_hours),
    status_id=COALESCE(?,status_id), done=COALESCE(?,done), updated_at=datetime('now') WHERE id=?`)
    .run(title || null, title_ar || null, description || null, department_id || null, assignee_id || null, priority || null,
      due_date || null, start_date || null, estimated_hours || null, status_id || null, doneVal, req.params.id);

  if (tags !== undefined && Array.isArray(tags)) {
    db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(req.params.id);
    tags.forEach(tagId => { try { db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(req.params.id, tagId); } catch (e) {} });
  }

  const updated = db.prepare(TASK_SELECT + ' WHERE t.id = ?').get(req.params.id);
  req.app.get('io').emit('task_updated', parseTags(updated));
  res.json(parseTags(updated));
});

router.delete('/:id', requireRole('admin', 'manager'), (req, res) => {
  const db = getDB();
  ['tasks', 'comments', 'time_entries', 'task_tags', 'task_watchers', 'checklists', 'attachments', 'activity', 'task_custom_values'].forEach(tbl => {
    const col = tbl === 'tasks' ? 'id' : 'task_id';
    db.prepare(`DELETE FROM ${tbl} WHERE ${col} = ?`).run(req.params.id);
  });
  db.prepare('DELETE FROM checklist_items WHERE checklist_id NOT IN (SELECT id FROM checklists)').run();
  req.app.get('io').emit('task_deleted', { id: req.params.id });
  res.json({ message: 'Task deleted' });
});

router.post('/:id/watchers', (req, res) => {
  const { user_id } = req.body;
  getDB().prepare('INSERT OR IGNORE INTO task_watchers (task_id, user_id) VALUES (?, ?)').run(req.params.id, user_id || req.user.id);
  res.json({ message: 'Watching' });
});

router.delete('/:id/watchers', (req, res) => {
  getDB().prepare('DELETE FROM task_watchers WHERE task_id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Unwatched' });
});

module.exports = router;
