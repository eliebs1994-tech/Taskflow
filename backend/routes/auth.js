const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../db/database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, dept: user.department_id }, JWT_SECRET, { expiresIn: '7d' });
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.post('/register', authMiddleware, (req, res) => {
  if (!['admin'].includes(req.user.role)) return res.status(403).json({ error: 'Only admins can create accounts' });
  const { username, email, password, full_name, role, department_id } = req.body;
  if (!username || !email || !password || !full_name) return res.status(400).json({ error: 'All fields required' });
  const db = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) return res.status(409).json({ error: 'Username or email already exists' });
  const initials = full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = [['#EEEDFE','#534AB7'],['#E1F5EE','#0F6E56'],['#FBEAF0','#993556'],['#E6F1FB','#185FA5'],['#FAEEDA','#854F0B']];
  const c = colors[Math.floor(Math.random() * colors.length)];
  const id = uuidv4();
  db.prepare(`INSERT INTO users (id, username, email, password_hash, full_name, role, department_id, avatar_initials, avatar_color, avatar_text_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, username, email, bcrypt.hashSync(password, 10), full_name, role || 'member', department_id || null, initials, c[0], c[1]);
  res.status(201).json({ message: 'User created', id });
});

router.get('/me', authMiddleware, (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, username, email, full_name, role, department_id, avatar_initials, avatar_color, avatar_text_color, language, last_login, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.put('/me', authMiddleware, (req, res) => {
  const { full_name, email, language, api_key, current_password, new_password } = req.body;
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (new_password) {
    if (!current_password || !bcrypt.compareSync(current_password, user.password_hash)) {
      return res.status(400).json({ error: 'Current password incorrect' });
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(new_password, 10), user.id);
  }
  db.prepare('UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), language = COALESCE(?, language), api_key = COALESCE(?, api_key) WHERE id = ?')
    .run(full_name || null, email || null, language || null, api_key !== undefined ? api_key : null, user.id);
  const updated = db.prepare('SELECT id, username, email, full_name, role, department_id, avatar_initials, avatar_color, avatar_text_color, language FROM users WHERE id = ?').get(user.id);
  res.json(updated);
});

module.exports = router;
