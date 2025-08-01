const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');

async function initData() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('数据库连接成功');

    // 清空现有数据
    await User.deleteMany({});
    await Department.deleteMany({});
    await Doctor.deleteMany({});

    // 创建用户
    const users = await User.create([
      { username: 'admin', password: '123456', name: '管理员', role: 'admin' },
      { username: 'user1', password: '123456', name: '张三' },
      { username: 'user2', password: '123456', name: '李四' }
    ]);

    // 创建科室
    const departments = await Department.create([
      { name: '内科', description: '内科疾病诊治', icon: 'heart' },
      { name: '外科', description: '外科手术治疗', icon: 'scissor' },
      { name: '儿科', description: '儿童疾病诊治', icon: 'baby' },
      { name: '妇科', description: '妇科疾病诊治', icon: 'woman' }
    ]);

    // 创建医生
    await Doctor.create([
      { name: '王医生', department: departments[0]._id, schedule: '周一至周五', period: '上午', fee: 50, totalSlots: 10, bookedSlots: 3 },
      { name: '李医生', department: departments[0]._id, schedule: '周一至周三', period: '下午', fee: 60, totalSlots: 8, bookedSlots: 2 },
      { name: '张医生', department: departments[1]._id, schedule: '周二至周四', period: '全天', fee: 80, totalSlots: 12, bookedSlots: 5 },
      { name: '赵医生', department: departments[2]._id, schedule: '周一至周五', period: '上午', fee: 45, totalSlots: 15, bookedSlots: 8 },
      { name: '陈医生', department: departments[3]._id, schedule: '周三至周五', period: '下午', fee: 70, totalSlots: 10, bookedSlots: 4 }
    ]);

    console.log('数据初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('数据初始化失败:', error);
    process.exit(1);
  }
}

initData();