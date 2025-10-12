import Punch from '../models/Punch.js';

export async function getDailyReport(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return Punch.find({ 
    timestamp: { $gte: start, $lte: end } 
  })
  .populate('userId', 'name email')
  .sort({ timestamp: -1 })
  .lean();
}

export async function getExportData(startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = endDate ? new Date(endDate) : new Date(startDate);
  end.setHours(23, 59, 59, 999);
  
  return Punch.find({ 
    timestamp: { $gte: start, $lte: end } 
  })
  .populate('userId', 'name email')
  .sort({ timestamp: 1 })
  .lean();
}
