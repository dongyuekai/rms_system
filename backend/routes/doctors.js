const express = require('express');
const Doctor = require('../models/Doctor');
const router = express.Router();

// 根据科室获取医生
router.get('/department/:departmentId', async (req, res) => {
  try {
    const doctors = await Doctor.find({ department: req.params.departmentId })
      .populate('department', 'name');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;