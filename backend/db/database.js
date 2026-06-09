const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.RAILWAY_ENVIRONMENT
  ? path.join(__dirname, '../taskflow.db')
  : path.join(__dirname, '../../taskflow.db');
let db;

function getDB() {
  if (!db) db = new Database(DB_PATH);
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, full_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member',
      department_id TEXT, api_key TEXT, avatar_initials TEXT,
      avatar_color TEXT DEFAULT '#EEEDFE', avatar_text_color TEXT DEFAULT '#534AB7',
      language TEXT DEFAULT 'en', is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')), last_login TEXT
    );
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, name_ar TEXT,
      color TEXT DEFAULT '#534AB7', description TEXT, manager_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS statuses (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT DEFAULT '#6B6F76',
      department_id TEXT, position INTEGER DEFAULT 0, is_closed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT DEFAULT '#534AB7'
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, title_ar TEXT, description TEXT,
      department_id TEXT, assignee_id TEXT, created_by TEXT,
      priority TEXT DEFAULT 'medium', status_id TEXT, done INTEGER DEFAULT 0,
      due_date TEXT, start_date TEXT, estimated_hours REAL DEFAULT 0,
      parent_task_id TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS task_tags (
      task_id TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY (task_id, tag_id)
    );
    CREATE TABLE IF NOT EXISTS task_watchers (
      task_id TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY (task_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS checklists (
      id TEXT PRIMARY KEY, task_id TEXT NOT NULL, name TEXT NOT NULL,
      position INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY, checklist_id TEXT NOT NULL, name TEXT NOT NULL,
      is_done INTEGER DEFAULT 0, position INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS custom_fields (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'text',
      options TEXT, department_id TEXT, position INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS task_custom_values (
      task_id TEXT NOT NULL, field_id TEXT NOT NULL, value TEXT,
      PRIMARY KEY (task_id, field_id)
    );
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY, task_id TEXT NOT NULL, user_id TEXT NOT NULL,
      name TEXT NOT NULL, mime_type TEXT NOT NULL, data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY, task_id TEXT NOT NULL, user_id TEXT NOT NULL,
      action TEXT NOT NULL, field TEXT, old_value TEXT, new_value TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY, task_id TEXT NOT NULL, user_id TEXT NOT NULL,
      content TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY, task_id TEXT NOT NULL, user_id TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL, date TEXT NOT NULL, note TEXT,
      timer_start TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL,
      title TEXT NOT NULL, title_ar TEXT, message TEXT, message_ar TEXT,
      reference_id TEXT, reference_type TEXT, is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const existing = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (existing.cnt === 0) seedData(db);

  console.log('Database initialized.');
}

function seedData(db) {
  const depts = [
    { id: 'd-hr', name: 'HR', name_ar: 'الموارد البشرية', color: '#D4537E' },
    { id: 'd-finance', name: 'Finance', name_ar: 'المالية', color: '#1D9E75' },
    { id: 'd-ops', name: 'Operations', name_ar: 'العمليات', color: '#534AB7' },
    { id: 'd-it', name: 'IT', name_ar: 'تكنولوجيا المعلومات', color: '#378ADD' },
  ];
  const insDept = db.prepare('INSERT INTO departments (id, name, name_ar, color) VALUES (?, ?, ?, ?)');
  depts.forEach(d => insDept.run(d.id, d.name, d.name_ar, d.color));

  const statuses = [
    { id: 'st-open', name: 'Open', color: '#6B6F76', position: 0, is_closed: 0 },
    { id: 'st-progress', name: 'In Progress', color: '#0075FF', position: 1, is_closed: 0 },
    { id: 'st-review', name: 'In Review', color: '#9B51E0', position: 2, is_closed: 0 },
    { id: 'st-blocked', name: 'Blocked', color: '#E24B4A', position: 3, is_closed: 0 },
    { id: 'st-done', name: 'Done', color: '#1D9E75', position: 4, is_closed: 1 },
  ];
  const insSt = db.prepare('INSERT INTO statuses (id, name, color, position, is_closed) VALUES (?, ?, ?, ?, ?)');
  statuses.forEach(s => insSt.run(s.id, s.name, s.color, s.position, s.is_closed));

  const tags = [
    { id: 'tag-bug', name: 'Bug', color: '#E24B4A' },
    { id: 'tag-feature', name: 'Feature', color: '#0075FF' },
    { id: 'tag-design', name: 'Design', color: '#9B51E0' },
    { id: 'tag-backend', name: 'Backend', color: '#FF6B00' },
  ];
  const insTag = db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)');
  tags.forEach(t => insTag.run(t.id, t.name, t.color));

  const adminId = uuidv4();
  const adminHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (id, username, email, password_hash, full_name, role, department_id, avatar_initials, avatar_color, avatar_text_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(adminId, 'admin', 'admin@taskflow.com', adminHash, 'Admin User', 'admin', 'd-ops', 'AD', '#EEEDFE', '#534AB7');

  const tasks = [
    { title: 'Update employee handbook', dept: 'd-hr', priority: 'high', due: '2026-06-20', status: 'st-open' },
    { title: 'Q2 budget reconciliation', dept: 'd-finance', priority: 'urgent', due: '2026-06-12', status: 'st-progress' },
    { title: 'Office supplies reorder', dept: 'd-ops', priority: 'low', due: '2026-06-25', status: 'st-open' },
    { title: 'Server maintenance window', dept: 'd-it', priority: 'high', due: '2026-06-15', status: 'st-review' },
    { title: 'VPN access audit', dept: 'd-it', priority: 'urgent', due: '2026-06-10', status: 'st-blocked' },
  ];
  const insTask = db.prepare('INSERT INTO tasks (id, title, department_id, assignee_id, created_by, priority, status_id, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  tasks.forEach(t => insTask.run(uuidv4(), t.title, t.dept, adminId, adminId, t.priority, t.status, t.due));

  console.log('Seed data inserted. Default admin: admin / admin123');
}

module.exports = { getDB, initDB };
