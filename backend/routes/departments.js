const express = require('express');
const Department = require('../models/Department');
const router = express.Router();

// 获取所有科室
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;