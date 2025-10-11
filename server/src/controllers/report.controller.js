import { getDailyReport } from '../services/report.service.js';

export const getDaily = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter required' });
    }
    const report = await getDailyReport(date);
    res.json(report);
  } catch (error) {
    next(error);
  }
};
