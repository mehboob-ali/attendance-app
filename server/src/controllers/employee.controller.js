import User from '../models/User.js';
import Geofence from '../models/Geofence.js';

export const getAll = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee', active: true })
      .select('-passwordHash')
      .populate({
        path: 'sites',
        match: { active: true }, // Only populate active geofences
        select: 'name type radiusMeters'
      })
      .lean();
    
    // Clean up any null sites (from deleted geofences)
    const cleanedEmployees = employees.map(emp => ({
      ...emp,
      sites: emp.sites ? emp.sites.filter(s => s !== null) : []
    }));
    
    res.json(cleanedEmployees);
  } catch (error) {
    console.error('Get employees error:', error);
    next(error);
  }
};

export const assignSites = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sites } = req.body;
    
    if (!sites || !Array.isArray(sites)) {
      return res.status(400).json({ message: 'Sites must be an array' });
    }
    
    // Verify all sites exist and are active
    const validSites = await Geofence.find({
      _id: { $in: sites },
      active: true
    }).select('_id');
    
    const validSiteIds = validSites.map(s => s._id.toString());
    
    const user = await User.findByIdAndUpdate(
      id,
      { sites: validSiteIds },
      { new: true }
    )
    .select('-passwordHash')
    .populate({
      path: 'sites',
      match: { active: true },
      select: 'name type radiusMeters'
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Assign sites error:', error);
    next(error);
  }
};
