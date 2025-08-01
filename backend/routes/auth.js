const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;