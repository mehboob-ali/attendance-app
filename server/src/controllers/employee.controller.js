import User from '../models/User.js';

export const getAll = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee', active: true })
      .select('-passwordHash')
      .populate('sites', 'name')
      .lean();
    res.json(employees);
  } catch (error) {
    next(error);
  }
};

export const assignSites = async (req, res, next) => {
  try {
    const { sites } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { sites },
      { new: true }
    ).select('-passwordHash');
    res.json(user);
  } catch (error) {
    next(error);
  }
};
