const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'rms_users', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'rms_doctors', required: true },
  status: { type: String, enum: ['active', 'cancelled', 'waiting'], default: 'active' },
  appointmentDate: { type: Date, default: Date.now },
  queuePosition: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('rms_appointments', appointmentSchema);
