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

export const getMySites = async (req, res, next) => {
  try {
    // req.user.sub is the user ID from the JWT
    const user = await User.findById(req.user.sub)
      .populate({
        path: 'sites',
        match: { active: true }, // Only populate active geofences
        select: 'name type geometry radiusMeters'
      })
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.sites || []);
  } catch (error) {
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
    
        // Verify employee exists
    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    if (employee.role !== 'employee') {
      return res.status(400).json({ message: 'Can only assign sites to employees' });
    }

    // Verify all sites exist and are active
    const validSites = await Geofence.find({
      _id: { $in: sites },
      active: true
    }).select('_id');
    
    const validSiteIds = validSites.map(s => s._id.toString());
    

        // Update user

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

export const getPendingApprovals = async (req, res, next) => {
  try {
    const pendingEmployees = await User.find({ 
      role: 'employee', 
      approvalStatus: 'pending' 
    })
    .select('-passwordHash')
    .sort({ registeredAt: -1 })
    .lean();

    res.json(pendingEmployees);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    next(error);
  }
};

export const approveEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const updateData = {
      approvalStatus: 'approved',
      active: true,
      approvedBy: req.user.sub,
      approvedAt: new Date()
    };

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      const existingEmail = await User.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      updateData.email = email;
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    console.log(`Employee ${user.name} approved by admin ${req.user.sub}`);
    res.json(user);
  } catch (error) {
    console.error('Approve employee error:', error);
    next(error);
  }
};

export const rejectEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        approvalStatus: 'rejected',
        rejectionReason: reason,
        approvedBy: req.user.sub,
        approvedAt: new Date()
      },
      { new: true }
    )
    .select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    console.log(`Employee ${user.name} rejected. Reason: ${reason}`);
    res.json(user);
  } catch (error) {
    console.error('Reject employee error:', error);
    next(error);
  }
};
