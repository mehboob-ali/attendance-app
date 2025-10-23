import { Router } from 'express';
import auth from '../middleware/auth.js';
import { allowRoles } from '../middleware/roles.js';
import { getAll, assignSites, getMySites } from '../controllers/employee.controller.js';
import { 
  getPendingApprovals,
  approveEmployee,
  rejectEmployee
} from '../controllers/employee.controller.js';

const router = Router();

// GET /api/employees - Get all employees (for admins)
router.get('/', auth, allowRoles('admin'), getAll);

// GET /api/employees/me/sites - Get assigned sites for the current logged-in user
router.get('/me/sites', auth, getMySites);

// PUT /api/employees/:id/sites - Assign geofences to an employee (for admins)
router.put('/:id/sites', auth, allowRoles('admin'), assignSites);

router.get('/pending', auth, allowRoles('admin'), getPendingApprovals);
router.post('/:id/approve', auth, allowRoles('admin'), approveEmployee);
router.post('/:id/reject', auth, allowRoles('admin'), rejectEmployee);


export default router;
