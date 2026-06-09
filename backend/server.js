const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const departmentRoutes = require('./routes/departments');
const timeRoutes = require('./routes/time');
const notificationRoutes = require('./routes/notifications');
const commentRoutes = require('./routes/comments');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(cors());
app.use(express.json());
const frontendPath = process.env.RAILWAY_ENVIRONMENT
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '../frontend/public');
app.use(express.static(frontendPath));

initDB();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);

app.get('*', (req, res) => {
  const indexPath = process.env.RAILWAY_ENVIRONMENT
    ? path.join(__dirname, 'public', 'index.html')
    : path.join(__dirname, '../frontend/public/index.html');
  res.sendFile(indexPath);
});

io.on('connection', (socket) => {
  socket.on('join', (userId) => socket.join(`user_${userId}`));
  socket.on('join_dept', (deptId) => socket.join(`dept_${deptId}`));

  socket.on('task_update', (data) => socket.broadcast.emit('task_updated', data));
  socket.on('task_create', (data) => socket.broadcast.emit('task_created', data));
  socket.on('task_delete', (data) => socket.broadcast.emit('task_deleted', data));
  socket.on('comment_add', (data) => socket.broadcast.emit('comment_added', data));
  socket.on('notification', (data) => {
    io.to(`user_${data.userId}`).emit('new_notification', data);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`TaskFlow server running on port ${PORT}`));
