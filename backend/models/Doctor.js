const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String, default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=doctor' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'rms_departments', required: true },
  schedule: { type: String, required: true }, // 出诊时间
  period: { type: String, enum: ['上午', '下午', '全天'], required: true },
  fee: { type: Number, required: true },
  totalSlots: { type: Number, default: 10 },
  bookedSlots: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('rms_doctors', doctorSchema);