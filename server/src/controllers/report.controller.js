import { getDailyReport, getExportData } from '../services/report.service.js';

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

export const getExport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate) {
      return res.status(400).json({ message: 'Start date required' });
    }
    const data = await getExportData(startDate, endDate);
    res.json(data);
  } catch (error) {
    next(error);
  }
};
