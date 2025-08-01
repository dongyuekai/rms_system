const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// WebSocket连接
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  socket.on('disconnect', () => {
    console.log('用户断开连接:', socket.id);
  });
});

// 将io实例传递给路由
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 连接数据库
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
