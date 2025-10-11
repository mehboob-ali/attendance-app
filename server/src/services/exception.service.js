import Exception from '../models/Exception.js';

export async function listExceptions(status = null) {
  const query = status ? { decision: status } : {};
  return Exception.find(query)
    .populate('userId', 'name email')
    .populate('punchId')
    .populate('decidedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
}

export async function decideException(id, decision, comment, decidedBy) {
  if (!['approved', 'denied'].includes(decision)) {
    throw { status: 400, message: 'Invalid decision' };
  }
  
  return Exception.findByIdAndUpdate(
    id,
    { 
      decision, 
      comment, 
      decidedBy,
      decidedAt: new Date()
    },
    { new: true }
  );
}
