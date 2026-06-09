const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../../taskflow.db');
let db;

function getDB() {
  if (!db) db = new Database(DB_PATH);
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      department_id TEXT,
      api_key TEXT,
      avatar_initials TEXT,
      avatar_color TEXT DEFAULT '#EEEDFE',
      avatar_text_color TEXT DEFAULT '#534AB7',
      language TEXT DEFAULT 'en',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_ar TEXT,
      color TEXT DEFAULT '#534AB7',
      description TEXT,
      manager_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_ar TEXT,
      description TEXT,
      department_id TEXT,
      assignee_id TEXT,
      created_by TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      due_date TEXT,
      start_date TEXT,
      estimated_hours REAL DEFAULT 0,
      done INTEGER DEFAULT 0,
      parent_task_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      timer_start TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      title_ar TEXT,
      message TEXT,
      message_ar TEXT,
      reference_id TEXT,
      reference_type TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      trigger_config TEXT NOT NULL,
      action_type TEXT NOT NULL,
      action_config TEXT NOT NULL,
      department_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_feature_requests (
      id TEXT PRIMARY KEY,
      requested_by TEXT NOT NULL,
      description TEXT NOT NULL,
      ai_response TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const existing = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (existing.cnt === 0) {
    seedData(db);
  }

  console.log('Database initialized.');
}

function seedData(db) {
  const depts = [
    { id: 'd-hr', name: 'HR', name_ar: 'الموارد البشرية', color: '#D4537E' },
    { id: 'd-finance', name: 'Finance', name_ar: 'المالية', color: '#1D9E75' },
    { id: 'd-ops', name: 'Operations', name_ar: 'العمليات', color: '#534AB7' },
    { id: 'd-it', name: 'IT', name_ar: 'تكنولوجيا المعلومات', color: '#378ADD' },
  ];
  const insertDept = db.prepare('INSERT INTO departments (id, name, name_ar, color) VALUES (?, ?, ?, ?)');
  depts.forEach(d => insertDept.run(d.id, d.name, d.name_ar, d.color));

  const adminId = uuidv4();
  const adminHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (id, username, email, password_hash, full_name, role, department_id, avatar_initials, avatar_color, avatar_text_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    adminId, 'admin', 'admin@taskflow.com', adminHash, 'Admin User', 'admin', 'd-ops', 'AD', '#EEEDFE', '#534AB7'
  );

  const tasks = [
    { id: uuidv4(), title: 'Update employee handbook', dept: 'd-hr', priority: 'high', due: '2026-06-20' },
    { id: uuidv4(), title: 'Q2 budget reconciliation', dept: 'd-finance', priority: 'urgent', due: '2026-06-12' },
    { id: uuidv4(), title: 'Office supplies reorder', dept: 'd-ops', priority: 'low', due: '2026-06-25' },
    { id: uuidv4(), title: 'Server maintenance window', dept: 'd-it', priority: 'high', due: '2026-06-15' },
    { id: uuidv4(), title: 'VPN access audit', dept: 'd-it', priority: 'urgent', due: '2026-06-10' },
  ];
  const insertTask = db.prepare(`INSERT INTO tasks (id, title, department_id, assignee_id, created_by, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  tasks.forEach(t => insertTask.run(t.id, t.title, t.dept, adminId, adminId, t.priority, t.due));

  console.log('Seed data inserted. Default admin: admin / admin123');
}

module.exports = { getDB, initDB };
