import { Router } from 'express';
import auth from '../middleware/auth.js';
import { allowRoles } from '../middleware/roles.js';
import { getAll, assignSites } from '../controllers/employee.controller.js';

const router = Router();

router.get('/', auth, allowRoles('admin'), getAll);
router.put('/:id/sites', auth, allowRoles('admin'), assignSites);

export default router;
