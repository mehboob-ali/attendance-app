import User from '../models/User.js';

export const getAll = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee', active: true })
      .select('-passwordHash')
      .populate('sites', 'name type radiusMeters')
      .lean();
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    next(error);
  }
};

export const assignSites = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sites } = req.body;
    
    console.log('Assigning sites:', { id, sites }); // Debug log
    
    if (!sites || !Array.isArray(sites)) {
      return res.status(400).json({ message: 'Sites must be an array' });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { sites },
      { new: true, runValidators: true }
    )
    .select('-passwordHash')
    .populate('sites', 'name type radiusMeters');
    
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    console.log('Sites assigned successfully:', user); // Debug log
    res.json(user);
  } catch (error) {
    console.error('Assign sites error:', error);
    next(error);
  }
};
