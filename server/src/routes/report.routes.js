import { Router } from 'express';
import auth from '../middleware/auth.js';
import { allowRoles } from '../middleware/roles.js';
import { getDaily } from '../controllers/report.controller.js';

const router = Router();

router.get('/daily', auth, allowRoles('admin'), getDaily);

export default router;
