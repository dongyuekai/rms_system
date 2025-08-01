const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const jwt = require('jsonwebtoken');
const router = express.Router();

// 验证token中间件
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: '未授权' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: '无效token' });
  }
};

// 挂号或候补
router.post('/', auth, async (req, res) => {
  try {
    const { doctorId } = req.body;

    // 检查是否已挂号
    const existingAppointment = await Appointment.findOne({
      user: req.userId,
      doctor: doctorId,
      status: { $in: ['active', 'waiting'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: '您已挂过该医生的号或在候补队列中' });
    }

    const doctor = await Doctor.findById(doctorId);

    if (doctor.bookedSlots >= doctor.totalSlots) {
      // 满额，加入候补队列
      const waitingCount = await Appointment.countDocuments({
        doctor: doctorId,
        status: 'waiting'
      });

      await Appointment.create({
        user: req.userId,
        doctor: doctorId,
        status: 'waiting',
        queuePosition: waitingCount + 1
      });

      res.json({ message: '已加入候补队列', status: 'waiting' });
    } else {
      // 直接挂号
      await Appointment.create({
        user: req.userId,
        doctor: doctorId,
        status: 'active'
      });

      await Doctor.findByIdAndUpdate(doctorId, {
        $inc: { bookedSlots: 1 }
      });

      res.json({ message: '挂号成功', status: 'active' });
    }

    // 广播更新给所有用户
    req.io.emit('doctorUpdate', { doctorId });

  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 取消挂号
router.delete('/:doctorId', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { user: req.userId, doctor: req.params.doctorId, status: { $in: ['active', 'waiting'] } },
      { status: 'cancelled' }
    );

    if (!appointment) {
      return res.status(404).json({ message: '未找到挂号记录' });
    }

    if (appointment.status === 'active') {
      await Doctor.findByIdAndUpdate(req.params.doctorId, {
        $inc: { bookedSlots: -1 }
      });

      // 检查候补队列，自动转正第一个
      const waitingAppointment = await Appointment.findOneAndUpdate(
        { doctor: req.params.doctorId, status: 'waiting' },
        { status: 'active', queuePosition: 0 },
        { sort: { queuePosition: 1 } }
      );

      if (waitingAppointment) {
        await Doctor.findByIdAndUpdate(req.params.doctorId, {
          $inc: { bookedSlots: 1 }
        });

        // 更新其他候补位置
        await Appointment.updateMany(
          { doctor: req.params.doctorId, status: 'waiting' },
          { $inc: { queuePosition: -1 } }
        );

        req.io.emit('appointmentUpdate', {
          userId: waitingAppointment.user,
          message: '您的候补挂号已转为正式挂号'
        });
      }
    }

    req.io.emit('doctorUpdate', { doctorId: req.params.doctorId });
    res.json({ message: '取消成功' });

  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户挂号记录
router.get('/my', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      user: req.userId,
      status: { $in: ['active', 'waiting'] }
    }).populate('doctor').populate('user', 'name');

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
